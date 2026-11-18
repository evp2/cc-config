# pstack in Pi

pstack skills use Cursor names. In Pi, read this file once per session, then map each Cursor name in a skill with the tables below. `<pstack>` means `~/.pstack-harness/pi`, the folder that holds `skills/`, `agents/` and `docs/`. If a Cursor field has no row, drop it and say so.

## Tools

| Cursor | Pi |
| --- | --- |
| `Task` | A subagent is a separate Pi process: run `pi -p --no-session "<brief>"` with `bash`, and read its stdout as the result. See Subagent fields. |
| `AskQuestion` | Pi has no question tool. Ask in plain text, list the options, and stop until the user answers. |
| Open a todolist | Keep the list in your reply and update it at each phase. |
| Run another pstack skill (`/name` or "the **name** skill") | `read` `<pstack>/skills/<name>/SKILL.md` and follow it. pstack's `tdd` and `teach` are installed as `pstack-tdd` and `pstack-teach`, so `/tdd` and "the **tdd** skill" mean `<pstack>/skills/pstack-tdd/SKILL.md`. When you tell the user to type it, write `/skill:<name>`. |
| `Grep`, `Glob` | `grep` and `find` when the session has them, else `bash` with `rg`. |

## Subagent fields

Write each brief to a file and pass it with `pi -p --no-session "$(cat brief.md)"`, so quoting cannot break it.

| Cursor | Pi |
| --- | --- |
| `subagent_type: generalPurpose` | A plain `pi -p --no-session` process. |
| `poteto-agent`, `comment-sicko` | A `pi -p --no-session` process whose brief starts with the body of `<pstack>/agents/<name>.md`, below its frontmatter. |
| `readonly: true` | Add `--tools read,grep,find,ls`, so the process cannot edit or run commands, and check `git status` afterward. |
| `readonly: false` | Omit `--tools`. |
| `environment: "cloud"` | Pi has no cloud agents. Create a `git worktree`, and run the process with `bash` from inside it (`cd <worktree> && pi -p ...`). |
| `environment: "local"` | Omit. |
| `cloud_base_branch: <b>` | Check out `<b>` in that worktree before starting the process. |
| `run_in_background: true` | Start each process with `> <out>.md 2>&1 &`, keep going, and `wait` before you read the outputs. Run several this way to fan out in parallel. |
| `resume` | Start a new process and paste the earlier result into its brief. |
| `file_attachments` | List the paths in the brief. |

## Models

| Cursor | Pi |
| --- | --- |
| `claude-<family>-<version>-<effort>[-fast]`, such as `claude-opus-5-5-xhigh` | `--model claude-opus-5.5:xhigh`. The version takes a dot. Drop `-fast`. When `pi --list-models` has no such model, such as `fable`, omit `--model` and say so. |
| `gpt-<version>-<variant>[-<effort>]`, such as `gpt-6-1-sol-high` | `--model gpt-6.1-sol:high`, when `pi --list-models` lists it. |
| A `grok-*`, `gemini-*` or other unlisted slug | Omit `--model` so the process runs on the default model, and say so. |
| `auto` or `inherit-parent` | Omit `--model`. |
| The `pstack-models.mdc` rule, `~/.cursor/rules/pstack-models.mdc` | `~/.pi/agent/pstack-models.md`. Pi does not load it on its own: read it before choosing a model for a role. If the file or the role's line is missing, use the skill's default slug. |
| A role value `<model> <effort>`, such as `claude-opus-5.5 high` | `--model claude-opus-5.5:high`. |

## setup-pstack

Follow its steps with these changes:

- Detect. The detected models are the model ids `pi --list-models` prints for the default provider, each with an effort from `off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `max`. Write a model as `<model> <effort>`, such as `claude-opus-5.5 xhigh`. The effort is the last token, so the budget step works as written.
- Defaults. Map each default slug with the rows above: `claude-opus-5-5-xhigh` is `claude-opus-5.5 xhigh`, `claude-opus-5-5-high-fast` is `claude-opus-5.5 high`, and a `fable`, `grok` or `gemini` slug is `inherit-parent`.
- Write. Write `~/.pi/agent/pstack-models.md` with no frontmatter, then the comment lines, the `# budget` line, and one line per role. Overwrite the whole file. Never put the role lines in `~/.pi/agent/AGENTS.md`, `AGENTS.md` or `CLAUDE.md`.

## Paths

| Cursor | Pi |
| --- | --- |
| `.cursor/skills/`, `~/.cursor/skills/` | `.pi/skills/` or `.agents/skills/`, and `~/.pi/agent/skills/` or `~/.agents/skills/`. |
| `~/.cursor/plugins/`, `.cursor-plugin/plugin.json` | `<pstack>/`, `<pstack>/plugin.json`. Edit pstack only in `~/.pstack-harness/source`, then run `~/.pstack-harness/update.sh`; the installed copy is regenerated. |
| `.cursor/rules/*.mdc`, always-applied rules | `AGENTS.md` or `CLAUDE.md` in the project, or `~/.pi/agent/AGENTS.md` for every project. Pi never reads `.mdc` files. The model rule is the exception. See Models. |
| `https://github.com/cursor/plugins/blob/main/pstack/<path>` | `<pstack>/<path>` when that file exists. Read the local copy and never fetch it. Give the user the URL when they need a link. |
| Transcripts in `~/.cursor/projects/<slug>/agent-transcripts/` | `~/.pi/agent/sessions/<slug>/<timestamp>_<id>.jsonl`. The slug is the workspace path with each `/` changed to `-`, wrapped in `--`, so `/Users/you/proj` is `--Users-you-proj--`. The newest file is the current session. Read only this workspace's folder. |

## Cursor-only features

Pi has no Cursor Automations, Bugbot, or Cursor cloud agents. Use `gh` for pull requests. When a step needs one of the others, put one line in your reply, `Skipped in Pi: <step>. <reason>.`, then go on to the next step. Do not stop, ask, or retry. When a later step needs what the skipped step made, such as a URL or a key, leave a placeholder and name it in the line.

## Repository instructions win

Where a pstack skill conflicts with the project's `AGENTS.md` or `CLAUDE.md`, or with the user's own instructions (commit messages, PR bodies, inline comments, checks to run before done), those win.
