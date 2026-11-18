#!/usr/bin/env node
// Builds a pstack tree for one harness from ~/.pstack-harness/source (a cursor/plugins checkout).
// Adapted from cursor/plugins scripts/generate-pstack-harness-trees.mjs (MIT, Lauren Tan),
// which only targets Claude Code: the harness name, adapter, output folder and skill renames are arguments here.
// Usage: node build.mjs <harness> "<label>" <out-dir> [old=new,...]

import { chmodSync, copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, posix, relative } from "node:path";
import { fileURLToPath } from "node:url";

const HOME = dirname(fileURLToPath(import.meta.url));
const [HARNESS, LABEL, OUT, RENAMES = ""] = process.argv.slice(2);
if (!HARNESS || !LABEL || !OUT) {
  console.error('usage: node build.mjs <harness> "<label>" <out-dir> [old=new,...]');
  process.exit(2);
}
const RENAME = new Map(RENAMES.split(",").filter(Boolean).map((pair) => pair.split("=")));
const PSTACK = join(HOME, "source", "pstack");
const SKILLS = join(PSTACK, "skills");
const ADAPTER = `docs/harness/${HARNESS}.md`;
const GUIDE = "docs/guide";
const GITHUB = "https://github.com/cursor/plugins";
const LINK = /\]\(([^)\s]+)\)/g;

// The adapter lives outside the checkout so a fresh download keeps it; links resolve from pstack/docs/harness/.
copyFileSync(join(HOME, "adapters", `${HARNESS}.md`), join(PSTACK, ADAPTER));

const TERMS = [
  { key: "`Task`", re: /`Task`|\bTask (tool|subagent|call)/ },
  { key: "`AskQuestion`", re: /AskQuestion/ },
  { key: "todolist", re: /\btodo ?list\b/i },
  { key: "generalPurpose", re: /generalPurpose/ },
  { key: "poteto-agent", re: /poteto-agent/ },
  { key: "comment-sicko", re: /comment-sicko/ },
  { key: "`readonly: true`", re: /readonly: (true|false)|readonly\/Ask/ },
  { key: "`environment: \"cloud\"`", re: /environment: "(cloud|local)"/ },
  { key: "cloud_base_branch", re: /cloud_base_branch/ },
  { key: "`run_in_background: true`", re: /run_in_background/ },
  { key: "`resume`", re: /`resume`/ },
  { key: "`file_attachments`", re: /file_attachments/ },
  { key: "claude-", re: /\bclaude-[a-z]+-\d/ },
  { key: "grok-", re: /\bgrok-\d/ },
  { key: "gpt-", re: /\bgpt-\d/ },
  { key: "inherit-parent", re: /inherit-parent/ },
  { key: "pstack-models.mdc", re: /pstack-models\.mdc/ },
  { key: ".cursor/skills/", re: /\.cursor\/skills/ },
  { key: "~/.cursor/plugins/", re: /\.cursor\/plugins|\.cursor-plugin/ },
  { key: ".cursor/rules/", re: /\.cursor\/rules|always-applied rule/ },
  { key: "agent-transcripts", re: /agent-transcripts|\.cursor\/projects/ },
  { key: "Cursor-only features", re: /Bugbot|Cursor [Aa]utomation|cursor\.(sh|com)\/automations|[Cc]loud [Aa]gent|built-in PR tool/ },
];
const ROUTE_KEY = "Run another pstack skill";

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    if (name === ".DS_Store" || name === "node_modules") return [];
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

function file(path) {
  return { bytes: readFileSync(path), executable: (statSync(path).mode & 0o111) !== 0 };
}

const skills = readdirSync(SKILLS).filter((name) => existsSync(join(SKILLS, name, "SKILL.md")));

function classify(skill) {
  const dir = join(SKILLS, skill);
  const others = skills.filter((name) => name !== skill).join("|");
  const route = new RegExp(`the \\*\\*(?<bold>${others})\\*\\* skill|\`/(?<command>${others})\``, "g");
  const linksToSkill = (line, name) => line.includes(`(../${name}/`);
  const namesBareSkill = (line) =>
    [...line.matchAll(route)].some(({ groups }) => !linksToSkill(line, groups.bold ?? groups.command));
  const usesCursorNames = new Set();
  for (const path of walk(dir).filter((path) => path.endsWith(".md"))) {
    const text = readFileSync(path, "utf8");
    for (const term of TERMS) if (term.re.test(text)) usesCursorNames.add(term.key);
    if (text.split("\n").some(namesBareSkill)) usesCursorNames.add(ROUTE_KEY);
  }
  const text = readFileSync(join(dir, "SKILL.md"), "utf8");
  return { usesCursorNames, wrap: usesCursorNames.size > 0 && /^# /m.test(text) };
}

const classes = new Map(skills.map((skill) => [skill, classify(skill)]));
const problems = [];
const users = new Map();
for (const [skill, { usesCursorNames, wrap }] of classes) {
  if (usesCursorNames.size > 0 && !wrap) problems.push(`skills/${skill}/SKILL.md uses Cursor names but has no H1`);
  for (const key of usesCursorNames) users.set(key, [...(users.get(key) ?? []), skill]);
}
const adapter = readFileSync(join(PSTACK, ADAPTER), "utf8");
for (const [key, using] of users) {
  if (!adapter.includes(key)) problems.push(`${HARNESS} adapter has no row for ${key}, used by ${using.join(", ")}`);
}
for (const old of RENAME.keys()) if (!skills.includes(old)) problems.push(`rename ${old}: no such skill`);
for (const problem of problems) console.log(`FAIL ${problem}`);
if (problems.length > 0) process.exit(1);

function resolve(from, href) {
  const target = href.replace(/[#?].*/, "");
  if (!target || /^[a-z][a-z0-9+.-]*:/i.test(target)) return undefined;
  const path = posix.join(posix.dirname(from), target).replace(/\/$/, "");
  return existsSync(join(PSTACK, path)) ? path : undefined;
}

function has(files, path) {
  return files.has(path) || [...files.keys()].some((key) => key.startsWith(`${path}/`));
}

const copies = [...walk(SKILLS), ...walk(join(PSTACK, "agents")), ...walk(join(PSTACK, GUIDE)), join(PSTACK, ADAPTER), join(PSTACK, "README.md")];
const files = new Map(copies.map((path) => [relative(PSTACK, path), file(path)]));
const line =
  `In ${LABEL}, read [the ${LABEL} adapter](../../${ADAPTER}) once per session before you follow this skill. ` +
  `It maps the Cursor names in pstack skills to ${LABEL}.`;
for (const [skill, { wrap }] of classes) {
  const path = `skills/${skill}/SKILL.md`;
  const text = files.get(path).bytes.toString("utf8");
  if (wrap) files.get(path).bytes = Buffer.from(text.replace(/^(# .*)\n+/m, `$1\n\n${line}\n\n`));
}
files.set("LICENSE", file(join(PSTACK, "LICENSE")));
for (const manifest of ["plugin.json", ".claude-plugin/plugin.json"]) files.set(manifest, file(join(PSTACK, "plugin.json")));
for (const [path, entry] of files) {
  if (!path.endsWith(".md")) continue;
  entry.bytes = Buffer.from(
    entry.bytes.toString("utf8").replace(LINK, (link, href) => {
      const target = resolve(path, href);
      if (!target || target.split("/")[0] === ".." || has(files, target)) return link;
      const kind = statSync(join(PSTACK, target)).isDirectory() ? "tree" : "blob";
      return `](${GITHUB}/${kind}/main/pstack/${target}${href.slice(href.search(/[#?]|$/))})`;
    }),
  );
}

const dangling = [];
for (const [path, entry] of files) {
  if (!path.endsWith(".md")) continue;
  for (const [, href] of entry.bytes.toString("utf8").matchAll(LINK)) {
    const target = resolve(path, href);
    if (target && !has(files, target)) dangling.push(`${path} links to ${href}, which is not in the tree`);
  }
}
for (const link of dangling) console.log(`FAIL ${link}`);
if (dangling.length > 0) process.exit(1);

// A rename moves the skill folder, its frontmatter name, and every relative link that passes through skills/<old>/.
const renamed = new Map();
for (const [path, entry] of files) {
  const [top, skill, ...rest] = path.split("/");
  const out = top === "skills" && RENAME.has(skill) ? ["skills", RENAME.get(skill), ...rest].join("/") : path;
  if (path.endsWith(".md")) {
    let text = entry.bytes.toString("utf8").replace(LINK, (link, href) => {
      if (/^[a-z][a-z0-9+.-]*:/i.test(href)) return link;
      const target = posix.join(posix.dirname(path), href.replace(/[#?].*/, ""));
      const [t0, t1, ...trest] = target.split("/");
      if (t0 !== "skills" || !RENAME.has(t1)) return link;
      const moved = posix.relative(posix.dirname(out), ["skills", RENAME.get(t1), ...trest].join("/")) || ".";
      return `](${moved}${href.slice(href.search(/[#?]|$/))})`;
    });
    if (out !== path && rest.join("/") === "SKILL.md") text = text.replace(/^name:\s*\S+$/m, `name: ${RENAME.get(skill)}`);
    entry.bytes = Buffer.from(text);
  }
  renamed.set(out, entry);
}

rmSync(OUT, { recursive: true, force: true });
for (const [path, { bytes, executable }] of renamed) {
  mkdirSync(dirname(join(OUT, path)), { recursive: true });
  writeFileSync(join(OUT, path), bytes);
  chmodSync(join(OUT, path), executable ? 0o755 : 0o644);
}
const wrapped = [...classes.values()].filter(({ wrap }) => wrap).length;
console.log(`${HARNESS}: ${skills.length} skills, ${wrapped} with the adapter line, renamed ${[...RENAME].map((p) => p.join("->")).join(", ") || "none"} -> ${OUT}`);
