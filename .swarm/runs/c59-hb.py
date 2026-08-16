import json, os

p = '/opt/swarm/runs/current.json'
r = json.load(open(p))
now = 1786900855
r['heartbeat'] = {"ts": now, "next_wakeup_at": now + 2700, "pid": 1248519,
                  "limp": False, "degraded_tiers": []}
b = r['budget']
b['source'] = 'clock'
b['gear'] = 1
b['gear_target'] = 1
b['ratio'] = 0
b['mode'] = 'guest'
b['k_cap'] = 1
b['promote'] = False
b['demote'] = True
b['last_probe_ts'] = now
b['last_real_probe_ts'] = now
b['probe_failures'] = 7
b['gear_evidence'] = (
    "cycle 59: a REAL probe WAS due (now 1786900855 - last_real_probe_ts 1786898052 = 2803 s >= 1800), "
    "so RUNFILE=... bin/swarm-budget.sh was invoked -- and DENIED by the Bash allowlist "
    "(KI-2, 12th consecutive cycle since 48). That is a due attempt that failed, so probe_failures 6 -> 7 "
    "and last_real_probe_ts advances to now; next real re-attempt due 1786902655. Gear 1 held on fresh disk "
    "evidence, not on the denial: runs/allocator.json reads weekly_used_pct 100.0, opus_used_pct 97, "
    "week_elapsed_pct 93.06 (up from 92.74 last cycle, so the file is live), posture trickle, "
    "allow_overall_pct 0, allow_premium_pct 0, dial 0.30, source probe. week_resets_at 1786942799 == stop_at "
    "exactly, so no later richer window exists to save for. Guest clamps 1-3."
)
b['weekly'] = {
    "ok": True,
    "weekly_used_pct": 100.0,
    "opus_used_pct": 97,
    "week_elapsed_pct": 93.06,
    "weekly_heat": round(100.0 / 93.06, 3),
    "opus_heat": round(97 / 93.06, 3),
    "ceiling": None,
    "promote_blocked": True,
    "note": ("ceiling is null because bin/swarm-budget.sh did NOT run (KI-2): no governor ceiling was emitted. "
             "Prior cycles carried ceiling 1, a value the script cannot produce (corrected at cycle 6 in prose "
             "but never in the field). Gear 1 rests on the allocator posture, not on the weekly governor.")
}
json.dump(r, open(p + '.tmp', 'w'), indent=2)
os.replace(p + '.tmp', p)
print("heartbeat", json.dumps(r['heartbeat']))
print("probe_failures", b['probe_failures'], "weekly_heat", b['weekly']['weekly_heat'])
