#!/usr/bin/env node
'use strict';

/**
 * T-143 — Mutation sweep of src/render.js
 *
 * Applies each mutant below to a fresh throwaway copy of the whole repo
 * (never the real tree), runs `node --test test/*.test.js` there, and
 * records KILLED (suite went red) or SURVIVED (suite stayed green).
 *
 * Run from the repo root:
 *   node .swarm/runs/c52-sweep.js
 *
 * Requires: a git checkout (uses `git archive HEAD` to get a clean, tracked
 * copy of the repo into a tmp dir). No network, no npm install, no deps.
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const RENDER_REL = 'src/render.js';
const TEST_FILES = fs
  .readdirSync(path.join(REPO_ROOT, 'test'))
  .filter((f) => f.endsWith('.test.js'))
  .sort();

// ---------------------------------------------------------------------------
// Mutant catalogue
// ---------------------------------------------------------------------------
// Each mutant is a single exact-string substitution against the PRISTINE
// src/render.js source (never chained against a previous mutant). `find`
// must occur exactly once in the pristine source, or the script aborts —
// that guarantees each mutant lands where its comment says it does.

const MUTANTS = [
  // --- 1. Disc glyph selection (SHADE ramp index, interior cells) ---------
  {
    id: 'D1',
    behavior: 'disc glyph selection (lineArt interior ramp)',
    note: 'round -> floor when picking the interior SHADE index',
    find: `out += SHADE[Math.round(clamp(cover, 0, 1) * (SHADE.length - 1))];`,
    replace: `out += SHADE[Math.floor(clamp(cover, 0, 1) * (SHADE.length - 1))];`,
  },
  {
    id: 'D2',
    behavior: 'disc glyph selection (lineArt interior ramp)',
    note: 'off-by-one: SHADE.length-1 -> SHADE.length (index can run past the array)',
    find: `out += SHADE[Math.round(clamp(cover, 0, 1) * (SHADE.length - 1))];`,
    replace: `out += SHADE[Math.round(clamp(cover, 0, 1) * (SHADE.length))];`,
  },
  {
    id: 'D3',
    behavior: 'disc glyph selection (blockArt cell ramp)',
    note: 'round -> floor when picking a masked cell SHADE index',
    find: `cell.presence < 0.5 ? ' ' : SHADE[Math.round(clamp(cell.cover, 0, 1) * (SHADE.length - 1))],`,
    replace: `cell.presence < 0.5 ? ' ' : SHADE[Math.floor(clamp(cell.cover, 0, 1) * (SHADE.length - 1))],`,
  },
  {
    id: 'D4',
    behavior: 'disc glyph selection (blockArt cell ramp)',
    note: 'compressed ramp: SHADE.length-1 -> SHADE.length-2 (top shade unreachable)',
    find: `cell.presence < 0.5 ? ' ' : SHADE[Math.round(clamp(cell.cover, 0, 1) * (SHADE.length - 1))],`,
    replace: `cell.presence < 0.5 ? ' ' : SHADE[Math.round(clamp(cell.cover, 0, 1) * (SHADE.length - 2))],`,
  },

  // --- 2. Limb selection (lineArt outer-cell cascade) ---------------------
  {
    id: 'L1',
    behavior: 'limb selection (cover threshold 0.02, lineArt)',
    note: 'the dark/hairline boundary moved from 0.02 to 0.05',
    find: `if (cover < 0.02) out += LIMB_DARK;`,
    replace: `if (cover < 0.05) out += LIMB_DARK;`,
  },
  {
    id: 'L2',
    behavior: 'limb selection (cover threshold 0.3, lineArt)',
    note: 'the hairline/half boundary moved from 0.3 to 0.35',
    find: `else if (cover < 0.3) out += HAIRLINE[sunward];`,
    replace: `else if (cover < 0.35) out += HAIRLINE[sunward];`,
  },
  {
    id: 'L3',
    behavior: 'limb selection (cover threshold 0.88, lineArt)',
    note: 'the half/round-limb boundary moved from 0.88 to 0.95',
    find: `else if (cover < 0.88) out += HALF[sunward];`,
    replace: `else if (cover < 0.95) out += HALF[sunward];`,
  },
  {
    id: 'L4',
    behavior: 'limb selection (sunward handedness, lineArt)',
    note: "waxing ? 'right' : 'left' flipped to waxing ? 'left' : 'right'",
    find: `    if (c === 0 || c === LINE_CELLS - 1) {\n      // Sunlight sits on the right of every cell while waxing, the left while waning.\n      const sunward = waxing ? 'right' : 'left';`,
    replace: `    if (c === 0 || c === LINE_CELLS - 1) {\n      // Sunlight sits on the right of every cell while waxing, the left while waning.\n      const sunward = waxing ? 'left' : 'right';`,
  },
  {
    id: 'L5',
    behavior: 'limb selection (ROUND_LIMB positional choice, lineArt)',
    note: "c === 0 ? 'left' : 'right' swapped to c === 0 ? 'right' : 'left'",
    find: `else out += ROUND_LIMB[c === 0 ? 'left' : 'right'];`,
    replace: `else out += ROUND_LIMB[c === 0 ? 'right' : 'left'];`,
  },

  // --- 3. Frame closure (renderBlock) -------------------------------------
  {
    id: 'F1',
    behavior: 'frame closure (BOX glyphs)',
    note: 'top-left corner glyph changed from ┌ to ╔',
    find: `const BOX = { h: '─', v: '│', tl: '┌', tr: '┐', bl: '└', br: '┘' };`,
    replace: `const BOX = { h: '─', v: '│', tl: '╔', tr: '┐', bl: '└', br: '┘' };`,
  },
  {
    id: 'F2',
    behavior: 'frame closure (BLOCK_INNER width)',
    note: 'off-by-one: leading 2 -> 1 in the inner-width sum',
    find: `const BLOCK_INNER = 2 + LABEL_WIDTH + VALUE_WIDTH + 2;`,
    replace: `const BLOCK_INNER = 1 + LABEL_WIDTH + VALUE_WIDTH + 2;`,
  },
  {
    id: 'F3',
    behavior: 'frame closure (art padding, renderBlock)',
    note: 'Math.floor/Math.ceil swapped between the left and right pad',
    find: `  const left = ' '.repeat(Math.floor(pad));\n  const right = ' '.repeat(Math.ceil(pad));`,
    replace: `  const left = ' '.repeat(Math.ceil(pad));\n  const right = ' '.repeat(Math.floor(pad));`,
  },
  {
    id: 'F4',
    behavior: 'frame closure (detail row padding, renderBlock)',
    note: 'leading two-space gutter on each detail row narrowed to one space',
    find: `    \`  \${label.padEnd(LABEL_WIDTH, ' ')}\${String(value).padStart(VALUE_WIDTH, ' ')}  \`;`,
    replace: `    \` \${label.padEnd(LABEL_WIDTH, ' ')}\${String(value).padStart(VALUE_WIDTH, ' ')}  \`;`,
  },
  {
    id: 'F5',
    behavior: 'frame closure (row structure, renderBlock)',
    note: 'the blank separator row between the art and the detail rows is dropped',
    find: `  lines.push(BOX.v + ' '.repeat(BLOCK_INNER) + BOX.v);\n  lines.push(BOX.v + detail('phase', phaseName(moon)) + BOX.v);`,
    replace: `  lines.push(BOX.v + detail('phase', phaseName(moon)) + BOX.v);`,
  },

  // --- 4. Percent formatting (illumField) ---------------------------------
  {
    id: 'P1',
    behavior: 'percent formatting (rounding, illumField)',
    note: 'round -> floor',
    find: `const pct = Math.round(clamp(Number(moon.illumination) || 0, 0, 1) * 100);`,
    replace: `const pct = Math.floor(clamp(Number(moon.illumination) || 0, 0, 1) * 100);`,
  },
  {
    id: 'P2',
    behavior: 'percent formatting (clamp, illumField)',
    note: 'upper clamp bound loosened from 1 to 1.5',
    find: `const pct = Math.round(clamp(Number(moon.illumination) || 0, 0, 1) * 100);`,
    replace: `const pct = Math.round(clamp(Number(moon.illumination) || 0, 0, 1.5) * 100);`,
  },
  {
    id: 'P3',
    behavior: 'percent formatting (padStart width)',
    note: 'ILLUM_WIDTH narrowed from 4 to 3',
    find: `const ILLUM_WIDTH = 4;`,
    replace: `const ILLUM_WIDTH = 3;`,
  },
  {
    id: 'P4',
    behavior: 'percent formatting (% suffix, illumField)',
    note: 'the literal % suffix is dropped',
    find: `  return \`\${pct}%\`.padStart(ILLUM_WIDTH, ' ');`,
    replace: `  return \`\${pct}\`.padStart(ILLUM_WIDTH, ' ');`,
  },

  // --- 5. Hemisphere mirroring --------------------------------------------
  {
    id: 'H1',
    behavior: 'hemisphere mirroring (mirrorArt reverse)',
    note: 'the reverse() call is removed: glyphs swap handedness but stay in place',
    find: `function mirrorArt(art) {\n  const out = [];\n  for (const ch of art) out.push(MIRROR.get(ch) || ch);\n  out.reverse();\n  return out.join('');\n}`,
    replace: `function mirrorArt(art) {\n  const out = [];\n  for (const ch of art) out.push(MIRROR.get(ch) || ch);\n  return out.join('');\n}`,
  },
  {
    id: 'H2',
    behavior: 'hemisphere mirroring (MIRROR map)',
    note: 'the ▌/▐ half-block pair is dropped from the MIRROR map',
    find: `const MIRROR = new Map([\n  ['◖', '◗'], ['◗', '◖'], // ◖ ◗\n  ['▏', '▕'], ['▕', '▏'], // ▏ ▕\n  ['▌', '▐'], ['▐', '▌'], // ▌ ▐\n]);`,
    replace: `const MIRROR = new Map([\n  ['◖', '◗'], ['◗', '◖'], // ◖ ◗\n  ['▏', '▕'], ['▕', '▏'], // ▏ ▕\n]);`,
  },
  {
    id: 'H3',
    behavior: 'hemisphere mirroring (renderLine south condition)',
    note: "hemisphere === 'south' inverted to hemisphere !== 'south'",
    find: `  if (hemisphere === 'south') disc = mirrorArt(disc);`,
    replace: `  if (hemisphere !== 'south') disc = mirrorArt(disc);`,
  },
  {
    id: 'H4',
    behavior: 'hemisphere mirroring (renderBlock south condition)',
    note: "hemisphere === 'south' inverted to hemisphere !== 'south'",
    find: `  const south = hemisphere === 'south';`,
    replace: `  const south = hemisphere !== 'south';`,
  },

  // --- 6. Optional: opticalState / hairline rescue / presence masking -----
  {
    id: 'O1',
    behavior: 'opticalState waxing boundary (f < 0.5)',
    note: 'f < 0.5 loosened to f <= 0.5 (exact-half fraction flips sides)',
    find: `  return { k, waxing: f < 0.5 };`,
    replace: `  return { k, waxing: f <= 0.5 };`,
  },
  {
    id: 'O2',
    behavior: 'opticalState fraction normalization',
    note: 'the f -= Math.floor(f) wraparound is removed',
    find: `  let f = Number(moon.cycleFraction);\n  if (!Number.isFinite(f)) f = 0;\n  f -= Math.floor(f);\n  return { k, waxing: f < 0.5 };`,
    replace: `  let f = Number(moon.cycleFraction);\n  if (!Number.isFinite(f)) f = 0;\n  return { k, waxing: f < 0.5 };`,
  },
  {
    id: 'O3',
    behavior: 'blockArt hairline rescue threshold (cover > 0.02)',
    note: 'the hairline-rescue trigger moved from 0.02 to 0.05',
    find: `if (limb >= 0 && row[limb] === SHADE[0] && cells[limb].cover > 0.02) {`,
    replace: `if (limb >= 0 && row[limb] === SHADE[0] && cells[limb].cover > 0.05) {`,
  },
  {
    id: 'O4',
    behavior: 'blockArt presence masking (presence < 0.5)',
    note: 'the off-disc mask threshold moved from 0.5 to 0.3',
    find: `cell.presence < 0.5 ? ' ' : SHADE[Math.round(clamp(cell.cover, 0, 1) * (SHADE.length - 1))],`,
    replace: `cell.presence < 0.3 ? ' ' : SHADE[Math.round(clamp(cell.cover, 0, 1) * (SHADE.length - 1))],`,
  },
];

// ---------------------------------------------------------------------------
// Harness
// ---------------------------------------------------------------------------

function readPristineSource() {
  return fs.readFileSync(path.join(REPO_ROOT, RENDER_REL), 'utf8');
}

function assertUnique(source, needle, id) {
  const first = source.indexOf(needle);
  if (first === -1) {
    throw new Error(`mutant ${id}: find string not present in src/render.js — mutant is stale`);
  }
  const second = source.indexOf(needle, first + 1);
  if (second !== -1) {
    throw new Error(`mutant ${id}: find string occurs more than once — need more context`);
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

  const pristine = readPristineSource();
  const rows = [];

  for (const mutant of MUTANTS) {
    assertUnique(pristine, mutant.find, mutant.id);
    const mutated = pristine.split(mutant.find).join(mutant.replace);

    const dir = freshCopy();
    let verdict, counts, redFiles = [];
    try {
      fs.writeFileSync(path.join(dir, RENDER_REL), mutated, 'utf8');
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
      `${mutant.id.padEnd(4)} ${verdict.padEnd(9)} ${mutant.behavior}` +
        (verdict === 'KILLED' ? `  [red: ${redFiles.join(', ')}]` : ''),
    );
  }

  console.log('');
  console.log('=== Summary table ===');
  console.log('id   verdict    behavior');
  for (const r of rows) {
    console.log(`${r.id.padEnd(4)} ${r.verdict.padEnd(10)} ${r.behavior}`);
  }

  const killed = rows.filter((r) => r.verdict === 'KILLED').length;
  const survived = rows.filter((r) => r.verdict === 'SURVIVED').length;
  console.log('');
  console.log(`Total: ${rows.length}  killed: ${killed}  survived: ${survived}`);
  console.log('');
  console.log('Survivors (need HOLE/BOUNDARY/UNDECIDED classification — see c52-sweep-report.md):');
  for (const r of rows.filter((r) => r.verdict === 'SURVIVED')) {
    console.log(`  ${r.id}: ${r.behavior} — ${r.note}`);
  }
}

main();
