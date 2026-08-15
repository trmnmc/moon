# FROZEN CONTRACTS — cycle 1

Authored by the conductor BEFORE any builder started. **No builder may edit this file,
and no builder may change a signature below.** If a contract looks wrong, stop and report
it — do not "fix" it, because three agents are building against it concurrently.

All modules are CommonJS. Zero runtime dependencies — stdlib only (`node:util`,
`node:test`, `node:assert`). No `require` of anything outside `node:*` and `../src/*`.

## src/astro.js

```js
/**
 * @param {Date} date
 * @returns {MoonState}
 */
function computeMoon(date)

/** @typedef {Object} MoonState
 * @property {number} julianDay      Julian Day for `date`
 * @property {number} age            days since last new moon, 0 .. ~29.84
 *                                   (the TRUE elapsed time, never clamped —
 *                                   real lunations exceed the 29.530589 mean;
 *                                   the original bound here was wrong and was
 *                                   corrected in cycle 1 after QA)
 * @property {number} cycleFraction  0 .. 1  (0 = new, 0.25 = first quarter, 0.5 = full)
 * @property {number} phaseAngle     degrees, 0 .. 360
 * @property {number} illumination   0 .. 1  (0 = new, 1 = full)
 * @property {string} phaseName      exactly one of PHASE_NAMES below
 * @property {boolean} isInstantPhase true when within tolerance of new/FQ/full/LQ
 */

module.exports = { computeMoon, PHASE_NAMES }
```

`PHASE_NAMES` is exactly this array, in this order:

```js
["new", "waxing crescent", "first quarter", "waxing gibbous",
 "full", "waning gibbous", "last quarter", "waning crescent"]
```

## src/hemisphere.js

```js
/**
 * @param {string} [timeZone]  IANA name; defaults to Intl.DateTimeFormat().resolvedOptions().timeZone
 * @returns {"north"|"south"}
 */
function detectHemisphere(timeZone)

module.exports = { detectHemisphere }
```

## src/args.js

```js
/**
 * @param {string[]} argv   process.argv.slice(2)
 * @returns {{json:boolean, hemisphere:("north"|"south"|null), block:boolean, help:boolean}}
 */
function parseArgs(argv)

module.exports = { parseArgs }
```

Flags: `--json`, `--south`, `--north`, `--block`, `--help`/`-h`.
`hemisphere` is `null` when neither `--south` nor `--north` was given (meaning: auto-detect).

## src/render.js

```js
/**
 * PRIMARY interface. Exactly one line, no trailing newline.
 * @param {MoonState} moon
 * @param {"north"|"south"} hemisphere
 * @returns {string}
 */
function renderLine(moon, hemisphere)

/**
 * Secondary. Multi-line framed block, no trailing newline.
 * @param {MoonState} moon
 * @param {"north"|"south"} hemisphere
 * @returns {string}
 */
function renderBlock(moon, hemisphere)

module.exports = { renderLine, renderBlock }
```

`render.js` MUST NOT require `astro.js`. It receives a `MoonState` and renders it. This
is what lets it be built and tested in parallel against hand-constructed fixtures.

## File ownership — strictly disjoint, no exceptions

| Path | Owner |
|---|---|
| `src/astro.js`, `test/astro.test.js` | builder T-001 |
| `src/hemisphere.js`, `src/args.js`, `test/hemisphere.test.js`, `test/args.test.js` | builder T-002 |
| `src/render.js`, `test/render.test.js` | builder T-003 |
| `bin/moon.js`, `package.json`, `README.md`, `.swarm/*` | CONDUCTOR ONLY |

## Cycle 1 Freeze vs. Current Code — Recorded Divergences

The following three divergences have developed between the frozen contracts and the actual code, without editing this file per the freeze.

### src/astro.js exports

Line 33 declares:

```js
module.exports = { computeMoon, PHASE_NAMES }
```

`src/astro.js:363` currently exports:

```js
module.exports = { computeMoon, nextFullMoon, PHASE_NAMES, PHASE_ILLUMINATION_CONSISTENCY_DOMAIN };
```

`nextFullMoon` and `PHASE_ILLUMINATION_CONSISTENCY_DOMAIN` are now exported and are absent from the frozen declaration.

### src/args.js parseArgs return shape

Line 60 declares:

```js
@returns {{json:boolean, hemisphere:("north"|"south"|null), block:boolean, help:boolean}}
```

`src/args.js:124-130` currently returns an object with an additional fifth key:

```js
compact: parsed.values.compact === true,
```

### src/args.js flag list

Line 67 declares:

```
Flags: `--json`, `--south`, `--north`, `--block`, `--help`/`-h`.
```

`src/args.js:13-23` currently registers six flags in OPTIONS, including `--compact` on line 21.

### Observable consequence

`test/args.test.js:87` is a shipping test titled `'the returned object has exactly the five contract keys'`. It asserts five keys exist (`json`, `hemisphere`, `block`, `compact`, `help`) and passes. The frozen contract on line 60 declares only four keys in the return type. This test would fail if judged against the frozen contract's JSDoc signature.
