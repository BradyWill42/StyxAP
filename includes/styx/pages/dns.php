<?php /** DNS, in Ad Blocking's place: who answers a device on this Wi-Fi. */ ?>
<div data-render="errors"></div>
<div class="grid cols-2">
  <section class="card"><h2>Who answers</h2><div data-render="dns"></div></section>
  <section class="card">
    <h2>Look a name up</h2>
    <form data-form="lookup" class="form-row">
      <label class="field" style="flex:1">Name<input name="name" placeholder="sentinel.styx.net" autocomplete="off"></label>
      <button class="button" type="submit"><i class="fa-solid fa-magnifying-glass"></i>Ask</button>
    </form>
    <div data-lookup-result></div>
    <p class="note">Asked the way this Pi asks: through the fleet's resolvers.</p>
  </section>
</div>
