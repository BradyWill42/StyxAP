# StyxAP

The access point portal for [Styx](https://github.com/BradyWill42/styx). Every Styx access
point runs one at `<node>ap.styx.net`, behind the Styx sign-in: sign in once at the front
door and the portal opens with nothing else to type.

StyxAP is a remake of [RaspAP](https://github.com/RaspAP/raspap-webgui) for Styx. RaspAP
runs an access point by itself; on a Styx node the access point is Styx's - the radio, its
addresses, its names and its way out to the internet are run by the AP pod - so every tab
here shows the Styx service that stands where RaspAP's did:

| Tab | Shows |
|---|---|
| Dashboard | the radio, the Pi's vitals, live Wi-Fi traffic, the path a device's traffic takes out |
| Hotspot | the radio (channel, width, power, devices), and the few settings it may change |
| DHCP Server | the radio's slice of the fleet client band, its leases and fleet reservations |
| DNS *(was Ad Blocking)* | who answers a device here, and a lookup through the fleet's resolvers |
| Networking | every interface on the Pi, with live rates |
| Uplink *(was WiFi client)* | how the Pi itself is connected |
| WireGuard | the Styx mesh: every Pi, its endpoint, its last handshake |
| VPN clients *(was OpenVPN)* | the fleet's registered WireGuard clients |
| Egress *(was VPN Provider)* | pistyx: which Pi carries this Wi-Fi out to the internet |
| Data usage | live, the last day, five weeks by day, and per device |
| System | the Pi: model, CPU per core, temperature, throttling, memory, disks |
| RestAPI | RaspAP's API on the portal's own name, keyed by the portal |

## How it works

StyxAP runs as `www-data` and runs nothing privileged. Everything it shows is measured by
Styx's **AP feed** (`styxctl/ap_feed.py` in the Styx repository), which runs as root in the
AP pod and writes `/run/styx-ap/status.json` every three seconds. A change - restarting the
radio, or its channel, country, client limit or hidden network name - is a request the
portal drops in `/run/styx-ap/requests/`; the feed applies only what its allowlist permits,
and undoes a channel that does not bring the radio back within a minute.

The AP's lighttpd answers only requests the Styx sign-in sent (Styx's `hotspot.py`), and the
sign-in names the person in `X-Styx-User`. There is no login here, and no fallback.

## Layout

```
index.php                 the shell: sidebar, top bar, one page per tab
includes/styx/app.php     routing, the feed's status, requests to the feed
includes/styx/pages/      one skeleton per tab
app/js/styx.js            every live part, drawn from the feed's status
app/css/styx.css          the Styx palette, light and dark
ajax/styx/                status, history, usage, requests, DNS lookups (JSON)
api/                      RaspAP's REST API, unchanged
config/50-raspap-router.conf   lighttpd: everything but assets is index.php
```

## Preview without a Pi

```
php -S 127.0.0.1:8099 dev/router.php
```

serves `dev/fixture/` as the feed's output, signed in as `brady`.

## Installing

Styx installs StyxAP itself: `prepare_hotspots.py` pins a commit of this repository and
reinstalls the web root whenever the pin changes. Nothing here is installed by hand.

## License

StyxAP is a modified version of RaspAP, by Bill Zimmerman and the RaspAP contributors,
changed for Styx from October 2026 on. Like RaspAP it is free software under the GNU General
Public License, version 3 - see [LICENSE](LICENSE).
