#!/usr/bin/env node
'use strict';

/**
 * T-145 — Mutation sweep of src/astro.js behaviors NOT covered by the T-129
 * ch.49 correction-table battery (test/astro.test.js:608).
 *
 * Adapted from c53-sweep.js (T-144, src/args.js + src/hemisphere.js), which was
 * itself adapted from c52-sweep.js (T-143, src/render.js). Same discipline,
 * single target file this time (src/astro.js). Applies each mutant below to a
 * fresh throwaway copy of the whole repo (via `git archive HEAD` into a tmp dir
 * -- the real tree is never touched, even transiently), runs
 * `node --test test/*.test.js` there, and records KILLED (suite went red) or
 * SURVIVED (suite stayed green).
 *
 * Explicitly OUT of scope: the ch.49 periodic-correction coefficient tables
 * (the `a` arrays, the W term, the A1..A14 table) inside truePhaseJD -- T-129
 * already measured that ground with a millisecond-exact pin test. This sweep
 * targets everything else: the instant-tolerance window and its comparisons,
 * cycleFraction/phaseAngle independence from illumination, the age
 * true-elapsed-time contract, lunationK's search, normDeg's boundary
 * handling, elongationDeg's eq.(47.2)/(47.4) mean-argument coefficients,
 * deltaTDays' polynomial coefficients, nextFullMoon's strictly-after
 * comparison, and the arc-to-PHASE_NAMES indexing.
 *
 * Run from the repo root:
 *   node .swarm/runs/c54-sweep.js
 *
 * Requires: a git checkout (uses `git archive HEAD` to get a clean, tracked
 * copy of the repo into a tmp dir). No network, no npm install, no deps.
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const ASTRO_REL = 'src/astro.js';
const TEST_FILES = fs
  .readdirSync(path.join(REPO_ROOT, 'test'))
  .filter((f) => f.endsWith('.test.js'))
  .sort();

// ---------------------------------------------------------------------------
// Mutant catalogue
// ---------------------------------------------------------------------------
// Each mutant is a single exact-string substitution against the PRISTINE
// source of src/astro.js (never chained against a previous mutant). `find`
// must occur exactly once in that pristine source, or the script aborts --
// that guarantees each mutant lands where its comment says it does.

const MUTANTS = [
  // --- 1. Phase-instant tolerance window (INSTANT_TOLERANCE_DAYS + nearest-quarter logic) ---
  {
    id: 'IT1',
    behavior: 'astro: instant-tolerance window widened 0.5 -> 0.6 days',
    note: 'a plausible "round up to 14.4h" transcription error; widens the plateau',
    find: `const INSTANT_TOLERANCE_DAYS = 0.5;`,
    replace: `const INSTANT_TOLERANCE_DAYS = 0.6;`,
  },
  {
    id: 'IT2',
    behavior: 'astro: instant-tolerance window narrowed 0.5 -> 0.49 days',
    note: 'a SUBTLE narrowing (11.76h, still > the 11h probe and < the 13h probe the suite uses) -- may slip between the suite\'s two hand-picked probe hours',
    find: `const INSTANT_TOLERANCE_DAYS = 0.5;`,
    replace: `const INSTANT_TOLERANCE_DAYS = 0.49;`,
  },
  {
    id: 'IT3',
    behavior: 'astro: instant-tolerance comparison <= flipped to <',
    note: 'boundary-inclusivity flip; only observable at exact floating-point equality of the offset to the tolerance',
    find: `const isInstantPhase = Math.abs(jd - instants[nearest][0]) <= INSTANT_TOLERANCE_DAYS;`,
    replace: `const isInstantPhase = Math.abs(jd - instants[nearest][0]) < INSTANT_TOLERANCE_DAYS;`,
  },
  {
    id: 'IT4',
    behavior: 'astro: nearest-quarter-instant tie-break < flipped to <=',
    note: 'changes which instant wins an exact tie in distance; only observable at exact floating-point equality between two candidate distances',
    find: `if (Math.abs(jd - instants[n][0]) < Math.abs(jd - instants[nearest][0])) nearest = n;`,
    replace: `if (Math.abs(jd - instants[n][0]) <= Math.abs(jd - instants[nearest][0])) nearest = n;`,
  },

  // --- 2. cycleFraction / phaseAngle independence from illumination ---
  {
    id: 'CI1',
    behavior: 'astro: cycleFraction re-derived FROM illumination instead of independently from phaseAngle',
    note: 'a plausible "just reuse illumination" refactor; illumination is symmetric about the full/new axis so this collapses waxing/waning distinction',
    find: `const cycleFraction = phaseAngle / 360;`,
    replace: `const cycleFraction = illumination;`,
  },
  {
    id: 'CI2',
    behavior: 'astro: cycleFraction mirrored (360 - phaseAngle) -- a sign/direction transcription error',
    note: 'still independent of illumination, but runs the cycle backwards relative to phaseAngle',
    find: `const cycleFraction = phaseAngle / 360;`,
    replace: `const cycleFraction = (360 - phaseAngle) / 360;`,
  },
  {
    id: 'IL1',
    behavior: 'astro: illumination fold Math.abs(180 - phaseAngle) dropped',
    note: 'drops the explicit fold about 180 degrees; candidate EQUIVALENT mutant since cos() is even (cos(-x) === cos(x))',
    find: `const i = Math.abs(180 - phaseAngle);`,
    replace: `const i = 180 - phaseAngle;`,
  },

  // --- 3. Age as true elapsed time, not a mean-month clamp ---
  {
    id: 'AG1',
    behavior: 'astro: age re-clamped to SYNODIC_MONTH (the exact historical bug, src/astro.js:305-313 comment)',
    note: 'reintroduces the documented cycle-1 bug: age silently under-reported by up to ~7h late in a long lunation',
    find: `const age = jd - instants[0][0];`,
    replace: `const age = Math.min(jd - instants[0][0], SYNODIC_MONTH);`,
  },

  // --- 4. lunationK search seed ---
  {
    id: 'LK1',
    behavior: 'astro: lunationK initial-guess rounding Math.round -> Math.floor',
    note: 'only changes the SEED for the correcting while-loops below it; candidate equivalent mutant since the loops converge to the same fixed point regardless of seed',
    find: `let k = Math.round((jd - MEAN_PHASE_EPOCH) / SYNODIC_MONTH);`,
    replace: `let k = Math.floor((jd - MEAN_PHASE_EPOCH) / SYNODIC_MONTH);`,
  },

  // --- 5. normDeg boundary handling ---
  {
    id: 'ND1',
    behavior: 'astro: normDeg negative-branch boundary < flipped to <=',
    note: 'only observable when x is exactly 0.0 entering the branch; candidate equivalent/unreachable mutant (0 + 360 still normalizes to 0 via the trailing >= 360 check... except that check is `>= 360`, so 360 does NOT re-fold to 0 wait it does: x>=360?0:x -- so 0 -> 360 -> 0, same output)',
    find: `if (x < 0) x += 360;`,
    replace: `if (x <= 0) x += 360;`,
  },
  {
    id: 'ND2',
    behavior: 'astro: normDeg terminal 360->0 guard dropped',
    note: 'drops the explicit re-fold of exactly 360 back to 0; only observable when the modulo result is exactly 360.0 (impossible for `x %= 360` in IEEE 754, since the result of a real modulo is always < the divisor in magnitude) -- OR when x was already exactly 0 and fell through the (mutated or not) negative branch',
    find: `return x >= 360 ? 0 : x;`,
    replace: `return x;`,
  },

  // --- 6. elongationDeg mean-argument coefficients (eq. 47.2 / 47.4) ---
  {
    id: 'EL1',
    behavior: 'astro: elongationDeg eq.(47.2) D rate term last digit dropped (445267.1114034 -> 445267.111403)',
    note: 'subtle transcription error (1 part in ~4.5e10 of the coefficient, ~1e-7 deg/century) -- below the module\'s own tolerance budget?',
    find: `const D = 297.8501921 + 445267.1114034 * T - 0.0018819 * T2`,
    replace: `const D = 297.8501921 + 445267.111403 * T - 0.0018819 * T2`,
  },
  {
    id: 'EL2',
    behavior: "astro: elongationDeg eq.(47.4) Moon's mean anomaly rate term last digit dropped (477198.8675055 -> 477198.867505)",
    note: 'subtle transcription error, same class as EL1 but on the Mp argument',
    find: `const Mp = 134.9633964 + 477198.8675055 * T + 0.0087414 * T2`,
    replace: `const Mp = 134.9633964 + 477198.867505 * T + 0.0087414 * T2`,
  },

  // --- 7. deltaTDays (TT -> UT) polynomial coefficient ---
  {
    id: 'DT1',
    behavior: 'astro: deltaTDays constant term 62.92 -> 62.9 (transcription: dropped digit)',
    note: 'changes DeltaT by 0.02s uniformly; well under the 1h/3h anchor tolerances and the T-129 battery only pins year-2150 values where this shifts everything by the same tiny constant',
    find: `return (62.92 + 0.32217 * t + 0.005589 * t * t) / 86400;`,
    replace: `return (62.9 + 0.32217 * t + 0.005589 * t * t) / 86400;`,
  },

  // --- 8. nextFullMoon strictly-after comparison ---
  {
    id: 'NFM1',
    behavior: 'astro: nextFullMoon rounding comparison <= flipped to <',
    note: 'changes whether an input that lands EXACTLY on a full-moon instant (in rounded ms) returns that instant or the next one',
    find: `if (fullMs <= date.getTime()) fullMs = toMs(truePhaseJD(k + 1.5));`,
    replace: `if (fullMs < date.getTime()) fullMs = toMs(truePhaseJD(k + 1.5));`,
  },

  // --- 9. arc -> PHASE_NAMES indexing ---
  {
    id: 'PN1',
    behavior: 'astro: intermediate-arc PHASE_NAMES index off-by-two (arc*2+1 -> arc*2-1)',
    note: 'plausible off-by-one/sign transcription in the arc-to-name mapping; arc=0 indexes PHASE_NAMES[-1] (undefined)',
    find: `phaseName = PHASE_NAMES[arc * 2 + 1];`,
    replace: `phaseName = PHASE_NAMES[arc * 2 - 1];`,
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
  console.log(`Mutated file: ${ASTRO_REL}`);
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

  const pristine = readPristineSource(ASTRO_REL);

  const rows = [];

  for (const mutant of MUTANTS) {
    assertUnique(pristine, mutant.find, mutant.id, ASTRO_REL);
    const mutated = pristine.split(mutant.find).join(mutant.replace);

    const dir = freshCopy();
    let verdict, counts, redFiles = [];
    try {
      fs.writeFileSync(path.join(dir, ASTRO_REL), mutated, 'utf8');
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
      `${mutant.id.padEnd(5)} ${verdict.padEnd(9)} ${mutant.behavior}` +
        (verdict === 'KILLED' ? `  [red: ${redFiles.join(', ')}]` : ''),
    );
  }

  console.log('');
  console.log('=== Summary table ===');
  console.log('id    verdict    behavior');
  for (const r of rows) {
    console.log(`${r.id.padEnd(5)} ${r.verdict.padEnd(10)} ${r.behavior}`);
  }

  const killed = rows.filter((r) => r.verdict === 'KILLED').length;
  const survived = rows.filter((r) => r.verdict === 'SURVIVED').length;
  console.log('');
  console.log(`Total: ${rows.length}  killed: ${killed}  survived: ${survived}`);
  console.log('');
  console.log('Survivors (need HOLE/BOUNDARY/UNDECIDED classification — see c54-sweep-report.md):');
  for (const r of rows.filter((r) => r.verdict === 'SURVIVED')) {
    console.log(`  ${r.id}: ${r.behavior} — ${r.note}`);
  }
}

main();
