## Git commit & PR attribution
Do not append any attribution trailer — omit "🤖 Generated with Claude Code"
and "Co-Authored-By: Claude <noreply@anthropic.com>" — to commit messages, PR
titles, or GitHub comments (PR comments, review comments, issue comments).
Keep all of these clean, with no generated-by/co-authored-by footer.

## Commit messages & PR titles
A commit message subject and a PR title must each begin with an imperative
verb (Add, Fix, Remove, Update, etc.) and stay within 75 characters, and
that's the whole thing — no body, no metadata, no rationale, no footer. PR
descriptions never get a body either, regardless of scope.

Exception: if the change has multiple concerns or touches multiple
functional areas, the commit message subject is the branch name, verbatim,
and nothing else — no imperative verb, no bullet list, no body.

## Source code comments and checked-in docs
Do not reference internal documentation paths or IDs in source code comments
OR in any checked-in prose (README, docs/, CHANGELOG, etc.) — e.g. ADR numbers
("ADR-0001"), ticket IDs, wiki/Confluence page names, or paths into a docs/
folder. This includes relative markdown links to such docs. Never assume such
docs are available to whoever reads the file later; a comment or doc that only
makes sense next to internal docs is broken outside that context. Explain the
WHY directly at the point of use when it's non-obvious, instead of pointing
elsewhere for it.
