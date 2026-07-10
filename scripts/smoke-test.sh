#!/usr/bin/env bash
# Headless smoke test: drives the real game in Chromium and fails unless the
# driver prints TEST-PASS. Usage: scripts/smoke-test.sh  (CHROMIUM=... to override)
set -euo pipefail
cd "$(dirname "$0")/.."

CHROMIUM="${CHROMIUM:-$(command -v chromium || command -v chromium-browser \
  || command -v google-chrome || echo /opt/pw-browsers/chromium)}"
if [ ! -x "$CHROMIUM" ] && ! command -v "$CHROMIUM" >/dev/null 2>&1; then
  echo "No Chromium found. Set CHROMIUM=/path/to/chromium" >&2
  exit 2
fi

TMP=".smoke-test.html"
trap 'rm -f "$TMP"' EXIT
sed 's~</body>~~' index.html > "$TMP"
cat scripts/smoke-driver.html >> "$TMP"
printf '</body></html>\n' >> "$TMP"

OUT=$("$CHROMIUM" --headless --no-sandbox --disable-gpu --virtual-time-budget=90000 \
  --dump-dom "file://$PWD/$TMP" 2>/dev/null | sed -n '/id="test-out"/,/<\/pre>/p')

echo "$OUT"
echo "$OUT" | grep -q 'TEST-PASS'
