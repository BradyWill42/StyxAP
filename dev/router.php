<?php
/**
 * Preview StyxAP without a Pi:  php -S 127.0.0.1:8099 dev/router.php
 *
 * Serves dev/fixture/ as the feed's output, stamped as just measured, unless STYXAP_RUN
 * names a real feed directory. Does what lighttpd's 50-raspap-router.conf does:
 * everything but the asset and ajax directories is index.php, the rest of the path being
 * PATH_INFO. Signed in as `brady`, as the Styx sign-in would say.
 */
if (getenv('STYXAP_RUN') === false) {
    $run = sys_get_temp_dir() . '/styxap-preview';
    @mkdir($run . '/requests', 0700, true);
    foreach (['status.json', 'history.json', 'usage.json'] as $name) {
        $value = json_decode((string)file_get_contents(__DIR__ . '/fixture/' . $name), true);
        if ($name === 'status.json') {
            $shift = time() - $value['generated'];
            $value['generated'] = time();
            $value['history']['t'] = array_map(fn ($t) => $t + $shift, $value['history']['t']);
        }
        file_put_contents($run . '/' . $name, json_encode($value));
    }
    putenv('STYXAP_RUN=' . $run);
}
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$_SERVER['HTTP_X_STYX_USER'] = $_SERVER['HTTP_X_STYX_USER'] ?? 'brady';
if (preg_match('#^/(dist|app|config)/#', $path)) {
    return false;
}
if (preg_match('#^/ajax/styx/[a-z]+\.php$#', $path)) {
    require __DIR__ . '/..' . $path;
    return true;
}
$_SERVER['PATH_INFO'] = $path;
require __DIR__ . '/../index.php';
