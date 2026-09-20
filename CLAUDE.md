## GitHub comments
Do not append a generated-by or Co-Authored-By footer to PR, review, or issue comments.

## Commit messages & PR titles
A commit message subject and a PR title must each begin with an imperative
verb (Add, Fix, Remove, Update, etc.) and stay within 75 characters, and
that's the whole thing — no body, no metadata, no rationale, no footer.

Exception: if the change has multiple concerns or touches multiple
functional areas, the commit message subject is the branch name, verbatim,
and nothing else — no imperative verb, no bullet list, no body.

## PR descriptions
**A PR has no body whatsoever.** Create it with an empty description: no summary,
no bullets, no test plan, no checklist, no headings, no links, no ticket
reference, not a single line of prose, regardless of how large or unusual the
change is. Pass `--body ""` to `gh pr create` and leave it at that. Anything that
would have gone in the body goes in the reply to me instead.

## Inline comments
Default to no comment. Write one only when its absence would mislead a reader:
a hidden constraint, a non-obvious invariant, a workaround for a specific bug, or
behavior that would surprise someone reading the code. One short line, stating the
mechanical why, with no cost/impact/trade-off framing.

Everything else is vacuous and must not be written; delete it when you find it in
code you are already editing:

- restating the line or the identifier: `# increment the counter` over `count += 1`
- naming the construct: `# loop over rows`, `# main entry point`, `# constructor`
- section banners and dividers: `# --- helpers ---`, `# Imports`, `# Constants`
- narrating the change or the task: `# new`, `# removed`, `# was 30s`, `# fixes the
  bug above`, `# per review feedback`, ticket ids
- describing the caller or the future: `# used by the ingest flow`, `# will support
  X later`
- docstrings and annotations that only re-spell the signature: `:param path: the
  path`, `# returns a bool`
- a TODO with no owner and no concrete action
- commented-out code; delete it, git has it

The bar does not drop for config, YAML, shell, or a file whose semantics are
surprising, and it does not drop for a small or unfamiliar file. Put that
explanation in the reply to me instead.

## Source code comments and checked-in docs
Do not reference internal documentation paths or IDs in source code comments
OR in any checked-in prose (README, docs/, CHANGELOG, etc.) — e.g. ADR numbers
("ADR-0001"), ticket IDs, wiki/Confluence page names, or paths into a docs/
folder. This includes relative markdown links to such docs. Never assume such
docs are available to whoever reads the file later; a comment or doc that only
makes sense next to internal docs is broken outside that context. Explain the
WHY directly at the point of use when it's non-obvious, instead of pointing
elsewhere for it.

## Memory notes
When a finding is refuted, correct every memory note that asserts it in the same
turn: follow the corrected note's `[[links]]` and backlinks, and update each one's
`MEMORY.md` index line.
