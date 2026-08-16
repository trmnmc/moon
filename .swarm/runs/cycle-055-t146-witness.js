'use strict';

// Scratch harness: re-derive the L1 witness recorded in the cycle-052 sweep
// before building on it. Not part of the deliverable harness proper (that is
// cycle-055-t146-arms.js) — this is just the reproduction step.

const { renderLine } = require('../../src/render.js');

const moon = {
  julianDay: 0,
  age: 0,
  cycleFraction: 0.025725,
  phaseAngle: 0.025725 * 360,
  illumination: 0.006517,
  phaseName: 'waxing crescent',
  isInstantPhase: false,
};

console.log('north:', JSON.stringify(renderLine(moon, 'north')));
console.log('south:', JSON.stringify(renderLine(moon, 'south')));
