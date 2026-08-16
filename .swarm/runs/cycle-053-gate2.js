#!/usr/bin/env node
'use strict';

/**
 * cycle 53 — CONDUCTOR'S SECOND GATE. Classifying the two survivors that gate 1
 * reported as NO-DIFF.
 *
 * Gate 1's NO-DIFF is a statement about ITS domain, not about the code. For each of
 * the two, the question is: reasoning from the mutated line, WHERE could a difference
 * live, and did gate 1's domain go there?
 *
 *   HF3 — `key === ''` -> `key === ' '`. After .trim(), key can never be ' ', so the
 *         guard becomes dead code. The real question is not "is the guard reachable"
 *         but "does deleting it change the answer for key === ''". That is decidable
 *         by PROOF over the table, not by sampling: '' returns DEFAULT_HEMISPHERE via
 *         the early return, and would return DEFAULT_HEMISPHERE via fall-through iff
 *         '' matches neither Set and no prefix is a prefix of ''. Both are checkable
 *         directly. Gate 1 DID visit key === '' — so its NO-DIFF is meaningful here,
 *         and this proof is what upgrades it from "did not observe" to "cannot".
 *
 *   HI1 — the recovery value inside `catch { zone = undefined }`, reached ONLY when
 *         Intl.DateTimeFormat().resolvedOptions() throws. Gate 1 passed `undefined`
 *         as an input, but on stock Node Intl does not throw, so the catch never ran:
 *         gate 1 NEVER VISITED the mutated line. Its NO-DIFF carries no information
 *         about HI1. This gate makes Intl throw and looks there.
 *
 * Bounded and instant: one proof over a ~80-entry table, and 3 calls per variant.
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const HEMI_REL = 'src/hemisphere.js';
const pristine = fs.readFileSync(path.join(REPO_ROOT, HEMI_REL), 'utf8');
const mutants = JSON.parse(fs.readFileSync(path.join(__dirname, 'cycle-053-mutants.json'), 'utf8'));

const byId = Object.fromEntries(mutants.map((m) => [m.id, m]));

function mutate(id) {
  const m = byId[id];
  if (!m) throw new Error(`mutant ${id} absent from the extracted catalogue`);
  const first = pristine.indexOf(m.find);
  if (first === -1) throw new Error(`${id}: find string absent`);
  if (pristine.indexOf(m.find, first + 1) !== -1) throw new Error(`${id}: find string not unique`);
  return pristine.split(m.find).join(m.replace);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'moon-c53-gate2-'));
let n = 0;

/**
 * Load a hemisphere module from source, in a context where `Intl` is whatever we
 * say it is. The module is CommonJS with no requires, so a bare vm context with a
 * hand-rolled `module` object is a faithful loader.
 */
function loadWithIntl(src, intl) {
  const file = path.join(tmp, `h${n++}.js`);
  fs.writeFileSync(file, src, 'utf8');
  const module_ = { exports: {} };
  const ctx = vm.createContext({ module: module_, exports: module_.exports, Intl: intl, require });
  vm.runInContext(src, ctx, { filename: file });
  return module_.exports;
}

const THROWING_INTL = {
  DateTimeFormat() {
    throw new TypeError('Intl.DateTimeFormat is not available on this runtime');
  },
};

const NO_TIMEZONE_INTL = {
  DateTimeFormat() {
    return { resolvedOptions: () => ({}) }; // returns no timeZone at all
  },
};

console.log('=== HF3 — proof, not sample ===');
{
  // Extract the live table contents from the pristine module by loading it and
  // re-reading the literals out of the source (the module does not export them).
  const southernZones = [];
  const northernZones = [];
  const prefixes = [];
  const grab = (name, into) => {
    const start = pristine.indexOf(name);
    const open = pristine.indexOf('[', start);
    let depth = 0;
    let end = -1;
    for (let i = open; i < pristine.length; i++) {
      if (pristine[i] === '[') depth++;
      else if (pristine[i] === ']') { depth--; if (!depth) { end = i; break; } }
    }
    for (const m of pristine.slice(open, end).matchAll(/'([^']*)'/g)) into.push(m[1]);
  };
  grab('const SOUTHERN_PREFIXES', prefixes);
  grab('const NORTHERN_ZONES', northernZones);
  grab('const SOUTHERN_ZONES', southernZones);

  const emptyInNorthern = northernZones.includes('');
  const emptyInSouthern = southernZones.includes('');
  const emptyPrefix = prefixes.filter((p) => p === '');
  const prefixMatchesEmpty = prefixes.filter((p) => ''.startsWith(p));

  console.log(`table sizes: NORTHERN_ZONES=${northernZones.length} SOUTHERN_ZONES=${southernZones.length} SOUTHERN_PREFIXES=${prefixes.length}`);
  console.log(`'' present in NORTHERN_ZONES: ${emptyInNorthern}`);
  console.log(`'' present in SOUTHERN_ZONES: ${emptyInSouthern}`);
  console.log(`prefixes p for which ''.startsWith(p) is true: ${JSON.stringify(prefixMatchesEmpty)}`);
  console.log(`empty-string prefixes: ${JSON.stringify(emptyPrefix)}`);

  const provable = !emptyInNorthern && !emptyInSouthern && prefixMatchesEmpty.length === 0;
  console.log(
    provable
      ? "PROVEN: with key === '', both Set lookups miss and no prefix matches, so the fall-through path\n" +
        '        reaches the same terminal `return DEFAULT_HEMISPHERE` the deleted guard returned.\n' +
        '        The guard is therefore semantically dead ON THE CURRENT TABLE, for every input.\n' +
        "        CONTINGENCY: this is a boundary of the current TABLE, not of the code. Adding '' to\n" +
        '        either Set, or an empty-string prefix (which every string startsWith), makes HF3 a\n' +
        '        live defect with no test behind it.'
      : 'NOT PROVEN: the table contains an entry that makes the guard load-bearing.',
  );

  // Direct confirmation of the proof's conclusion at the one input in question.
  const truth = loadWithIntl(pristine, Intl);
  const mut = loadWithIntl(mutate('HF3'), Intl);
  for (const input of ['', '   ', '\t\n']) {
    console.log(`  key-source ${JSON.stringify(input)}: truth=${truth.detectHemisphere(input)} mutant=${mut.detectHemisphere(input)}`);
  }
}

console.log('');
console.log('=== HI1 — the region gate 1 never visited ===');
{
  const truth = loadWithIntl(pristine, THROWING_INTL);
  const mut = loadWithIntl(mutate('HI1'), THROWING_INTL);
  console.log('with Intl.DateTimeFormat() throwing (the runtime the catch branch exists for):');
  console.log(`  detectHemisphere()          truth=${truth.detectHemisphere()}  mutant=${mut.detectHemisphere()}`);
  console.log(`  detectHemisphere(undefined) truth=${truth.detectHemisphere(undefined)}  mutant=${mut.detectHemisphere(undefined)}`);

  const truth2 = loadWithIntl(pristine, NO_TIMEZONE_INTL);
  const mut2 = loadWithIntl(mutate('HI1'), NO_TIMEZONE_INTL);
  console.log('with resolvedOptions() returning no timeZone (the other case the comment names):');
  console.log(`  detectHemisphere()          truth=${truth2.detectHemisphere()}  mutant=${mut2.detectHemisphere()}`);

  const truth3 = loadWithIntl(pristine, Intl);
  const mut3 = loadWithIntl(mutate('HI1'), Intl);
  console.log('with stock Intl (the reachable domain on a normal Node host):');
  console.log(`  detectHemisphere()          truth=${truth3.detectHemisphere()}  mutant=${mut3.detectHemisphere()}`);
  console.log(`  host zone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
}

fs.rmSync(tmp, { recursive: true, force: true });
