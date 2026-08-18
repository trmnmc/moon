'use strict';
// c092 live-look scratch: programmatic alignment checks over code-point arrays.
const path = require('node:path');
const { renderLine, renderBlock } = require(path.join(__dirname, '..', '..', 'src', 'render.js'));

const cps = (s) => [...s];
const names = ['new', 'waxing crescent', 'first quarter', 'waxing gibbous', 'full',
  'waning gibbous', 'last quarter', 'waning crescent'];

let lineProblems = [];
let blockProblems = [];

for (let i = 0; i <= 1000; i++) {
  const k = i / 1000;
  for (const waxing of [true, false]) {
    for (const hemi of ['north', 'south']) {
      for (const name of [names[1], names[4], names[0]]) {
        const moon = { illumination: k, cycleFraction: waxing ? 0.2 : 0.7, phaseName: name };
        const line = renderLine(moon, hemi);
        const a = cps(line);
        // name must start at index 12; prefix widths fixed
        const nameStart = line.indexOf(name);
        if (nameStart !== 12) lineProblems.push(`k=${k} wax=${waxing} ${hemi} name@${nameStart}: ${JSON.stringify(line)}`);
        if (a.length !== 12 + cps(name).length) lineProblems.push(`k=${k} wax=${waxing} ${hemi} len=${a.length}: ${JSON.stringify(line)}`);
        if (a[5] !== ' ' || a[10] !== ' ' || a[11] !== ' ') lineProblems.push(`k=${k} wax=${waxing} ${hemi} sep: ${JSON.stringify(line)}`);
        if (/\s$/.test(line)) lineProblems.push(`trailing ws k=${k}`);

        const block = renderBlock(moon, hemi);
        const rows = block.split('\n');
        if (rows.length !== 11) blockProblems.push(`k=${k} rows=${rows.length}`);
        for (const r of rows) {
          if (cps(r).length !== 34) blockProblems.push(`k=${k} wax=${waxing} ${hemi} rowlen=${cps(r).length}: ${JSON.stringify(r)}`);
        }
      }
    }
  }
}
console.log('line problems:', lineProblems.length, lineProblems.slice(0, 5));
console.log('block problems:', blockProblems.length, blockProblems.slice(0, 5));

// README sample table (lines 51-68): can every north line be produced, and is each
// south line the exact mirror render at the same k?
const samples = [
  ['░░░░▕   3%  waxing crescent', '▏░░░░   3%  waxing crescent', true],
  ['░░░░▐  14%  waxing crescent', '▌░░░░  14%  waxing crescent', true],
  ['░░░▓◗  32%  waxing crescent', '◖▓░░░  32%  waxing crescent', true],
  ['░░▓█◗  51%  first quarter', '◖█▓░░  51%  first quarter', true],
  ['░▒██◗  69%  waxing gibbous', '◖██▒░  69%  waxing gibbous', true],
  ['▕███◗  85%  waxing gibbous', '◖███▏  85%  waxing gibbous', true],
  ['▐███◗  96%  waxing gibbous', '◖███▌  96%  waxing gibbous', true],
  ['◖███◗ 100%  full', '◖███◗ 100%  full', true],
  ['◖███▌  96%  waning gibbous', '▐███◗  96%  waning gibbous', false],
  ['◖██▓▏  83%  waning gibbous', '▕▓██◗  83%  waning gibbous', false],
  ['◖██░░  63%  waning gibbous', '░░██◗  63%  waning gibbous', false],
  ['◖█░░░  40%  waning crescent', '░░░█◗  40%  waning crescent', false],
  ['◖▒░░░  19%  waning crescent', '░░░▒◗  19%  waning crescent', false],
  ['▌░░░░   5%  waning crescent', '░░░░▐   5%  waning crescent', false],
  ['░░░░░   0%  new', '░░░░░   0%  new', false],
];
for (const [north, south, waxing] of samples) {
  const pct = parseInt(north.slice(5, 10), 10);
  const name = north.slice(12);
  let foundN = false, foundS = false;
  for (let i = 0; i <= 2000; i++) {
    const k = i / 2000;
    if (Math.round(k * 100) !== pct) continue;
    const moon = { illumination: k, cycleFraction: waxing ? 0.2 : 0.7, phaseName: name };
    if (renderLine(moon, 'north') === north) foundN = true;
    if (renderLine(moon, 'south') === south) foundS = true;
    if (foundN && foundS) break;
  }
  console.log(`${foundN ? 'ok' : 'NORTH-UNREPRODUCIBLE'} ${foundS ? 'ok' : 'SOUTH-UNREPRODUCIBLE'}  ${north}`);
}
