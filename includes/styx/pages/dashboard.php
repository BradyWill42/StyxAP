<?php /** Dashboard: the access point at a glance - the radio, the Pi, and the way out. */ ?>
<div data-render="errors"></div>
<section class="card hero" data-render="hero">
  <svg class="waves" viewBox="0 0 200 200" aria-hidden="true"><g fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round"><path d="M40 120a85 85 0 0 1 120 0"/><path d="M65 145a50 50 0 0 1 70 0"/><path d="M15 95a120 120 0 0 1 170 0"/></g><circle cx="100" cy="170" r="12" fill="#fff"/></svg>
  <div class="eyebrow">Styx access point · <?= h($node) ?></div>
  <h2 data-bind="ssid"><?= h($ssid) ?></h2>
  <div class="row" data-bind="pills"></div>
  <div class="hero-stats" data-bind="stats"></div>
</section>
<div class="grid cols-4" style="margin-top:18px">
  <div class="card" data-render="vital-cpu" data-title="CPU"></div>
  <div class="card" data-render="vital-temp" data-title="Temperature"></div>
  <div class="card" data-render="vital-mem" data-title="Memory"></div>
  <div class="card" data-render="vital-disk" data-title="Storage"></div>
</div>
<div class="grid cols-3" style="margin-top:18px">
  <section class="card span-2" data-render="traffic-live" data-kind="radio" data-rx="From devices" data-tx="To devices">
    <div class="card-head"><h2>Wi-Fi traffic · last 10 minutes</h2><div class="legend-host"></div></div>
    <div class="chart-host"></div>
  </section>
  <section class="card"><h2>At a glance</h2><div data-render="glance"></div></section>
</div>
<section class="card" style="margin-top:18px">
  <div class="card-head"><h2>Packet route</h2><a href="/egress">Egress <i class="fa-solid fa-arrow-right"></i></a></div>
  <div data-render="path"></div>
</section>
<section class="card" style="margin-top:18px">
  <div class="card-head"><h2>On the Wi-Fi</h2><a href="/hotspot">Every device <i class="fa-solid fa-arrow-right"></i></a></div>
  <div data-render="stations" data-brief></div>
</section>
