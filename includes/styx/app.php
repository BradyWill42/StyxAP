<?php
/**
 * StyxAP: the Styx access point portal.
 *
 * Everything this page shows is measured by Styx's AP feed, which runs as root in the AP
 * pod and writes /run/styx-ap/status.json (styxctl/ap_feed.py in the Styx repository).
 * This process runs as www-data and runs nothing privileged: a change is a request
 * dropped in the feed's spool, which the feed checks against its own allowlist.
 *
 * Who is asking is Styx's to say: the portal answers only requests the Styx sign-in let
 * through (the AP's lighttpd refuses everything else), and the sign-in names the person
 * in X-Styx-User.
 *
 * Based on RaspAP (https://github.com/RaspAP/raspap-webgui), GPL-3.0.
 */

declare(strict_types=1);

const STYXAP_VERSION = '1.0.0';

function styx_run_dir(): string
{
    $override = getenv('STYXAP_RUN');
    return rtrim($override !== false && $override !== '' ? $override : '/run/styx-ap', '/');
}

/** The tabs, in RaspAP's order, each standing for the Styx service behind it. */
function styx_pages(): array
{
    return [
        'dashboard' => ['Dashboard', 'fa-gauge-high', 'Access point', null],
        'hotspot'   => ['Hotspot', 'fa-tower-broadcast', 'Access point', null],
        'dhcp'      => ['DHCP Server', 'fa-right-left', 'Access point', null],
        'dns'       => ['DNS', 'fa-signs-post', 'Access point', 'was Ad Blocking'],
        'network'   => ['Networking', 'fa-network-wired', 'Network', null],
        'uplink'    => ['Uplink', 'fa-ethernet', 'Network', 'was WiFi client'],
        'wireguard' => ['WireGuard', 'fa-diagram-project', 'Network', 'the mesh'],
        'vpn'       => ['VPN clients', 'fa-mobile-screen', 'Network', 'was OpenVPN'],
        'egress'    => ['Egress', 'fa-shield-halved', 'Network', 'pistyx'],
        'usage'     => ['Data usage', 'fa-chart-area', 'Pi', null],
        'system'    => ['System', 'fa-microchip', 'Pi', null],
        'restapi'   => ['RestAPI', 'fa-code', 'Pi', null],
        'about'     => ['About StyxAP', 'fa-circle-info', 'Pi', null],
    ];
}

/** RaspAP's own addresses still land on the page that replaced them. */
function styx_route(string $path): string
{
    $legacy = [
        'hostapd_conf' => 'hotspot', 'dhcpd_conf' => 'dhcp', 'adblock_conf' => 'dns',
        'network_conf' => 'network', 'wpa_conf' => 'uplink', 'wg_conf' => 'wireguard',
        'openvpn_conf' => 'vpn', 'provider_conf' => 'egress', 'data_use' => 'usage',
        'system_info' => 'system', 'restapi_conf' => 'restapi', 'login' => 'dashboard',
        'auth_conf' => 'dashboard', '' => 'dashboard',
    ];
    $slug = strtolower(trim($path, '/'));
    $slug = $legacy[$slug] ?? $slug;
    return array_key_exists($slug, styx_pages()) ? $slug : 'notfound';
}

function styx_read_json(string $name): ?array
{
    $path = styx_run_dir() . '/' . $name;
    $text = @file_get_contents($path);
    if ($text === false) {
        return null;
    }
    $value = json_decode($text, true);
    return is_array($value) ? $value : null;
}

/** The feed's latest word, or null when there is none. */
function styx_status(): ?array
{
    return styx_read_json('status.json');
}

/** fresh, stale (the feed stopped writing), or missing. */
function styx_freshness(?array $status): string
{
    if ($status === null) {
        return 'missing';
    }
    return (time() - (int)($status['generated'] ?? 0)) <= 15 ? 'fresh' : 'stale';
}

/** The person the Styx sign-in let through. */
function styx_user(): string
{
    $user = $_SERVER['HTTP_X_STYX_USER'] ?? '';
    return preg_match('/^[a-z_][a-z0-9_-]{0,31}$/', $user) ? $user : 'signed in';
}

function h(?string $text): string
{
    return htmlspecialchars((string)$text, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function styx_fact(?array $status, string $path, $default = null)
{
    $value = $status['facts'] ?? [];
    foreach (explode('.', $path) as $key) {
        if (!is_array($value) || !array_key_exists($key, $value)) {
            return $default;
        }
        $value = $value[$key];
    }
    return $value;
}

/**
 * Queue a request for the feed. Only the two actions it knows; the feed decides whether
 * the values are allowed. Returns [ok, message].
 */
function styx_queue(array $request): array
{
    $action = $request['action'] ?? '';
    if (!in_array($action, ['restart-radio', 'radio-settings'], true)) {
        return [false, 'not an action the portal can ask for'];
    }
    $settings = [];
    foreach (['channel', 'country_code', 'max_num_sta', 'ignore_broadcast_ssid'] as $key) {
        if (isset($request['settings'][$key]) && $request['settings'][$key] !== '') {
            $settings[$key] = (string)$request['settings'][$key];
        }
    }
    $id = bin2hex(random_bytes(6));
    $body = json_encode([
        'action' => $action, 'id' => $id, 'user' => styx_user(), 'at' => time(),
        'settings' => $action === 'radio-settings' ? $settings : new stdClass(),
    ]);
    $spool = styx_run_dir() . '/requests';
    $temporary = $spool . '/.' . $id;
    if (@file_put_contents($temporary, $body) === false || !@rename($temporary, $spool . '/' . time() . '-' . $id . '.json')) {
        @unlink($temporary);
        return [false, 'the AP feed is not taking requests right now'];
    }
    return [true, $id];
}
