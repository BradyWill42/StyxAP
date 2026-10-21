#!/bin/sh
# Remove StyxAP: what install.sh put down, and nothing else. Safe to run on any node, any
# number of times. install.sh leaves a copy at /usr/local/lib/styxap/uninstall.sh, so a
# node can always undo what it has, whichever StyxAP that was. Needs root.
#
# The same STYXAP_ROOT, STYXAP_API, STYXAP_LIGHTTPD and STYXAP_LIB as install.sh.
set -eu
root=${STYXAP_ROOT:-/var/www/html}
api=${STYXAP_API:-/etc/raspap/api}
lighttpd=${STYXAP_LIGHTTPD:-/etc/lighttpd}
lib=${STYXAP_LIB:-/usr/local/lib/styxap}

# The web root only if it is StyxAP's; an empty one is left, as the package ships it.
if [ -e "$root/.styxap-commit" ]; then
    rm -rf "$root"
    mkdir -p "$root"
fi
rm -rf "$api"
rm -f "$lighttpd/conf-enabled/50-raspap-router.conf" "$lighttpd/conf-available/50-raspap-router.conf"
rm -rf "$lib"
echo "StyxAP removed"
