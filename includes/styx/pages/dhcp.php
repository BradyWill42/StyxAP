<?php /** DHCP Server: Styx's addressing for this radio's slice of the client band. */ ?>
<div data-render="errors"></div>
<div class="notice" style="margin-bottom:18px"><i class="fa-solid fa-circle-info"></i><div>Styx hands out these addresses, not RaspAP: each access point serves its own slice of the fleet's client band, and a device that joins once keeps its fleet name and address everywhere.</div></div>
<div class="grid cols-3">
  <section class="card"><h2>This radio's band</h2><div data-render="band"></div></section>
  <section class="card span-2"><h2>Leases</h2><div data-render="leases"></div></section>
</div>
<section class="card" style="margin-top:18px"><h2>Fleet reservations</h2><div data-render="reservations"></div></section>
