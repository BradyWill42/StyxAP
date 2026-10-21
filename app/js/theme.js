// Before the page paints: the light/dark choice this device made, if it made one.
(function () {
  try {
    var chosen = localStorage.getItem('styxap-theme');
    if (chosen === 'light' || chosen === 'dark') document.documentElement.setAttribute('data-theme', chosen);
  } catch (e) { /* no storage: follow the device */ }
})();
