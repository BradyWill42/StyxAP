<?php /** About StyxAP. */ ?>
<div class="grid cols-2">
  <section class="card">
    <div class="row" style="gap:16px;margin-bottom:12px">
      <span style="width:56px;height:56px;display:block"><?php include __DIR__ . '/../mark.svg.php'; ?></span>
      <div><h2 style="margin:0;text-transform:none;letter-spacing:-.4px;font-size:24px;color:var(--ink)">StyxAP</h2><span class="note" style="margin:0">version <?= h(STYXAP_VERSION) ?></span></div>
    </div>
    <p>The access point portal for Styx. Every Styx access point runs one, behind the Styx sign-in: sign in once at the front door and the portal opens with nothing else to type.</p>
    <p>Styx runs the access point - the radio, its addresses, its names, and the way out to the internet - and StyxAP shows it. What the portal shows is measured by Styx's AP feed, which runs as root in the AP pod; the portal itself runs nothing privileged and asks the feed for any change.</p>
  </section>
  <section class="card">
    <h2>Built on RaspAP</h2>
    <p>StyxAP is a fork of <a href="https://github.com/RaspAP/raspap-webgui">RaspAP</a> by Bill Zimmerman and its contributors, remade for Styx. Like RaspAP, it is free software under the <a href="https://www.gnu.org/licenses/gpl-3.0.html">GNU General Public License, version 3</a>: see <code>LICENSE</code>.</p>
    <dl class="kv">
      <dt>Source</dt><dd><a href="https://github.com/BradyWill42/StyxAP">BradyWill42/StyxAP</a></dd>
      <dt>Upstream</dt><dd><a href="https://github.com/RaspAP/raspap-webgui">RaspAP/raspap-webgui</a></dd>
      <dt>Runs on</dt><dd><?= h((string)styx_fact($status, 'node', '—')) ?></dd>
    </dl>
  </section>
</div>
