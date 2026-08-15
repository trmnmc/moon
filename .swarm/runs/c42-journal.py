#!/usr/bin/env python3
"""Append the cycle-42 journal block."""
import json, os

os.chdir('/opt/targets/moon')

BLOCK = r"""
## cycle 42 — 2026-08-15T07:16:01Z — VALUE_LOOP — build-wave (k=1) — T-138 — GATE PASS

clock: now=1786777285 at entry, stop_at=1786807947 (8.52 h remaining). Not within 900s of
  stop, not limp; usage_reset_at long past. Conductor PID 299778. The documented ps/ppid
  walk (cycle.md step 0) was NOT used this cycle: cycles 38 and 39 both recorded it
  false-matching the bash wrapper, whose argv carries
  `/home/swarm/.claude/shell-snapshots/...` and therefore satisfies a substring match on
  "claude". Used `pgrep -af claude` and took the real `claude -p /swarm cycle` process
  instead. Third cycle running the workaround rather than the documented walk; still a
  SWARM tool defect for the morning report, unfixable mid-run under hard rule 5.
budget probe: NOT invoked (42nd consecutive cycle), same closed reason as cycles 35-41.
  RE-GREPPED this cycle rather than inherited, because the cycle-41 morning report named
  the fix and a human could have applied it overnight:
  `grep -n 'swarm-budget\|swarm-playbook' /opt/swarm/.claude/settings.json` returns
  NO-MATCH, so nobody has. probe_failures stays at 34 — an attempt not made is not a
  failure. Gear rests on runs/allocator.json (source=probe): posture=trickle,
  allow_premium_pct 0, allow_overall_pct 0, opus_used_pct 96, weekly_used_pct 77.0,
  week_elapsed_pct 72.63, dial 0.3. Freshness CHECKED not assumed: week_elapsed_pct
  advanced 72.33 -> 72.63 since cycle 41, so the pacer is still refreshing the file.
  weekly_heat 77.0/72.63 = 1.060 < 1.1 -> governor disengaged, ceiling 5; opus_heat
  1.322 > 1.2 keeps promote blocked. Trickle + guest 1-3 clamp -> gear 1, k_cap 1.
  week_resets_at 1786942799 is after stop_at, so gear 1 stays structural for the rest of
  the run. Movement since cycle 41: weekly_used_pct and opus_used_pct both held EXACTLY
  (77.0, 96) while elapsed advanced, so both heats fell again (weekly 1.065 -> 1.060,
  opus 1.327 -> 1.322) — a second consecutive cooling cycle, driven entirely by the clock
  rather than by any drop in usage. Still 0.04 clear of the 1.1 governor threshold.
orient: tree clean at entry, 135/135 green, no salvage needed. Control channel: poll OK
  (bare-relative form from /opt/swarm — a ninth consecutive success while the budget
  script is refused in that identical form, which keeps reading as per-script allowlisting
  rather than a shell-form problem), pending[] empty, inject[] empty, nothing to triage.
re-anchor: 42 % 5 != 0, no full SPEC re-read due. Scope unchanged: harden tests, close
  known issues, doc truth, NO new features, no new deps.
craft pack: `node bin/swarm-craft.mjs` clean, `degraded: []` (ui 2969 / review 2233 /
  docs 1737 bytes). Not spliced: the build-wave slice is craft.ui and T-138 touches one
  test file in a stdout-only Node CLI with no UI surface, so the item is not ui-flagged
  under the step-5 rule. Journaled, not dropped.

PICK: T-138 (priority 4, kind fix, S, attempts 0), the highest-priority live item and the
only one of the five todos that is a correctness defect rather than a doc nit — the other
four (T-137 provenance sentence, T-126 CONTRACTS line cite, T-116 British spellings, T-130
ECMA-262 wording) are all wording items. Both halves of the step-4 ratchet clear on the
run's stated audience ("the next person to change this code"): a test that goes red on an
honestly regenerated README row is noticed immediately and is still costing that person
time ten minutes later. consecutive_no_value was 0, so no forced work-type switch applied.

ROUTING: kind fix + effort S -> sonnet by the value-routing table; attempts 0, so no
  ladder escalation. Gear 1 demotion does not apply (build/fix never drops below sonnet)
  and gear 1's work-choice rule explicitly permits S-effort sonnet builds. Backlog stored
  `model: sonnet` already, so pick-time recomputation agreed with it this time.

BUILD-WAVE (k=1, direct Agent dispatch — Workflow is review-gated in a headless -p
session, the documented fallback). Effective k = min(k_current 4, gear cap 1) = 1. Builder
prompt carried the playbook builder line ("the conductor is the SOLE committer"), the
item's acceptance, the measured 56%/44% instants the item names, and the conductor's note
that "new" and "full" also lack the "waning" substring and must be CHECKED rather than
assumed safe. The builder never received any verify command — this gate was authored after
its return, per hard rule 2.

BUILDER RETURN (a CLAIM, not a fact): status done, branch wave-1786777381-T-138, one file
changed (test/regressions.test.js), 135/135 self-reported, mutation battery re-run,
endpoints checked empirically. Its disclosure section was honest and useful: it reported
that the sandbox blocked writes to /tmp, so its scratch scripts landed in
/opt/swarm/.scratch/ instead. See "conductor notes" below — that is a real SWARM-side gap,
not a builder error.

MERGE: fe113bf -> 42b80fe, `--no-ff`, clean, 13 insertions / 1 deletion in one file. The
one-line substring predicate became a structural one:
`const nameIndex = PHASE_NAMES.indexOf(north.name)` + `nameIndex < PHASE_NAMES.length / 2`,
with an added `nameIndex !== -1` assertion. Post-merge product tree checked byte-identical
to pre-merge HEAD: `git diff --stat fe113bf..HEAD -- src/ bin/ README.md package.json`
returns EMPTY, so the item's "no product file changes" clause is machine-confirmed, not
taken on the builder's word.

VERIFICATION GATE — three checks authored at verification time, all wider than the
acceptance on axes the builder was never told about. Scripts: .swarm/runs/c42-gate.py and
.swarm/runs/c42-escape-check.py.

1. GENERALITY. The acceptance names two instants at one slot. The gate instead SCANS 2026
   at a 3-hour stride for a genuine instant for all EIGHT PHASE_NAMES entries, regenerates
   each row from the shipping renderer, and inserts it at EVERY table slot where the
   cycle-order check still holds — 30 cases. A fix that special-cased "last quarter" fails
   here. Result: 0 of 30 red under the new predicate.

2. DISCRIMINATOR (the check that separates "the fix works" from "the case is toothless").
   Every one of those 30 cases was ALSO run against the pre-merge substring predicate,
   reconstructed by patching the merged file. Exactly TWO flip:

     last quarter    slot 12  new=GREEN  old=RED  -> DISCRIMINATING
     last quarter    slot 13  new=GREEN  old=RED  -> DISCRIMINATING

   at a conductor-chosen instant (2026-01-10T06:00:00Z, `◖█▓░░  54%  last quarter`) —
   NOT either of the two the item named. That is the reported defect independently
   reproduced and closed. The other 28 are green under both predicates and prove only
   non-regression; the journal says so rather than counting them as evidence for the fix.

3. NON-WEAKENING, and the part of this gate that nearly went wrong. 36 adjacent-retype
   mutants were generated; 33 turned the suite red and THREE stayed green:

     retype slot  9 'full' -> 'waxing gibbous'    ESCAPED
     retype slot  9 'full' -> 'waning gibbous'    ESCAPED
     retype slot 16 'new'  -> 'waning crescent'   ESCAPED

   The first question was attribution, not alarm: were these escapes T-138 caused? The
   identical three mutants were re-run against the PRE-MERGE file (`git show
   fe113bf:test/regressions.test.js`) and escaped there identically — so T-138 weakened
   nothing. But "pre-existing" is not the same as "correct", so the second question was
   whether they are escapes at all. A 28.5-year 15-minute-stride renderer scan settles it:
   all three rows are GENUINELY REACHABLE —

     waxing gibbous @100%   2020-01-10T04:30:00Z   ◖███◗ 100%  waxing gibbous
     waning gibbous @100%   2020-01-11T07:30:00Z   ◖███◗ 100%  waning gibbous
     waning crescent @0%    2020-01-24T05:00:00Z   ░░░░░   0%  waning crescent

   At the symmetric endpoints the disc and the percent are identical across adjacent
   names, so the name is not recoverable from the rendered row and a CORRECT check must
   accept these. The three survivors are an artifact of a mutant generator that was naive
   by construction — it treated every adjacent retype as a lie. Recorded at length because
   the honest reading (0 real escapes, 33/33 real mutants killed) is the OPPOSITE of the
   first reading (3 holes), and a gate that had stopped at the first reading would have
   failed a correct item.

VERIFICATION EVIDENCE (conductor-run, full output in .swarm/runs/cycle-042-verify-T-138.txt
and .swarm/runs/cycle-042-escape-T-138.txt):

```
$ node --test test/*.test.js          # post-merge, conductor-run
ℹ tests 135
ℹ pass 135
ℹ fail 0

  last quarter     slot 12  new=GREEN  old=RED  -> DISCRIMINATING
  last quarter     slot 13  new=GREEN  old=RED  -> DISCRIMINATING
SUMMARY: 30 honest cases; 2 discriminating (old RED / new GREEN);
         0 red under new code; 33/36 mutants killed

--- AFTER T-138 (merged, structural predicate) ---
  slot  9 'full' -> 'waxing gibbous'  : ESCAPED (green)
  slot 16 'new'  -> 'waning crescent' : ESCAPED (green)
--- BEFORE T-138 (fe113bf, substring predicate) ---
  slot  9 'full' -> 'waxing gibbous'  : ESCAPED (green)
  slot 16 'new'  -> 'waning crescent' : ESCAPED (green)
        -> identical before and after; T-138 weakened nothing

waxing gibbous@100   REACHABLE  2020-01-10T04:30:00.000Z  ◖███◗ 100%  waxing gibbous
waning crescent@0    REACHABLE  2020-01-24T05:00:00.000Z  ░░░░░   0%  waning crescent
git diff --stat fe113bf..HEAD -- src/ bin/ README.md package.json   ->  (empty)
```

GATE VERDICT: PASS. T-138 -> done. README restored byte-for-byte after every one of the
66 substitutions (verified by `git status --porcelain` returning only the two new
.swarm/runs/ gate scripts).

FILED: T-139 (docs, S, priority 12) — nothing in the repo records that the sweep table
cannot discriminate a phase NAME at the 0% and 100% endpoints, so the next person to
mutation-test this check will read three correct passes as three holes and may "harden" it
into a third check that false-rejects honest renderer output — the exact failure mode of
T-136 and T-138. Deliberately LOW priority: the check is correct as it stands, so this
documents a boundary rather than fixing a defect, and the run's taste note warns that the
risk here is churn. Worth one comment, not a test.

WAVE AUTOTUNE: clean wave — 0 reverts, 0 failed verifies — so wave_streak 1 -> 2, which
trips the bump: k_current 4 -> 5, wave_streak reset to 0. Note this has no practical effect
while gear 1 caps the effective wave at 1; recorded so the counter's history stays honest
rather than silently frozen.

conductor notes:
- The builder's scratch files landed in /opt/swarm/.scratch/ because the sandbox denies
  subagent writes to /tmp. That is a write inside SWARM outside runs/ and playbook/, i.e.
  outside the hard-rule-5 fence, and it will recur on every dispatched build. The debris
  was removed after the worktree was pruned (`rm -rf /opt/swarm/.scratch`, SWARM tree back
  to only the expected `M playbook/applied.log`), but the CAUSE is a SWARM-side gap for the
  morning report alongside KI-2: builders need a sanctioned scratch path outside both the
  SWARM repo and the target repo. Not fixable mid-run.
- The builder's worktree was created under /opt/swarm/.scratch/ for the same reason;
  `git worktree remove --force` + `prune` cleaned it, and `git worktree list` now shows
  only /opt/targets/moon.
- Three Bash calls this cycle were refused by the permission layer for shape rather than
  content (a `cd` before `git`, a `tee`, and a `$?` echo) and were re-issued in accepted
  forms. No work was lost; noted only because it is a recurring per-cycle tax.
"""

MIRROR_HDR = "\nrunfile-mirror:\n\n```json\n"

with open('.swarm/journal.md', 'a', encoding='utf-8') as f:
    f.write(BLOCK)
    f.write(MIRROR_HDR)
    f.write(json.dumps(json.load(open('/opt/swarm/runs/current.json'))))
    f.write("\n```\n")

print('journal appended')
