
## cycle 31 | 2026-08-15T02:12:11+00:00 | moon | VALUE_LOOP
work: VALUE_LOOP candidate scan (cycle 30's standing requirement: a DONE declaration needs a scan
  that comes back EMPTY), then build-wave [T-128] k=1 at sonnet. The scan probed FOUR surfaces and
  three came back already-closed by earlier cycles -- that hit rate is the number worth recording,
  not the one item found. Each rejection was MEASURED, not recalled:
  (a) HEMISPHERE TABLE vs the IANA reference latitudes. src/hemisphere.js is the largest hand-typed
      data structure in the repo (6 prefixes, 85 southern zones, 1 northern carve-out) and its
      header claims it was "compiled from the reference coordinates the IANA tz database publishes".
      Already closed: test/hemisphere.test.js:327 cross-checks it against /usr/share/zoneinfo.
      Re-verified independently anyway (.swarm/runs/cycle-031-tzoracle.mjs, -tzoracle2.mjs):
      418/418 canonical zones agree; reverse direction 0 mismatches and 0 dead table entries; the
      only real zone sitting north under a southern prefix (Indian/Maldives, +4.167) is correctly
      carved out; 5 of the hardcoded legacy aliases resolve through Intl to a tab zone and match,
      7 (the Argentina backward links and Pacific/Enderbury) are unreachable from zone.tab and
      remain hand-verified only.
  (b) PROCESS-LEVEL SURFACES: an early-closed stdout pipe and the exit-code matrix
      (.swarm/runs/cycle-031-epipe.mjs). No EPIPE crash in any of five piped modes -- the payload
      fits the pipe buffer, so the write lands before the reader closes -- and eight probed
      invocations exit 0/0/0/0/2/2/2/0 exactly as documented. Nothing to fix.
  (c) The next-full-moon line's YEAR-SUPPRESSION branch in bin/moon.js, which is only reachable in
      late December and whose leading pad has a recorded past regression. Already pinned in BOTH
      directions by T-106 in test/regressions.test.js, under a faked clock. Nothing to add.
  (d) THE HIT -- the FLAG table. Direct sibling of cycle 30's T-127, which pinned the --json FIELD
      names across three documents and left the flag set itself unpinned. src/args.js registers the
      accepted options in `const OPTIONS`; the same set is restated in bin/moon.js's HELP `options`
      block and in README's `## Options` table, and nothing checked any edge. The only existing
      check, cli.test.js:178, asserted a HARDCODED six-name literal was PRESENT in --help output:
      one-directional and blind to src/args.js entirely, so removing --compact from OPTIONS kept the
      suite green while both documents went stale. README's Options table had never been read by any
      test at all. Second half: src/args.js:5-8 asserted the table is kept there "so the help text
      and the parser can never drift apart" -- a guarantee the code does not provide, since HELP is
      an unrelated string literal in another file. A false claim about verification, in a run whose
      whole premise is replacing prose-only claims with machine-checked ones.
  RATCHET: passes both questions where the two backlog survivors still fail. Q1 the audience is "the
  next person to change this code" and today drift there ships a flag documented in two places and
  accepted in neither. Q2 it is a standing gate, not a one-time cleanup.
workflow: DIRECT Agent call, working tree, no branch (Workflow is review-gated in a headless -p
  session -- the documented failure-table fallback). model: sonnet. kind fix / effort S routes to
  sonnet by the table; attempts 0 so the ladder offered no escalation; gear 1's demotion rung never
  drops build/fix below sonnet. craft pack ran clean, degraded []. NOT craft:"ui" -- files_hint is
  test/cli.test.js + src/args.js, no UI surface -- so craft.ui was deliberately not spliced in.
gear: 1 | allocator trickle (allow_premium_pct 0, allow_overall_pct 0, dial 0.30), guest mode clamps
  1-3 | k_cap 1 | effective wave = min(k_current 5, gear cap 1, hard max 5) = 1 | probe: bin/swarm-budget.sh
  REFUSED a 31st time. rho, tokens/hour and projected depletion stay UNKNOWN and are never estimated;
  last_real_probe_ts stays 0 because a refused invocation is not a probe. Gear rests on
  runs/allocator.json (source=probe): posture trickle, week_elapsed_pct 69.61, weekly_used_pct 73.0
  -> weekly_heat 1.049 < 1.1, governor disengaged, ceiling 5; opus_used_pct 96 -> opus_heat 1.379
  > 1.2, promote stays blocked. week_resets_at 1786942799 is after stop_at 1786807947, so gear 1 is
  structural for the rest of the run.
  NEW KI-2 EVIDENCE, and it CONTRADICTS part of cycle 21's entry: `bin/swarm-notify.sh poll` SUCCEEDED
  this cycle, invoked bare-relative with cwd=/opt/swarm. Cycle 23 pinned the root cause as an
  allowlist that carries the relative and macOS-absolute forms of notify.sh but no /opt form and no
  swarm-budget.sh entry of any kind; this cycle is a clean positive confirmation of the notify.sh
  half of that diagnosis. The control channel was therefore read through its real path, not off disk.
control: poll ok; runs/control.json pending [] and inject [] -- nothing to apply, nothing to triage,
  no control-ack push warranted.
re-anchor: cycle 31, 31 % 5 != 0, so no full SPEC re-read or backlog hygiene pass this cycle
  (cycle 30 did both; backlog is 29 items, well under the ~30 live cap).

VERIFICATION EVIDENCE (T-128) -- full output .swarm/runs/cycle-031-verify-T-128.txt

      === BASELINE (unmutated builder diff) === exit=0
      M1 add flag to OPTIONS, docs stale ............. exit 1  BITES
      M2 remove flag from OPTIONS, docs advertise it .. exit 1  BITES
      M3 README row deleted only ..................... exit 1  BITES
      M4 HELP line deleted only ...................... exit 1  BITES
      M5 anti-vacuity: HELP header renamed ........... exit 1  BITES
      M6 anti-vacuity: OPTIONS anchor reformatted .... exit 1  BITES
      M7 -h alias dropped from HELP .................. exit 1  BITES
      M8 partial drift: OPTIONS+HELP renamed, README stale  exit 1  BITES
      M9 commented-out decoy entry (must stay GREEN) . exit 0  BITES
      === RESTORE === all 4 mutated files byte-identical to pre-battery; mutants misbehaving: 0
      === POST-GATE SUITE === exit 0   tests 119  pass 119  fail 0

  M8 is the mutant that decides the item, and it is the one the builder could not have anticipated:
  it renames `compact` to `terse` CONSISTENTLY in the two places a lazier gate would compare against
  each other -- OPTIONS and HELP -- leaving only README stale. A gate wired HELP<->README, or one
  that trusted HELP as the source of truth, passes M8 clean. This one failed on the README edge
  specifically. M2 is the direction the replaced hardcoded test was structurally blind to.
  M9 is the false-positive control: a source-text parser that is too eager reads
  `// ghost: { type: 'boolean' },` as a seventh registered flag and goes red on a file whose
  behaviour did not change. It stayed green. A gate shown only to fail has not been shown usable.
  READ HONESTLY: for M2 and M8 the FIRST error line in the run is a pre-existing --compact test
  dying, not the new gate -- both mutants change what the CLI accepts. What settles them is the
  separate check that greps the whole run for a string existing ONLY in the new test's assertion
  messages; both returned true. "exit=1" alone would not have proven the new gate fired, and is
  not claimed to.
  BEHAVIOUR FROZEN, machine-checked rather than eyeballed: src/args.js with comments and whitespace
  stripped is IDENTICAL to HEAD (and the raw files DO differ, so the comment genuinely changed);
  bin/moon.js, README.md and package.json are byte-identical to HEAD. Zero dependencies: the test
  requires only node: builtins plus two in-repo relative paths.
  THE OLD CHECK IS GONE, NOT STACKED: the hardcoded six-name array and its test name are both absent
  (grep -rn 'documents every flag' test/ -> no hits), and its exit-0 half was folded in and
  strengthened -- --help output must now equal the HELP constant byte-for-byte. One loose conductor
  probe ("any literal flag-name array") did fire; followed up rather than waved off, all four hits
  are pre-existing argv invocations like run(['--north', '--compact']), not restatements of the set.
  THREE PARSERS, LIVE OUTPUT: OPTIONS -> json south north block compact help; HELP -> json block
  compact south north help; README -> json block compact south north help. 6/6/6, set-equal.
  The -h alias was handled by DECISION rather than by omission: it is an alternate spelling of
  --help, not a seventh flag, so it is not a set member -- but both document parsers now REQUIRE
  the alias shape on the --help row and assert they saw it (M7 confirms that bites).

  collision-scan: NOT RUN, and not applicable -- the standing browser-target gate keys on classic
  non-module scripts served to a browser; moon is a stdout Node CLI with no html/css/client-js/
  template/static asset anywhere in the repo. Reported as not-run, never as passed.
  qa-verify look pass: same reason, not dispatched.

gate: T-128 PASS -> done. Zero merges (working tree, no branch), zero reverts, zero failed verifies.
wave autotune: clean k=1 wave -> wave_streak 1 -> 2 -> bump fires, but k_current is already at the
  hard max of 5, so it stays 5 and the streak resets to 0. Gear 1 caps the effective wave at 1
  regardless, so this changes nothing operationally.
DONE-declaration check: NOT yet, and the reason is narrower than last cycle's. The definition of
  done is met and the suite is green; the scan again returned a ratchet-passing candidate, so by
  cycle 30's own rule the space is not exhausted. But the cost moved: cycle 30 found its candidate
  on the first look, cycle 31 needed four probes for one hit. If the next scan comes back empty, or
  needs more probes than a cycle can honestly afford, DONE is the correct call rather than a
  concession. The standing handoff requirement carries to cycle 32.
known-issues: unchanged (KI-2 medium, KI-4 low, KI-5 medium, KI-7 low, KI-8 low). KI-2 gained the
  notify.sh positive-confirmation evidence recorded under `gear` above. KI-8 (no LICENSE file while
  package.json declares MIT with private:false) stays open and deliberately unfixed: the MIT text
  needs a copyright line naming a legal person, which is the repo owner's call and not one a build
  agent or the conductor may invent.
backlog: 29 items -- 27 done, 2 todo, 0 blocked. The two survivors (T-116 British 'colour' / '##
  Licence' heading; T-126 a drift note citing a comment line) both stay REJECTED by the ratchet and
  stay `todo` rather than `dropped`, on the cycle-21 reasoning: a human may still want them, and an
  empty queue is not an argument for building what the ratchet refuses.
