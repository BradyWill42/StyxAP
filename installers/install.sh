#!/bin/sh
# Install StyxAP from the checkout this script is in. Run it again to update: it builds the
# new web root beside the live one and swaps it in whole, so a failure leaves what was
# there. Needs root, lighttpd and php-fpm.
#
# Where things go (the defaults are what Styx expects):
#   STYXAP_ROOT      /var/www/html            the web root, owned by root, read by www-data
#   STYXAP_API       /etc/raspap/api          RaspAP's REST API, run by Styx's AP pod
#   STYXAP_LIGHTTPD  /etc/lighttpd            the router: everything but assets is index.php
#   STYXAP_LIB       /usr/local/lib/styxap    uninstall.sh, so a node can always undo this
#   STYXAP_OWNER     root:root
#   STYXAP_COMMIT    the commit, if the checkout cannot say (stamped in the web root)
set -eu
here=$(cd "$(dirname "$0")/.." && pwd)
root=${STYXAP_ROOT:-/var/www/html}
api=${STYXAP_API:-/etc/raspap/api}
lighttpd=${STYXAP_LIGHTTPD:-/etc/lighttpd}
lib=${STYXAP_LIB:-/usr/local/lib/styxap}
owner=${STYXAP_OWNER:-root:root}
commit=${STYXAP_COMMIT:-$(git -C "$here" rev-parse HEAD 2>/dev/null || echo unknown)}

for file in index.php api/main.py config/50-raspap-router.conf installers/uninstall.sh; do
    if [ ! -f "$here/$file" ]; then
        echo "StyxAP: $file is missing from $here" >&2
        exit 1
    fi
done
# Never over another site: only an empty root, RaspAP's, or StyxAP's own is replaced.
if [ -e "$root/index.php" ] && [ ! -e "$root/.styxap-commit" ] && ! grep -qs RaspAP "$root/index.php"; then
    echo "StyxAP: $root holds another site; refusing to replace it" >&2
    exit 1
fi

trap 'rm -rf "$root.styxap-new"' EXIT
rm -rf "$root.styxap-new"
mkdir -p "$root.styxap-new" "$api" "$lib" "$lighttpd/conf-available" "$lighttpd/conf-enabled"
(cd "$here" && tar -cf - --exclude=./.git --exclude=./api --exclude=./dev --exclude=./installers .) | (cd "$root.styxap-new" && tar -xf -)
echo "$commit" > "$root.styxap-new/.styxap-commit"
# The API as shipped, keeping only its own settings file.
find "$api" -mindepth 1 -maxdepth 1 ! -name .env -exec rm -rf {} +
(cd "$here/api" && tar -cf - .) | (cd "$api" && tar -xf -)
cp "$here/installers/uninstall.sh" "$lib/uninstall.sh"
chown -R "$owner" "$root.styxap-new" "$api" "$lib"
chmod -R u=rwX,go=rX "$root.styxap-new" "$api" "$lib"
chmod 755 "$lib/uninstall.sh"
sed 's@/REPLACE_ME@@g' "$here/config/50-raspap-router.conf" > "$lighttpd/conf-available/50-raspap-router.conf"
ln -sf ../conf-available/50-raspap-router.conf "$lighttpd/conf-enabled/50-raspap-router.conf"

rm -rf "$root.styxap-old"
if [ -e "$root" ]; then
    mv "$root" "$root.styxap-old"
fi
mv "$root.styxap-new" "$root"
rm -rf "$root.styxap-old"
echo "StyxAP $commit installed in $root"
