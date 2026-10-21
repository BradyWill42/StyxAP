<?php /** Data usage: measured by the Styx feed, kept for five weeks. */ ?>
<div data-render="errors"></div>
<div class="grid cols-2">
  <section class="card" data-render="traffic-live" data-kind="radio" data-rx="From devices" data-tx="To devices">
    <div class="card-head"><h2>Wi-Fi · now</h2><div class="legend-host"></div></div><div class="chart-host"></div>
  </section>
  <section class="card" data-render="usage-day" data-kind="radio">
    <div class="card-head"><h2>Wi-Fi · last day</h2></div><div class="chart-host"></div>
  </section>
  <section class="card" data-render="traffic-live" data-kind="uplink" data-rx="In" data-tx="Out">
    <div class="card-head"><h2>Uplink · now</h2><div class="legend-host"></div></div><div class="chart-host"></div>
  </section>
  <section class="card" data-render="traffic-live" data-kind="mesh" data-rx="In" data-tx="Out">
    <div class="card-head"><h2>Mesh · now</h2><div class="legend-host"></div></div><div class="chart-host"></div>
  </section>
</div>
<div class="grid cols-2" style="margin-top:18px">
  <section class="card"><h2>Wi-Fi by day</h2><div data-render="usage-days" data-kind="radio"></div></section>
  <section class="card"><h2>Devices today</h2><div data-render="usage-clients"></div></section>
</div>
