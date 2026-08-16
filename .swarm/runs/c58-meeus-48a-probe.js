'use strict';
// T-148 (cycle 58) -- rerun of the "LIVE 48.a PROBE" embedded in
// .swarm/runs/cycle-032-illum-mutants.py (lines 134-149), reused verbatim
// (same instant, same fake formula) rather than re-derived, per the item's
// "reuse an existing script" instruction. That script also runs a mutation
// battery against src/astro.js; this file extracts only the read-only probe
// so today's rerun does not require mutating and restoring the source tree.
//
// REPORT.md VERIFIED row under test:
//   "At Meeus example 48.a the module gives 0.6801 (book: 0.6786); an
//    age-derived fake gives 0.6475."
const { computeMoon } = require('../../src/astro.js');
// Meeus example 48.a: 1992 April 12.0 TD.
const d = new Date(Date.UTC(1992, 3, 12, 0, 0, 0));
const m = computeMoon(d);
console.log('48.a illumination   =', m.illumination.toFixed(4));
console.log('48.a phaseAngle deg =', m.phaseAngle.toFixed(4));
console.log('48.a age days       =', m.age.toFixed(4));
const fake = (1 - Math.cos(2 * Math.PI * (m.age / 29.530588853))) / 2;
console.log('age-derived fake    =', fake.toFixed(4));
console.log('book (Meeus 48.a)   = 0.6786 (memory-sourced, not computed here)');
