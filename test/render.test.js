'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { renderLine, renderBlock } = require('../src/render.js');

// ---------------------------------------------------------------------------
// Fixtures
//
// render.js takes a MoonState and never computes one, so everything here is a
// hand-built state. Illumination and cycleFraction are kept physically
// consistent — k = (1 - cos 2*pi*f) / 2 — so the art is being asked to draw a
// moon that could actually exist.
// ---------------------------------------------------------------------------

const SYNODIC = 29.530588861;

/**
 * @param {string} phaseName
 * @param {number} cycleFraction 0..1
 * @param {number} illumination  0..1
 * @param {boolean} [isInstantPhase]
 * @returns {object} a MoonState
 */
function state(phaseName, cycleFraction, illumination, isInstantPhase = false) {
  return {
    julianDay: 2451550.09766 + cycleFraction * SYNODIC,
    age: cycleFraction * SYNODIC,
    cycleFraction,
    phaseAngle: cycleFraction * 360,
    illumination,
    phaseName,
    isInstantPhase,
  };
}

/** A spread across the full cycle: new -> waxing -> full -> waning -> new. */
const CYCLE = [
  state('new', 0.0, 0.0, true),
  state('waxing crescent', 0.05, 0.02447),
  state('waxing crescent', 0.1, 0.09549),
  state('first quarter', 0.25, 0.5, true),
  state('waxing gibbous', 0.35, 0.79389),
  state('full', 0.5, 1.0, true),
  state('waning gibbous', 0.65, 0.79389),
  state('last quarter', 0.75, 0.5, true),
  state('waning crescent', 0.9, 0.09549),
  state('waning crescent', 0.95, 0.02447),
];

/** Width of the disc field at the head of renderLine. */
const DISC_CELLS = 5;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Independent implementation of the horizontal mirror, written from the glyph
 * shapes rather than from src/render.js, so the mirror tests are a real check.
 */
const MIRROR_PAIRS = [['◖', '◗'], ['▏', '▕'], ['▌', '▐']];

function mirrorGlyph(ch) {
  for (const [a, b] of MIRROR_PAIRS) {
    if (ch === a) return b;
    if (ch === b) return a;
  }
  return ch; // ░ ▒ ▓ █ and space are symmetric about a vertical axis
}

function mirror(s) {
  return Array.from(s).reverse().map(mirrorGlyph).join('');
}

/** Every glyph renderLine is allowed to emit, plus the literal separators. */
const ALLOWED_DISC = new Set(['░', '▒', '▓', '█', '▏', '▕', '▌', '▐', '◖', '◗']);

/**
 * How much sunlight each disc glyph stands for, for "which limb is lit"
 * assertions. This is meaning, not ink: ░ is the unlit limb (earthshine), so it
 * counts as zero, while the ▏ ▕ hairlines are a sliver of genuine sunlight.
 */
const LIT_WEIGHT = new Map([
  [' ', 0], ['░', 0], ['▒', 0.33], ['▓', 0.67], ['█', 1],
  ['▏', 0.15], ['▕', 0.15], ['▌', 0.5], ['▐', 0.5], ['◖', 1], ['◗', 1],
]);

function chars(s) {
  return Array.from(s);
}

function disc(line) {
  return chars(line).slice(0, DISC_CELLS).join('');
}

function litness(glyphs) {
  return chars(glyphs).reduce((sum, ch) => {
    assert.ok(LIT_WEIGHT.has(ch), `unknown disc glyph ${JSON.stringify(ch)}`);
    return sum + LIT_WEIGHT.get(ch);
  }, 0);
}

/** All output this module can produce for a given state, both hemispheres. */
function allOutput(moon) {
  return [
    renderLine(moon, 'north'),
    renderLine(moon, 'south'),
    renderBlock(moon, 'north'),
    renderBlock(moon, 'south'),
  ];
}

// ---------------------------------------------------------------------------
// renderLine — exact output across the cycle, both hemispheres
// ---------------------------------------------------------------------------

test('renderLine: exact output across the full cycle, northern hemisphere', () => {
  const got = CYCLE.map((m) => renderLine(m, 'north'));
  assert.deepEqual(got, [
    '░░░░░   0%  new',
    '░░░░▕   2%  waxing crescent',
    '░░░░▐  10%  waxing crescent',
    '░░▓█◗  50%  first quarter',
    '░▓██◗  79%  waxing gibbous',
    '◖███◗ 100%  full',
    '◖██▓░  79%  waning gibbous',
    '◖█▓░░  50%  last quarter',
    '▌░░░░  10%  waning crescent',
    '▏░░░░   2%  waning crescent',
  ]);
});

test('renderLine: exact output across the full cycle, southern hemisphere', () => {
  const got = CYCLE.map((m) => renderLine(m, 'south'));
  assert.deepEqual(got, [
    '░░░░░   0%  new',
    '▏░░░░   2%  waxing crescent',
    '▌░░░░  10%  waxing crescent',
    '◖█▓░░  50%  first quarter',
    '◖██▓░  79%  waxing gibbous',
    '◖███◗ 100%  full',
    '░▓██◗  79%  waning gibbous',
    '░░▓█◗  50%  last quarter',
    '░░░░▐  10%  waning crescent',
    '░░░░▕   2%  waning crescent',
  ]);
});

// ---------------------------------------------------------------------------
// Hemisphere: south is north mirrored horizontally
// ---------------------------------------------------------------------------

test('renderLine: the southern disc is the northern disc mirrored', () => {
  for (const moon of CYCLE) {
    const north = renderLine(moon, 'north');
    const south = renderLine(moon, 'south');
    assert.equal(
      disc(south),
      mirror(disc(north)),
      `${moon.phaseName} @ ${moon.cycleFraction}: south disc is not the mirror of north`,
    );
    // Only the art is handed. The text columns are identical.
    assert.equal(chars(south).slice(DISC_CELLS).join(''), chars(north).slice(DISC_CELLS).join(''));
  }
});

test('renderBlock: every southern art row is the northern row mirrored', () => {
  for (const moon of CYCLE) {
    const north = renderBlock(moon, 'north').split('\n');
    const south = renderBlock(moon, 'south').split('\n');
    assert.equal(north.length, south.length);
    for (let i = 0; i < north.length; i++) {
      const n = north[i];
      const s = south[i];
      if (!n.includes('░') && !n.includes('▒') && !n.includes('▓') && !n.includes('█')) continue;
      assert.equal(s, mirror(n), `${moon.phaseName}: block row ${i} is not mirrored`);
    }
  }
});

test('renderLine: a moon and its mirror image render the same disc in opposite hemispheres', () => {
  // A waxing crescent seen from the south looks like a waning crescent seen
  // from the north: the same lit limb, the same picture.
  const waxing = state('waxing crescent', 0.1, 0.09549);
  const waning = state('waning crescent', 0.9, 0.09549);
  assert.equal(disc(renderLine(waxing, 'south')), disc(renderLine(waning, 'north')));
  assert.equal(disc(renderLine(waxing, 'north')), disc(renderLine(waning, 'south')));
});

// ---------------------------------------------------------------------------
// Hemisphere: the lit limb faces the right way
// ---------------------------------------------------------------------------

test('renderLine: a waxing moon is lit on the right in the north, the left in the south', () => {
  for (const moon of CYCLE) {
    if (moon.illumination <= 0.001 || moon.illumination >= 0.999) continue; // no handedness at new or full
    const waxing = moon.cycleFraction < 0.5;
    const north = chars(disc(renderLine(moon, 'north')));
    const south = chars(disc(renderLine(moon, 'south')));

    const label = `${moon.phaseName} @ ${moon.cycleFraction}`;
    const nLeft = litness(north.slice(0, 2));
    const nRight = litness(north.slice(3));
    const sLeft = litness(south.slice(0, 2));
    const sRight = litness(south.slice(3));

    if (waxing) {
      assert.ok(nRight > nLeft, `${label}: waxing moon is not lit on the right in the north`);
      assert.ok(sLeft > sRight, `${label}: waxing moon is not lit on the left in the south`);
    } else {
      assert.ok(nLeft > nRight, `${label}: waning moon is not lit on the left in the north`);
      assert.ok(sRight > sLeft, `${label}: waning moon is not lit on the right in the south`);
    }
  }
});

test('renderLine: a thin crescent still shows a lit limb', () => {
  // 2% illuminated. If this collapses to an unlit disc the tool is lying.
  const thin = state('waxing crescent', 0.05, 0.02447);
  assert.equal(litness('░░░░░'), 0);
  assert.ok(litness(disc(renderLine(thin, 'north'))) > 0);
  assert.ok(litness(disc(renderLine(thin, 'south'))) > 0);
  // ...and a genuinely new moon shows no sunlight at all.
  assert.equal(litness(disc(renderLine(state('new', 0, 0, true), 'north'))), 0);
});

// ---------------------------------------------------------------------------
// No emoji
// ---------------------------------------------------------------------------

test('no output anywhere contains an emoji codepoint', () => {
  const suspects = [];
  for (let f = 0; f <= 1.0001; f += 1 / 64) {
    const k = (1 - Math.cos(2 * Math.PI * f)) / 2;
    suspects.push(state('waxing crescent', Math.min(f, 1), k));
  }
  for (const moon of [...CYCLE, ...suspects]) {
    for (const out of allOutput(moon)) {
      for (const ch of out) {
        const cp = ch.codePointAt(0);
        assert.ok(
          cp < 0x1f000,
          `emoji-range codepoint U+${cp.toString(16).toUpperCase()} in ${JSON.stringify(out)}`,
        );
      }
    }
  }
});

test('no output contains a moon emoji or a variation selector', () => {
  // U+1F311..U+1F318 are the moon-phase emoji; U+FE0F forces emoji presentation.
  const banned = [
    '\u{1F311}', '\u{1F312}', '\u{1F313}', '\u{1F314}', '\u{1F315}',
    '\u{1F316}', '\u{1F317}', '\u{1F318}', '\u{1F319}', '\u{1F31A}',
    '\u{1F31B}', '\u{1F31C}', '\u{2B50}', '\u{FE0F}', '\u{2728}',
  ];
  for (const moon of CYCLE) {
    for (const out of allOutput(moon)) {
      for (const bad of banned) {
        const cp = bad.codePointAt(0).toString(16).toUpperCase();
        assert.ok(!out.includes(bad), `banned glyph U+${cp} in ${JSON.stringify(out)}`);
      }
    }
  }
});

test('renderLine emits only geometric block glyphs, digits, letters and spaces', () => {
  for (const moon of CYCLE) {
    for (const hemisphere of ['north', 'south']) {
      const line = renderLine(moon, hemisphere);
      for (const ch of disc(line)) {
        assert.ok(ALLOWED_DISC.has(ch), `disc glyph ${JSON.stringify(ch)} is not in the palette`);
      }
      assert.match(chars(line).slice(DISC_CELLS).join(''), /^[ a-z0-9%]+$/);
    }
  }
});

test('no exclamation marks anywhere — this is a readout, not a greeting', () => {
  for (const moon of CYCLE) {
    for (const out of allOutput(moon)) assert.ok(!out.includes('!'));
  }
});

// ---------------------------------------------------------------------------
// Shape: one line, no trailing newline, stable columns
// ---------------------------------------------------------------------------

test('renderLine is exactly one line with no trailing newline', () => {
  for (const moon of CYCLE) {
    for (const hemisphere of ['north', 'south']) {
      const line = renderLine(moon, hemisphere);
      assert.equal(line.split('\n').length, 1, 'renderLine returned more than one line');
      assert.ok(!line.includes('\n'));
      assert.ok(!line.includes('\r'));
      assert.ok(!line.endsWith('\n'));
    }
  }
});

test('renderLine has no trailing whitespace — it goes in a prompt', () => {
  for (const moon of CYCLE) {
    for (const hemisphere of ['north', 'south']) {
      const line = renderLine(moon, hemisphere);
      assert.equal(line, line.trimEnd(), `trailing whitespace in ${JSON.stringify(line)}`);
    }
  }
});

test('renderBlock has no trailing newline and no trailing whitespace on any row', () => {
  for (const moon of CYCLE) {
    for (const hemisphere of ['north', 'south']) {
      const block = renderBlock(moon, hemisphere);
      assert.ok(!block.endsWith('\n'));
      for (const row of block.split('\n')) {
        assert.equal(row, row.trimEnd(), `trailing whitespace in ${JSON.stringify(row)}`);
      }
    }
  }
});

test('renderLine width is stable as illumination varies', () => {
  // The alignment requirement: the columns ahead of the phase name never move,
  // whatever the percentage, so a MOTD line does not jitter from 9% to 100%.
  const widths = new Set();
  for (let pct = 0; pct <= 100; pct++) {
    for (const cycleFraction of [0.2, 0.8]) {
      for (const hemisphere of ['north', 'south']) {
        const line = renderLine(state('waxing crescent', cycleFraction, pct / 100), hemisphere);
        const cells = chars(line);
        widths.add(cells.length);
        // Column layout: disc | space | 4-wide percent | two spaces | name.
        assert.equal(cells[DISC_CELLS], ' ');
        assert.equal(cells.slice(DISC_CELLS + 1, DISC_CELLS + 5).join('').length, 4);
        assert.match(cells.slice(DISC_CELLS + 1, DISC_CELLS + 5).join(''), /^ *\d{1,3}%$/);
        assert.equal(cells.slice(DISC_CELLS + 5, DISC_CELLS + 7).join(''), '  ');
        assert.equal(cells.slice(DISC_CELLS + 7).join(''), 'waxing crescent');
      }
    }
  }
  assert.equal(widths.size, 1, `renderLine width jitters with illumination: ${[...widths]}`);
});

test('renderLine disc is always exactly five cells', () => {
  for (const moon of CYCLE) {
    for (const hemisphere of ['north', 'south']) {
      const cells = chars(renderLine(moon, hemisphere));
      assert.equal(cells.slice(0, DISC_CELLS).length, DISC_CELLS);
      for (const ch of cells.slice(0, DISC_CELLS)) assert.ok(ALLOWED_DISC.has(ch));
    }
  }
});

test('renderLine columns line up across every phase name', () => {
  const prefixes = new Set();
  for (const moon of CYCLE) {
    const line = renderLine(moon, 'north');
    prefixes.add(chars(line).slice(DISC_CELLS, DISC_CELLS + 7).join('').length);
    // The name starts at the same column every time.
    assert.equal(chars(line).slice(DISC_CELLS + 7).join(''), moon.phaseName);
  }
  assert.equal(prefixes.size, 1);
});

// ---------------------------------------------------------------------------
// renderBlock — exact output, and a fixed frame
// ---------------------------------------------------------------------------

test('renderBlock: exact output for a waxing crescent, both hemispheres', () => {
  const moon = state('waxing crescent', 0.1, 0.09549);
  assert.deepEqual(renderBlock(moon, 'north').split('\n'), [
    '┌────────────────────────────────┐',
    '│            ░░░░░░▒▓            │',
    '│           ░░░░░░░░░▓           │',
    '│          ░░░░░░░░░░▒█          │',
    '│           ░░░░░░░░░▓           │',
    '│            ░░░░░░▒▓            │',
    '│                                │',
    '│  phase        waxing crescent  │',
    '│  illuminated              10%  │',
    '│  hemisphere          northern  │',
    '└────────────────────────────────┘',
  ]);
  assert.deepEqual(renderBlock(moon, 'south').split('\n'), [
    '┌────────────────────────────────┐',
    '│            ▓▒░░░░░░            │',
    '│           ▓░░░░░░░░░           │',
    '│          █▒░░░░░░░░░░          │',
    '│           ▓░░░░░░░░░           │',
    '│            ▓▒░░░░░░            │',
    '│                                │',
    '│  phase        waxing crescent  │',
    '│  illuminated              10%  │',
    '│  hemisphere          southern  │',
    '└────────────────────────────────┘',
  ]);
});

test('renderBlock: exact output for a waning gibbous, both hemispheres', () => {
  const moon = state('waning gibbous', 0.65, 0.79389);
  assert.deepEqual(renderBlock(moon, 'north').split('\n'), [
    '┌────────────────────────────────┐',
    '│            █████▓▒░            │',
    '│           ████████▒░           │',
    '│          █████████▒░░          │',
    '│           ████████▒░           │',
    '│            █████▓▒░            │',
    '│                                │',
    '│  phase         waning gibbous  │',
    '│  illuminated              79%  │',
    '│  hemisphere          northern  │',
    '└────────────────────────────────┘',
  ]);
  assert.deepEqual(renderBlock(moon, 'south').split('\n'), [
    '┌────────────────────────────────┐',
    '│            ░▒▓█████            │',
    '│           ░▒████████           │',
    '│          ░░▒█████████          │',
    '│           ░▒████████           │',
    '│            ░▒▓█████            │',
    '│                                │',
    '│  phase         waning gibbous  │',
    '│  illuminated              79%  │',
    '│  hemisphere          southern  │',
    '└────────────────────────────────┘',
  ]);
});

test('renderBlock: exact output for new and full', () => {
  assert.deepEqual(renderBlock(state('new', 0, 0, true), 'north').split('\n'), [
    '┌────────────────────────────────┐',
    '│            ░░░░░░░░            │',
    '│           ░░░░░░░░░░           │',
    '│          ░░░░░░░░░░░░          │',
    '│           ░░░░░░░░░░           │',
    '│            ░░░░░░░░            │',
    '│                                │',
    '│  phase                    new  │',
    '│  illuminated               0%  │',
    '│  hemisphere          northern  │',
    '└────────────────────────────────┘',
  ]);
  assert.deepEqual(renderBlock(state('full', 0.5, 1, true), 'south').split('\n'), [
    '┌────────────────────────────────┐',
    '│            ████████            │',
    '│           ██████████           │',
    '│          ████████████          │',
    '│           ██████████           │',
    '│            ████████            │',
    '│                                │',
    '│  phase                   full  │',
    '│  illuminated             100%  │',
    '│  hemisphere          southern  │',
    '└────────────────────────────────┘',
  ]);
});

test('renderBlock: a hair-thin crescent stays continuous down the limb', () => {
  // Rounding a 2%-lit disc to a four-step shade ramp erases the crescent from
  // the rows where it is thinnest, which reads as three disconnected specks.
  // Those rows fall back to a hairline instead.
  const moon = state('waxing crescent', 0.05, 0.02447);
  const rows = renderBlock(moon, 'north').split('\n').slice(1, 6);
  assert.deepEqual(rows, [
    '│            ░░░░░░░▕            │',
    '│           ░░░░░░░░░▕           │',
    '│          ░░░░░░░░░░░▒          │',
    '│           ░░░░░░░░░▕           │',
    '│            ░░░░░░░▕            │',
  ]);
  for (const row of rows) {
    const art = row.slice(1, -1).trim();
    assert.ok(litness(art) > 0, `block row shows no sunlight at all: ${JSON.stringify(row)}`);
    // The sunlit edge is the last glyph of the row, i.e. the right limb.
    assert.ok(LIT_WEIGHT.get(art[art.length - 1]) > 0, 'the lit limb is not on the right');
    assert.equal(LIT_WEIGHT.get(art[0]), 0, 'the left limb should be dark while waxing');
  }
});

test('renderBlock: every block is the same size, whatever the phase', () => {
  const shapes = new Set();
  for (const moon of CYCLE) {
    for (const hemisphere of ['north', 'south']) {
      const rows = renderBlock(moon, hemisphere).split('\n');
      const widths = new Set(rows.map((r) => chars(r).length));
      assert.equal(widths.size, 1, `ragged block frame: ${[...widths]}`);
      shapes.add(`${rows.length}x${[...widths][0]}`);
    }
  }
  assert.equal(shapes.size, 1, `block size varies with phase: ${[...shapes]}`);
});

test('renderBlock: the frame is closed on all four sides', () => {
  const rows = renderBlock(state('first quarter', 0.25, 0.5, true), 'north').split('\n');
  assert.match(rows[0], /^┌─+┐$/);
  assert.match(rows[rows.length - 1], /^└─+┘$/);
  for (const row of rows.slice(1, -1)) {
    assert.ok(row.startsWith('│') && row.endsWith('│'), `unframed row ${JSON.stringify(row)}`);
  }
});

test('renderBlock reports the same phase and illumination as renderLine', () => {
  for (const moon of CYCLE) {
    for (const hemisphere of ['north', 'south']) {
      const block = renderBlock(moon, hemisphere);
      const pct = renderLine(moon, hemisphere).slice(DISC_CELLS + 1, DISC_CELLS + 5).trim();
      assert.ok(block.includes(moon.phaseName), `block omits the phase name`);
      assert.ok(block.includes(pct), `block omits the illumination ${pct}`);
      assert.ok(block.includes(hemisphere === 'south' ? 'southern' : 'northern'));
    }
  }
});

// ---------------------------------------------------------------------------
// Illumination precision
// ---------------------------------------------------------------------------

test('illumination is printed as a whole percent — no spurious decimals', () => {
  for (const k of [0, 0.004, 0.02447, 0.5, 0.79389, 0.99999, 1]) {
    const line = renderLine(state('waxing gibbous', 0.3, k), 'north');
    assert.ok(!line.includes('.'), `decimal point in ${JSON.stringify(line)}`);
    assert.match(line.slice(DISC_CELLS + 1, DISC_CELLS + 5), /^ *\d{1,3}%$/);
  }
  assert.ok(renderLine(state('new', 0, 0.004), 'north').includes('  0%'));
  assert.ok(renderLine(state('full', 0.5, 0.99999), 'north').includes('100%'));
  assert.ok(renderLine(state('first quarter', 0.25, 0.5), 'north').includes(' 50%'));
});

// ---------------------------------------------------------------------------
// Robustness
// ---------------------------------------------------------------------------

test('an unknown hemisphere value renders as northern', () => {
  const moon = state('waxing crescent', 0.1, 0.09549);
  assert.equal(renderLine(moon, 'north'), renderLine(moon, undefined));
  assert.equal(renderBlock(moon, 'north'), renderBlock(moon, undefined));
});

test('the whole cycle renders without throwing and never widens the disc', () => {
  for (let step = 0; step <= 512; step++) {
    const f = step / 512;
    const k = (1 - Math.cos(2 * Math.PI * f)) / 2;
    const moon = state(f < 0.5 ? 'waxing gibbous' : 'waning gibbous', f, k);
    for (const hemisphere of ['north', 'south']) {
      const line = renderLine(moon, hemisphere);
      assert.equal(chars(line).length, DISC_CELLS + 7 + moon.phaseName.length);
      for (const ch of disc(line)) assert.ok(ALLOWED_DISC.has(ch));
    }
  }
});

// ---------------------------------------------------------------------------
// KI-5 pin — disc glyphs vs. the documented East Asian Width partition
//
// README.md, "Known limitation: terminal glyph width" (~line 188-196), makes
// a prose claim about the disc's Block Element glyphs:
//   Neutral:   U+2591 ░   U+2590 ▐
//   Ambiguous: U+2592 ▒   U+2593 ▓   U+2588 █   U+258C ▌   U+258F ▏   U+2595 ▕
// That split across two East Asian Width classes is KI-5: in a terminal that
// renders Ambiguous as double-width, the disc is 5-9 columns instead of a
// constant 5. The glyph-set redesign that would fix it is deliberately
// deferred — this block does not fix it, it pins it: no EAW table ships as a
// dependency, so this map IS the machine-checkable copy of the README's
// claim, and the test below derives the glyph set the disc actually draws
// (never hand-typed against itself) and checks it against this table, so an
// unannounced glyph change fails the gate instead of drifting silently.
// ---------------------------------------------------------------------------

/** The Block Element partition documented in README.md, transcribed verbatim. */
const DOCUMENTED_EAW = new Map([
  [0x2591, 'Neutral'], // ░
  [0x2590, 'Neutral'], // ▐
  [0x2592, 'Ambiguous'], // ▒
  [0x2593, 'Ambiguous'], // ▓
  [0x2588, 'Ambiguous'], // █
  [0x258c, 'Ambiguous'], // ▌
  [0x258f, 'Ambiguous'], // ▏
  [0x2595, 'Ambiguous'], // ▕
]);

/**
 * The disc is also observed (below) to draw two round-limb glyphs —
 * U+25D6/U+25D7, Geometric Shapes, not Block Elements — for a fully-lit
 * outer cell. The README's width caveat never mentions them: it is scoped to
 * the Block Element shade ramp and does not claim completeness over every
 * glyph the disc can emit. That is a real documentation gap, not a bug in
 * this test. They are pinned separately below, apart from the documented
 * partition, so this test tells the truth about what is and is not covered.
 */
const UNDOCUMENTED_DISC_GLYPHS = new Set([0x25d6, 0x25d7]); // ◖ ◗

/**
 * The disc-region characters of a renderBlock output: the art rows only,
 * frame and padding stripped. Art rows run from row 1 (under the top frame)
 * up to, but not including, the first row whose interior is nothing but
 * spaces — the blank separator ahead of the phase/illuminated/hemisphere
 * detail rows. Padding spaces and off-disc background cells are both just
 * ' ', so neither is a glyph; only non-space characters in that band belong
 * to the disc. Box-drawing frame characters (BOX.h/v/tl/tr/bl/br) are
 * excluded by construction: the loop never looks past column 0 or before the
 * last column of each row, and stops before the label rows entirely.
 */
function blockDiscChars(block) {
  const rows = block.split('\n');
  const out = [];
  for (let i = 1; i < rows.length; i++) {
    const inner = chars(rows[i]).slice(1, -1); // strip the leading/trailing '│'
    if (inner.every((ch) => ch === ' ')) break; // blank separator: art is over
    for (const ch of inner) if (ch !== ' ') out.push(ch);
  }
  return out;
}

test('KI-5 pin: disc glyph set matches the documented East Asian Width partition', () => {
  // Representative sweep: the named cycle plus a finer illumination sweep,
  // both hemispheres, both renderLine and renderBlock.
  const sweep = [...CYCLE];
  for (let f = 0; f <= 1.0001; f += 1 / 96) {
    const k = (1 - Math.cos(2 * Math.PI * f)) / 2;
    sweep.push(state(f < 0.5 ? 'waxing gibbous' : 'waning gibbous', Math.min(f, 1), k));
  }

  const observed = new Map(); // codepoint -> glyph, as actually drawn
  for (const moon of sweep) {
    for (const hemisphere of ['north', 'south']) {
      for (const ch of disc(renderLine(moon, hemisphere))) observed.set(ch.codePointAt(0), ch);
      for (const ch of blockDiscChars(renderBlock(moon, hemisphere))) observed.set(ch.codePointAt(0), ch);
    }
  }

  // Split what was actually drawn into Block Elements (the family the
  // README's caveat is about) and everything else.
  const observedBlockElements = [...observed.keys()].filter((cp) => cp >= 0x2580 && cp <= 0x259f);
  const observedOther = [...observed.keys()].filter((cp) => !(cp >= 0x2580 && cp <= 0x259f));

  const byCp = (a, b) => a - b;
  const hex = (cps) => cps.map((cp) => `U+${cp.toString(16).toUpperCase()}`);

  // The Block Element glyphs the disc draws must be EXACTLY the documented
  // partition: no fewer (a stale caveat about a glyph the code stopped
  // drawing) and no more (an undocumented glyph silently joined the mix).
  assert.deepEqual(
    observedBlockElements.sort(byCp),
    [...DOCUMENTED_EAW.keys()].sort(byCp),
    `disc Block Element glyphs drifted from the documented partition: observed ${JSON.stringify(hex(observedBlockElements))}`,
  );

  // The documented glyphs really do split across two EAW classes — the
  // width hazard the README describes is real, not a typo.
  assert.deepEqual([...new Set(DOCUMENTED_EAW.values())].sort(), ['Ambiguous', 'Neutral']);

  // Pin the undocumented round-limb glyphs too, kept apart from the table
  // above: if this ever fails, either they were removed (revisit this
  // comment and UNDOCUMENTED_DISC_GLYPHS) or some other new glyph joined the
  // disc outside the documented partition (a fresh doc gap to report).
  assert.deepEqual(
    observedOther.sort(byCp),
    [...UNDOCUMENTED_DISC_GLYPHS].sort(byCp),
    `undocumented disc glyphs changed: observed ${JSON.stringify(hex(observedOther))}, expected ${JSON.stringify(hex([...UNDOCUMENTED_DISC_GLYPHS]))}`,
  );
});
