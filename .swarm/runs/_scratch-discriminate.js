'use strict';
// Scratch discriminator for T-143 survivors. Not a deliverable — deleted after use.
// Builds truth + one mutant copy per survivor in os.tmpdir(), then sweeps the
// reachable input domain comparing rendered output, printing witnesses or a
// clean "no difference found" verdict with the domain/step searched.

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const REPO_ROOT = path.resolve(__dirname, '..', '..');

const SURVIVORS = [
  {
    id: 'L1',
    find: `if (cover < 0.02) out += LIMB_DARK;`,
    replace: `if (cover < 0.05) out += LIMB_DARK;`,
  },
  {
    id: 'L3',
    find: `else if (cover < 0.88) out += HALF[sunward];`,
    replace: `else if (cover < 0.95) out += HALF[sunward];`,
  },
  {
    id: 'F3',
    find: `  const left = ' '.repeat(Math.floor(pad));\n  const right = ' '.repeat(Math.ceil(pad));`,
    replace: `  const left = ' '.repeat(Math.ceil(pad));\n  const right = ' '.repeat(Math.floor(pad));`,
  },
  {
    id: 'P2',
    find: `const pct = Math.round(clamp(Number(moon.illumination) || 0, 0, 1) * 100);`,
    replace: `const pct = Math.round(clamp(Number(moon.illumination) || 0, 0, 1.5) * 100);`,
  },
  {
    id: 'O1',
    find: `  return { k, waxing: f < 0.5 };`,
    replace: `  return { k, waxing: f <= 0.5 };`,
  },
  {
    id: 'O2',
    find: `  let f = Number(moon.cycleFraction);\n  if (!Number.isFinite(f)) f = 0;\n  f -= Math.floor(f);\n  return { k, waxing: f < 0.5 };`,
    replace: `  let f = Number(moon.cycleFraction);\n  if (!Number.isFinite(f)) f = 0;\n  return { k, waxing: f < 0.5 };`,
  },
  {
    id: 'O3',
    find: `if (limb >= 0 && row[limb] === SHADE[0] && cells[limb].cover > 0.02) {`,
    replace: `if (limb >= 0 && row[limb] === SHADE[0] && cells[limb].cover > 0.05) {`,
  },
];

function freshCopy() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'moon-disc-'));
  const archive = execFileSync('git', ['archive', 'HEAD'], { cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 64 });
  execFileSync('tar', ['-x', '-C', dir], { input: archive });
  return dir;
}

function buildTruth() {
  const dir = freshCopy();
  return require(path.join(dir, 'src', 'render.js'));
}

function buildMutant(survivor) {
  const dir = freshCopy();
  const file = path.join(dir, 'src', 'render.js');
  const src = fs.readFileSync(file, 'utf8');
  if (src.indexOf(survivor.find) === -1) throw new Error(`${survivor.id}: find string missing`);
  const mutated = src.split(survivor.find).join(survivor.replace);
  fs.writeFileSync(file, mutated, 'utf8');
  return require(file);
}

function state(cycleFraction, illumination) {
  return {
    julianDay: 0,
    age: 0,
    cycleFraction,
    phaseAngle: cycleFraction * 360,
    illumination,
    phaseName: 'waxing crescent', // arbitrary; not under test here
    isInstantPhase: false,
  };
}

const truth = buildTruth();

function sweepIndependent(mutantMod, id) {
  // Domain: illumination k in [0, 1], step 1/20000; waxing via cycleFraction
  // 0.25 (waxing) and 0.75 (waning); both hemispheres. This is the literal
  // domain the task names: "illumination 0..1 and both waxing/waning ... both
  // hemispheres" — independent of any physical k/f coupling, because
  // opticalState() reads k straight from moon.illumination and only reads the
  // sign of (cycleFraction - floor) for the waxing flag, so render.js treats
  // them as independent inputs.
  const STEP = 1 / 20000;
  const witnesses = [];
  for (let i = 0; i <= 20000; i++) {
    const k = i * STEP;
    for (const cf of [0.25, 0.75]) {
      for (const hemisphere of ['north', 'south']) {
        const m = state(cf, k);
        const tLine = truth.renderLine(m, hemisphere);
        const mLine = mutantMod.renderLine(m, hemisphere);
        const tBlock = truth.renderBlock(m, hemisphere);
        const mBlock = mutantMod.renderBlock(m, hemisphere);
        if (tLine !== mLine || tBlock !== mBlock) {
          witnesses.push({ k, cf, hemisphere, tLine, mLine, tBlockDiff: tBlock !== mBlock });
          if (witnesses.length >= 5) return { witnesses, domain: `k in [0,1] step ${STEP}, cf in {0.25,0.75}, hemisphere in {north,south}` };
        }
      }
    }
  }
  return { witnesses, domain: `k in [0,1] step ${STEP} (${20001} points), cf in {0.25,0.75}, hemisphere in {north,south} — ${20001 * 4} total states checked` };
}

function sweepPhysical(mutantMod, id) {
  // Secondary domain: the physically-coupled cycle, f in [0,1), k=(1-cos 2pi
  // f)/2 — the shape astro.js and the shipping tests use for "the whole cycle
  // renders" — fine step across the whole synodic cycle.
  const STEPS = 200000;
  const witnesses = [];
  for (let i = 0; i <= STEPS; i++) {
    const f = i / STEPS;
    const k = (1 - Math.cos(2 * Math.PI * f)) / 2;
    for (const hemisphere of ['north', 'south']) {
      const m = state(f, k);
      const tLine = truth.renderLine(m, hemisphere);
      const mLine = mutantMod.renderLine(m, hemisphere);
      const tBlock = truth.renderBlock(m, hemisphere);
      const mBlock = mutantMod.renderBlock(m, hemisphere);
      if (tLine !== mLine || tBlock !== mBlock) {
        witnesses.push({ f, k, hemisphere, tLine, mLine, tBlockDiff: tBlock !== mBlock });
        if (witnesses.length >= 5) return { witnesses, domain: `f in [0,1) step 1/${STEPS}, physically-coupled k=(1-cos 2pi f)/2, hemisphere in {north,south}` };
      }
    }
  }
  return { witnesses, domain: `f in [0,1) step 1/${STEPS} (${STEPS + 1} points), physically-coupled k, hemisphere in {north,south} — ${(STEPS + 1) * 2} total states checked` };
}

for (const survivor of SURVIVORS) {
  console.log(`\n=== ${survivor.id} ===`);
  const mutantMod = buildMutant(survivor);

  const r1 = sweepIndependent(mutantMod, survivor.id);
  console.log(`[independent sweep] domain: ${r1.domain}`);
  if (r1.witnesses.length === 0) {
    console.log(`[independent sweep] NO DIFFERENCE FOUND`);
  } else {
    console.log(`[independent sweep] ${r1.witnesses.length} witness(es) found (showing up to 5):`);
    for (const w of r1.witnesses) console.log(JSON.stringify(w));
  }

  const r2 = sweepPhysical(mutantMod, survivor.id);
  console.log(`[physical-cycle sweep] domain: ${r2.domain}`);
  if (r2.witnesses.length === 0) {
    console.log(`[physical-cycle sweep] NO DIFFERENCE FOUND`);
  } else {
    console.log(`[physical-cycle sweep] ${r2.witnesses.length} witness(es) found (showing up to 5):`);
    for (const w of r2.witnesses) console.log(JSON.stringify(w));
  }
}

// ---------------------------------------------------------------------------
// Supplementary targeted checks for P2, O1, O2 (contract-boundary probes)
// and a full block dump for the O3 witness.
// ---------------------------------------------------------------------------
console.log('\n\n=== SUPPLEMENTARY: out-of-contract-domain probes ===');

// P2: illumination beyond the documented 0..1 range (contract says
// MoonState.illumination is 0..1; astro.js by construction never emits
// outside that; this asks whether the clamp mutation is observable AT ALL,
// even off the documented domain).
{
  const m = buildMutant(SURVIVORS.find((s) => s.id === 'P2'));
  console.log('\n[P2 out-of-domain] illumination > 1 (never producible by astro.js; contract declares 0..1):');
  for (const k of [1.01, 1.1, 1.3, 1.5, 2, 100]) {
    const s = state(0.25, k);
    const t = truth.renderLine(s, 'north');
    const mm = m.renderLine(s, 'north');
    console.log('  k=' + k + ': truth=' + JSON.stringify(t) + ' mutant=' + JSON.stringify(mm) + (t === mm ? ' (same)' : ' (DIFFERS)'));
  }
}

// O1: cf exactly at / around 0.5 boundary, decoupled from illumination so the
// waxing flag flip is actually observable (physically cf=0.5 forces k=1,
// where handedness is moot — that is what the physical sweep showed).
{
  const m = buildMutant(SURVIVORS.find((s) => s.id === 'O1'));
  console.log('\n[O1 out-of-domain] cf exactly/near 0.5 with a non-full illumination (physically cf=0.5 implies k=1; this decouples them):');
  let any = false;
  for (const cf of [0.499999, 0.5, 0.500001]) {
    for (const k of [0.1, 0.3, 0.5, 0.7, 0.9]) {
      const s = state(cf, k);
      const t = truth.renderLine(s, 'north');
      const mm = m.renderLine(s, 'north');
      if (t !== mm) {
        any = true;
        console.log('  cf=' + cf + ' k=' + k + ': truth=' + JSON.stringify(t) + ' mutant=' + JSON.stringify(mm) + ' (DIFFERS)');
      }
    }
  }
  if (!any) console.log('  no difference at any probed point');
}

// O2: cycleFraction outside [0,1) — astro.js's cycleFraction is documented
// 0..1 by construction (contracts.md), so this is a decoupled/out-of-contract
// probe, not a reachable astro.js output.
{
  const m = buildMutant(SURVIVORS.find((s) => s.id === 'O2'));
  console.log('\n[O2 out-of-domain] cycleFraction outside [0,1):');
  for (const cf of [-0.2, -0.7, 1.3, 1.7, 2.25]) {
    for (const k of [0.3, 0.7]) {
      const s = state(cf, k);
      const t = truth.renderLine(s, 'north');
      const mm = m.renderLine(s, 'north');
      console.log('  cf=' + cf + ' k=' + k + ': truth=' + JSON.stringify(t) + ' mutant=' + JSON.stringify(mm) + (t === mm ? ' (same)' : ' (DIFFERS)'));
    }
  }
}

// O3: full block dump for the smallest witness found by the main sweep.
{
  const m = buildMutant(SURVIVORS.find((s) => s.id === 'O3'));
  console.log('\n[O3 witness] full renderBlock dump, k=0.00165, cf=0.25, north:');
  const s = state(0.25, 0.00165);
  console.log('  truth:');
  for (const row of truth.renderBlock(s, 'north').split('\n')) console.log('    ' + row);
  console.log('  mutant:');
  for (const row of m.renderBlock(s, 'north').split('\n')) console.log('    ' + row);
}
