#!/usr/bin/env bash
# Pulls the latest pstack from cursor/plugins and updates it in Claude Code, Copilot CLI and Pi.
# Claude Code installs upstream's own plugin. Copilot and Pi load the trees build.sh writes here, live from disk.
set -euo pipefail
here=$(cd "$(dirname "$0")" && pwd)
"$here/build.sh"

# Some checkouts carry an invalid repo-local settings file, which makes the CLIs refuse marketplace commands there.
cd /tmp
claude plugin marketplace update cursor-plugins >/dev/null
claude plugin update pstack@cursor-plugins
copilot plugin marketplace update pstack-harness >/dev/null
echo "Copilot and Pi load $here/{copilot,pi} live; start a new session to pick it up."
