/**
 * Conductor verification gate for T-104 (cycle 5).
 * Authored at verification time; the builder never saw this file.
 *
 * Three independent checks:
 *  A. Full suite green, exit status read directly from the child process.
 *  B. Independent derivation of the disc glyph set -- the conductor's own
 *     extraction, not the builder's helper -- cross-checked against the claim.
 *  C. Non-vacuity by MUTATION: perturb the glyph set in src/render.js and
 *     require the new test to FAIL. A pin that survives a glyph change is
 *     not a pin.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { renderLine, renderBlock } from '../../src/render.js';

const ROOT = new URL('../../', import.meta.url).pathname;
const RENDER = ROOT + 'src/render.js';
const TESTS = readdirSync(ROOT + 'test').filter((f) => f.endsWith('.test.js')).map((f) => 'test/' + f);
const PIN = 'KI-5 pin';

// TAP reporter pinned explicitly: the default reporter differs by TTY, and a
// gate that parses whichever format it happens to get is not a gate.
const runSuite = (args) =>
  spawnSync(process.execPath, ['--test', '--test-reporter=tap', ...args], {
    cwd: ROOT, encoding: 'utf8',
  });

const tally = (out) => {
  const g = (k) => (out.match(new RegExp('^# ' + k + ' (\\d+)$', 'm')) || [, '?'])[1];
  return `tests ${g('tests')} pass ${g('pass')} fail ${g('fail')}`;
};

let failures = 0;
const check = (name, ok, detail) => {
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${name}${detail ? ' -- ' + detail : ''}`);
  if (!ok) failures++;
};

// ---- A. full suite, exit status captured directly (never through a pipe) ----
const full = runSuite(TESTS);
console.log('A. full suite: exit status =', full.status, '|', tally(full.stdout));
check('A full suite green', full.status === 0, tally(full.stdout));
check('A new pin test present and ran', full.stdout.includes(PIN));

// ---- B. conductor's OWN derivation of the disc glyph set ----
// Deliberately different extraction from the builder's: take EVERY non-space,
// non-box-drawing character out of the full renders, then classify by block.
// MoonState shape read from src/render.js's consumers, not from the test file.
const BOX = new Set([...'─│┌┐└┘']);
const SYNODIC = 29.530588861;
const mkState = (name, frac, k, instant = false) => ({
  julianDay: 2451550.09766 + frac * SYNODIC,
  age: frac * SYNODIC,
  cycleFraction: frac,
  phaseAngle: frac * 360,
  illumination: k,
  phaseName: name,
  isInstantPhase: instant,
});
const mine = new Set();
for (let i = 0; i <= 720; i++) {
  const f = i / 720;
  const k = (1 - Math.cos(2 * Math.PI * f)) / 2;
  const st = mkState(f < 0.5 ? 'waxing gibbous' : 'waning gibbous', f, k, i % 90 === 0);
  for (const h of ['north', 'south']) {
    for (const out of [renderLine(st, h), renderBlock(st, h)]) {
      for (const ch of out) {
        const cp = ch.codePointAt(0);
        if (ch === ' ' || ch === '\n' || BOX.has(ch)) continue;
        if (cp < 0x2000) continue; // ASCII: digits, %, letters of the label fields
        mine.add(cp);
      }
    }
  }
}
const hex = (s) => [...s].sort((a, b) => a - b).map((c) => 'U+' + c.toString(16).toUpperCase());
const CLAIMED = [0x2588, 0x258c, 0x258f, 0x2590, 0x2591, 0x2592, 0x2593, 0x2595, 0x25d6, 0x25d7];
console.log('B. conductor-derived disc glyph set:', hex(mine).join(' '));
console.log('B. builder-claimed set:            ', hex(CLAIMED).join(' '));
check(
  'B independent derivation matches the claim',
  JSON.stringify(hex(mine)) === JSON.stringify(hex(CLAIMED)),
);
check('B round-limb glyphs really are drawn (the doc gap is real)', mine.has(0x25d6) && mine.has(0x25d7));

// ---- C. non-vacuity: mutate the glyph set, the pin must FAIL ----
const original = readFileSync(RENDER, 'utf8');
const MUTATIONS = [
  ['add an undocumented Block Element (shade ramp ▒ -> ▚)',
   "const SHADE = ['░', '▒', '▓', '█'];",
   "const SHADE = ['░', '▚', '▓', '█'];"],
  // NOTE: mutating HAIRLINE right ▕ -> ▏ does NOT work as a "drop" probe: the
  // MIRROR map swaps ▏<->▕, so the southern render puts ▕ straight back into
  // the observed set. The shade ramp is the honest drop probe -- ▒/▓ are both
  // mirror-symmetric, so removing one really removes it.
  ['drop a documented glyph (shade ramp ▓ -> ▒, collapsing the ramp)',
   "const SHADE = ['░', '▒', '▓', '█'];",
   "const SHADE = ['░', '▒', '▒', '█'];"],
  ['change the undocumented round limb (◗ -> ◕)',
   "const ROUND_LIMB = { right: '◗', left: '◖' };",
   "const ROUND_LIMB = { right: '◕', left: '◖' };"],
];
try {
  for (const [label, from, to] of MUTATIONS) {
    if (!original.includes(from)) { check(`C mutation applied: ${label}`, false, 'anchor not found'); continue; }
    writeFileSync(RENDER, original.replace(from, to));
    const r = runSuite(['test/render.test.js']);
    const failed = [...r.stdout.matchAll(/^not ok \d+ - (.*)$/gm)].map((m) => m[1].trim());
    const pinFailed = r.status !== 0 && failed.some((t) => t.includes(PIN));
    check(`C pin FAILS under mutation: ${label}`, pinFailed,
      `exit=${r.status}; failing tests: ${failed.length ? failed.join(' | ') : '(none parsed)'}`);
  }
} finally {
  writeFileSync(RENDER, original);
}
const restored = readFileSync(RENDER, 'utf8') === original;
check('C src/render.js restored byte-identical', restored);

// ---- D. suite green again after restore ----
const after = runSuite(TESTS);
check('D suite green after mutation harness', after.status === 0, tally(after.stdout));

console.log(failures === 0 ? '\nGATE: PASS' : `\nGATE: FAIL (${failures})`);
process.exit(failures === 0 ? 0 : 1);
