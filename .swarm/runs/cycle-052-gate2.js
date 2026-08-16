'use strict';
/**
 * CONDUCTOR GATE, part 2 — cycle 52, T-143.
 *
 * Part 1 (cycle-052-gate.js) searched the coupled and decoupled domains and
 * returned BOUNDARY for F3, P2, O1 and O2. That verdict is NOT yet earned:
 * three of those four mutants can only differ in a region part 1 never
 * visited.
 *
 *   O1 (f < 0.5 -> f <= 0.5)  differs only at cycleFraction EXACTLY 0.5.
 *                             Part 1's decoupled sweep used cf in {0.25, 0.75}
 *                             and its coupled sweep pins k=1 at f=0.5, where a
 *                             fully lit disc is its own mirror image.
 *   O2 (wraparound removed)   differs only for cycleFraction outside [0,1).
 *                             Part 1 never left [0,1].
 *   P2 (clamp 1 -> 1.5)       differs only for illumination > 1. Part 1 never
 *                             left [0,1].
 *
 * "No witness where I did not look" is not a boundary. This part looks there,
 * and separately settles F3 by arithmetic rather than by search.
 *
 * CONTRACTS.md declares MoonState.cycleFraction 0..1 and illumination 0..1, so
 * anything found out there is off-contract: it cannot come from astro.js, but
 * it CAN come from a hand-constructed fixture, which is the idiom render.js's
 * own header invites. Each finding below is labelled with which it is.
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const REPO_ROOT = path.resolve(__dirname, '..', '..');

function freshCopy() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'moon-gate2-'));
  const archive = execFileSync('git', ['archive', 'HEAD'], { cwd: REPO_ROOT, maxBuffer: 64 << 20 });
  execFileSync('tar', ['-x', '-C', dir], { input: archive });
  return dir;
}
function load(find, replace) {
  const dir = freshCopy();
  const file = path.join(dir, 'src', 'render.js');
  const src = fs.readFileSync(file, 'utf8');
  if (find !== null) {
    if (src.indexOf(find) === -1) throw new Error('find string absent');
    fs.writeFileSync(file, src.split(find).join(replace), 'utf8');
  }
  return require(file);
}
function st(cycleFraction, illumination) {
  return { julianDay: 0, age: 0, cycleFraction, phaseAngle: cycleFraction * 360,
           illumination, phaseName: 'waxing crescent', isInstantPhase: false };
}
const truth = load(null, null);

// --------------------------------------------------------------------------
console.log('=== F3 — settled by arithmetic, not by search ===');
{
  // pad = (BLOCK_INNER - BLOCK_COLS) / 2. If that is an integer, floor and
  // ceil are the same number and the mutation is a literal no-op: a boundary
  // that is PROVEN, not merely unwitnessed.
  const src = fs.readFileSync(path.join(REPO_ROOT, 'src', 'render.js'), 'utf8');
  const grab = (re) => Number(re.exec(src)[1]);
  const LABEL_WIDTH = grab(/const LABEL_WIDTH = (\d+);/);
  const BLOCK_COLS = grab(/const BLOCK_COLS = (\d+);/);
  const NAME_WIDTH = Math.max(...['new', 'waxing crescent', 'first quarter', 'waxing gibbous',
    'full', 'waning gibbous', 'last quarter', 'waning crescent'].map((n) => n.length));
  const VALUE_WIDTH = NAME_WIDTH + 1;
  const BLOCK_INNER = 2 + LABEL_WIDTH + VALUE_WIDTH + 2;
  const pad = (BLOCK_INNER - BLOCK_COLS) / 2;
  console.log(`  LABEL_WIDTH=${LABEL_WIDTH} NAME_WIDTH=${NAME_WIDTH} VALUE_WIDTH=${VALUE_WIDTH}`);
  console.log(`  BLOCK_INNER=${BLOCK_INNER} BLOCK_COLS=${BLOCK_COLS}`);
  console.log(`  pad = (${BLOCK_INNER} - ${BLOCK_COLS}) / 2 = ${pad}`);
  console.log(`  Math.floor(pad)=${Math.floor(pad)}  Math.ceil(pad)=${Math.ceil(pad)}`);
  console.log(`  => floor === ceil is ${Math.floor(pad) === Math.ceil(pad)}; the swap is a no-op for ALL inputs.`);
  console.log(`  VERDICT: BOUNDARY (proven structurally, not sampled)`);
  console.log(`  NOTE: it stops being a no-op the moment BLOCK_INNER - BLOCK_COLS turns odd,`);
  console.log(`        i.e. this is a boundary of the current widths, not of the code.`);
}

// --------------------------------------------------------------------------
console.log('\n=== O1 — cycleFraction EXACTLY 0.5, decoupled from illumination ===');
{
  const mut = load(`  return { k, waxing: f < 0.5 };`, `  return { k, waxing: f <= 0.5 };`);
  let hits = 0;
  for (const cf of [0.5]) {
    for (const k of [0.05, 0.2, 0.5, 0.8, 0.95]) {
      for (const hemi of ['north', 'south']) {
        const m = st(cf, k);
        const a = truth.renderLine(m, hemi), b = mut.renderLine(m, hemi);
        if (a !== b) {
          hits++;
          if (hits <= 4) {
            console.log(`  WITNESS cf=${cf} k=${k} ${hemi}`);
            console.log(`    truth : ${JSON.stringify(a)}`);
            console.log(`    mutant: ${JSON.stringify(b)}`);
          }
        }
      }
    }
  }
  console.log(`  witnesses at cf=0.5: ${hits}`);
  // Is cf=0.5 with k != 1 reachable from astro.js? Physically f=0.5 => k=1.
  const kAtHalf = (1 - Math.cos(2 * Math.PI * 0.5)) / 2;
  console.log(`  physical k at f=0.5 is ${kAtHalf} (full moon) — so the witness above is OFF the coupled cycle`);
  const mFull = st(0.5, 1);
  console.log(`  at the REACHABLE point (cf=0.5, k=1): truth===mutant is ` +
    `${truth.renderLine(mFull, 'north') === mut.renderLine(mFull, 'north')}`);
}

// --------------------------------------------------------------------------
console.log('\n=== O2 — cycleFraction OUTSIDE [0,1) ===');
{
  const mut = load(
    `  let f = Number(moon.cycleFraction);\n  if (!Number.isFinite(f)) f = 0;\n  f -= Math.floor(f);\n  return { k, waxing: f < 0.5 };`,
    `  let f = Number(moon.cycleFraction);\n  if (!Number.isFinite(f)) f = 0;\n  return { k, waxing: f < 0.5 };`);
  let hits = 0;
  for (const cf of [-0.75, -0.25, 1.25, 1.75, 2.25, 3.6]) {
    for (const k of [0.25, 0.75]) {
      const m = st(cf, k);
      const a = truth.renderLine(m, 'north'), b = mut.renderLine(m, 'north');
      if (a !== b) {
        hits++;
        if (hits <= 4) {
          console.log(`  WITNESS cf=${cf} k=${k} north`);
          console.log(`    truth : ${JSON.stringify(a)}`);
          console.log(`    mutant: ${JSON.stringify(b)}`);
        }
      }
    }
  }
  console.log(`  witnesses outside [0,1): ${hits}   (CONTRACTS.md declares cycleFraction 0..1)`);
}

// --------------------------------------------------------------------------
console.log('\n=== P2 — illumination ABOVE 1 (the clamp guard the mutation loosens) ===');
{
  const mut = load(
    `const pct = Math.round(clamp(Number(moon.illumination) || 0, 0, 1) * 100);`,
    `const pct = Math.round(clamp(Number(moon.illumination) || 0, 0, 1.5) * 100);`);
  let hits = 0;
  for (const k of [1.0, 1.01, 1.2, 1.5, 2, 100]) {
    const m = st(0.25, k);
    const a = truth.renderLine(m, 'north'), b = mut.renderLine(m, 'north');
    const differs = a !== b;
    if (differs) hits++;
    console.log(`  k=${String(k).padEnd(5)} truth=${JSON.stringify(a)} mutant=${JSON.stringify(b)}` +
      (differs ? '  DIFFERS' : '  (same)'));
  }
  console.log(`  witnesses above 1: ${hits}   (CONTRACTS.md declares illumination 0..1)`);
  console.log(`  the clamp's LOWER bound is a separate guard; probing it too:`);
  for (const k of [-0.5, -0.01]) {
    const m = st(0.25, k);
    console.log(`    k=${k}: truth=${JSON.stringify(truth.renderLine(m, 'north'))}`);
  }
}
