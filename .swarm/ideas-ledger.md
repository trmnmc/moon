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

- 2026-08-18T00:17:55+00:00 (cycle 81, surfaced by the TASTE pass — fable judgment seat,
  verdict `wears-thin`; conductor-reproduced, evidence `.swarm/runs/cycle-081-verify-taste.txt`)
  **The daily glance has no element guaranteed to change.** Ten consecutive default runs printed
  the byte-identical `░░░▓◗  30%  waxing crescent` / `next full moon  28 Aug` (conductor C1:
  10 runs → 1 distinct rendering). Near new and full, the 5-cell art and the whole-percent
  field will be identical across consecutive DAYS too, so the only reliably-moving element is
  an absolute date the reader must subtract from today by hand. Taste suggestion: a relative
  countdown, `next full moon  28 Aug (in 10 days)` — one line, zero deps, and it ticks every
  day even when the art and the percent are frozen.
  NOT FILED as work: it adds user-visible output the locked SPEC does not ask for, and this
  run's taste note requires every item to trace to a recorded survivor, a failed doc
  re-verification, or the flag-interaction axis. This traces to none of the three. It is the
  strongest product idea the run produced and the first thing a *feature* run should weigh.

- 2026-08-18T00:17:55+00:00 (cycle 81, TASTE pass; conductor-reproduced, C4a/C4b/C4c)
  **No way to ask about any date but today.** Verified: no `--date` flag exists in the CLI
  source, `src/` and `bin/` contain ZERO `process.env` references, and `faketime` is not
  installed on this host — so the product can show exactly one moon per calendar day and the
  first-time user's immediate second question ("what will it be Friday?") dead-ends at use 2.
  Taste suggestion: `--date <iso>` reusing the existing astro path, still zero-dep, no network.
  NOT FILED as work: the locked non-goals forbid new flags outright. Recorded because the
  taste seat rated it the highest-leverage addition available to the product, and because the
  *measurement* (that the CLI's output is a pure function of the wall clock with no injection
  point) is itself worth inheriting — it is why no taste agent can ever exercise ten different
  moons through the CLI, only through `src/render.js` directly.

- 2026-08-18T00:17:55+00:00 (cycle 81, TASTE pass; conductor-reproduced, C5/C6)
  **`--block`'s next-full-moon line dangles outside the closed frame.** Verified: the framed
  block ends with `│  hemisphere          northern  │` and then `└──…┘`, after which
  `   next full moon  28 Aug` is printed at a 3-space indent that aligns with nothing inside
  the box (C5: the line carries no box character). `--block --compact` drops it cleanly (C6),
  which is what makes it read as bolted on rather than composed. Taste suggestion: make it a
  fourth detail row inside the frame; the frame width already fits it.
  NOT FILED as work: it is a layout change to shipped output, tracing to none of this run's
  three permitted sources. It is small, real, and the cheapest taste win available to the next
  run that is allowed to change how the product looks.
