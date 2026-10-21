<?php /** Uplink, in WiFi client's place: how this Pi itself is connected. */ ?>
<div data-render="errors"></div>
<div class="grid cols-3">
  <section class="card"><h2>This Pi's uplink</h2><div data-render="uplink"></div></section>
  <section class="card span-2" data-render="traffic-live" data-kind="uplink" data-rx="In" data-tx="Out">
    <div class="card-head"><h2>Uplink traffic · last 10 minutes</h2><div class="legend-host"></div></div>
    <div class="chart-host"></div>
  </section>
</div>
