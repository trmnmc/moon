
## cycle 49 | 2026-08-16T13:48:11Z | moon | PLAN → BUILD

pacing: gear 1 (crawl), guest mode (clamps 1–3), dial 0.30, effective wave cap k=1.
`bin/swarm-budget.sh` was DENIED again — KI-2, unchanged since kickoff: the allowlist in
`.claude/settings.json` carries `Bash(bin/swarm-notify.sh:*)` and a macOS absolute path for the
same script, but no entry in EITHER form for `swarm-budget.sh` or `swarm-playbook.sh`. So
`probe_failures` goes 1 → 2 and `source` stays `clock`.

That is a probe failure, and the failure table's default for one is clock-fallback CRUISE
(gear 3). Gear 1 is being held instead, and the reason is that cruise-by-default is the
*evidence-free* fallback while better evidence exists on disk: `runs/allocator.json` and
`runs/allocator-state.json`, both stamped `1786887824` — eight seconds before this cycle's
clock — read `weekly_used_pct 98.0`, `opus_used_pct 97`, `week_elapsed_pct 90.91`, posture
`trickle`, `allow_overall_pct 0`, `allow_premium_pct 0`. The binding constraint is absolute
headroom, not heat: ~2% of the weekly envelope remains, and `week_resets_at 1786942800` is
`stop_at`, so there is no later, richer window to save for. Taking gear 3 here on a
technicality would burn a 2%-remaining envelope against the allocator's own explicit 0%
allowance. Crawl WITH evidence, per the step-1 evidence rule.

control: poll ok (exit 0, `bin/swarm-notify.sh poll` invoked relatively from `/opt/swarm`,
which is the form that matches the allow entry). 0 pending, 0 applied, no `inject` array.
Nothing to triage.

orient: tree clean at entry, no salvage needed. cycle 49 is not a re-anchor cycle (49 % 5 = 4).
craft pack ran clean — `degraded: []`.

### Cycle 49 work

Phase gates: DESIGN satisfied (92 decisions on record), PLAN satisfied at cycle 48 (every
must-have has a live item), must-have items remain todo → BUILD. Phase advanced PLAN → BUILD.

Picked **T-116** (priority 1, kind polish, effort S, model haiku) — the highest-priority live
item, spec-mandated by MH3 ("T-116/T-130/T-139 resolved or refused WITH EVIDENCE"), and
haiku-priced, which is exactly the gear-1 work class.

Dispatched as ONE DIRECT Agent call, not a Workflow: this is a `-p` headless session, where the
Workflow tool is review-gated, and the documented fallback is direct Agent dispatch. With k=1
there is no concurrency to isolate, so the builder edited the working tree directly and the
conductor verified and committed — no branch, no merge step. The builder carried the playbook
`prompt_lines.builder` line (sole-committer) and two craft `docs` lines; the full 27-line craft
`ui` pack was deliberately NOT loaded, since a two-word spelling fix on a terminal CLI has no UI
surface and gear 1 does not spend tokens on inapplicable context.

The builder was given the acceptance and the scope fence, and NOT the check — hard rule 2.

### VERIFICATION EVIDENCE — T-116

Gate authored by the conductor at verification time, five checks. The builder never saw any of
them, so it cannot have coded to them.

    1. git status --porcelain
       ` M README.md`                                    <- exactly one file, PASS

    2. git diff --stat
       ` README.md | 4 ++--`
       ` 1 file changed, 2 insertions(+), 2 deletions(-)`  <- exactly two lines, PASS

    3. git diff (both hunks, verbatim)
       -- No emoji, no colour themes, no config file.
       +- No emoji, no color themes, no config file.
       -## Licence
       +## License                                        <- exactly the two targets, PASS

    4. grep -n -i 'colour|licence' README.md
       (no lines)                                         <- zero residual, PASS
       grep -n 'color themes' README.md   -> 193:- No emoji, no color themes, no config file.
       grep -n '^## License' README.md    -> 227:## License
                                                          <- US forms at the TRUE lines, PASS

    5. grep -n 'centre' src/astro.js src/render.js
       src/astro.js:38   ~24 h centred on the instant, ...
       src/astro.js:239  equation of centre -- i.e. a real Moon-minus-Sun longitude ...
       src/render.js:45  Odd, so the disc has a centre column.
                                                          <- terms of art untouched, PASS

    test_cmd: node --test test/*.test.js
       tests 145 / pass 145 / fail 0 / cancelled 0 / skipped 0 / todo 0   PASS
       (baseline before the change, same command: 145 / 145 / 0 — unchanged)

Check 5 is the discriminator, and it is worth naming why it is not redundant with check 1. The
risk on a "fix the British spellings" item is not that the builder fails to change README — it
is that the builder helpfully sweeps `centre` out of `src/` too, where "equation of centre" is
Meeus's term of art and "centre column" is geometry, not a Briticism. Check 1 already proves
`src/` was untouched; check 5 proves the specific tokens that a plausible over-reach would have
eaten are still there, which is the observable an over-eager pass could not produce.

The suite is 145/145 both before and after, which for a README-only change is a null result by
construction — recorded as *unchanged*, not as evidence the item works. The greps are what
verify this item; the suite only proves nothing else broke.

T-116 → **done**. Not counted as a test added: no test was added, and this run's spec is
explicit that test COUNT is never an outcome.

### Follow-on recorded, deliberately NOT filed as a new item

Landing T-116 falsified two prose claims in the shipped `REPORT.md`:

- `REPORT.md:122` closes the KI-8 row with "Adjacent: T-116 notes README's `## Licence` heading
  disagrees with `package.json`'s spelling." The heading now agrees, so the clause is false.
- `REPORT.md:144-147` opens "Three backlog items remain `todo`" and lists T-116 as
  ratchet-rejected at cycles 20/21/22/47. T-116 is done, so both the count and the entry are wrong.

This is the T-112 pattern (landing one item made another file's prose false) and the reflex is to
file a fix item. That reflex was declined. WRAP_UP regenerates `REPORT.md` from the template, so
a dedicated build cycle to hand-patch prose that is about to be overwritten is churn — and this
run's own taste line names churn wearing rigor's clothes as THE risk. The claims are instead
folded into T-147's notes, which is the item that re-verifies README/CONTRACTS/REPORT claims, with
an explicit marker that they are prose claims rather than line-number citations and so were not
already inside its scope. Nothing is lost; no cycle is spent twice.

KI-8 itself (no `LICENSE` file at the repo root while `package.json` declares MIT) remains OPEN
and untouched, exactly as scoped: the MIT body needs a copyright line naming a legal person, and
neither a build agent nor the conductor may invent one. Owner action.

### Wave autotune

Wave was CLEAN — 0 reverts, 0 failed verifies. `wave_streak` 1 → 2, which fires the promote rule;
`k_current` is already at the hard max 5, so it stays 5 and the streak resets to 0. Gear 1 caps
the effective wave at 1 regardless, so `k_current` is bookkeeping tonight, not a live lever.

### Tension noted for RETRO (not acted on)

T-116, T-130 and T-139 are three haiku-priced docs items with pairwise-disjoint file scopes
(`README.md` / `test/astro.test.js` / `test/regressions.test.js`) — a textbook k=3 wave. Gear 1
caps the wave at 1, so they cost three separate conductor cycles instead of one dispatch. On a
2%-remaining envelope the conductor's own per-cycle overhead is plausibly larger than the three
haiku builders combined, which means the gear cap may be optimizing the wrong term: it models
agent burn, not orchestration burn. The cap was HONORED, not bent — this is a candidate lesson
for the WRAP_UP distillation, not a live deviation.

backlog: 49 items, 8 todo, 41 done.
next pick (cycle 50): T-130 at priority 2 (S, docs, haiku) — the ECMA-262 `Math.sin`/`Math.cos`
nondeterminism wording nit, second of the three MH3 items.
