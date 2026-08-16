#!/usr/bin/env node
'use strict';

/**
 * cycle 53 — extract the builder's mutant catalogue out of c53-sweep.js into JSON,
 * so the conductor's independent gate (cycle-053-gate.js) runs against EXACTLY the
 * mutants the sweep ran, with no hand-retyping (a retyped find-string that silently
 * fails to match would turn a real HOLE into a fake "stale mutant").
 *
 * The sweep file calls main() at load time, so it cannot simply be required. This
 * lifts the MUTANTS array literal out textually and evaluates just that literal.
 */

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const SWEEP = path.join(__dirname, 'c53-sweep.js');
const OUT = path.join(__dirname, 'cycle-053-mutants.json');

const src = fs.readFileSync(SWEEP, 'utf8');

const start = src.indexOf('const MUTANTS = [');
if (start === -1) throw new Error('MUTANTS array not found in c53-sweep.js');
const open = src.indexOf('[', start);

// Brace-match the array literal, skipping over string and template contents so a
// bracket inside a mutant's find/replace text cannot end the scan early.
let depth = 0;
let i = open;
let end = -1;
let quote = null;
for (; i < src.length; i++) {
  const ch = src[i];
  if (quote) {
    if (ch === '\\') { i++; continue; }
    if (ch === quote) quote = null;
    continue;
  }
  if (ch === "'" || ch === '"' || ch === '`') { quote = ch; continue; }
  if (ch === '[') depth++;
  else if (ch === ']') {
    depth--;
    if (depth === 0) { end = i; break; }
  }
}
if (end === -1) throw new Error('could not brace-match the MUTANTS literal');

const literal = src.slice(open, end + 1);

// The literal references the two path constants; bind them from the sweep source
// itself rather than assuming their values.
const relOf = (name) => {
  const m = new RegExp(`const ${name}\\s*=\\s*'([^']+)'`).exec(src);
  if (!m) throw new Error(`${name} not found in c53-sweep.js`);
  return m[1];
};

const sandbox = { ARGS_REL: relOf('ARGS_REL'), HEMI_REL: relOf('HEMI_REL') };
const mutants = vm.runInNewContext(`(${literal})`, sandbox);

fs.writeFileSync(OUT, JSON.stringify(mutants, null, 2));
console.log(`extracted ${mutants.length} mutants -> ${path.basename(OUT)}`);
console.log(`ARGS_REL=${sandbox.ARGS_REL}  HEMI_REL=${sandbox.HEMI_REL}`);
const byFile = {};
for (const m of mutants) byFile[m.file] = (byFile[m.file] || 0) + 1;
console.log(JSON.stringify(byFile));
