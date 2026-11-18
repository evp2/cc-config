# pstack in GitHub Copilot CLI

pstack skills use Cursor names. In GitHub Copilot CLI, read this file once per session, then map each Cursor name in a skill with the tables below. `<pstack>` means `~/.pstack-harness/copilot`, the folder that holds `skills/`, `agents/` and `docs/`. If a Cursor field has no row, drop it and say so. Never pass a field or value the tool schema rejects.

## Tools

| Cursor | Copilot CLI |
| --- | --- |
| `Task` | `task` |
| `AskQuestion` | `ask_user`, one question per call, with `choices` when the answers are predictable. |
| Open a todolist | Insert rows into the session database's `todos` table with the `sql` tool, and update each row's `status` as you go. |
| Run another pstack skill (`/name` or "the **name** skill") | `view` `<pstack>/skills/<name>/SKILL.md` and follow it. The `skill` tool refuses most pstack skills, since they are user-invoked only. pstack's `tdd` and `teach` are installed as `pstack-tdd` and `pstack-teach`, so `/tdd` and "the **tdd** skill" mean `<pstack>/skills/pstack-tdd/SKILL.md`. When you tell the user to type it, write `/<name>`. |
| `Grep`, `Glob` | `grep`, `glob`. |

## Subagent fields

| Cursor | Copilot CLI |
| --- | --- |
| `subagent_type: generalPurpose` | `agent_type: "general-purpose"` |
| `poteto-agent`, `comment-sicko` | `agent_type: "pstack:poteto-agent"`, `agent_type: "pstack:comment-sicko"`. When the `task` tool does not list them, use `general-purpose` and paste `<pstack>/agents/<name>.md` at the top of the brief. |
| `readonly: true` | `agent_type: "explore"` for code search. For anything else, `general-purpose` with "do not edit files" in the brief, and check `git status` afterward. |
| `readonly: false` | `general-purpose`. |
| `environment: "cloud"` | Copilot CLI has no cloud agents. Create a `git worktree` for the worker, name it in the brief, and tell the worker to work only there. |
| `environment: "local"` | Omit. |
| `cloud_base_branch: <b>` | Tell the worker to check out `<b>` in its worktree first. |
| `run_in_background: true` | `mode: "background"`. You are notified when it finishes; read it once with `read_agent`. |
| `resume` | `write_agent` to the same agent id while it is idle. |
| `file_attachments` | List the paths in the brief. |

## Models

| Cursor | Copilot CLI |
| --- | --- |
| `claude-<family>-<version>-<effort>[-fast]`, such as `claude-opus-5-5-xhigh` | `model: "claude-opus-5.5"` and `reasoning_effort: "xhigh"`. The version takes a dot. Drop `-fast`. A family the `task` tool does not list, such as `fable`, omits `model` and says so. |
| `gpt-<version>-<variant>[-<effort>]`, such as `gpt-6-1-sol-high` | `model: "gpt-6.1-sol"` and `reasoning_effort: "high"`, when the `task` tool lists it. |
| A `grok-*`, `gemini-*` or other unlisted slug | Omit `model` so the agent runs on the default, and say so. |
| `auto` or `inherit-parent` | Omit `model`. |
| The `pstack-models.mdc` rule, `~/.cursor/rules/pstack-models.mdc` | `~/.copilot/pstack-models.md`. Copilot CLI does not load it on its own: read it before choosing a model for a role. If the file or the role's line is missing, use the skill's default slug. |
| A role value `<model> <effort>`, such as `claude-opus-5.5 high` | `model: "claude-opus-5.5"` and `reasoning_effort: "high"`. |

The session may require a model for a subagent type. When it does, the required model wins over a pstack role.

## setup-pstack

Follow its steps with these changes:

- Detect. The detected models are the `model` values the `task` tool schema lists, each with the `reasoning_effort` values it accepts. Write a model as `<model> <effort>`, such as `claude-opus-5.5 xhigh`. The effort is the last token, so the budget step works as written.
- Defaults. Map each default slug with the rows above: `claude-opus-5-5-xhigh` is `claude-opus-5.5 xhigh`, `claude-opus-5-5-high-fast` is `claude-opus-5.5 high`, and a `fable`, `grok` or `gemini` slug is `inherit-parent`.
- Write. Write `~/.copilot/pstack-models.md` with no frontmatter, then the comment lines, the `# budget` line, and one line per role. Overwrite the whole file. Never put the role lines in `~/.copilot/copilot-instructions.md`, `AGENTS.md` or `CLAUDE.md`.

## Paths

| Cursor | Copilot CLI |
| --- | --- |
| `.cursor/skills/`, `~/.cursor/skills/` | `.github/skills/` or `.agents/skills/`, and `~/.copilot/skills/`. |
| `~/.cursor/plugins/`, `.cursor-plugin/plugin.json` | `<pstack>/`, `<pstack>/plugin.json`. Edit pstack only in `~/.pstack-harness/source`, then run `~/.pstack-harness/update.sh`; the installed copy is regenerated. |
| `.cursor/rules/*.mdc`, always-applied rules | `AGENTS.md`, `.github/copilot-instructions.md`, or `~/.copilot/copilot-instructions.md` for every repository. Copilot CLI never reads `.mdc` files. The model rule is the exception. See Models. |
| `https://github.com/cursor/plugins/blob/main/pstack/<path>` | `<pstack>/<path>` when that file exists. Read the local copy and never fetch it. Give the user the URL when they need a link. |
| Transcripts in `~/.cursor/projects/<slug>/agent-transcripts/` | `~/.copilot/session-state/<session>/events.jsonl`. Each session's `workspace.yaml` names its `cwd`, so pick sessions whose `cwd` is this workspace. The session in use is the one whose id this session reports. Read only this workspace's sessions. |

## Cursor-only features

Copilot CLI has no Cursor Automations, Bugbot, or Cursor cloud agents. Use `gh` for pull requests. When a step needs one of the others, put one line in your reply, `Skipped in Copilot CLI: <step>. <reason>.`, then go on to the next step. Do not stop, ask, or retry. When a later step needs what the skipped step made, such as a URL or a key, leave a placeholder and name it in the line.

## Repository instructions win

Where a pstack skill conflicts with the repository's `AGENTS.md`, `CLAUDE.md` or `.github/copilot-instructions.md`, or with the user's own instructions (commit messages, PR bodies, inline comments, checks to run before done), those win.
