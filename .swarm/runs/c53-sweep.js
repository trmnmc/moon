#!/usr/bin/env node
'use strict';

/**
 * T-144 — Mutation sweep of src/args.js and src/hemisphere.js
 *
 * Adapted from c52-sweep.js (T-143, src/render.js). Same discipline, extended to two
 * source files: each mutant now names its own target file. Applies each mutant below to
 * a fresh throwaway copy of the whole repo (via `git archive HEAD` into a tmp dir — the
 * real tree is never touched, even transiently), runs `node --test test/*.test.js`
 * there, and records KILLED (suite went red) or SURVIVED (suite stayed green).
 *
 * Run from the repo root:
 *   node .swarm/runs/c53-sweep.js
 *
 * Requires: a git checkout (uses `git archive HEAD` to get a clean, tracked copy of the
 * repo into a tmp dir). No network, no npm install, no deps.
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const ARGS_REL = 'src/args.js';
const HEMI_REL = 'src/hemisphere.js';
const TEST_FILES = fs
  .readdirSync(path.join(REPO_ROOT, 'test'))
  .filter((f) => f.endsWith('.test.js'))
  .sort();

// ---------------------------------------------------------------------------
// Mutant catalogue
// ---------------------------------------------------------------------------
// Each mutant is a single exact-string substitution against the PRISTINE source of its
// named `file` (never chained against a previous mutant). `find` must occur exactly once
// in that pristine source, or the script aborts — that guarantees each mutant lands
// where its comment says it does.

const MUTANTS = [
  // === src/args.js ==========================================================

  // --- 1. Per-flag wiring in the return object (each flag the parser accepts) ---
  {
    id: 'AJ1',
    file: ARGS_REL,
    behavior: 'args: --json flag wiring',
    note: 'json comparison flipped: === true -> !== true (default becomes true, not false)',
    find: `    json: parsed.values.json === true,`,
    replace: `    json: parsed.values.json !== true,`,
  },
  {
    id: 'AJ2',
    file: ARGS_REL,
    behavior: 'args: --block flag wiring',
    note: 'block comparison flipped: === true -> !== true',
    find: `    block: parsed.values.block === true,`,
    replace: `    block: parsed.values.block !== true,`,
  },
  {
    id: 'AJ3',
    file: ARGS_REL,
    behavior: 'args: --compact flag wiring',
    note: 'compact comparison flipped: === true -> !== true',
    find: `    compact: parsed.values.compact === true,`,
    replace: `    compact: parsed.values.compact !== true,`,
  },
  {
    id: 'AJ4',
    file: ARGS_REL,
    behavior: 'args: --help/-h flag wiring',
    note: 'help comparison flipped: === true -> !== true',
    find: `    help: parsed.values.help === true,`,
    replace: `    help: parsed.values.help !== true,`,
  },

  // --- 2. Hemisphere flags (--south / --north) and last-one-wins override ---
  {
    id: 'AH1',
    file: ARGS_REL,
    behavior: 'args: --south sets hemisphere south',
    note: "south token wired to the wrong value: hemisphere = 'south' -> 'north'",
    find: `    if (token.name === 'south') hemisphere = 'south';`,
    replace: `    if (token.name === 'south') hemisphere = 'north';`,
  },
  {
    id: 'AH2',
    file: ARGS_REL,
    behavior: 'args: --north sets hemisphere north',
    note: "north token wired to the wrong value: hemisphere = 'north' -> 'south'",
    find: `    else if (token.name === 'north') hemisphere = 'north';`,
    replace: `    else if (token.name === 'north') hemisphere = 'south';`,
  },
  {
    id: 'AH3',
    file: ARGS_REL,
    behavior: 'args: last-one-wins hemisphere override',
    note: 'token walk reversed: LAST flag on the line no longer wins, first one does',
    find: `  for (const token of parsed.tokens) {\n    if (token.kind !== 'option') continue;`,
    replace: `  for (const token of parsed.tokens.slice().reverse()) {\n    if (token.kind !== 'option') continue;`,
  },
  {
    id: 'AH4',
    file: ARGS_REL,
    behavior: 'args: hemisphere default is null (auto-detect sentinel)',
    note: "initial default changed: 'let hemisphere = null' -> 'north', so 'no flag given' stops meaning auto-detect",
    find: `  let hemisphere = null;`,
    replace: `  let hemisphere = 'north';`,
  },
  {
    id: 'AH5',
    file: ARGS_REL,
    behavior: 'args: option-token filter in the hemisphere walk',
    note: "token.kind !== 'option' guard flipped to === 'option' (skips real option tokens instead of non-option ones)",
    find: `    if (token.kind !== 'option') continue;`,
    replace: `    if (token.kind === 'option') continue;`,
  },

  // --- 3. argv normalization (documented: undefined argv == no arguments) ---
  {
    id: 'AA1',
    file: ARGS_REL,
    behavior: 'args: undefined argv treated as no arguments',
    note: "argv === undefined -> argv === null, so parseArgs(undefined) no longer normalizes to []",
    find: `  const args = argv === undefined ? [] : argv;`,
    replace: `  const args = argv === null ? [] : argv;`,
  },

  // --- 4. EUSAGE error contract (documented: code === 'EUSAGE', one-line message) ---
  {
    id: 'AE1',
    file: ARGS_REL,
    behavior: 'args: usage errors carry code EUSAGE',
    note: 'the err.code = EUSAGE assignment is dropped',
    find: `  const err = new Error(message);\n  err.code = 'EUSAGE';`,
    replace: `  const err = new Error(message);`,
  },
  {
    id: 'AE2',
    file: ARGS_REL,
    behavior: 'args: unknown-option message wording',
    note: "'unknown option' wording changed to 'bad option' (documented message content)",
    find: `      return usageError(\`unknown option\${token} - \${hint}\`);`,
    replace: `      return usageError(\`bad option\${token} - \${hint}\`);`,
  },
  {
    id: 'AE3',
    file: ARGS_REL,
    behavior: 'args: unexpected-positional message wording',
    note: "'positional arguments' dropped from the unexpected-argument message",
    find: `      return usageError(\`unexpected argument\${token} - moon takes no positional arguments; \${hint}\`);`,
    replace: `      return usageError(\`unexpected argument\${token} - moon takes no arguments; \${hint}\`);`,
  },
  {
    id: 'AE4',
    file: ARGS_REL,
    behavior: 'args: invalid-option-value message wording',
    note: "'takes no value' dropped from the flag-given-a-value message",
    find: `      return usageError(\`option\${token} is a flag and takes no value - \${hint}\`);`,
    replace: `      return usageError(\`option\${token} is a flag - \${hint}\`);`,
  },

  // === src/hemisphere.js =====================================================

  // --- 5. Timezone table lookup: priority order and per-zone entries ---
  {
    id: 'HZ1',
    file: HEMI_REL,
    behavior: 'hemisphere: NORTHERN_ZONES exact-zone override (Indian/Maldives)',
    note: "the sole NORTHERN_ZONES entry ('indian/maldives') is dropped from the table",
    find: `const NORTHERN_ZONES = new Set([\n  'indian/maldives', // Male +04d10'N - the country straddles, the reference point is north\n]);`,
    replace: `const NORTHERN_ZONES = new Set([\n]);`,
  },
  {
    id: 'HZ2',
    file: HEMI_REL,
    behavior: 'hemisphere: SOUTHERN_ZONES exact-zone entry (Africa/Nairobi)',
    note: "the equator-adjacent 'africa/nairobi' entry is dropped from SOUTHERN_ZONES",
    find: `  'africa/nairobi', //       -01d17'  EQUATOR-ADJACENT. Kenya straddles; Nairobi is south.\n`,
    replace: ``,
  },
  {
    id: 'HZ3',
    file: HEMI_REL,
    behavior: 'hemisphere: SOUTHERN_PREFIXES whole-region entry (australia/)',
    note: "the 'australia/' prefix is dropped, so every Australia/* zone falls through to the northern default",
    find: `  'australia/', // mainland + Tasmania + Lord Howe + Eucla: no Australia/* zone is northern\n`,
    replace: ``,
  },
  {
    id: 'HZ4',
    file: HEMI_REL,
    behavior: 'hemisphere: table priority order (NORTHERN_ZONES checked before SOUTHERN_PREFIXES)',
    note: 'the documented priority order (NORTHERN_ZONES, SOUTHERN_ZONES, then SOUTHERN_PREFIXES) is reversed: prefixes now checked first',
    find: `  if (NORTHERN_ZONES.has(key)) return 'north';\n  if (SOUTHERN_ZONES.has(key)) return 'south';\n  for (const prefix of SOUTHERN_PREFIXES) {\n    if (key.startsWith(prefix)) return 'south';\n  }`,
    replace: `  for (const prefix of SOUTHERN_PREFIXES) {\n    if (key.startsWith(prefix)) return 'south';\n  }\n  if (NORTHERN_ZONES.has(key)) return 'north';\n  if (SOUTHERN_ZONES.has(key)) return 'south';`,
  },

  // --- 6. Unknown-zone fallback ---
  {
    id: 'HF1',
    file: HEMI_REL,
    behavior: 'hemisphere: unknown-zone fallback value',
    note: "the terminal fallback for a zone matched by nothing changes from DEFAULT_HEMISPHERE ('north') to a hardcoded 'south'",
    find: `  // Unknown / unparseable zone (including Etc/GMT*, UTC, GMT, and anything the table\n  // has never heard of): fall back to the documented default rather than throwing.\n  return DEFAULT_HEMISPHERE;`,
    replace: `  // Unknown / unparseable zone (including Etc/GMT*, UTC, GMT, and anything the table\n  // has never heard of): fall back to the documented default rather than throwing.\n  return 'south';`,
  },
  {
    id: 'HF2',
    file: HEMI_REL,
    behavior: 'hemisphere: non-string zone guard',
    note: "typeof zone !== 'string' flipped to === 'string' (strings now short-circuit to default, non-strings fall through to .trim() and throw)",
    find: `  if (typeof zone !== 'string') return DEFAULT_HEMISPHERE;`,
    replace: `  if (typeof zone === 'string') return DEFAULT_HEMISPHERE;`,
  },
  {
    id: 'HF3',
    file: HEMI_REL,
    behavior: 'hemisphere: empty-string-after-trim guard',
    note: "key === '' changed to key === ' ' (a value .trim() can never produce, so the explicit empty-string early-return becomes dead code)",
    find: `  if (key === '') return DEFAULT_HEMISPHERE;`,
    replace: `  if (key === ' ') return DEFAULT_HEMISPHERE;`,
  },

  // --- 7. Normalization (trim / case-fold) feeding the table lookup ---
  {
    id: 'HN1',
    file: HEMI_REL,
    behavior: 'hemisphere: whitespace trimming before lookup',
    note: '.trim() dropped, so a zone string with leading/trailing whitespace no longer matches the table',
    find: `  const key = zone.trim().toLowerCase();`,
    replace: `  const key = zone.toLowerCase();`,
  },
  {
    id: 'HN2',
    file: HEMI_REL,
    behavior: 'hemisphere: case-insensitive lookup',
    note: '.toLowerCase() dropped, so mixed-case zone names no longer match the (lowercased) table',
    find: `  const key = zone.trim().toLowerCase();`,
    replace: `  const key = zone.trim();`,
  },

  // --- 8. Defensive Intl fallback (documented non-goal: never throw) ---
  {
    id: 'HI1',
    file: HEMI_REL,
    behavior: 'hemisphere: defensive fallback when Intl.DateTimeFormat() throws',
    note: "the catch branch's recovery value changed from 'undefined' (-> DEFAULT_HEMISPHERE) to a hardcoded southern zone string",
    find: `    } catch {\n      zone = undefined;\n    }`,
    replace: `    } catch {\n      zone = 'Australia/Sydney';\n    }`,
  },
];

// ---------------------------------------------------------------------------
// Harness
// ---------------------------------------------------------------------------

function readPristineSource(file) {
  return fs.readFileSync(path.join(REPO_ROOT, file), 'utf8');
}

function assertUnique(source, needle, id, file) {
  const first = source.indexOf(needle);
  if (first === -1) {
    throw new Error(`mutant ${id}: find string not present in ${file} — mutant is stale`);
  }
  const second = source.indexOf(needle, first + 1);
  if (second !== -1) {
    throw new Error(`mutant ${id}: find string occurs more than once in ${file} — need more context`);
  }
}

function freshCopy() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'moon-mutate-'));
  // Clean, tracked-only snapshot of HEAD (no .git, no stray local files).
  const archive = execFileSync('git', ['archive', 'HEAD'], { cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 64 });
  execFileSync('tar', ['-x', '-C', dir], { input: archive });
  return dir;
}

function runSuite(dir) {
  const result = spawnSync(process.execPath, ['--test', ...TEST_FILES.map((f) => `test/${f}`)], {
    cwd: dir,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 64,
  });
  return result;
}

function parseCounts(output) {
  const pass = /ℹ pass (\d+)/.exec(output);
  const fail = /ℹ fail (\d+)/.exec(output);
  const tests = /ℹ tests (\d+)/.exec(output);
  return {
    tests: tests ? Number(tests[1]) : null,
    pass: pass ? Number(pass[1]) : null,
    fail: fail ? Number(fail[1]) : null,
  };
}

/** Which individual test files go red under this mutation, run in isolation. */
function findRedFiles(dir) {
  const red = [];
  for (const file of TEST_FILES) {
    const result = spawnSync(process.execPath, ['--test', `test/${file}`], {
      cwd: dir,
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 64,
    });
    const counts = parseCounts(result.stdout + result.stderr);
    if (result.status !== 0 || (counts.fail && counts.fail > 0)) red.push(file);
  }
  return red;
}

function main() {
  console.log(`Repo root: ${REPO_ROOT}`);
  console.log(`Test files: ${TEST_FILES.join(', ')}`);
  console.log(`Mutated files: ${ARGS_REL}, ${HEMI_REL}`);
  console.log('');

  // Baseline: pristine repo, full suite.
  console.log('Running baseline suite against the pristine repo...');
  const baselineDir = freshCopy();
  let baseline;
  try {
    const result = runSuite(baselineDir);
    baseline = { ...parseCounts(result.stdout + result.stderr), status: result.status };
  } finally {
    fs.rmSync(baselineDir, { recursive: true, force: true });
  }
  console.log(
    `Baseline: tests=${baseline.tests} pass=${baseline.pass} fail=${baseline.fail} exit=${baseline.status}`,
  );
  if (baseline.status !== 0 || baseline.fail) {
    console.error('Baseline suite is not green on the pristine repo. Aborting sweep.');
    process.exit(1);
  }
  console.log('');

  const pristineByFile = new Map();
  for (const file of [ARGS_REL, HEMI_REL]) pristineByFile.set(file, readPristineSource(file));

  const rows = [];

  for (const mutant of MUTANTS) {
    const pristine = pristineByFile.get(mutant.file);
    assertUnique(pristine, mutant.find, mutant.id, mutant.file);
    const mutated = pristine.split(mutant.find).join(mutant.replace);

    const dir = freshCopy();
    let verdict, counts, redFiles = [];
    try {
      fs.writeFileSync(path.join(dir, mutant.file), mutated, 'utf8');
      const result = runSuite(dir);
      counts = parseCounts(result.stdout + result.stderr);
      const suiteGreen = result.status === 0 && counts.fail === 0 && counts.tests !== null;
      verdict = suiteGreen ? 'SURVIVED' : 'KILLED';
      if (verdict === 'KILLED') redFiles = findRedFiles(dir);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }

    rows.push({ ...mutant, verdict, counts, redFiles });
    console.log(
      `${mutant.id.padEnd(4)} ${verdict.padEnd(9)} [${mutant.file}] ${mutant.behavior}` +
        (verdict === 'KILLED' ? `  [red: ${redFiles.join(', ')}]` : ''),
    );
  }

  console.log('');
  console.log('=== Summary table ===');
  console.log('id    verdict    file                   behavior');
  for (const r of rows) {
    console.log(`${r.id.padEnd(5)} ${r.verdict.padEnd(10)} ${r.file.padEnd(22)} ${r.behavior}`);
  }

  const killed = rows.filter((r) => r.verdict === 'KILLED').length;
  const survived = rows.filter((r) => r.verdict === 'SURVIVED').length;
  console.log('');
  console.log(`Total: ${rows.length}  killed: ${killed}  survived: ${survived}`);
  console.log('');
  console.log('Survivors (need HOLE/BOUNDARY/UNDECIDED classification — see c53-sweep-report.md):');
  for (const r of rows.filter((r) => r.verdict === 'SURVIVED')) {
    console.log(`  ${r.id}: [${r.file}] ${r.behavior} — ${r.note}`);
  }
}

main();
