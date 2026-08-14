# moon

Prints the current phase of the moon. Accurate, hemisphere-aware, offline, zero
dependencies.

```
░░░░▕   4%  waxing crescent
            next full moon  28 Aug
```

## Install

Nothing to install:

```sh
npx github:YOUR_USER/moon
```

Or clone and run it directly — there are no dependencies to fetch:

```sh
git clone https://github.com/YOUR_USER/moon && node moon/bin/moon.js
```

## Why this one

Most terminal moon phase tools compute the phase with a naive synodic-month modulo,
which drifts by hours to days, and draw the moon from a fixed set of sprites, which is
**backwards for the southern hemisphere** — a waxing crescent is lit on the right in
Edinburgh and on the left in Sydney.

This one uses the Meeus algorithm with its full periodic correction terms, and mirrors
the disc when you're south of the equator.

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
want in a shell prompt:

```sh
# ~/.zshrc
echo "$(npx --no-install moon --compact)"
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
| `phaseAngle` | elongation in degrees, `0` = new, `180` = full |
| `hemisphere` | the hemisphere actually used for rendering |
| `nextFullMoon` | ISO-8601 instant of the next full moon |
| `julianDay` | Julian Day of the observation instant |
| `timestamp` | ISO-8601 instant the reading was computed for |

Numeric fields are rounded to the precision the algorithm has actually earned. Phase
instants are good to roughly an hour, so illumination is good to about a percent —
emitting seventeen significant digits would be precision theatre.

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

- lunation length varies across **29.339–29.775 days** — the real physical range. A
  mean-only implementation is flat at 29.530589 by construction.
- new→full interval over 36 lunations spans 13.942–15.576 days, mean **14.764** against
  a theoretical half-synodic of 14.765.

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

95 tests. Timezone is pinned explicitly in every date-sensitive test — the CI host is
UTC, and a test that passes only because of that is a bug.

## Licence

MIT
