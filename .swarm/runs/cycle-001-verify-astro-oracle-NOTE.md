# Independent astronomy verification — target `moon`, cycle 1 items T-001 / T-005

Produced 2026-08-14T12:01Z by a **second, duplicate conductor session** (pacer spawn
`claude -p "/swarm cycle"`, PID 87647) that ran concurrently with the live kickoff
conductor. That session yielded rather than race the state files; this evidence is the
part of its work worth keeping. See `SWARM/runs/incident-duplicate-conductor.md`.

## Why this is not a re-run of the project's own tests

`test/astro.test.js` was written by the same wave that wrote `src/astro.js`. A test
suite cannot certify the algorithm it was written alongside. This check is an
**independent re-derivation**: `verify-oracle-independent.js` computes illumination
from apparent ecliptic longitudes and the geocentric elongation (Astronomical Almanac
low-precision solar series + Meeus table 47.A/47.B leading terms), a different
formulation from the lunation-phase-instant approach in `src/astro.js`. It was written
at verification time and never shown to any builder.

Reproduce: `node .swarm/runs/verify-gate-astro.js` (requires the sibling oracle file;
the copy in `SWARM/runs/` is the one the recorded output was generated from).

## Result

| check | result |
|---|---|
| worst \|Δ illumination\| vs oracle, 1600 samples over 400 days | **0.292 pp** |
| worst \|Δ cycle angle\| | **0.504°** (oracle self-accuracy ~0.3°) |
| `nextFullMoon` vs oracle bisection on Δλ = 180°, 8 months | **worst 3.3 min**, best 0.5 min |
| illumination at the returned full-moon instant | 100.00% |
| phase name ↔ illumination ↔ waxing/waning coherence, 1200 samples | 0 violations |
| range invariants (illumination, cycleFraction, age, julianDay), 800 samples | 0 violations |
| end-to-end: `bin/moon.js --json` illumination vs oracle at its own timestamp | 0.017 pp |

**Discriminator — this is the point of the check.** Must-have 1 says the periodic
correction terms must be present and the mean formula alone is not sufficient. A
mean-formula-only implementation errs by up to ~6.3° in longitude and ~14 h in syzygy
timing, which would surface here as >4 pp of illumination error. Observed: 0.292 pp,
and full-moon instants agreeing to ~3 minutes. **The corrections are genuinely there.**

## Two honest caveats about this evidence

1. `mean synodic month = 29.5000d` in the recorded output is **not** an accuracy result.
   New-moon wraps were detected on a 6-hour sampling grid, so the figure is quantised to
   0.25 d; it is consistent with 29.5306 d and is only a sanity check, not a measurement.
2. The oracle's own timing precision is ~35 min (its ~0.3° longitude error divided by the
   ~12.2°/day Moon–Sun separation rate). The 3.3-minute agreement on full-moon instants is
   therefore *better than the oracle can resolve* — it bounds the error, it does not
   measure it. Both implementations descend from Meeus, so this is a strong consistency
   check and an independent-formulation check, **but not an ephemeris-grade check against
   JPL**. Nothing offline on this host can supply that.

## Not verified here

Terminal font/width rendering (KI-4) — no automated check can cover it; a human must look.
