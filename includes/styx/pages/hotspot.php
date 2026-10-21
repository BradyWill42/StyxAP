<?php
/** Hotspot: the radio. Styx names it and keys it; the rest is RaspAP's hostapd.conf. */
$password = $node . 'hack';
?>
<div data-render="errors"></div>
<div class="grid cols-2">
  <section class="card"><h2>The radio</h2><div data-render="radio"></div></section>
  <section class="card">
    <h2>Joining the Wi-Fi</h2>
    <dl class="kv">
      <dt>Network</dt><dd><b><?= h($ssid) ?></b></dd>
      <dt>Password</dt>
      <dd class="row"><span class="secret" id="wifi-password" data-value="<?= h($password) ?>">••••••••••</span>
        <button class="icon-button" type="button" data-action="reveal" data-target="#wifi-password" aria-label="Show the password"><i class="fa-solid fa-eye"></i></button></dd>
      <dt>Portal</dt><dd><a href="/"><?= h((string)styx_fact($status, 'portal', $node . 'ap.styx.net')) ?></a>, through the Styx sign-in</dd>
    </dl>
    <p class="note">Styx names every access point for its Pi and keys it <code>&lt;node&gt;hack</code>, and puts both back each time the AP pod starts, so they are not changed here.</p>
  </section>
</div>
<div class="grid cols-2" style="margin-top:18px">
  <section class="card">
    <h2>Change the radio</h2>
    <form data-form="radio" data-render="radio-form">
      <div class="form-row">
        <label class="field">Channel<select name="channel"></select></label>
        <label class="field">Country<input name="country_code" maxlength="2" size="3" pattern="[A-Za-z]{2}" autocomplete="off"></label>
        <label class="field">Client limit<input name="max_num_sta" type="number" min="1" max="2007" placeholder="none"></label>
        <label class="field">Network name<select name="ignore_broadcast_ssid"><option value="0">broadcast</option><option value="1">hidden</option></select></label>
      </div>
      <div class="row" style="margin-top:16px">
        <button class="button" type="submit"><i class="fa-solid fa-floppy-disk"></i>Apply</button>
        <button class="button danger" type="button" data-action="restart-radio"><i class="fa-solid fa-rotate"></i>Restart the radio</button>
      </div>
      <p class="note">Only channels this radio can take without radar listening are offered. A change that does not bring the radio back within a minute is undone by itself.</p>
    </form>
  </section>
  <section class="card"><h2>What was asked</h2><div data-render="requests"></div></section>
</div>
<section class="card" style="margin-top:18px"><h2>Devices on the Wi-Fi</h2><div data-render="stations"></div></section>
<details class="card" style="margin-top:18px"><summary style="cursor:pointer;font-weight:650">hostapd.conf, as the radio reads it</summary><div style="margin-top:14px" data-render="settings"></div></details>
