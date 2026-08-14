# SPEC — moon

<!-- Instantiated at kickoff. Frozen after user confirmation 2026-08-14. -->

## Idea

A tiny, zero-dependency Node CLI that prints the current phase of the moon: the phase
name, the illuminated percentage, and a Unicode moon rendered so the terminator (the
light/dark boundary) falls on the correct side. Accurate to within an hour via a real
astronomical algorithm, hemisphere-aware, offline, and instant. Runs with `npx` and no
install.

## Audience

Terminal-dwellers who want a correct, quiet moon in their MOTD, shell prompt, or status
bar. Secondarily night-sky hobbyists, astrophotographers, and gardeners who care whether
tonight is dark — people for whom a wrong answer is worse than no answer. Tertiary:
anyone piping `--json` into a script.

## Must-haves

<!-- The PLAN gate holds until every box is covered by a backlog item. Checked off only
     after conductor verification, never by claim. -->

- [ ] Astronomically accurate phase computation using the Meeus method WITH periodic
      correction terms (not a naive synodic-month modulo, and not the mean formula
      alone), correct to within ~1 hour, verified in tests against independently
      published new/full moon timestamps
- [ ] Correct illuminated fraction printed at a precision the algorithm actually earns,
      plus the phase name (new / waxing crescent / first quarter / waxing gibbous /
      full / waning gibbous / last quarter / waning crescent)
- [ ] Hemisphere-aware rendering: the lit limb faces the correct direction in the
      southern hemisphere (mirrored), auto-detected from the system IANA timezone via a
      static table, with `--south` / `--north` override
- [ ] `--json` mode emitting valid, stable, documented, parseable structured output
- [ ] Zero runtime dependencies; runs via `npx`; startup fast enough for a shell prompt
- [ ] Single-line output is the PRIMARY interface (the MOTD line is where this earns its
      second use); the framed block is secondary and derived from it, not the reverse

## Nice-to-haves

<!-- EXPLICITLY CUT at lock per the taste judge's scope-fits-night score of 6. Do not
     start these until every must-have is verified green. -->

- Countdown to the next new moon — CUT
- **Date of the next FULL moon, printed under the phase line — UN-CUT by user injection
  during cycle 1.** Implemented additively (`nextFullMoon()` export + a conductor-composed
  second output line) so the frozen mid-wave contract was never edited. Sequenced after
  must-have verification; the first thing cut if the clock bites.
- `--date <iso>` to query an arbitrary date — CUT
- Moon age in days — CUT

## Non-goals

- No network calls at runtime, ever — offline is the design, not a limitation
- No emoji anywhere in the output
- No color themes, no config file, no plugin system
- No moonrise/moonset times (needs observer lat/long — a genuinely different and harder
  problem). ACKNOWLEDGED CEILING: the tool answers "what phase is it" but never "is the
  moon up right now." Confirmed by the user with eyes open at lock.
- No eclipse or libration prediction
- Not published to npm during this run (no registry credentials); distribution is
  npx-from-git

## Taste notes

A tiny precision instrument, not a toy. Unicode moon glyphs with a subtle ASCII glow; no
emoji soup. Austere and aligned: the output should look like a readout, not a greeting.
No exclamation marks. Illumination printed to a precision the algorithm actually earns —
never spurious decimals. The "glow" exists to make the terminator legible, not to
sparkle. Must read well both as a single line and as a small framed block.

Terminal font and width variance is a real untested surface (taste judge, product-not-demo
axis): the glyphs chosen must degrade legibly in a plain monospace font without ligatures.

## Domain rules

Ground truth, hand-computable without reading any code:

- Mean synodic month = 29.530588861 days.
- Meeus (*Astronomical Algorithms*, ch. 49) mean phase:
  `JDE = 2451550.09766 + 29.530588861*k + 0.00015437*T^2 - 0.000000150*T^3 + 0.00000000073*T^4`
  where integer `k` counts new moons from the 2000 Jan 6 epoch and `T = k/1236.85`.
  Quarter phases are `k + 0.25 / 0.5 / 0.75`. Real accuracy REQUIRES the periodic
  correction terms; the mean formula alone is not sufficient and does not satisfy
  must-have 1.
- Illuminated fraction (Meeus ch. 48): `k_illum = (1 + cos i) / 2`, where `i` is the
  phase angle. `k_illum` = 0 at new, 1 at full, 0.5 at both quarters.
- Phase naming is by position in the cycle; the four "instant" phases (new, first
  quarter, full, last quarter) are reported when within a defined tolerance of the exact
  instant, never only on exact equality.
- Southern hemisphere rendering is the northern rendering mirrored horizontally. A waxing
  crescent is lit on the RIGHT in the northern hemisphere and on the LEFT in the southern.
- The system clock's timezone must never silently determine correctness: tests pin `TZ`
  explicitly. (The build host is UTC; a test that passes only because of that is a bug.)

## Provenance

Prior-art scout returned stance `extend`. The core algorithm is solved, published work —
PORT a documented algorithm, do not invent one. Reference implementations, all
permissively licensed and grep-verified:

- `Pickle-Clawd/tidecal` (MIT) — `src/astro.js`, genuine Meeus ch.47 in offline JS.
  Closest reference in the target language.
- `Wawona/wwn-phoon-rs` (MIT) — real kepler solver, phoon-compat test suite. Use as a
  CROSS-CHECK ORACLE for computed phase instants.
- `iriswebb/moontool` (0BSD) — Walker/Duffett-Smith port, per-scanline terminator render.

Open ground that justifies this build (verified absent in all prior art): hemisphere-
mirrored art, Unicode rather than 1980s ASCII, and package-manager distribution.

KNOWN GAP: npm/pypi/web prior art was NOT swept (session permissions blocked the search).
It remains possible an npm CLI already occupies this niche. Flagged to the user at lock.

## Definition of done

`npx .` prints a correct, well-aligned moon readout. `node --test test/*.test.js` passes
with tests that pin `TZ` and check computed phase instants against independently published timestamps.
`--json` emits valid JSON that `JSON.parse` accepts and whose fields are documented.
Hemisphere override verified in BOTH directions by actual command output. README
documents the one-line install and every flag. `package.json` has no runtime dependencies.

## Commands

- run: `node bin/moon.js`
- test: `node --test test/*.test.js`

<!-- The glob form is load-bearing: on Node 24 the directory form `node --test test/`
     fails with MODULE_NOT_FOUND (recorded by the prior run on this host). -->


## Spec digest

- Zero-dep Node CLI printing the current moon phase: name, illumination %, hemisphere-
  correct Unicode moon; offline, instant, npx-runnable.
- Must-have core: Meeus WITH periodic corrections (~1h accuracy), correct illumination,
  hemisphere-mirrored art with override, `--json`, single-line output as primary.
- Non-goals: no network, no emoji, no color/config, no moonrise/moonset, no npm publish.
  All three nice-to-haves explicitly cut at lock.
- Taste: a tiny precision instrument, not a toy — austere aligned readout, glow serves
  terminator legibility, degrades legibly in plain monospace.
- Port a published algorithm (tidecal/wwn-phoon-rs as reference + cross-check oracle);
  never invent one, never ship the mean formula alone.
