#!/usr/bin/env bash
# Downloads the latest pstack from cursor/plugins and regenerates the Copilot CLI and Pi trees beside this script.
set -euo pipefail
cd "$(dirname "$0")"

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
gh api repos/cursor/plugins/tarball/main > "$tmp/plugins.tgz"
tar xzf "$tmp/plugins.tgz" -C "$tmp"
rm -rf source && mv "$tmp"/cursor-plugins-* source
gh api repos/cursor/plugins/commits/main --jq .sha > source/.commit

renames=tdd=pstack-tdd,teach=pstack-teach
node build.mjs copilot "GitHub Copilot CLI" "$PWD/copilot" "$renames"
node build.mjs pi "Pi" "$PWD/pi" "$renames"

# The manifest declares Agent Plugins 1.0, under which Copilot reads agents only from com.github.copilot/agents/*.agent.md.
mkdir -p copilot/com.github.copilot/agents
for agent in copilot/agents/*.md; do
  cp "$agent" "copilot/com.github.copilot/agents/$(basename "${agent%.md}").agent.md"
done

echo "pstack $(node -p 'require(process.argv[1]).version' "$PWD/source/pstack/plugin.json") from cursor/plugins $(cut -c1-8 source/.commit)"
