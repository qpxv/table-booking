// Generate a user-facing changelog from the commits made since the last time
// CHANGELOG.md was touched, using the local `claude` CLI to write it in our
// house format. CHANGELOG.md always holds just the newest release, so the
// file never grows: git history keeps the older ones.
//
//   npm run changelog              # overwrite CHANGELOG.md with the new "App-Update X.Y"
//   npm run changelog -- --dry-run # print to stdout, do not write the file
//   npm run changelog -- --major   # bump the major version instead of minor
//   npm run changelog -- --set 2.0 # force a specific version number
//
// Needs the `claude` CLI on PATH (comes with Claude Code). Nothing is
// committed: review the result, edit if needed, then commit yourself.

import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CHANGELOG = join(ROOT, "CHANGELOG.md");
const DIFF_BUDGET = 50_000;

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const bumpMajor = args.has("--major");
const setIdx = process.argv.indexOf("--set");
const forcedVersion = setIdx !== -1 ? process.argv[setIdx + 1] : null;

function git(...a) {
  return execFileSync("git", a, {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 256 * 1024 * 1024,
  }).trim();
}

function baselineCommit() {
  // Everything committed after CHANGELOG.md was last touched is "new".
  const touched = git("log", "-1", "--format=%H", "--", "CHANGELOG.md");
  if (touched) return touched;
  // First run (CHANGELOG.md not committed yet): fall back to the latest tag,
  // otherwise the last 15 commits. Trim the generated entry by hand this once.
  const tag = spawnSync("git", ["describe", "--tags", "--abbrev=0"], {
    cwd: ROOT,
    encoding: "utf8",
  });
  if (tag.status === 0 && tag.stdout.trim()) return tag.stdout.trim();
  const count = Number(git("rev-list", "--count", "HEAD"));
  return count > 15 ? "HEAD~15" : git("rev-list", "--max-parents=0", "HEAD").split("\n")[0];
}

function nextVersion(currentChangelog) {
  if (forcedVersion) return forcedVersion;
  const match = currentChangelog.match(/App-Update\s+(\d+)\.(\d+)/);
  if (!match) return "1.0";
  const major = Number(match[1]);
  const minor = Number(match[2]);
  return bumpMajor ? `${major + 1}.0` : `${major}.${minor + 1}`;
}

function stripCodeFence(text) {
  const fenced = text.match(/^```(?:markdown|md)?\n([\s\S]*?)\n```\s*$/);
  return (fenced ? fenced[1] : text).trim();
}

const base = baselineCommit();
const range = `${base}..HEAD`;

const commits = git("log", range, "--reverse", "--format=%h%x1f%s%x1f%b%x1e")
  .split("\x1e")
  .map((c) => c.trim())
  .filter(Boolean)
  .map((c) => {
    const [hash, subject, body] = c.split("\x1f");
    return { hash, subject, body: (body || "").trim() };
  });

if (commits.length === 0) {
  console.log("No new commits since CHANGELOG.md was last updated. Nothing to do.");
  process.exit(0);
}

const stat = git("diff", "--stat", range);
// Skip lockfiles / generated output from the diff the model reads.
let diff = git(
  "diff",
  range,
  "--",
  ".",
  ":(exclude)package-lock.json",
  ":(exclude)generated/**",
  ":(exclude)public/**",
);
if (diff.length > DIFF_BUDGET) {
  diff = `${diff.slice(0, DIFF_BUDGET)}\n\n[... Diff gekürzt ...]`;
}

const currentChangelog = existsSync(CHANGELOG) ? readFileSync(CHANGELOG, "utf8") : "";
const version = nextVersion(currentChangelog);

const commitList = commits
  .map((c) => `- ${c.subject}${c.body ? `\n${c.body.replace(/^/gm, "  ")}` : ""}`)
  .join("\n");

const prompt = `Du schreibst den Changelog-Eintrag für ein internes Tool eines Tabletop-Spielevereins (Tischreservierung, Spielersuche, Getränke, Events). Die Leser sind normale Vereinsmitglieder ohne Technikkenntnisse.

Schreibe den Eintrag für Version ${version} im exakt gleichen Format wie der bestehende Changelog unten. Regeln:

- Beginne mit der Überschrift "# App-Update ${version}".
- Danach eine oder mehrere Abschnitte, jeweils "## N.  <Emoji> <Titel>" (fortlaufend nummeriert ab 1).
- Der Inhalt jedes Abschnitts steht in einem \`\`\`diff Codeblock.
- In den Codeblöcken: normale Zeilen mit zwei Leerzeichen Einzug für Kontext, "+ " für neue Möglichkeiten und Highlights, "- " für Warnungen oder Wegfall. Verschachtelte Aufzählungen mit "  - ".
- Deutsch, freundlich, "du"/"ihr". Keine technischen Begriffe (keine Datenbank, keine Server, keine Feldnamen, keine Commit-Hashes). Beschreibe nur, was Nutzer sehen und tun.
- Nur nutzerrelevante Änderungen. Reine Aufräum-, Test- oder Infrastruktur-Commits weglassen.
- Gib NUR den Markdown-Eintrag aus, kein Vorwort, keine Erklärung, keinen umschließenden Codeblock.

=== BESTEHENDER CHANGELOG (Formatvorlage) ===
${currentChangelog || "(noch keiner vorhanden)"}

=== COMMITS SEIT DEM LETZTEN CHANGELOG ===
${commitList}

=== GEÄNDERTE DATEIEN ===
${stat}

=== DIFF ===
${diff}
`;

console.error(`Baseline commit: ${base}`);
console.error(`Commits since:   ${commits.length}`);
console.error(`New version:     ${version}`);
console.error("Asking claude to write the entry...\n");

// `claude -p` is a full agent: run it with NO tools and auto-deny any
// permission prompt so it can only generate text and never touches the repo.
const result = spawnSync(
  "claude",
  ["-p", prompt, "--tools", "", "--permission-prompts", "none"],
  { encoding: "utf8", cwd: ROOT, maxBuffer: 64 * 1024 * 1024 },
);
if (result.error) {
  console.error("Could not run the `claude` CLI. Is it installed and on PATH?");
  console.error(result.error.message);
  process.exit(1);
}
if (result.status !== 0) {
  console.error(result.stderr || "claude exited with a non-zero status.");
  process.exit(result.status ?? 1);
}

const entry = stripCodeFence(result.stdout);
if (!entry) {
  console.error("claude returned an empty response.");
  process.exit(1);
}

if (dryRun) {
  console.log(entry);
  process.exit(0);
}

writeFileSync(CHANGELOG, `${entry}\n`);
console.error("\nWrote CHANGELOG.md (replaced with the new release). Review and commit when happy.");
