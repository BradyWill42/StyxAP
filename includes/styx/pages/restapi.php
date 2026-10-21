<?php
/** RestAPI: RaspAP's API, on this portal's own name, keyed by the portal itself. */
$socket = @fsockopen('127.0.0.1', 8081, $errno, $errstr, 1.0);
$up = $socket !== false;
if ($up) {
    fclose($socket);
}
$spec = null;
if ($up) {
    $text = @file_get_contents('http://127.0.0.1:8081/openapi.json', false, stream_context_create(['http' => ['timeout' => 2]]));
    $spec = $text !== false ? json_decode($text, true) : null;
}
$paths = is_array($spec['paths'] ?? null) ? $spec['paths'] : [];
?>
<div class="grid cols-3">
  <section class="card">
    <h2>The API</h2>
    <dl class="kv">
      <dt>State</dt><dd><?= $up ? '<span class="pill ok"><span class="dot"></span>answering</span>' : '<span class="pill bad"><span class="dot"></span>not answering</span>' ?></dd>
      <dt>Listens</dt><dd><code>127.0.0.1:8081</code>, this Pi only</dd>
      <dt>Reached at</dt><dd><code>/api/…</code> on this portal's name</dd>
      <dt>Key</dt><dd>added by the portal: being signed in is enough</dd>
      <dt>Version</dt><dd><?= h((string)($spec['info']['version'] ?? '—')) ?></dd>
    </dl>
    <div class="row" style="margin-top:16px">
      <a class="button" href="/docs"><i class="fa-solid fa-book-open"></i>Try it</a>
      <a class="button secondary" href="/redoc">Reference</a>
    </div>
  </section>
  <section class="card span-2">
    <h2>Endpoints</h2>
    <?php if (!$paths): ?>
      <div class="empty"><i class="fa-solid fa-plug-circle-xmark"></i>The API did not describe itself<?= $up ? '' : ': it is not running' ?>.</div>
    <?php else: ?>
      <div class="table-wrap"><table>
        <thead><tr><th>Call</th><th>What it returns</th></tr></thead>
        <tbody>
        <?php foreach ($paths as $path => $methods): foreach ($methods as $method => $operation): ?>
          <tr>
            <td><span class="pill info"><?= h(strtoupper((string)$method)) ?></span> <code>/api<?= h((string)$path) ?></code></td>
            <td><?= h((string)($operation['summary'] ?? implode(', ', $operation['tags'] ?? []))) ?></td>
          </tr>
        <?php endforeach; endforeach; ?>
        </tbody>
      </table></div>
    <?php endif; ?>
  </section>
</div>
