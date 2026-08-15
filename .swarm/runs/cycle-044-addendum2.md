
### cycle 44 addendum 2 — burn-up parser defect: introduced, caught, and corrected in-cycle

- DEFECT I INTRODUCED THIS CYCLE: I gave cycle 44's addendum commit a `[1 verified` subject
  bracket, but cycle 44's MAIN commit already carried one. The burn-up parser SUMS every
  bracket matching a cycle number, so cycle 44 would have read as 2 verified items for the
  one item actually verified (T-126). Caught by re-parsing the series after the addendum
  commit landed rather than trusting the render that ran before it existed.
- INVESTIGATING IT SURFACED A PRE-EXISTING INSTANCE OF THE SAME DEFECT: cycle 32 also has two
  bracketed commits — `[1 verified locally` on the wave commit and `[1 verified` on the state
  commit — for a single verified item, T-129. So the SUM rule has been over-counting since
  cycle 32, and part of the "unattributed one-item gap" this tooltip has honestly flagged for
  several cycles was in fact this double-count rather than an unreconciled backlog item. That
  is a better answer than the one the last four cycles have been carrying.
- CORRECT RULE, now applied: a cycle's verified count is the MAX over that cycle's commit
  subjects, not the SUM. An addendum RESTATES the cycle's result; it does not add a second
  one. MAX is robust to both patterns in this repo's history — cycle 43 (main carries no
  count, addendum carries 1 -> 1) and cycles 32/44 (both carry 1 -> 1). The correction script
  asserts that exactly cycles 32 and 44 disagree between the two rules, and that the MAX total
  is 35, so it fails loudly rather than silently re-rendering if the history shifts.
- EFFECT: cumulative verified 36 -> 35 against 41 backlog items. The gap versus 37 items
  marked done widens from one item to TWO, and is still NOT attributed to specific items,
  because most done items carry no closing-cycle field to reconcile against. The dashboard
  tooltip now says all of this, including that cycle 44's half of it was my error.
- WHY NOT FIXED BY AMENDING THE COMMIT: the addendum was already pushed, and rewriting pushed
  history to correct a subject line is a worse trade than fixing the parser — the same
  judgment cycle 43 made about its own subject slip. The difference is that cycle 43's slip
  was cosmetic (a flat bar) while this one corrupted an arithmetic total, so it warranted a
  corrective render rather than only a note.
- CONVENTION FOR FUTURE CYCLES, so this stops recurring: only a cycle's MAIN commit carries
  the `[N verified` bracket; addendum commits never do. Cycle 43's addendum was the one
  deliberate exception, made to repair a main subject that had dropped its count. Under the
  MAX rule that exception is now harmless either way, which is the point of choosing MAX over
  a first-commit-wins rule.
- The live dashboard was re-rendered with the corrected series. This addendum's own commit
  subject deliberately carries NO verified bracket.
