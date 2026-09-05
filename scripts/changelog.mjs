// Generate a user-facing changelog from the commits made since the last time
// CHANGELOG.md was touched, using the local `claude` CLI to write it in our
// house format. CHANGELOG.md always holds just the newest release, so the
// file never grows: git history keeps the older ones.
//
// Claude reads the commits/diff and decides itself whether the release is a
// major, minor, or patch bump (semver rules), then writes the entry.
//
//   npm run changelog              # auto-detect major/minor/patch bump and write CHANGELOG.md
//   npm run changelog -- --dry-run # print to stdout, do not write the file
//   npm run changelog -- --major   # force a major bump instead of auto-detecting
//   npm run changelog -- --minor   # force a minor bump instead of auto-detecting
//   npm run changelog -- --patch   # force a patch bump instead of auto-detecting
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
const VERSION_PLACEHOLDER = "{{VERSION}}";

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const forcedBump = args.has("--major")
  ? "major"
  : args.has("--minor")
    ? "minor"
    : args.has("--patch")
      ? "patch"
      : null;
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

function nextVersion(currentChangelog, bump) {
  if (forcedVersion) return forcedVersion;
  const match = currentChangelog.match(/App-Update\s+(\d+)\.(\d+)(?:\.(\d+))?/);
  if (!match) return "1.0";
  const major = Number(match[1]);
  const minor = Number(match[2]);
  const patch = Number(match[3] || 0);
  if (bump === "major") return `${major + 1}.0`;
  if (bump === "patch") return `${major}.${minor}.${patch + 1}`;
  return `${major}.${minor + 1}`;
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

const commitList = commits
  .map((c) => `- ${c.subject}${c.body ? `\n${c.body.replace(/^/gm, "  ")}` : ""}`)
  .join("\n");

const prompt = `Du schreibst den Changelog-Eintrag für ein internes Tool eines Tabletop-Spielevereins (Tischreservierung, Spielersuche, Getränke, Events). Die Leser sind normale Vereinsmitglieder ohne Technikkenntnisse.

Schritt 1: Bestimme selbst, ob dieses Release ein "major", "minor" oder "patch" Update ist (normale Semver-Logik):
- "major": große, einschneidende Änderungen, ein komplett neuer, zentraler Bereich der App, oder Änderungen, die sich für Nutzer massiv anders anfühlen.
- "minor": neue Funktionen oder Möglichkeiten, die Nutzer vorher nicht hatten, aber alles Bestehende funktioniert weiter wie gewohnt.
- "patch": nur Fehlerbehebungen, kleine Korrekturen, Text-/Wording-Anpassungen oder kleine optische Verbesserungen, keine neuen Funktionen.
${forcedBump ? `Der Bump-Typ wurde bereits von Menschenhand vorgegeben: "${forcedBump}". Gib trotzdem "${forcedBump}" als BUMP zurück.` : ""}

Schritt 2: Schreibe den Changelog-Eintrag im exakt gleichen Format wie der bestehende Changelog unten.

Gib deine Antwort in genau diesem Format zurück, sonst nichts:

BUMP: <major|minor|patch>

# App-Update ${VERSION_PLACEHOLDER}

## 1.  <Emoji> <Titel>
\`\`\`diff
...
\`\`\`

Regeln für den Eintrag:
- Die erste Zeile ist exakt "BUMP: major", "BUMP: minor" oder "BUMP: patch".
- Danach eine Leerzeile, dann die Überschrift "# App-Update ${VERSION_PLACEHOLDER}" (den Platzhalter ${VERSION_PLACEHOLDER} genau so wörtlich übernehmen, nicht durch eine Zahl ersetzen).
- Danach eine oder mehrere Abschnitte, jeweils "## N.  <Emoji> <Titel>" (fortlaufend nummeriert ab 1).
- Der Inhalt jedes Abschnitts steht in einem \`\`\`diff Codeblock.
- In den Codeblöcken: normale Zeilen mit zwei Leerzeichen Einzug für Kontext, "+ " für neue Möglichkeiten und Highlights, "- " für Warnungen oder Wegfall. Verschachtelte Aufzählungen mit "  - ".
- Deutsch, freundlich, "du"/"ihr". Keine technischen Begriffe (keine Datenbank, keine Server, keine Feldnamen, keine Commit-Hashes). Beschreibe nur, was Nutzer sehen und tun.
- Nur nutzerrelevante Änderungen. Reine Aufräum-, Test- oder Infrastruktur-Commits weglassen.
- Gib NUR das oben beschriebene Format aus, kein Vorwort, keine Erklärung, keinen umschließenden Codeblock um den ganzen Eintrag.

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
console.error(forcedBump ? `Bump type:       ${forcedBump} (forced)` : "Bump type:       letting claude decide...");
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

const raw = stripCodeFence(result.stdout);
const bumpMatch = raw.match(/^BUMP:\s*(major|minor|patch)\s*\n+([\s\S]*)$/i);
if (!bumpMatch) {
  console.error("claude did not return the expected \"BUMP: ...\" header. Raw output:\n");
  console.error(raw);
  process.exit(1);
}

const detectedBump = bumpMatch[1].toLowerCase();
const bump = forcedBump || detectedBump;
const version = nextVersion(currentChangelog, bump);
const entry = bumpMatch[2].trim().split(VERSION_PLACEHOLDER).join(version);

if (!entry) {
  console.error("claude returned an empty entry.");
  process.exit(1);
}

console.error(`Bump type used:  ${bump}${forcedBump && forcedBump !== detectedBump ? ` (claude suggested ${detectedBump})` : ""}`);
console.error(`New version:     ${version}`);

if (dryRun) {
  console.log(entry);
  process.exit(0);
}

writeFileSync(CHANGELOG, `${entry}\n`);
console.error("\nWrote CHANGELOG.md (replaced with the new release). Review and commit when happy.");
