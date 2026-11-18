#!/usr/bin/env bash
# Sets up pstack for Claude Code, Copilot CLI and Pi on this machine, from ~/.pstack-harness.
# PI names the pi binary when it is not on PATH, such as one installed under rc-agent's node_modules.
set -euo pipefail
src=$(cd "$(dirname "$0")" && pwd)
dest="$HOME/.pstack-harness"
pi_bin="${PI:-pi}"

# The adapters name ~/.pstack-harness as the install folder, so the scripts run from there, not from this checkout.
mkdir -p "$dest/adapters" "$dest/.github/plugin"
cp "$src"/adapters/*.md "$dest/adapters/"
cp "$src"/build.mjs "$src"/build.sh "$src"/update.sh "$dest/"
cp "$src/.github/plugin/marketplace.json" "$dest/.github/plugin/"
chmod +x "$dest"/build.sh "$dest"/update.sh
"$dest/build.sh"

cd /tmp
claude plugin marketplace add cursor/plugins >/dev/null 2>&1 || true
claude plugin install pstack@cursor-plugins --scope user
copilot plugin marketplace add "$dest" >/dev/null 2>&1 || true
copilot plugin install pstack@pstack-harness
if command -v "$pi_bin" >/dev/null 2>&1; then
  "$pi_bin" install "$dest/pi"
else
  echo "Skipped Pi: no pi binary. Rerun with PI=/path/to/pi."
fi
