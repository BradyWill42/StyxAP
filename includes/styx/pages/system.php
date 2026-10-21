<?php /** System: the Pi under the access point. */ ?>
<div data-render="errors"></div>
<div class="grid cols-4">
  <div class="card" data-render="vital-cpu" data-title="CPU"></div>
  <div class="card" data-render="vital-temp" data-title="Temperature"></div>
  <div class="card" data-render="vital-mem" data-title="Memory"></div>
  <div class="card" data-render="vital-disk" data-title="Storage"></div>
</div>
<div class="grid cols-2" style="margin-top:18px">
  <section class="card"><h2>This Pi</h2><div data-render="system"></div></section>
  <section class="card"><h2>Cores</h2><div data-render="cores"></div><h2 style="margin-top:20px">Memory and storage</h2><div data-render="memory"></div></section>
  <section class="card" data-render="cpu-chart"><div class="card-head"><h2>CPU and memory · last 10 minutes</h2><div class="legend"><span style="--c:var(--series-1)">CPU</span><span style="--c:var(--series-4)">Memory</span></div></div><div class="chart-host"></div></section>
  <section class="card" data-render="temp-chart"><div class="card-head"><h2>Temperature · last 10 minutes</h2></div><div class="chart-host"></div></section>
</div>
