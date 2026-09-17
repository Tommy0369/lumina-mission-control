#!/usr/bin/env bash
# Build LUMINA.app and optionally install to ~/Desktop
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP_NAME="LUMINA"
BUILD_DIR="$ROOT/dist/macos"
APP="$BUILD_DIR/$APP_NAME.app"
ICON_SRC="$ROOT/assets/macos/AppIcon.icns"
INSTALL_DESKTOP=false

for arg in "$@"; do
  case "$arg" in
    --desktop) INSTALL_DESKTOP=true ;;
  esac
done

if [[ ! -f "$ICON_SRC" ]]; then
  echo "Missing $ICON_SRC — run icon build first (see assets/macos/README.md)"
  exit 1
fi

rm -rf "$APP"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"

cat > "$APP/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDevelopmentRegion</key>
  <string>ja_JP</string>
  <key>CFBundleExecutable</key>
  <string>launch</string>
  <key>CFBundleIconFile</key>
  <string>AppIcon</string>
  <key>CFBundleIdentifier</key>
  <string>com.tomy.lumina-mission-control</string>
  <key>CFBundleInfoDictionaryVersion</key>
  <string>6.0</string>
  <key>CFBundleName</key>
  <string>LUMINA</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>CFBundleShortVersionString</key>
  <string>0.1.0</string>
  <key>CFBundleVersion</key>
  <string>1</string>
  <key>LSMinimumSystemVersion</key>
  <string>12.0</string>
  <key>NSHighResolutionCapable</key>
  <true/>
</dict>
</plist>
PLIST

cp "$ICON_SRC" "$APP/Contents/Resources/AppIcon.icns"

cat > "$APP/Contents/MacOS/launch" <<LAUNCH
#!/usr/bin/env bash
REPO=$(printf '%q' "$ROOT")
PORT=3000
URL="http://127.0.0.1:\${PORT}/"
LOG="\${TMPDIR:-/tmp}/lumina-dev.log"

server_up() {
  curl -sf "\$URL" >/dev/null 2>&1
}

wait_for_server() {
  for _ in \$(seq 1 90); do
    if server_up; then return 0; fi
    sleep 1
  done
  return 1
}

if ! server_up; then
  cd "\$REPO" || exit 1
  if ! command -v pnpm >/dev/null 2>&1; then
    osascript -e 'display alert "LUMINA" message "pnpm が見つかりません。Node/pnpm を入れてから再度開いてください。" as critical'
    exit 1
  fi
  nohup pnpm dev >>"\$LOG" 2>&1 &
  if ! wait_for_server; then
    osascript -e 'display alert "LUMINA" message "dev サーバーが起動しませんでした。ログ: '"\$LOG"'" as critical'
    exit 1
  fi
fi

if [[ -d "/Applications/Google Chrome.app" ]]; then
  open -na "Google Chrome" --args --app="\$URL"
elif [[ -d "/Applications/Arc.app" ]]; then
  open -a "Arc" "\$URL"
else
  open "\$URL"
fi
LAUNCH

chmod +x "$APP/Contents/MacOS/launch"

echo "Built: $APP"

if $INSTALL_DESKTOP; then
  DESKTOP="$HOME/Desktop/$APP_NAME.app"
  rm -rf "$DESKTOP"
  ditto "$APP" "$DESKTOP"
  echo "Installed: $DESKTOP"
fi
