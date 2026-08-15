# moon

Prints the current phase of the moon. Accurate, hemisphere-aware, offline, zero
dependencies.

```
░░░░▕   4%  waxing crescent
            next full moon  28 Aug
```

## Install

Nothing to install: if you already have this repo, run it straight from the repo root —

```sh
node bin/moon.js
```

To get the repo onto another machine, clone it — there are no dependencies to fetch:

```sh
git clone <url-of-this-repo> && node moon/bin/moon.js
```

`<url-of-this-repo>` is a placeholder: replace it with wherever you host this repository.
It's left unfilled here rather than pointing at a URL that would 404 for a reader.

## Why this one

The naive way to compute moon phase is a synodic-month modulo: divide elapsed days by
the mean synodic month and take the remainder. That drifts, because the real lunar cycle
isn't a constant length — this repo's own mean-formula-only epoch lands nearly four hours
off a published new-moon instant (see [Accuracy](#accuracy) below). The naive way to draw
it is a fixed set of sprites, which is hemisphere-blind: **backwards south of the
equator**, where a waxing crescent is lit on the right in Edinburgh and on the left in
Sydney.

That's not a straw man: the nearest package on npm, `lunarphase-js`, takes exactly this
route on the math — a mean-synodic modulo with zero periodic correction terms — and swaps
*emoji glyphs* for hemisphere rather than mirroring the art, with no `bin` entry, so it
isn't even a CLI. (`astronomia` is a genuine Meeus port, but it's a dependency — this
project has none.)

This one uses the Meeus algorithm with its full periodic correction terms (see Accuracy
below), and mirrors the disc when you're south of the equator.

```
north                          south
░░░░▕   3%  waxing crescent   ▏░░░░   3%  waxing crescent
░░░░▐  14%  waxing crescent   ▌░░░░  14%  waxing crescent
░░░▓◗  32%  waxing crescent   ◖▓░░░  32%  waxing crescent
░░▓█◗  51%  first quarter     ◖█▓░░  51%  first quarter
░▒██◗  69%  waxing gibbous    ◖██▒░  69%  waxing gibbous
▕███◗  85%  waxing gibbous    ◖███▏  85%  waxing gibbous
▐███◗  96%  waxing gibbous    ◖███▌  96%  waxing gibbous
◖███◗ 100%  full              ◖███◗ 100%  full
◖███▌  96%  waning gibbous    ▐███◗  96%  waning gibbous
◖██▓▏  83%  waning gibbous    ▕▓██◗  83%  waning gibbous
◖██░░  63%  waning gibbous    ░░██◗  63%  waning gibbous
◖█░░░  40%  waning crescent   ░░░█◗  40%  waning crescent
◖▒░░░  19%  waning crescent   ░░░▒◗  19%  waning crescent
▌░░░░   5%  waning crescent   ░░░░▐   5%  waning crescent
░░░░░   0%  new               ░░░░░   0%  new
```

The hemisphere is inferred from your system timezone. If that guess is wrong for where
you are, pass `--south` or `--north`.

## Options

| flag | effect |
|---|---|
| `--json` | structured output for scripting |
| `--block` | multi-line framed readout instead of the single line |
| `--compact` | suppress the next-full-moon line, leaving exactly one line |
| `--south` | force southern-hemisphere rendering |
| `--north` | force northern-hemisphere rendering |
| `-h`, `--help` | usage |

`--south` and `--north` are last-one-wins, so you can override a shell alias:

```sh
alias moon='moon --south'
moon --north   # works
```

## In your prompt or MOTD

`--compact` gives exactly one line with no trailing whitespace, which is the form you
want in a shell prompt. Fetching from git on every prompt render would be slow, so clone
the repo once and call the local binary directly:

```sh
# ~/.zshrc — moon is not on npm; clone once, then call the local binary
echo "$(node ~/src/moon/bin/moon.js --compact)"
```

## `--block`

```
┌────────────────────────────────┐
│            ░░░░░░░▒            │
│           ░░░░░░░░░▕           │
│          ░░░░░░░░░░░▓          │
│           ░░░░░░░░░▕           │
│            ░░░░░░░▒            │
│                                │
│  phase        waxing crescent  │
│  illuminated               4%  │
│  hemisphere          northern  │
└────────────────────────────────┘
  next full moon  28 Aug
```

## `--json`

```json
{
  "phase": "waxing crescent",
  "illumination": 0.0408,
  "age": 1.764,
  "cycleFraction": 0.06477,
  "phaseAngle": 23.319,
  "hemisphere": "north",
  "nextFullMoon": "2026-08-28T04:18:25.225Z",
  "julianDay": 2461266.99732,
  "timestamp": "2026-08-14T11:56:08.127Z"
}
```

| field | meaning |
|---|---|
| `phase` | one of the eight canonical phase names |
| `illumination` | illuminated fraction of the disc, `0`–`1` |
| `age` | days elapsed since the last new moon |
| `cycleFraction` | position through the synodic month, `0` = new, `0.5` = full |
| `phaseAngle` | elongation in degrees, `0` = new, `180` = full — see caution below |
| `hemisphere` | the hemisphere actually used for rendering |
| `nextFullMoon` | ISO-8601 instant of the next full moon |
| `julianDay` | Julian Day of the observation instant |
| `timestamp` | ISO-8601 instant the reading was computed for |

Numeric fields are rounded to the precision the algorithm has actually earned. Phase
instants are good to roughly an hour, so illumination is good to about a percent —
emitting seventeen significant digits would be precision theatre.

**Caution on `phaseAngle`.** It is the Moon–Sun *elongation* (0 at new, 180 at full),
not the Meeus phase angle *i* (which is 180 at new). Applying the textbook
`k = (1 + cos i) / 2` to this field returns `1 − illumination` — the exact inverse.
Use the `illumination` field, which is already computed correctly.

Errors go to stderr and exit `2`; normal output goes to stdout. Safe to pipe.

## Accuracy

Phase instants use Meeus, *Astronomical Algorithms* (2nd ed.), ch. 49 — the mean phase
formula **plus** the full periodic correction tables and the A1–A14 additional
corrections, with TT→UT via the Espenak–Meeus ΔT polynomial. Illumination is the true
Moon−Sun elongation per ch. 48, not a cosine of the moon's age.

Verified against the published new moon of 2000-01-06 18:14 UTC: this implementation
computes **18:15 UTC**. A mean-formula-only implementation lands at 14:20 UTC, nearly
four hours off.

Independently checked properties:

- lunation length varies **29.274–29.826 days** across 864 lunations measured over
  1990–2060 — a lower bound from that window, not the physical range. A mean-only
  implementation is flat at 29.530589 by construction.
- new→full interval spans **13.906–15.613 days** across 865 intervals measured over
  1990–2060, mean **14.765** against a theoretical half-synodic of 14.765 — a lower bound
  from that window, not the physical range.

`phaseName` and `illumination` come from two different Meeus series, so nothing
guarantees they stay in step forever. Over the half-open range of years **1000–3000**,
`test/astro.test.js` samples that domain and finds no contradiction between them;
outside it, behavior is unspecified and the two fields may disagree.

## Non-goals

- **No network access, ever.** Everything is computed locally.
- **No moonrise/moonset times.** Those need your latitude and longitude, which is a
  genuinely different and harder problem. This tool tells you what phase the moon is
  in; it does not tell you whether the moon is above your horizon right now.
- No emoji, no colour themes, no config file.

## Tests

```sh
node --test test/*.test.js
```

Timezone is pinned explicitly in every date-sensitive test — the CI host is UTC, and a
test that passes only because of that is a bug.

## Known limitation: terminal glyph width

The disc's shade ramp and its half-block and hairline limb glyphs are Unicode Block
Elements, and those glyphs do not share an East Asian Width class: `░` and `▐` are Neutral
while `▒ ▓ █ ▌ ▏ ▕` are Ambiguous. In a terminal configured to render ambiguous-width
characters as double-width (common in CJK locales, iTerm2's "treat ambiguous-width as
double", `xterm -cjk_width`), the disc renders 5–9 columns wide depending on phase instead
of a constant 5. Three consequences there: the single-line readout jitters between nights,
the two-line form stops aligning, and the `--block` frame does not close.

In a default Western-locale terminal — every configuration this was developed and
tested against — all forms are exactly 5 columns and align correctly.

This is not a typo but an upstream Unicode fact: no subset of Block Elements provides a
four-step shade ramp plus a symmetric half-block pair within one width class. Fixing it
properly means changing the glyph set, which is deferred rather than rushed.

The disc also draws round-limb glyphs, `◗` and `◖`, once the outer cell's lit fraction reaches
0.88, not only when it is fully lit. These are Geometric Shapes, not Block Elements. Their East
Asian Width class has been established: both are Neutral in Unicode Character Database 15.0.0,
as measured by the audit script at `.swarm/runs/cycle-024-eaw-audit.py`. They thus share the
Neutral width class of `░` and `▐`, not the Ambiguous class of the other block elements.

## Licence

MIT
