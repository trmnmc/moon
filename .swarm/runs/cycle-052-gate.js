'use strict';
/**
 * CONDUCTOR GATE for T-143 — authored at verification time, cycle 52.
 * The builder never saw this file.
 *
 * The item claims a mutation sweep of src/render.js with every survivor
 * classified. The sweep verdicts (KILLED/SURVIVED) I re-ran directly from
 * .swarm/runs/c52-sweep.js. THIS script checks the half the sweep script
 * cannot: whether each SURVIVOR is genuinely indiscriminable (BOUNDARY) or
 * observably wrong and unnoticed (HOLE).
 *
 * Method — for each survivor, build truth and mutant as two live modules and
 * search two domains for a WITNESS (an input where rendered output differs):
 *
 *   COUPLED  — the physically reachable cycle: f in [0,1), k = (1-cos 2pi f)/2.
 *              This is what astro.js actually emits, so a witness here is a
 *              defect a real user can see.
 *   DECOUPLED— render.js's declared contract domain: illumination and
 *              cycleFraction as independent inputs (the module header states it
 *              is built to be tested against hand-constructed fixtures, so this
 *              domain is reachable by the suite's own idiom).
 *
 * A witness found => HOLE (observably different, suite blind to it).
 * No witness across both domains => BOUNDARY, reported WITH the step sizes
 * searched so the strength of the claim is visible rather than asserted.
 *
 * renderLine is swept finely; renderBlock is ~12x costlier per call and is
 * swept coarsely. Both steps are printed. This is a search, not a proof: a
 * BOUNDARY here means "no witness at this resolution", stated as such.
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const REPO_ROOT = path.resolve(__dirname, '..', '..');

const SURVIVORS = [
  { id: 'L1', what: 'lineArt dark/hairline cover threshold 0.02 -> 0.05',
    find: `if (cover < 0.02) out += LIMB_DARK;`,
    replace: `if (cover < 0.05) out += LIMB_DARK;` },
  { id: 'L3', what: 'lineArt half/round-limb cover threshold 0.88 -> 0.95',
    find: `else if (cover < 0.88) out += HALF[sunward];`,
    replace: `else if (cover < 0.95) out += HALF[sunward];` },
  { id: 'F3', what: 'renderBlock art padding: floor/ceil swapped between left and right',
    find: `  const left = ' '.repeat(Math.floor(pad));\n  const right = ' '.repeat(Math.ceil(pad));`,
    replace: `  const left = ' '.repeat(Math.ceil(pad));\n  const right = ' '.repeat(Math.floor(pad));` },
  { id: 'P2', what: 'illumField upper clamp 1 -> 1.5',
    find: `const pct = Math.round(clamp(Number(moon.illumination) || 0, 0, 1) * 100);`,
    replace: `const pct = Math.round(clamp(Number(moon.illumination) || 0, 0, 1.5) * 100);` },
  { id: 'O1', what: 'opticalState waxing test f < 0.5 -> f <= 0.5',
    find: `  return { k, waxing: f < 0.5 };`,
    replace: `  return { k, waxing: f <= 0.5 };` },
  { id: 'O2', what: 'opticalState fraction wraparound f -= Math.floor(f) removed',
    find: `  let f = Number(moon.cycleFraction);\n  if (!Number.isFinite(f)) f = 0;\n  f -= Math.floor(f);\n  return { k, waxing: f < 0.5 };`,
    replace: `  let f = Number(moon.cycleFraction);\n  if (!Number.isFinite(f)) f = 0;\n  return { k, waxing: f < 0.5 };` },
  { id: 'O3', what: 'blockArt hairline-rescue trigger cover > 0.02 -> 0.05',
    find: `if (limb >= 0 && row[limb] === SHADE[0] && cells[limb].cover > 0.02) {`,
    replace: `if (limb >= 0 && row[limb] === SHADE[0] && cells[limb].cover > 0.05) {` },
];

function freshCopy() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'moon-gate-'));
  const archive = execFileSync('git', ['archive', 'HEAD'], { cwd: REPO_ROOT, maxBuffer: 64 << 20 });
  execFileSync('tar', ['-x', '-C', dir], { input: archive });
  return dir;
}

function loadTruth() {
  return require(path.join(freshCopy(), 'src', 'render.js'));
}

function loadMutant(s) {
  const dir = freshCopy();
  const file = path.join(dir, 'src', 'render.js');
  const src = fs.readFileSync(file, 'utf8');
  const first = src.indexOf(s.find);
  if (first === -1) throw new Error(`${s.id}: find string absent — mutant is stale`);
  if (src.indexOf(s.find, first + 1) !== -1) throw new Error(`${s.id}: find string not unique`);
  fs.writeFileSync(file, src.split(s.find).join(s.replace), 'utf8');
  return require(file);
}

function st(cycleFraction, illumination) {
  return { julianDay: 0, age: 0, cycleFraction, phaseAngle: cycleFraction * 360,
           illumination, phaseName: 'waxing crescent', isInstantPhase: false };
}

const truth = loadTruth();

/** Search a domain for the first witness. Returns null when none found. */
function search(mut, states, useBlock) {
  for (const m of states()) {
    for (const hemi of ['north', 'south']) {
      const a = truth.renderLine(m, hemi), b = mut.renderLine(m, hemi);
      if (a !== b) return { m, hemi, surface: 'renderLine', truth: a, mutant: b };
      if (useBlock) {
        const c = truth.renderBlock(m, hemi), d = mut.renderBlock(m, hemi);
        if (c !== d) return { m, hemi, surface: 'renderBlock', truth: c, mutant: d };
      }
    }
  }
  return null;
}

const LINE_STEPS = 40000;   // coupled + decoupled, renderLine only
const BLOCK_STEPS = 1500;   // renderBlock too (~12x costlier per call)

function* coupled(n) {
  for (let i = 0; i <= n; i++) {
    const f = i / n;
    yield st(f, (1 - Math.cos(2 * Math.PI * f)) / 2);
  }
}
function* decoupled(n) {
  for (let i = 0; i <= n; i++) {
    const k = i / n;
    yield st(0.25, k);
    yield st(0.75, k);
  }
}

const results = [];
for (const s of SURVIVORS) {
  const mut = loadMutant(s);
  const found =
    search(mut, () => coupled(LINE_STEPS), false) ||
    search(mut, () => coupled(BLOCK_STEPS), true) ||
    search(mut, () => decoupled(LINE_STEPS), false) ||
    search(mut, () => decoupled(BLOCK_STEPS), true);
  results.push({ s, found });

  console.log(`\n=== ${s.id} — ${s.what}`);
  if (!found) {
    console.log(`  VERDICT: BOUNDARY (no witness at this resolution)`);
    console.log(`  searched: coupled f in [0,1] step 1/${LINE_STEPS} (renderLine)`);
    console.log(`            coupled f in [0,1] step 1/${BLOCK_STEPS} (renderLine + renderBlock)`);
    console.log(`            decoupled k in [0,1] step 1/${LINE_STEPS}, cf in {0.25,0.75} (renderLine)`);
    console.log(`            decoupled k in [0,1] step 1/${BLOCK_STEPS}, cf in {0.25,0.75} (+renderBlock)`);
    console.log(`            both hemispheres throughout`);
  } else {
    const dom = Math.abs(found.m.illumination - (1 - Math.cos(2 * Math.PI * found.m.cycleFraction)) / 2) < 1e-9
      ? 'COUPLED (physically reachable)' : 'DECOUPLED (contract domain, fixture-reachable)';
    console.log(`  VERDICT: HOLE — witness found`);
    console.log(`  domain:  ${dom}`);
    console.log(`  witness: cycleFraction=${found.m.cycleFraction} illumination=${found.m.illumination} hemisphere=${found.hemi}`);
    console.log(`  surface: ${found.surface}`);
    if (found.surface === 'renderLine') {
      console.log(`    truth : ${JSON.stringify(found.truth)}`);
      console.log(`    mutant: ${JSON.stringify(found.mutant)}`);
    } else {
      const t = found.truth.split('\n'), d = found.mutant.split('\n');
      for (let i = 0; i < t.length; i++) {
        if (t[i] !== d[i]) {
          console.log(`    row ${i} truth : ${JSON.stringify(t[i])}`);
          console.log(`    row ${i} mutant: ${JSON.stringify(d[i])}`);
        }
      }
    }
  }
}

console.log('\n\n=== GATE SUMMARY ===');
const holes = results.filter((r) => r.found);
const bounds = results.filter((r) => !r.found);
console.log(`survivors classified: ${results.length}`);
console.log(`HOLE     (${holes.length}): ${holes.map((r) => r.s.id).join(', ') || '-'}`);
console.log(`BOUNDARY (${bounds.length}): ${bounds.map((r) => r.s.id).join(', ') || '-'}`);
