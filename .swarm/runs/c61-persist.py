#!/usr/bin/env python3
"""cycle 61 persist: state.json + backlog.json + runfile + journal block."""
import json, os

NOW = 1786903989
ISO = "2026-08-16T18:13:09+00:00"
CYCLE = 61
T = "/opt/targets/moon"
RF = "/opt/swarm/runs/current.json"


def atomic(path, obj):
    tmp = path + ".tmp"
    with open(tmp, "w") as f:
        json.dump(obj, f, indent=1)
        f.write("\n")
    os.replace(tmp, path)


# ---------- backlog ----------
b = json.load(open(T + "/.swarm/backlog.json"))
for i in b["items"]:
    if i["id"] == "T-150":
        i["status"] = "done"
        i["notes"] += (
            " | CLOSED cycle 61: haiku builder changed exactly one line (REPORT.md:212, "
            "'# 145 tests' -> '# 147 tests'). Conductor gate ran a programmatic discriminator: "
            "parse the claimed count out of REPORT.md and compare it to the count a FRESH "
            "`node --test test/*.test.js` actually emits -- 147 == 147 -- plus an assertion that "
            "the three historical lines (:6, :55, :142) still carry their original 145 text. "
            "git diff --numstat was 1/1 on REPORT.md alone, so the no-other-line-changes clause "
            "is proven by the diff itself, not by the builder's word."
        )
atomic(T + "/.swarm/backlog.json", b)
counts = {}
for i in b["items"]:
    counts[i["status"]] = counts.get(i["status"], 0) + 1
print("backlog:", counts)

# ---------- state ----------
s = json.load(open(T + "/.swarm/state.json"))
s["cycle"] = CYCLE
c = s["counters"]
c["consecutive_no_value"] = 0          # verified value this cycle
c["consecutive_failures"] = 0
c["wave_streak"] = 0                    # hit 2 -> consumed
c["k_current"] = 5                      # autotune: clean wave, streak 1 -> 2 -> k+1 (cap 5)
s["qa"]["last_build_wave_cycle"] = CYCLE
atomic(T + "/.swarm/state.json", s)
print("state: cycle", s["cycle"], "counters", c)

# ---------- runfile ----------
r = json.load(open(RF))
r["heartbeat"] = {"ts": NOW, "next_wakeup_at": NOW + 90, "pid": 1253910,
                  "limp": False, "degraded_tiers": []}
bud = r["budget"]
bud["source"] = "clock"
bud["gear"] = 1
bud["gear_target"] = 1
bud["ratio"] = 0
bud["mode"] = "guest"
bud["k_cap"] = 1
bud["promote"] = False
bud["demote"] = True
bud["last_probe_ts"] = NOW
bud["last_real_probe_ts"] = NOW          # a REAL probe WAS attempted this cycle
bud["probe_failures"] = 8                # ...and was denied -> failure
bud["gear_evidence"] = (
    "cycle 61: a REAL probe WAS due (now 1786903816 - last_real_probe_ts 1786900855 = 2961 s >= 1800) "
    "and WAS attempted: bin/swarm-budget.sh, tried three ways (with RUNFILE= env prefix, bare path, "
    "and plain invocation) -- all three DENIED by the Bash allowlist (KI-2, unchanged). That is a real "
    "probe failure, so probe_failures 7 -> 8 and last_real_probe_ts is advanced to 1786903989; next real "
    "re-attempt due 1786905789. Gear 1 held on fresh disk evidence read directly from runs/allocator.json: "
    "posture trickle, weekly_used_pct 100.0, opus_used_pct 97, week_elapsed_pct 93.55 (up from 93.24 last "
    "cycle, so the file is live), allow_overall_pct 0, allow_premium_pct 0, dial 0.30, source probe. "
    "week_resets_at 1786942799 == stop_at, so there is no later richer window to save for. Guest clamps 1-3; "
    "gear 1 caps the effective wave at 1, which is what ran. runs/control.json read directly (swarm-notify.sh "
    "poll is denied by the same gap): pending [], applied [], no inject array -- nothing to apply or triage."
)
w = bud["weekly"]
w["week_elapsed_pct"] = 93.55
w["ceiling"] = None
w["note"] = (
    "ceiling stays null because bin/swarm-budget.sh still cannot run (KI-2), so no governor ceiling was "
    "emitted this cycle either. Gear 1 rests on the allocator posture, not on the weekly governor."
)
r["cycles_since_recycle"] = 13
atomic(RF, r)
with open("/opt/swarm/runs/current.json.bak", "w") as f:
    json.dump(r, f, indent=2)
    f.write("\n")
print("runfile: probe_failures", bud["probe_failures"], "cycles_since_recycle", r["cycles_since_recycle"])

# ---------- journal ----------
mirror = dict(r)
mirror["artifact"] = {k: v for k, v in r["artifact"].items() if k != "url"}
block = """
## cycle {c} | {iso} | moon | VALUE_LOOP
work: build-wave k=1 (effective wave = min(k_current 4, gear cap 1, hard max 5) = 1) -- item T-150,
the last output-cited doc claim in the run's must-have sweep that T-147/T-148 stepped over. Dispatched
as a DIRECT Agent call, not Workflow: this is a pacer-spawned `claude -p` session (ancestry walk:
bash -> `claude -p /swarm cycle --output-format json --permission-mode acceptEdits --add-dir
/opt/targets/moon` pid 1253910 -> bin/swarm-pacer.sh), and Workflow is review-gated headless -- the
documented failure-table fallback. k=1 means the disjoint-file-scope requirement is met by construction.
budget: gear 1 (guest, clamp 1-3) | REAL probe attempted and DENIED (KI-2) -> probe_failures 7 -> 8,
last_real_probe_ts advanced to {now} | allocator.json posture trickle, weekly_used_pct 100.0,
opus_used_pct 97, week_elapsed_pct 93.55 (live: 93.24 last cycle) | tokens/hour and projected depletion
remain unavailable -- no probe has produced burn evidence since the allowlist gap opened, and this cycle
does not pretend otherwise.
control: bin/swarm-notify.sh poll DENIED by the same allowlist gap; runs/control.json read directly --
pending [], applied [], no inject array. Nothing to apply, nothing to triage.
craft pack: node bin/swarm-craft.mjs ran clean, degraded [] -- craft.docs lines passed to the builder.
routing: T-150 is kind docs / effort S -> haiku per the routing table; attempts 0 so no ladder escalation,
and gear-1 demotion cannot push docs below haiku. No judgment seat was involved, so the fable guard is
not in play.
pick rationale: two todo items, both S-effort docs, and the gear caps the wave at ONE. T-151 carries the
lower priority NUMBER (6 vs 7), but cycle.md makes value scoring -- not the priority field -- the authority
in VALUE_LOOP, and the two items are not the same kind of thing: T-150 repairs a statement that is FALSE
against the current tree and sits inside a SPEC must-have ("every line-cited and output-cited doc claim
re-verified"), while T-151 improves the clarity of a section that is already true and is SPEC nice-to-have
#2. A falsehood in a shipped doc outranks a clarity gain. T-151 stays todo at priority 6 and is next.
VERIFICATION EVIDENCE (conductor-run, authored at gate time -- the builder never saw these checks):
  1. scope, from the diff itself rather than from the builder's word:
     git -C /opt/targets/moon diff --numstat   -> "1	1	REPORT.md"
     git diff -U0 -> one hunk, @@ -212 +212 @@
       -node --test test/*.test.js    # 145 tests
       +node --test test/*.test.js    # 147 tests
  2. the discriminator (an observable a stale-or-guessed edit could not produce): parse the count OUT of
     REPORT.md and compare it to what a fresh suite run actually emits, rather than to a remembered 147 --
     node -e '...' ->
       "REPORT.md:212 claims 147 | fresh suite run reports 147 | MATCH true"
       "historical lines intact -> :6 true | :55 true | :142 true"
     The second line is the anti-falsification arm: it asserts the three run-scoped 145 statements
     (:6 cycles 0-47, :55 at-cycle-47, :142 green-at-the-time) STILL read 145. Agreeing with today's
     number there would have been the failure mode, not the fix.
  3. full test_cmd, conductor-run: node --test test/*.test.js
       -> "tests 147 / pass 147 / fail 0 / skipped 0 / todo 0"   GREEN
post-merge checks: SKIPPED, with reason -- the merged file is REPORT.md, markdown documentation. moon is a
zero-dependency terminal CLI with no browser-served surface, so the build-wave's user-visible heuristic
(html/css/client-js/template/static asset) does not fire: no collision-scan, no qa-verify look pass.
Recorded as not-run, not as passed.
gate: T-150 PASS -> done. Backlog 51 done / 1 todo (T-151).
wave autotune: the wave was CLEAN (zero reverts, zero failed verifies) -> wave_streak 1 -> 2 -> at 2,
k_current 4 -> 5 and wave_streak resets to 0. Note this is bookkeeping with no near-term effect: gear 1
caps the effective wave at 1 for as long as the trickle posture holds.
outcome: 1 item verified done. counters.consecutive_no_value 1 -> 0 (verified-value cycle).
""".format(c=CYCLE, iso=ISO, now=NOW)

with open(T + "/.swarm/journal.md", "a") as f:
    f.write(block)
    f.write("runfile-mirror:\n```json\n")
    f.write(json.dumps(mirror, separators=(",", ":")))
    f.write("\n```\n")
print("journal appended")
