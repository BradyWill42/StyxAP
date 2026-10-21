<?php
/**
 * StyxAP - the Styx access point portal. One page per tab; every tab stands for the Styx
 * service behind it. See includes/styx/app.php.
 */

declare(strict_types=1);

require __DIR__ . '/includes/styx/app.php';

$route = styx_route($_SERVER['PATH_INFO'] ?? '/');
$pages = styx_pages();
$status = styx_status();
$freshness = styx_freshness($status);
$node = (string)styx_fact($status, 'node', gethostname() ?: 'access point');
$ssid = (string)styx_fact($status, 'ssid', $node . 'AP');
[$title, $icon] = $route === 'notfound' ? ['Not here', 'fa-compass'] : $pages[$route];
if ($route === 'notfound') {
    http_response_code(404);
}
$user = styx_user();
header('Cache-Control: no-store');
header("Content-Security-Policy: default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'self' *.styx.net");
?>
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title><?= h($title) ?> · <?= h($ssid) ?> · StyxAP</title>
<link rel="icon" type="image/svg+xml" href="/app/img/styxap.svg">
<link rel="stylesheet" href="/dist/font-awesome/css/all.min.css">
<link rel="stylesheet" href="/app/css/styx.css?v=<?= h(STYXAP_VERSION) ?>">
<script src="/app/js/theme.js?v=<?= h(STYXAP_VERSION) ?>"></script>
</head>
<body data-page="<?= h($route) ?>">
<div class="app">
  <aside class="side" id="side">
    <a class="brand" href="/">
      <?php include __DIR__ . '/includes/styx/mark.svg.php'; ?>
      <span><b>StyxAP</b><small><?= h($ssid) ?></small></span>
    </a>
    <nav class="nav" aria-label="Tabs">
      <?php $group = null; foreach ($pages as $slug => [$label, $glyph, $section, $was]): ?>
        <?php if ($section !== $group): $group = $section; ?><h6><?= h($section) ?></h6><?php endif; ?>
        <a href="/<?= $slug === 'dashboard' ? '' : h($slug) ?>"<?= $slug === $route ? ' aria-current="page"' : '' ?>>
          <i class="fa-solid <?= h($glyph) ?>"></i><span><?= h($label) ?></span>
          <?php if ($was): ?><span class="was"><?= h($was) ?></span><?php endif; ?>
        </a>
      <?php endforeach; ?>
    </nav>
    <div class="side-foot">
      <div><b><?= h($node) ?></b> · Styx access point</div>
      <div>StyxAP <?= h(STYXAP_VERSION) ?> · based on RaspAP</div>
    </div>
  </aside>
  <div class="main">
    <header class="top">
      <button class="icon-button menu-button" type="button" data-action="menu" aria-label="Menu"><i class="fa-solid fa-bars"></i></button>
      <div>
        <h1><?= h($title) ?></h1>
        <div class="crumb"><?= h($ssid) ?> on <?= h($node) ?></div>
      </div>
      <div class="spacer"></div>
      <span class="live <?= $freshness === 'fresh' ? '' : ($freshness === 'stale' ? 'stale' : 'down') ?>" id="live" title="Measured by the Styx AP feed">
        <span class="dot"></span><span class="text"><?= $freshness === 'fresh' ? 'Live' : ($freshness === 'stale' ? 'Feed stalled' : 'No feed') ?></span>
      </span>
      <button class="icon-button" type="button" data-action="theme" aria-label="Light or dark"><i class="fa-solid fa-circle-half-stroke"></i></button>
      <span class="user-chip" title="Signed in through Styx"><span class="avatar"><?= h(strtoupper(substr($user, 0, 1))) ?></span><span class="name"><?= h($user) ?></span></span>
    </header>
    <main class="content">
      <?php if ($freshness !== 'fresh' && $route !== 'about'): ?>
        <div class="notice <?= $freshness === 'missing' ? 'bad' : 'warn' ?>" style="margin-bottom:18px">
          <i class="fa-solid fa-triangle-exclamation"></i>
          <div><?= $freshness === 'missing'
            ? 'The Styx AP feed has not written anything yet, so there is nothing to show. It runs in the AP pod (<code>styx-hotspot-' . h($node) . '</code>, container <code>feed</code>).'
            : 'The Styx AP feed stopped writing, so what follows is out of date. Its log is in the AP pod (<code>styx-hotspot-' . h($node) . '</code>, container <code>feed</code>).' ?></div>
        </div>
      <?php endif; ?>
      <?php include __DIR__ . '/includes/styx/pages/' . $route . '.php'; ?>
    </main>
  </div>
</div>
<script id="styx-status" type="application/json"><?= json_encode($status, JSON_HEX_TAG | JSON_HEX_AMP | JSON_UNESCAPED_SLASHES) ?></script>
<script src="/app/js/styx.js?v=<?= h(STYXAP_VERSION) ?>"></script>
</body>
</html>
