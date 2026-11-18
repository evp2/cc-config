# pstack for Claude Code, Copilot CLI and Pi

[pstack](https://github.com/cursor/plugins/tree/main/pstack) is written for Cursor. Upstream also publishes a Claude Code plugin. This folder builds the same skills for GitHub Copilot CLI and Pi, so all three run the latest upstream version.

- **Claude Code** installs upstream's `pstack@cursor-plugins` plugin. Commands are `/pstack:<name>`.
- **Copilot CLI** loads `~/.pstack-harness/copilot` as `pstack@pstack-harness` from a local marketplace. Agents are `pstack:poteto-agent` and `pstack:comment-sicko`.
- **Pi** loads `~/.pstack-harness/pi` as a package. Commands are `/skill:<name>`.

## Install and update

```sh
./install.sh                 # once per machine; PI=/path/to/pi if pi is not on PATH
~/.pstack-harness/update.sh  # pull the latest pstack into all three
```

`install.sh` copies this folder to `~/.pstack-harness`, since the adapters name that path. Edit the adapters here, then run `install.sh` again.

## How the Copilot and Pi trees differ from upstream

`build.mjs` is upstream's `scripts/generate-pstack-harness-trees.mjs`, taking the harness, adapter and output folder as arguments. Each generated skill that uses Cursor names starts by pointing at `docs/harness/copilot.md` or `docs/harness/pi.md` (from `adapters/`), which map those names to the harness: `task` and `ask_user` in Copilot, `pi -p` subprocesses in Pi.

pstack's `tdd` and `teach` become `pstack-tdd` and `pstack-teach`, because Copilot and Pi let a personal skill of the same name hide a plugin's.
