// StyxAP: every live part of every tab, drawn from the Styx AP feed's status and redrawn
// as it changes. The page arrives with the latest status inline; this keeps it current.
(function () {
  'use strict';

  var S = null;
  try { S = JSON.parse(document.getElementById('styx-status').textContent || 'null'); } catch (e) { S = null; }
  var PAGE = document.body.getAttribute('data-page');
  var EVERY = 3000;

  // ------------------------------------------------------------------ small things
  function $(selector, root) { return (root || document).querySelector(selector); }
  function $$(selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); }
  function esc(value) {
    return String(value === null || value === undefined ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function get(path, root) {
    var value = root === undefined ? S : root;
    path.split('.').forEach(function (key) { value = value === null || value === undefined ? undefined : value[key]; });
    return value;
  }
  function num(value) { return typeof value === 'number' && isFinite(value); }

  var fmt = {
    bytes: function (n) {
      if (!num(n)) return '—';
      var units = ['B', 'KB', 'MB', 'GB', 'TB'], i = 0;
      while (Math.abs(n) >= 1024 && i < units.length - 1) { n /= 1024; i++; }
      return (i === 0 ? n : n.toFixed(n >= 100 ? 0 : 1)) + ' ' + units[i];
    },
    bits: function (bytesPerSecond) {
      if (!num(bytesPerSecond)) return '—';
      var n = bytesPerSecond * 8, units = ['b/s', 'kb/s', 'Mb/s', 'Gb/s'], i = 0;
      while (n >= 1000 && i < units.length - 1) { n /= 1000; i++; }
      return (i === 0 ? Math.round(n) : n.toFixed(n >= 100 ? 0 : 1)) + ' ' + units[i];
    },
    pct: function (n) { return num(n) ? Math.round(n) + '%' : '—'; },
    temp: function (n) { return num(n) ? n.toFixed(1) + ' °C' : '—'; },
    span: function (seconds) {
      if (!num(seconds)) return '—';
      var d = Math.floor(seconds / 86400), h = Math.floor(seconds % 86400 / 3600), m = Math.floor(seconds % 3600 / 60);
      if (d) return d + 'd ' + h + 'h';
      if (h) return h + 'h ' + m + 'm';
      if (m) return m + 'm';
      return Math.round(seconds) + 's';
    },
    ago: function (seconds) { return num(seconds) ? fmt.span(seconds) + ' ago' : 'never'; },
    clock: function (t) { var d = new Date(t * 1000); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); },
    day: function (iso) { var d = new Date(iso + 'T12:00:00'); return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); },
    short: function (key) { return key ? key.slice(0, 8) + '…' : '—'; }
  };

  function level(value, warn, bad) { return !num(value) ? '' : value >= bad ? 'bad' : value >= warn ? 'warn' : 'ok'; }
  function pill(text, kind, dot) { return '<span class="pill ' + (kind || '') + '">' + (dot ? '<span class="dot"></span>' : '') + esc(text) + '</span>'; }
  function handshake(age) {
    if (!num(age)) return pill('never', 'bad', true);
    return pill(fmt.ago(age), age < 180 ? 'ok' : age < 600 ? 'warn' : 'bad', true);
  }
  function signal(dbm) {
    if (!num(dbm)) return '—';
    var s = dbm >= -55 ? 4 : dbm >= -65 ? 3 : dbm >= -75 ? 2 : 1;
    return '<span class="bars s' + s + '"><span></span><span></span><span></span><span></span></span>' + Math.round(dbm) + ' dBm';
  }
  function empty(icon, text) { return '<div class="empty"><i class="fa-solid ' + icon + '"></i>' + esc(text) + '</div>'; }
  function kv(pairs) {
    return '<dl class="kv">' + pairs.filter(function (p) { return p; }).map(function (p) {
      return '<dt>' + esc(p[0]) + '</dt><dd>' + (p[2] ? p[1] : esc(p[1] === undefined || p[1] === null || p[1] === '' ? '—' : p[1])) + '</dd>';
    }).join('') + '</dl>';
  }
  function table(columns, rows, none) {
    if (!rows.length) return none;
    return '<div class="table-wrap"><table><thead><tr>' + columns.map(function (c) {
      return '<th' + (c.num ? ' class="num"' : '') + '>' + esc(c.label) + '</th>';
    }).join('') + '</tr></thead><tbody>' + rows.map(function (row) {
      return '<tr>' + columns.map(function (c) { return '<td' + (c.num ? ' class="num"' : '') + '>' + c.cell(row) + '</td>'; }).join('') + '</tr>';
    }).join('') + '</tbody></table></div>';
  }
  function who(icon, name, sub) {
    return '<div class="who"><span class="glyph"><i class="fa-solid ' + icon + '"></i></span><span><b>' + esc(name) + '</b><small>' + esc(sub || '') + '</small></span></div>';
  }
  function meter(value, warn, bad) {
    return '<div class="meter ' + level(value, warn, bad) + '"><span style="width:' + (num(value) ? Math.min(100, Math.max(0, value)) : 0) + '%"></span></div>';
  }

  // ------------------------------------------------------------------ drawings
  function gauge(value, max, kind, label) {
    var r = 34, c = 2 * Math.PI * r, fraction = num(value) ? Math.max(0, Math.min(1, value / max)) : 0;
    var colour = kind === 'bad' ? 'var(--bad)' : kind === 'warn' ? 'var(--warn)' : kind === 'ok' ? 'var(--ok)' : 'var(--accent)';
    return '<svg class="gauge" width="84" height="84" viewBox="0 0 84 84" role="img" aria-label="' + esc(label) + '">' +
      '<circle class="track" cx="42" cy="42" r="' + r + '"/>' +
      '<circle class="arc" cx="42" cy="42" r="' + r + '" style="stroke:' + colour + '" stroke-dasharray="' + c.toFixed(1) +
      '" stroke-dashoffset="' + (c * (1 - fraction)).toFixed(1) + '" transform="rotate(-90 42 42)"/>' +
      '<text x="42" y="42">' + esc(label) + '</text></svg>';
  }
  // A fixed range (`domain`) for a percentage or a temperature, so a flat line looks flat.
  function spark(values, colour, domain) {
    var points = (values || []).map(function (v, i) { return [i, v]; }).filter(function (p) { return num(p[1]); });
    if (points.length < 2) return '<svg class="spark" viewBox="0 0 100 42" preserveAspectRatio="none"></svg>';
    var max = Math.max.apply(null, points.map(function (p) { return p[1]; })), min = Math.min.apply(null, points.map(function (p) { return p[1]; }));
    if (domain) { min = Math.min(min, domain[0]); max = Math.max(max, domain[1]); }
    var span = max - min || 1, last = (values.length - 1) || 1;
    var line = points.map(function (p, i) { return (i ? 'L' : 'M') + (100 * p[0] / last).toFixed(2) + ',' + (40 - 36 * (p[1] - min) / span).toFixed(2); }).join('');
    var style = colour ? ' style="stroke:' + colour + '"' : '';
    return '<svg class="spark" viewBox="0 0 100 42" preserveAspectRatio="none" aria-hidden="true">' +
      '<path class="area" d="' + line + 'L100,42L' + (100 * points[0][0] / last).toFixed(2) + ',42Z"' + (colour ? ' style="fill:color-mix(in srgb,' + colour + ' 14%,transparent)"' : '') + '/>' +
      '<path class="line" d="' + line + '" vector-effect="non-scaling-stroke"' + style + '/></svg>';
  }
  function nice(max) {
    if (!(max > 0)) return 1;
    var p = Math.pow(10, Math.floor(Math.log10(max))), f = max / p;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p;
  }
  function chart(el, times, series, format, opts) {
    opts = opts || {};
    times = times || [];
    if (times.length < 2) { el.innerHTML = empty('fa-chart-line', opts.waiting || 'Gathering the first minutes of history…'); return; }
    var w = Math.max(280, el.clientWidth || 600), h = opts.height || 190, l = 64, r = 8, t = 10, b = 22;
    var all = [];
    series.forEach(function (s) { (s.values || []).forEach(function (v) { if (num(v)) all.push(v); }); });
    var max = nice(Math.max(opts.floor || 0, Math.max.apply(null, all.length ? all : [0])));
    var n = times.length;
    function x(i) { return l + (w - l - r) * i / (n - 1); }
    function y(v) { return t + (h - t - b) * (1 - v / max); }
    var out = '<svg class="chart" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '" role="img" aria-label="' + esc(opts.label || 'chart') + '">';
    for (var k = 0; k <= 4; k++) {
      var v = max * k / 4, yy = y(v).toFixed(1);
      out += '<line class="grid-line" x1="' + l + '" x2="' + (w - r) + '" y1="' + yy + '" y2="' + yy + '"/>' +
        '<text class="axis" x="' + (l - 8) + '" y="' + yy + '" text-anchor="end" dominant-baseline="central">' + esc(format(v)) + '</text>';
    }
    [0, Math.floor((n - 1) / 2), n - 1].forEach(function (i, j) {
      out += '<text class="axis" x="' + x(i).toFixed(1) + '" y="' + (h - 5) + '" text-anchor="' + (j === 0 ? 'start' : j === 2 ? 'end' : 'middle') + '">' + esc(fmt.clock(times[i])) + '</text>';
    });
    series.forEach(function (s, index) {
      var cls = 's' + (s.series || index + 1), d = '';
      (s.values || []).forEach(function (value, i) { d += (d && num(value) ? 'L' : 'M') + x(i).toFixed(1) + ',' + y(num(value) ? value : 0).toFixed(1); });
      if (!d) return;
      if (s.area !== false) out += '<path class="' + cls + '" style="stroke:none" d="' + d + 'L' + x(n - 1).toFixed(1) + ',' + y(0).toFixed(1) + 'L' + x(0).toFixed(1) + ',' + y(0).toFixed(1) + 'Z"/>';
      out += '<path class="line ' + cls + '" d="' + d + '"/>';
    });
    el.innerHTML = out + '</svg>';
  }
  function legend(items) {
    return '<div class="legend">' + items.map(function (item) { return '<span style="--c:var(--series-' + item[1] + ')">' + esc(item[0]) + '</span>'; }).join('') + '</div>';
  }

  // ------------------------------------------------------------------ what the feed says
  function iface(kind) { return (get('interfaces') || []).filter(function (i) { return i.kind === kind; }); }
  function history(key) { return get('history.' + key) || []; }
  function rootDisk() { var disks = get('pi.disks') || []; return disks.filter(function (d) { return d.mount === '/'; })[0] || disks[0]; }
  function onAir() { return get('radio.mode') === 'AP' && get('radio.hostapd'); }
  function stations() { return (get('stations') || []).slice().sort(function (a, b) { return (b.signal_dbm || -999) - (a.signal_dbm || -999); }); }
  function peers(kind) {
    var found = [];
    (get('mesh') || []).forEach(function (wg) { wg.peers.forEach(function (p) { if (!kind || p.kind === kind) found.push(Object.assign({ iface: wg.name }, p)); }); });
    return found;
  }

  // ------------------------------------------------------------------ renderers, by data-render
  var R = {};

  R.hero = function (el) {
    var on = onAir(), radio = get('radio') || {};
    $('[data-bind="ssid"]', el).textContent = radio.ssid || get('facts.ssid') || '—';
    $('[data-bind="pills"]', el).innerHTML =
      pill(on ? 'On the air' : 'Off the air', on ? 'ok' : 'bad', true) +
      (radio.band ? ' ' + pill(radio.band) : '') +
      (radio.channel ? ' ' + pill('Channel ' + radio.channel + (radio.width_mhz ? ' · ' + radio.width_mhz + ' MHz' : '')) : '');
    $('[data-bind="stats"]', el).innerHTML = [
      [String((get('stations') || []).length), 'devices connected'],
      [fmt.bits((history('radio_rx').slice(-1)[0] || 0) + (history('radio_tx').slice(-1)[0] || 0)), 'on the radio now'],
      [get('egress.holder') || '—', 'carries traffic out'],
      [fmt.span(get('pi.uptime_s')), 'Pi uptime']
    ].map(function (s) { return '<div><b>' + esc(s[0]) + '</b><span>' + esc(s[1]) + '</span></div>'; }).join('');
  };

  function vital(el, value, max, kind, label, detail, series, colourKind, domain) {
    el.innerHTML = '<div class="tile">' + gauge(value, max, kind, label) +
      '<div><div class="label">' + esc(el.getAttribute('data-title')) + '</div><div class="value">' + detail.value + '</div>' +
      '<div class="detail">' + detail.sub + '</div></div></div>' + spark(series, colourKind ? 'var(--' + colourKind + ')' : null, domain);
  }
  R.glance = function (el) {
    var nodes = peers().filter(function (p) { return p.kind === 'node'; });
    var heard = nodes.filter(function (p) { return num(p.handshake_age_s) && p.handshake_age_s < 180; }).length;
    el.innerHTML = kv([
      ['Mesh', nodes.length ? pill(heard + ' of ' + nodes.length + ' Pis heard', heard === nodes.length ? 'ok' : heard ? 'warn' : 'bad', true) : '—', true],
      ['Egress', get('egress.holder') ? (get('egress.here') ? 'this Pi' : 'via ' + get('egress.holder')) : '—'],
      ['Leases', String((get('leases') || []).length) + ' handed out'],
      ['Reserved', String((get('reservations') || []).length) + ' fleet names'],
      ['VPN clients', String((get('facts.clients') || []).length) + ' registered'],
      ['Uplink', (iface('uplink')[0] || {}).name || 'none'],
      ['Sign-in', 'only through ' + (get('facts.sign_in') || 'the Styx sign-in')]
    ]);
  };

  R['vital-cpu'] = function (el) {
    var cpu = get('pi.cpu.percent'), load = get('pi.cpu.load') || [];
    vital(el, cpu, 100, level(cpu, 70, 90), fmt.pct(cpu), { value: fmt.pct(cpu), sub: 'load ' + (load.length ? load.map(function (l) { return l.toFixed(2); }).join(' · ') : '—') }, history('cpu'), null, [0, 100]);
  };
  R['vital-temp'] = function (el) {
    var t = get('pi.temp_c'), th = get('pi.throttled') || {};
    var flagged = (th.now || []).length ? th.now.join(', ') : (th.since_boot || []).length ? 'was ' + th.since_boot.join(', ') : 'no throttling';
    vital(el, t, 85, level(t, 60, 75), num(t) ? Math.round(t) + '°' : '—', { value: fmt.temp(t), sub: flagged }, history('temp'), level(t, 60, 75) === 'ok' ? null : level(t, 60, 75), [30, 85]);
  };
  R['vital-mem'] = function (el) {
    var m = get('pi.memory') || {};
    vital(el, m.percent, 100, level(m.percent, 75, 90), fmt.pct(m.percent), { value: fmt.bytes(m.used), sub: 'of ' + fmt.bytes(m.total) + (m.swap && m.swap.total ? ' · swap ' + fmt.pct(m.swap.percent) : '') }, history('mem'), null, [0, 100]);
  };
  R['vital-disk'] = function (el) {
    var d = rootDisk() || {};
    vital(el, d.percent, 100, level(d.percent, 80, 92), fmt.pct(d.percent), { value: fmt.bytes(d.used), sub: 'of ' + fmt.bytes(d.total) + ' on ' + (d.mount || '/') }, null);
  };

  R['traffic-live'] = function (el) {
    var kind = el.getAttribute('data-kind') || 'radio';
    var target = $('.chart-host', el) || el;
    chart(target, history('t'), [
      { values: history(kind + '_rx'), series: 1 },
      { values: history(kind + '_tx'), series: 2 }
    ], fmt.bits, { label: kind + ' traffic', floor: 1000 });
    var legendHost = $('.legend-host', el);
    if (legendHost) legendHost.innerHTML = legend([[el.getAttribute('data-rx') || 'In', 1], [el.getAttribute('data-tx') || 'Out', 2]]);
  };

  R.path = function (el) {
    var on = onAir(), holder = get('egress.holder'), here = get('egress.here'), age = get('egress.handshake_age_s');
    var node = get('facts.node') || 'this Pi', n = (get('stations') || []).length;
    var reach = here ? 'ok' : !num(age) ? 'bad' : age < 180 ? 'ok' : age < 600 ? 'warn' : 'bad';
    var hops = [
      ['fa-mobile-screen-button', n + ' device' + (n === 1 ? '' : 's'), 'on the Wi-Fi', n ? 'ok' : ''],
      ['fa-tower-broadcast', get('radio.ssid') || get('facts.ssid'), on ? 'channel ' + (get('radio.channel') || '?') : 'off the air', on ? 'ok' : 'bad'],
      ['fa-microchip', node, 'this Pi', 'ok'],
      here ? null : ['fa-diagram-project', 'Styx mesh', 'WireGuard, ' + (num(age) ? 'heard ' + fmt.ago(age) : 'no handshake'), reach],
      ['fa-shield-halved', holder || 'pistyx', here ? 'this Pi carries it out' : 'carries it out', holder ? reach : 'bad'],
      ['fa-globe', 'Internet', get('egress.hostname') || '', holder ? reach : '']
    ].filter(Boolean);
    el.innerHTML = '<div class="path">' + hops.map(function (h) {
      return '<div class="hop ' + h[3] + (h[3] === 'ok' ? ' flow' : '') + '"><div class="node"><i class="fa-solid ' + h[0] + '"></i></div><b>' + esc(h[1]) + '</b><small>' + esc(h[2]) + '</small></div>';
    }).join('') + '</div>';
  };

  var stationColumns = [
    { label: 'Device', cell: function (s) { return who('fa-mobile-screen-button', s.name || 'unnamed device', s.mac); } },
    { label: 'Address', cell: function (s) { return s.ip ? '<span class="mono">' + esc(s.ip) + '</span>' : '—'; } },
    { label: 'Signal', cell: function (s) { return signal(s.signal_dbm); } },
    { label: 'Link', cell: function (s) { return num(s.tx_mbps) ? esc(Math.round(s.tx_mbps) + ' / ' + Math.round(s.rx_mbps || 0) + ' Mb/s') : '—'; } },
    { label: 'Connected', cell: function (s) { return esc(fmt.span(s.connected_s)); } },
    { label: 'Down / up', num: true, cell: function (s) { return esc(fmt.bytes(s.tx_bytes) + ' / ' + fmt.bytes(s.rx_bytes)); } }
  ];
  R.stations = function (el) {
    var rows = stations();
    if (el.hasAttribute('data-brief')) rows = rows.slice(0, 6);
    el.innerHTML = table(stationColumns, rows, empty('fa-wifi', 'Nobody is on the Wi-Fi right now.'));
  };

  R.radio = function (el) {
    var r = get('radio') || {}, s = r.settings || {};
    el.innerHTML = kv([
      ['Network', r.ssid || s.ssid],
      ['State', onAir() ? pill('On the air', 'ok', true) : pill(r.hostapd ? 'Starting' : 'hostapd not running', r.hostapd ? 'warn' : 'bad', true), true],
      ['Radio', (r.interface || '—') + (r.mac ? ' · ' + r.mac : '')],
      ['Band', r.band],
      ['Channel', r.channel ? r.channel + ' (' + r.freq_mhz + ' MHz)' : s.channel],
      ['Width', r.width_mhz ? r.width_mhz + ' MHz' : '—'],
      ['Transmit power', num(r.txpower_dbm) ? r.txpower_dbm + ' dBm' : '—'],
      ['Country', s.country_code],
      ['Client limit', s.max_num_sta || 'none'],
      ['Hidden', s.ignore_broadcast_ssid === '1' ? 'yes, not broadcast' : 'no, broadcast'],
      ['Security', s.wpa === '2' ? 'WPA2 ' + (s.wpa_key_mgmt || '') : (s.wpa ? 'WPA' + s.wpa : 'open')]
    ]);
  };

  var CHANNELS = { a: [36, 40, 44, 48, 149, 153, 157, 161, 165], g: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] };
  R['radio-form'] = function (el) {
    if (el.getAttribute('data-ready')) return;
    var s = get('radio.settings') || {};
    if (!s.channel) return;
    el.setAttribute('data-ready', '1');
    var band = s.hw_mode === 'a' ? 'a' : 'g';
    $('[name="channel"]', el).innerHTML = CHANNELS[band].map(function (c) {
      return '<option value="' + c + '"' + (String(c) === s.channel ? ' selected' : '') + '>' + c + (band === 'a' ? (c < 100 ? ' · low 5 GHz' : ' · high 5 GHz') : '') + '</option>';
    }).join('');
    $('[name="country_code"]', el).value = s.country_code || '';
    $('[name="max_num_sta"]', el).value = s.max_num_sta || '';
    $('[name="ignore_broadcast_ssid"]', el).value = s.ignore_broadcast_ssid === '1' ? '1' : '0';
  };

  R.requests = function (el) {
    var pending = get('requests.pending'), recent = get('requests.recent') || [];
    var out = '';
    if (pending) out += '<div class="notice warn"><i class="fa-solid fa-spinner fa-spin"></i><div>Applying ' + esc(Object.keys(pending.changes || {}).join(', ')) + ' for ' + esc(pending.user || 'someone') + ' — the radio has until ' + esc(fmt.clock(pending.deadline)) + ' to come back, or it is put back as it was.</div></div>';
    out += recent.slice(0, 5).map(function (r) {
      return '<div class="notice ' + (r.ok ? 'ok' : 'bad') + '" style="margin-top:8px"><i class="fa-solid ' + (r.ok ? 'fa-circle-check' : 'fa-circle-xmark') + '"></i><div><b>' + esc(r.action === 'restart-radio' ? 'Restart' : 'Radio settings') + '</b> · ' + esc(r.message) + '<br><small class="mono">' + esc((r.user || '') + ' · ' + fmt.clock(r.at)) + '</small></div></div>';
    }).join('');
    el.innerHTML = out || '<p class="note">Nothing asked of the radio lately.</p>';
  };

  R.settings = function (el) {
    var s = get('radio.settings') || {};
    var keys = Object.keys(s);
    el.innerHTML = keys.length ? kv(keys.map(function (k) { return [k, s[k]]; })) : empty('fa-file-lines', 'hostapd.conf could not be read.');
  };

  R.band = function (el) {
    var b = get('facts.band') || {};
    var gateway4 = b.gateway_v4, resolvers = [gateway4].concat(get('facts.resolvers_v4') || []).filter(Boolean);
    el.innerHTML = kv([
      ['IPv4 network', b.network_v4], ['Gateway', b.gateway_v4],
      ['Handed out', b.pool_start_v4 ? b.pool_start_v4 + ' – ' + b.pool_end_v4 : '—'],
      ['Lease', get('facts.lease_time') || '10m'],
      ['IPv6 network', b.network_v6], ['IPv6', 'SLAAC with router advertisements, stateless DHCPv6 for DNS'],
      ['DNS handed out', resolvers.join(', ')],
      ['Search domain', get('facts.domain')]
    ]);
  };

  R.leases = function (el) {
    var now = get('generated') || Date.now() / 1000, online = {};
    (get('stations') || []).forEach(function (s) { online[s.mac] = true; });
    var rows = (get('leases') || []).slice().sort(function (a, b) { return a.ip.localeCompare(b.ip, undefined, { numeric: true }); });
    el.innerHTML = table([
      { label: 'Device', cell: function (l) { return who('fa-laptop', l.hostname || 'no name given', l.mac); } },
      { label: 'Address', cell: function (l) { return '<span class="mono">' + esc(l.ip) + '</span>'; } },
      { label: 'State', cell: function (l) { return online[l.mac] ? pill('on the Wi-Fi', 'ok', true) : pill('away'); } },
      { label: 'Lease ends', num: true, cell: function (l) { return num(l.expires) ? esc(l.expires > now ? 'in ' + fmt.span(l.expires - now) : 'expired') : '—'; } }
    ], rows, empty('fa-right-left', 'No leases handed out right now.'));
  };

  R.reservations = function (el) {
    var online = {};
    (get('stations') || []).forEach(function (s) { online[s.mac] = true; });
    el.innerHTML = table([
      { label: 'Fleet name', cell: function (r) { return who('fa-id-card', r.name, r.mac); } },
      { label: 'Address', cell: function (r) { return '<span class="mono">' + esc(r.ip) + '</span>'; } },
      { label: 'State', cell: function (r) { return online[r.mac] ? pill('on the Wi-Fi', 'ok', true) : pill('away'); } }
    ], get('reservations') || [], empty('fa-id-card', 'No device holds a reservation on this radio yet.'));
  };

  R.dns = function (el) {
    var b = get('facts.band') || {}, pistyx = get('facts.pistyx') || {};
    el.innerHTML = kv([
      ['Clients ask', (b.gateway_v4 || '—') + (b.gateway_v6 ? ' · ' + b.gateway_v6 : '') + ' — this radio'],
      ['Which asks', (get('facts.resolvers_v4') || []).concat(get('facts.resolvers_v6') || []).join(', ') || '—'],
      ['Answered here', get('egress.here') && pistyx.hostname ? pistyx.hostname + ' (this Pi holds it)' : 'nothing — every name goes to the fleet'],
      ['Public resolvers', 'none: answers come from Styx or not at all'],
      ['Search domain', get('facts.domain')],
      ['This portal', get('facts.portal')]
    ]);
  };

  R.interfaces = function (el) {
    var order = { radio: 0, uplink: 1, mesh: 2, cluster: 3, other: 4 };
    var rows = (get('interfaces') || []).slice().sort(function (a, b) { return (order[a.kind] - order[b.kind]) || a.name.localeCompare(b.name); });
    var icons = { radio: 'fa-tower-broadcast', uplink: 'fa-ethernet', mesh: 'fa-diagram-project', cluster: 'fa-cubes', other: 'fa-plug' };
    el.innerHTML = table([
      { label: 'Interface', cell: function (i) { return who(icons[i.kind] || 'fa-plug', i.name, i.kind + (i.mac ? ' · ' + i.mac : '')); } },
      { label: 'State', cell: function (i) { return pill(i.state || 'unknown', i.state === 'UP' ? 'ok' : i.state === 'UNKNOWN' ? '' : 'bad', true); } },
      { label: 'Addresses', cell: function (i) { return i.addresses.length ? '<span class="mono">' + i.addresses.map(esc).join('<br>') + '</span>' : '—'; } },
      { label: 'Now in / out', num: true, cell: function (i) { return esc(fmt.bits(i.rx_rate) + ' / ' + fmt.bits(i.tx_rate)); } },
      { label: 'Since boot', num: true, cell: function (i) { return esc(fmt.bytes(i.rx_bytes) + ' / ' + fmt.bytes(i.tx_bytes)); } }
    ], rows, empty('fa-network-wired', 'No interfaces measured.'));
  };

  R.routes = function (el) {
    var routes = get('default_routes') || [];
    el.innerHTML = routes.length ? kv(routes.map(function (r) { return ['Default', (r.gateway ? 'via ' + r.gateway + ' ' : '') + 'on ' + r.dev + (r.metric !== undefined ? ' · metric ' + r.metric : '')]; }))
      : empty('fa-route', 'No default route: this Pi cannot reach the internet by itself.');
  };

  R.uplink = function (el) {
    var up = iface('uplink')[0], site = get('facts.site') || {};
    el.innerHTML = up ? kv([
      ['Interface', up.name + (up.mac ? ' · ' + up.mac : '')],
      ['State', pill(up.state, up.state === 'UP' ? 'ok' : 'bad', true), true],
      ['Addresses', up.addresses.map(esc).join('<br>') || '—', true],
      ['Gateway', ((get('default_routes') || [])[0] || {}).gateway],
      ['Now', fmt.bits(up.rx_rate) + ' in · ' + fmt.bits(up.tx_rate) + ' out'],
      ['Since boot', fmt.bytes(up.rx_bytes) + ' in · ' + fmt.bytes(up.tx_bytes) + ' out'],
      ['LAN address', site.lan_ip], ['Public IPv4', site.public_ipv4], ['Public IPv6', site.public_ipv6],
      ['Entry point', site.entrypoint ? 'yes, this site answers the internet' : 'no']
    ]) : empty('fa-ethernet', 'No default route, so no uplink.');
  };

  R.mesh = function (el) {
    var wgs = get('mesh') || [];
    if (!wgs.length) { el.innerHTML = empty('fa-diagram-project', 'WireGuard showed no interface.'); return; }
    el.innerHTML = wgs.map(function (wg) {
      var nodes = wg.peers.filter(function (p) { return p.kind !== 'client'; });
      var up = nodes.filter(function (p) { return num(p.handshake_age_s) && p.handshake_age_s < 180; }).length;
      return '<div class="card" style="margin-bottom:18px"><div class="card-head"><h2>' + esc(wg.name) + '</h2><div class="row">' +
        pill(up + ' of ' + nodes.length + ' heard recently', up === nodes.length ? 'ok' : up ? 'warn' : 'bad', true) + ' ' +
        pill('port ' + (wg.listen_port || '—')) + ' ' + pill('key ' + fmt.short(wg.public_key)) + '</div></div>' +
        table([
          { label: 'Peer', cell: function (p) { return who(p.kind === 'client' ? 'fa-mobile-screen' : 'fa-server', p.name || 'unknown peer', fmt.short(p.public_key)); } },
          { label: 'Endpoint', cell: function (p) { return p.endpoint ? '<span class="mono">' + esc(p.endpoint) + '</span>' : '—'; } },
          { label: 'Routes', cell: function (p) { return '<span class="mono">' + (p.allowed_ips.slice(0, 3).map(esc).join('<br>') || '—') + (p.allowed_ips.length > 3 ? '<br>+' + (p.allowed_ips.length - 3) + ' more' : '') + '</span>'; } },
          { label: 'Handshake', cell: function (p) { return handshake(p.handshake_age_s); } },
          { label: 'In / out', num: true, cell: function (p) { return esc(fmt.bytes(p.rx_bytes) + ' / ' + fmt.bytes(p.tx_bytes)); } }
        ], wg.peers, empty('fa-diagram-project', 'No peers.')) + '</div>';
    }).join('');
  };

  R.vpn = function (el) {
    var live = {}, holder = get('egress.holder'), here = get('egress.here');
    peers('client').forEach(function (p) { live[p.public_key] = p; });
    var clients = (get('facts.clients') || []).map(function (c) { return Object.assign({ live: live[c.public_key] }, c); });
    el.innerHTML = '<p class="note" style="margin:0 0 14px">Registered Styx VPN clients. ' +
      (here ? 'This Pi holds pistyx, so it carries their tunnels: what you see is live.' : 'Their tunnels end at the pistyx holder, ' + esc(holder || '—') + ', not here, so this page lists them without a live state.') + '</p>' +
      table([
        { label: 'Client', cell: function (c) { return who('fa-mobile-screen', c.name, fmt.short(c.public_key)); } },
        { label: 'Address', cell: function (c) { return '<span class="mono">' + esc([c.ipv4, c.ipv6].filter(Boolean).join(' · ')) + '</span>'; } },
        { label: 'Tunnel', cell: function (c) { return c.live ? handshake(c.live.handshake_age_s) : pill(here ? 'not connected' : 'at ' + (holder || 'the holder')); } },
        { label: 'In / out', num: true, cell: function (c) { return c.live ? esc(fmt.bytes(c.live.rx_bytes) + ' / ' + fmt.bytes(c.live.tx_bytes)) : '—'; } }
      ], clients, empty('fa-mobile-screen', 'No VPN clients are registered. `styxctl client add <name>` registers one.'));
  };

  R.egress = function (el) {
    var holder = get('egress.holder'), here = get('egress.here'), pistyx = get('facts.pistyx') || {};
    el.innerHTML = kv([
      ['Carried out by', holder ? holder + (here ? ' — this Pi' : '') : 'no pistyx holder known'],
      ['Public name', pistyx.hostname],
      ['Mesh to the holder', here ? 'not needed' : handshake(get('egress.handshake_age_s')), !here],
      ['How', here ? 'The band\'s traffic leaves through this Pi\'s own uplink.' : 'Every device on this Wi-Fi reaches the internet over the WireGuard mesh to ' + (holder || 'the holder') + ', which carries it out. If the holder moves, the band follows it.'],
      ['Local overrides', here && pistyx.hostname ? pistyx.hostname + ' answers with the band gateway' : 'none']
    ]);
  };

  R['usage-days'] = function (el) {
    var days = Object.keys(window.STYX_USAGE && window.STYX_USAGE.days || {}).sort().slice(-14);
    if (!days.length) { el.innerHTML = empty('fa-calendar-days', 'Daily totals start with the first full minute the feed runs.'); return; }
    var usage = window.STYX_USAGE.days, kind = el.getAttribute('data-kind') || 'radio';
    var max = Math.max.apply(null, days.map(function (d) { var v = usage[d][kind] || [0, 0]; return v[0] + v[1]; })) || 1;
    el.innerHTML = days.reverse().map(function (d) {
      var v = usage[d][kind] || [0, 0];
      return '<div class="bar-row"><span>' + esc(fmt.day(d)) + '</span><div class="track"><span class="rx" style="width:' + (100 * v[0] / max) + '%"></span><span class="tx" style="width:' + (100 * v[1] / max) + '%"></span></div><span class="num">' + esc(fmt.bytes(v[0]) + ' / ' + fmt.bytes(v[1])) + '</span></div>';
    }).join('') + '<div style="margin-top:10px">' + legend([['In', 1], ['Out', 2]]) + '</div>';
  };

  R['usage-clients'] = function (el) {
    var days = Object.keys(window.STYX_USAGE && window.STYX_USAGE.days || {}).sort();
    var today = days.length ? window.STYX_USAGE.days[days[days.length - 1]].clients || {} : {};
    var rows = Object.keys(today).map(function (mac) { var v = today[mac]; return { mac: mac, down: v[1], up: v[0], name: v[2] }; })
      .sort(function (a, b) { return (b.down + b.up) - (a.down + a.up); });
    el.innerHTML = table([
      { label: 'Device', cell: function (r) { return who('fa-mobile-screen-button', r.name || 'unnamed device', r.mac); } },
      { label: 'Downloaded', num: true, cell: function (r) { return esc(fmt.bytes(r.down)); } },
      { label: 'Uploaded', num: true, cell: function (r) { return esc(fmt.bytes(r.up)); } }
    ], rows, empty('fa-user-clock', 'No device has used the Wi-Fi today.'));
  };

  R['usage-day'] = function (el) {
    var h = window.STYX_HISTORY || {}, kind = el.getAttribute('data-kind') || 'radio';
    var target = $('.chart-host', el) || el;
    chart(target, h.t, [{ values: h[kind + '_rx'], series: 1 }, { values: h[kind + '_tx'], series: 2 }], fmt.bits,
      { label: 'the last day', floor: 1000, waiting: 'The day\'s history fills in a minute at a time.' });
  };

  R.system = function (el) {
    var pi = get('pi') || {}, cpu = pi.cpu || {}, th = pi.throttled || {};
    el.innerHTML = kv([
      ['Model', pi.model], ['Operating system', pi.os], ['Kernel', pi.kernel + ' · ' + pi.arch],
      ['Hostname', pi.hostname], ['Up for', fmt.span(pi.uptime_s)], ['Processes', pi.processes],
      ['CPU', (pi.cores || '?') + ' cores' + (cpu.freq_mhz ? ' at ' + cpu.freq_mhz + ' MHz' : '') + (cpu.governor ? ' · ' + cpu.governor : '')],
      ['Load', (cpu.load || []).map(function (l) { return l.toFixed(2); }).join(' · ') + ' (1, 5, 15 min)'],
      ['Firmware flags', !th.known ? 'not reported on this board' : (th.now.length ? pill(th.now.join(', '), 'bad', true) : pill('nothing now', 'ok', true)) + (th.since_boot.length ? ' ' + pill('since boot: ' + th.since_boot.join(', '), 'warn') : ''), th.known]
    ]);
  };

  R.cores = function (el) {
    var cores = get('pi.cpu.per_core') || [];
    el.innerHTML = cores.length ? '<div class="cores">' + cores.map(function (c, i) {
      return '<div class="core">core ' + i + '<b>' + fmt.pct(c) + '</b>' + meter(c, 70, 90) + '</div>';
    }).join('') + '</div>' : empty('fa-microchip', 'The next sample shows each core.');
  };

  R.memory = function (el) {
    var m = get('pi.memory') || {}, disks = get('pi.disks') || [];
    el.innerHTML = '<div class="stack" style="gap:14px">' +
      '<div><div class="row between"><b>Memory</b><span class="note" style="margin:0">' + esc(fmt.bytes(m.used) + ' of ' + fmt.bytes(m.total)) + '</span></div>' + meter(m.percent, 75, 90) + '</div>' +
      (m.swap && m.swap.total ? '<div><div class="row between"><b>Swap</b><span class="note" style="margin:0">' + esc(fmt.bytes(m.swap.used) + ' of ' + fmt.bytes(m.swap.total)) + '</span></div>' + meter(m.swap.percent, 50, 80) + '</div>' : '') +
      disks.map(function (d) {
        return '<div><div class="row between"><b>' + esc(d.mount) + '</b><span class="note" style="margin:0">' + esc(fmt.bytes(d.used) + ' of ' + fmt.bytes(d.total) + ' · ' + d.fs + ' · ' + d.device) + '</span></div>' + meter(d.percent, 80, 92) + '</div>';
      }).join('') + '</div>';
  };

  R['temp-chart'] = function (el) {
    chart($('.chart-host', el) || el, history('t'), [{ values: history('temp'), series: 3 }], function (v) { return Math.round(v) + '°'; }, { label: 'temperature', floor: 80 });
  };
  R['cpu-chart'] = function (el) {
    chart($('.chart-host', el) || el, history('t'), [{ values: history('cpu'), series: 1 }, { values: history('mem'), series: 4, area: false }], function (v) { return Math.round(v) + '%'; }, { label: 'CPU and memory', floor: 100 });
  };

  R.errors = function (el) {
    var errors = get('errors') || [];
    el.innerHTML = errors.length ? '<div class="notice warn" style="margin-bottom:18px"><i class="fa-solid fa-circle-info"></i><div>' + errors.map(esc).join('<br>') + '</div></div>' : '';
  };

  // ------------------------------------------------------------------ keeping it current
  function render() {
    $$('[data-render]').forEach(function (el) {
      var name = el.getAttribute('data-render');
      if (!R[name]) return;
      try { R[name](el); } catch (e) { el.innerHTML = empty('fa-bug', 'Could not draw this: ' + e.message); }
    });
  }
  function live(state, text) {
    var el = $('#live');
    if (!el) return;
    el.className = 'live ' + state;
    $('.text', el).textContent = text;
  }
  function refresh() {
    fetch('/ajax/styx/status.php', { cache: 'no-store', credentials: 'same-origin' }).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    }).then(function (status) {
      if (!status) { live('down', 'No feed'); return; }
      S = status;
      var age = Date.now() / 1000 - (S.generated || 0);
      live(age < 15 ? '' : 'stale', age < 15 ? 'Live' : 'Feed stalled');
      render();
    }).catch(function () { live('down', 'Offline'); });
  }
  function load(url, key, then) {
    fetch(url, { cache: 'no-store', credentials: 'same-origin' }).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (value) { window[key] = value || {}; then(); }).catch(function () { window[key] = {}; then(); });
  }

  // ------------------------------------------------------------------ what the person does
  function toast(kind, text) {
    var el = document.createElement('div');
    el.className = 'notice toast ' + kind;
    el.innerHTML = '<i class="fa-solid ' + (kind === 'ok' ? 'fa-circle-check' : kind === 'bad' ? 'fa-circle-xmark' : 'fa-circle-info') + '"></i><div>' + esc(text) + '</div>';
    document.body.appendChild(el);
    setTimeout(function () { el.remove(); }, 6000);
  }
  function ask(body) {
    return fetch('/ajax/styx/request.php', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-StyxAP': '1' }, body: JSON.stringify(body)
    }).then(function (r) { return r.json(); }).then(function (answer) {
      toast(answer.ok ? 'ok' : 'bad', answer.message);
      setTimeout(refresh, 1500);
    }).catch(function () { toast('bad', 'The portal could not be reached.'); });
  }

  document.addEventListener('click', function (event) {
    var button = event.target.closest('[data-action]');
    if (!button) return;
    var action = button.getAttribute('data-action');
    if (action === 'theme') {
      var root = document.documentElement, dark = root.getAttribute('data-theme') === 'dark' ||
        (!root.getAttribute('data-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
      root.setAttribute('data-theme', dark ? 'light' : 'dark');
      try { localStorage.setItem('styxap-theme', dark ? 'light' : 'dark'); } catch (e) { /* this device forgets */ }
      render();
    } else if (action === 'menu') {
      $('#side').classList.toggle('open');
    } else if (action === 'restart-radio') {
      if (window.confirm('Restart the radio? Everyone on the Wi-Fi drops for a few seconds.')) ask({ action: 'restart-radio' });
    } else if (action === 'reveal') {
      var secret = $(button.getAttribute('data-target'));
      var shown = secret.getAttribute('data-shown') === '1';
      secret.textContent = shown ? '••••••••••' : secret.getAttribute('data-value');
      secret.setAttribute('data-shown', shown ? '0' : '1');
      button.innerHTML = '<i class="fa-solid ' + (shown ? 'fa-eye' : 'fa-eye-slash') + '"></i>';
    }
  });

  document.addEventListener('submit', function (event) {
    var form = event.target;
    if (form.getAttribute('data-form') === 'radio') {
      event.preventDefault();
      var settings = {};
      $$('[name]', form).forEach(function (field) { if (field.value !== '') settings[field.name] = field.value; });
      if (window.confirm('Apply these radio settings? The Wi-Fi drops while the radio restarts, and the change is undone if it does not come back within a minute.')) {
        ask({ action: 'radio-settings', settings: settings });
      }
    } else if (form.getAttribute('data-form') === 'lookup') {
      event.preventDefault();
      var out = $('[data-lookup-result]'), name = $('[name="name"]', form).value.trim();
      if (!name) return;
      out.innerHTML = '<p class="note">Asking…</p>';
      fetch('/ajax/styx/lookup.php?name=' + encodeURIComponent(name), { credentials: 'same-origin' }).then(function (r) { return r.json(); })
        .then(function (answer) {
          out.innerHTML = answer.records && answer.records.length ? table([
            { label: 'Type', cell: function (r) { return pill(r.type, 'info'); } },
            { label: 'Answer', cell: function (r) { return '<span class="mono">' + esc(r.value) + '</span>'; } },
            { label: 'TTL', num: true, cell: function (r) { return esc(r.ttl + 's'); } }
          ], answer.records, '') : '<div class="notice warn" style="margin-top:12px"><i class="fa-solid fa-circle-question"></i><div>' + esc(answer.message || 'No answer for ' + name) + '</div></div>';
        }).catch(function () { out.innerHTML = '<p class="note">The lookup could not be made.</p>'; });
    }
  });

  var resizing;
  window.addEventListener('resize', function () { clearTimeout(resizing); resizing = setTimeout(render, 150); });

  render();
  if (PAGE === 'usage') {
    load('/ajax/styx/usage.php', 'STYX_USAGE', function () { load('/ajax/styx/history.php', 'STYX_HISTORY', render); });
  }
  setInterval(function () { if (!document.hidden) refresh(); }, EVERY);
}());
