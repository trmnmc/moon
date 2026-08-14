# ideas ledger — moon

Ideas surfaced during a run that neither fit the locked SPEC nor conflict with it hard
enough to warrant a drift pause. Parked here rather than folded into the backlog or
silently dropped. Nothing here is committed work.

- 2026-08-14T17:19:30+00:00 (cycle 6, surfaced by the T-103a builder, conductor-confirmed)
  **Runtime enforcement of the KI-7 supported date domain.** `PHASE_ILLUMINATION_CONSISTENCY_DOMAIN`
  now declares years 1000-3000, but `computeMoon` and `nextFullMoon` still compute outside
  it with no warning, so the bound is declarative only. A runtime guard (warn, or throw as
  `nextFullMoon` does past the Date range) would make the declaration enforced rather than
  documented.
  DELIBERATELY NOT FILED as a backlog item this run: it is a behavior change to a shipped
  CLI, and the improvement run's non-goals forbid new behavior. It is also not obviously
  right — the out-of-domain results are *unspecified*, not known-wrong, and throwing on
  them would break callers who are today getting correct answers at, say, year 500. If a
  future run takes this up, the first question is which of warn / throw / nothing is
  actually correct, not how to implement it.
