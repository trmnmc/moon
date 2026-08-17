'use strict';

/**
 * Rendering of a MoonState into terminal text.
 *
 * This module MUST NOT require ./astro.js — it takes a MoonState (see
 * .swarm/CONTRACTS.md) and renders it, so it can be built and tested against
 * hand-constructed fixtures.
 *
 * Design notes (the taste brief):
 *   - No emoji. Ever. Geometric / block glyphs only (U+2588..U+2595, U+25D6,
 *     U+25D7, U+2500 box drawing) so the output degrades legibly in a plain
 *     monospace font with no ligatures and no Nerd Font.
 *   - Fixed column offsets. Every field ahead of the phase name has a constant
 *     width, so a MOTD line never jitters as the illumination ticks over from
 *     9% to 10% to 100%. The name is last, so nothing trails it.
 *   - The shade ramp (U+2591 U+2592 U+2593 U+2588) is antialiasing of the
 *     terminator, not sparkle: the dithered cells appear only where the
 *     light/dark boundary actually crosses a character cell.
 *   - Illumination is printed as a whole percent. The underlying algorithm is
 *     good to about an hour, i.e. about a percent; extra decimals would be a lie.
 */

/**
 * Local copy of the phase-name vocabulary. Duplicated on purpose: requiring
 * astro.js here is forbidden by the contract. Used only to size the name column.
 */
const PHASE_NAMES = Object.freeze([
  'new',
  'waxing crescent',
  'first quarter',
  'waxing gibbous',
  'full',
  'waning gibbous',
  'last quarter',
  'waning crescent',
]);

/** Width of the phase-name column: the longest name ("waxing crescent"). */
const NAME_WIDTH = PHASE_NAMES.reduce((w, n) => Math.max(w, n.length), 0);

/** Width of the illumination column: "  0%" .. "100%". */
const ILLUM_WIDTH = 4;

/** Cells in the one-line moon. Odd, so the disc has a centre column. */
const LINE_CELLS = 5;

/** The framed block's disc. 2:1 to compensate for character aspect ratio. */
const BLOCK_ROWS = 5;
const BLOCK_COLS = 12;

/** Sub-samples per axis when integrating a character cell. */
const SUB = 16;

/** Interior shade ramp, darkest to brightest. All are mirror-symmetric. */
const SHADE = ['░', '▒', '▓', '█']; // ░ ▒ ▓ █

/**
 * Glyphs for the outermost cell of the one-line disc, where the moon's edge is.
 *
 * A partly lit outer cell must draw its light against the side the sunlight is
 * on — the right of the cell while waxing, the left while waning — otherwise
 * the terminator lands on the wrong side of a character. Only the case where
 * cover reaches 0.88 — not only a fully lit cell — is positional: there the
 * glyph is the round limb itself.
 */
const LIMB_DARK = '░'; // ░
const HAIRLINE = { right: '▕', left: '▏' }; // ▕ ▏
const HALF = { right: '▐', left: '▌' }; // ▐ ▌
const ROUND_LIMB = { right: '◗', left: '◖' }; // ◗ ◖

/** Horizontal-mirror map. Anything absent mirrors onto itself. */
const MIRROR = new Map([
  ['◖', '◗'], ['◗', '◖'], // ◖ ◗
  ['▏', '▕'], ['▕', '▏'], // ▏ ▕
  ['▌', '▐'], ['▐', '▌'], // ▌ ▐
]);

/** Box drawing for the framed block. */
const BOX = { h: '─', v: '│', tl: '┌', tr: '┐', bl: '└', br: '┘' };

/** Detail rows of the block: label column + right-aligned value column. */
const LABEL_WIDTH = 12;
const VALUE_WIDTH = NAME_WIDTH + 1; // widest value is the longest phase name
const BLOCK_INNER = 2 + LABEL_WIDTH + VALUE_WIDTH + 2;

/**
 * Mirror a run of art horizontally: reverse it, and swap any handed glyph.
 * @param {string} art
 * @returns {string}
 */
function mirrorArt(art) {
  const out = [];
  for (const ch of art) out.push(MIRROR.get(ch) || ch);
  out.reverse();
  return out.join('');
}

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

/**
 * Integrate one character cell over the unit-radius lunar disc.
 *
 * The visible disc is the unit circle. At height y the disc runs to
 * w = sqrt(1 - y^2); the terminator — the projection of the great circle
 * dividing day from night — is the ellipse x = (1 - 2k) * w, where k is the
 * illuminated fraction. For a waxing moon the sunlit side is x >= that
 * boundary (the right limb, northern hemisphere); waning is the mirror image.
 *
 * @param {number} x0 @param {number} x1 @param {number} y0 @param {number} y1
 * @param {number} k       illuminated fraction, 0..1
 * @param {boolean} waxing
 * @returns {{cover:number, presence:number}} cover = lit fraction of the part
 *   of the cell that lies on the disc; presence = fraction of the cell on the disc.
 */
function sampleCell(x0, x1, y0, y1, k, waxing) {
  let inside = 0;
  let lit = 0;
  for (let i = 0; i < SUB; i++) {
    const y = y0 + ((i + 0.5) / SUB) * (y1 - y0);
    const yy = y * y;
    if (yy >= 1) continue;
    const w = Math.sqrt(1 - yy);
    const term = (1 - 2 * k) * w;
    for (let j = 0; j < SUB; j++) {
      const x = x0 + ((j + 0.5) / SUB) * (x1 - x0);
      if (x * x + yy > 1) continue;
      inside++;
      if (waxing ? x >= term : x <= -term) lit++;
    }
  }
  return {
    cover: inside === 0 ? 0 : lit / inside,
    presence: inside / (SUB * SUB),
  };
}

/**
 * Reduce a MoonState to the two numbers the art needs.
 * @param {MoonState} moon
 * @returns {{k:number, waxing:boolean}}
 */
function opticalState(moon) {
  const k = clamp(Number(moon.illumination) || 0, 0, 1);
  let f = Number(moon.cycleFraction);
  if (!Number.isFinite(f)) f = 0;
  f -= Math.floor(f);
  return { k, waxing: f < 0.5 };
}

/**
 * The one-line disc: a single scanline through the whole moon, so the outer
 * cells are naturally dimmer where the disc curves away from them.
 * Always rendered northern; mirror afterwards for the south.
 * @param {number} k @param {boolean} waxing
 * @returns {string} exactly LINE_CELLS characters
 */
function lineArt(k, waxing) {
  let out = '';
  for (let c = 0; c < LINE_CELLS; c++) {
    const x0 = -1 + (2 * c) / LINE_CELLS;
    const x1 = -1 + (2 * (c + 1)) / LINE_CELLS;
    const { cover } = sampleCell(x0, x1, -1, 1, k, waxing);
    if (c === 0 || c === LINE_CELLS - 1) {
      // Sunlight sits on the right of every cell while waxing, the left while waning.
      const sunward = waxing ? 'right' : 'left';
      if (cover < 0.02) out += LIMB_DARK;
      else if (cover < 0.3) out += HAIRLINE[sunward];
      else if (cover < 0.88) out += HALF[sunward];
      else out += ROUND_LIMB[c === 0 ? 'left' : 'right'];
    } else {
      out += SHADE[Math.round(clamp(cover, 0, 1) * (SHADE.length - 1))];
    }
  }
  return out;
}

/**
 * The framed block's disc: the same geometry sampled on a grid and masked to
 * the circle.
 * @param {number} k @param {boolean} waxing
 * @returns {string[]} BLOCK_ROWS rows of exactly BLOCK_COLS characters
 */
function blockArt(k, waxing) {
  const sunward = waxing ? 'right' : 'left';
  const rows = [];
  for (let r = 0; r < BLOCK_ROWS; r++) {
    const y0 = -1 + (2 * r) / BLOCK_ROWS;
    const y1 = -1 + (2 * (r + 1)) / BLOCK_ROWS;
    const row = [];
    const cells = [];
    for (let c = 0; c < BLOCK_COLS; c++) {
      const x0 = -1 + (2 * c) / BLOCK_COLS;
      const x1 = -1 + (2 * (c + 1)) / BLOCK_COLS;
      const cell = sampleCell(x0, x1, y0, y1, k, waxing);
      cells.push(cell);
      row.push(
        cell.presence < 0.5 ? ' ' : SHADE[Math.round(clamp(cell.cover, 0, 1) * (SHADE.length - 1))],
      );
    }

    // A crescent thinner than a sixth of a cell rounds away to the dark shade,
    // which would break the crescent into disconnected rows. Where that
    // happens on the disc's sunlit edge, keep it as a hairline instead: the
    // moon really is lit there, and this row would otherwise read as new.
    //
    // Only rows that would otherwise read as fully dark are eligible — a row
    // that already has a visibly lit cell (SHADE[1] or brighter) is left
    // alone, so an ordinary thick disc's blank off-disc fringe never grows a
    // spurious hairline (that fringe legitimately has near-zero cover at low
    // k, but can have plenty of cover at high k, e.g. a full moon, where the
    // row is already correctly lit elsewhere).
    //
    // Within such a row, the limb cell has to be found by *cover*, not by
    // which cells rounded to a visible glyph. A cell whose presence on the
    // disc is under half is rendered blank above, and a "first/last
    // non-blank" scan then skips right over it — even when it is the true
    // sunward edge of the disc and is carrying real light, sometimes more
    // than the cell the scan would otherwise land on. Scanning `cells` by
    // cover from the sunward edge finds the actual edge regardless of how
    // thin its presence made it render.
    const allDark = row.every((ch) => ch === ' ' || ch === SHADE[0]);
    if (allDark) {
      const limb = waxing ? lastLit(cells) : firstLit(cells);
      if (limb >= 0) row[limb] = HAIRLINE[sunward];
    }

    rows.push(row.join(''));
  }
  return rows;
}

/**
 * Index of the first cell (from the left) carrying real light, or -1.
 * Looks at cover directly rather than at how the cell rounded to a glyph,
 * so a cell too thin to reach 50% presence — and therefore rendered blank —
 * still counts if it truly has sunlight on it.
 *
 * "Carrying real light" means any lit sub-sample at all, never a fixed
 * absolute cut on cover. Near the illuminations that reach this guard the
 * crescent is thinner than one SUB-grid sample, so a cell's measured cover
 * is a quantization artifact that can rank the rows in the wrong order —
 * e.g. at k ≈ 0.0016 the limb cell measures ~0.025 in rows 0/2/4 but
 * ~0.017 in rows 1/3, while a fine-grained integration ranks those rows
 * the other way round. Any absolute threshold therefore lands between two
 * rows of the same crescent somewhere and breaks the arc into specks; the
 * only cut that cannot is zero.
 * @param {{cover:number,presence:number}[]} cells
 */
function firstLit(cells) {
  return cells.findIndex((cell) => cell.cover > 0);
}

/** Index of the last cell (from the right) carrying real light, or -1. */
function lastLit(cells) {
  for (let i = cells.length - 1; i >= 0; i--) if (cells[i].cover > 0) return i;
  return -1;
}

/**
 * Illuminated percent, whole numbers only — the precision the algorithm earns.
 * @param {MoonState} moon
 * @returns {string} exactly ILLUM_WIDTH characters, right aligned
 */
function illumField(moon) {
  const pct = Math.round(clamp(Number(moon.illumination) || 0, 0, 1) * 100);
  return `${pct}%`.padStart(ILLUM_WIDTH, ' ');
}

/**
 * @param {MoonState} moon
 * @returns {string}
 */
function phaseName(moon) {
  return typeof moon.phaseName === 'string' ? moon.phaseName : '';
}

/**
 * PRIMARY interface. Exactly one line, no trailing newline.
 *
 * Layout — three columns at fixed offsets, so nothing shifts as the phase or
 * the illumination changes:
 *
 *   cols  1..5   the disc
 *   col      6   space
 *   cols  7..10  illumination, right aligned:  "  0%" .. "100%"
 *   cols 11..12  two spaces
 *   cols 13..    the phase name
 *
 * The phase name is last and unpadded on purpose: this string goes in a prompt
 * or a MOTD, where a run of trailing spaces is a defect.
 *
 * @param {MoonState} moon
 * @param {"north"|"south"} hemisphere
 * @returns {string}
 */
function renderLine(moon, hemisphere) {
  const { k, waxing } = opticalState(moon);
  let disc = lineArt(k, waxing);
  if (hemisphere === 'south') disc = mirrorArt(disc);
  return `${disc} ${illumField(moon)}  ${phaseName(moon)}`;
}

/**
 * Secondary, derived from the same geometry as renderLine. Multi-line framed
 * block, no trailing newline. Every block is the same width and height.
 *
 * @param {MoonState} moon
 * @param {"north"|"south"} hemisphere
 * @returns {string}
 */
function renderBlock(moon, hemisphere) {
  const south = hemisphere === 'south';
  const { k, waxing } = opticalState(moon);
  const art = blockArt(k, waxing).map((row) => (south ? mirrorArt(row) : row));

  const pad = (BLOCK_INNER - BLOCK_COLS) / 2;
  const left = ' '.repeat(Math.floor(pad));
  const right = ' '.repeat(Math.ceil(pad));

  const detail = (label, value) =>
    `  ${label.padEnd(LABEL_WIDTH, ' ')}${String(value).padStart(VALUE_WIDTH, ' ')}  `;

  const lines = [];
  lines.push(BOX.tl + BOX.h.repeat(BLOCK_INNER) + BOX.tr);
  for (const row of art) lines.push(BOX.v + left + row + right + BOX.v);
  lines.push(BOX.v + ' '.repeat(BLOCK_INNER) + BOX.v);
  lines.push(BOX.v + detail('phase', phaseName(moon)) + BOX.v);
  lines.push(BOX.v + detail('illuminated', illumField(moon).trimStart()) + BOX.v);
  lines.push(BOX.v + detail('hemisphere', south ? 'southern' : 'northern') + BOX.v);
  lines.push(BOX.bl + BOX.h.repeat(BLOCK_INNER) + BOX.br);
  return lines.join('\n');
}

module.exports = { renderLine, renderBlock };
