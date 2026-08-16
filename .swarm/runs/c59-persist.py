import json, os

TARGET = '/opt/targets/moon'
NOW = 1786901309

# ---------- backlog ----------
bp = TARGET + '/.swarm/backlog.json'
b = json.load(open(bp))
for i in b['items']:
    if i['id'] == 'T-148':
        i['status'] = 'done'
        i['notes'] += (
            "\n[cycle 59] PASSED on attempt 2. Builder applied the historical Espenak/Meeus "
            "1986-2005 DeltaT polynomial (dT = 58.548 s at 1992 Apr 12.0, in-domain) rather than "
            "src/astro.js's own 2005-2050 deltaTDays() extrapolated 13 years out (dT = 60.765 s), "
            "and both committed figures reproduced exactly: illum 0.6801, age-derived fake 0.6475. "
            "REPORT.md NOT edited -- the correct outcome. Conductor gate ran two independent parts: "
            "(1) a DeltaT ROBUSTNESS SWEEP showing the pair holds for every dT in [48, 80] s, so the "
            "figure never depended on which DeltaT anyone picked; (2) a PATH-INDEPENDENCE mutation "
            "battery (M1 elongation +0.01 deg -> illum moves, fake holds; M2 age +0.01 d -> fake "
            "moves, illum holds) proving the row's actual claim, that the two figures travel "
            "independent paths. Evidence: .swarm/runs/c59-gate-48a.js, c59-gate-mutants.js, "
            "cycle-059-verify-T-148.md."
        )
        break
else:
    raise SystemExit('T-148 not found')
counts = {}
for i in b['items']:
    counts[i['status']] = counts.get(i['status'], 0) + 1
json.dump(b, open(bp + '.tmp', 'w'), indent=1)
os.replace(bp + '.tmp', bp)
print('backlog:', counts)

# ---------- state ----------
sp = TARGET + '/.swarm/state.json'
s = json.load(open(sp))
s['cycle'] = 59
s['qa']['last_build_wave_cycle'] = 59
c = s['counters']
c['consecutive_no_value'] = 0
c['consecutive_failures'] = 0
c['wave_streak'] = 1          # clean wave: 0 reverts, 0 failed verifies
# k_current unchanged at 4 -- streak must reach 2 before it bumps
s['last_cycle'] = {
    'cycle': 59,
    'work': 'build-wave k=1 (T-148 retry, S/qa, sonnet) -- regenerate Meeus 48.a figure in the TD frame',
    'outcome': 'verified-value: T-148 PASSED, REPORT.md correctly left unedited, backlog empty',
}
s['decisions'].extend([
    {
        'cycle': 59,
        'what': ("the gate's decisive check was a DELTA-T ROBUSTNESS BAND, not a re-derivation at the "
                 "builder's chosen DeltaT: the committed pair 0.6801/0.6475 holds for every dT in "
                 "[48, 80] s, which makes the figure independent of the judgement call the item forced."),
        'why': ("Cycle 58 settled this figure using dT = 58.3 s (published historical) and the retry "
                "builder independently chose 58.548 s from a different, better-scoped polynomial. Had my "
                "gate simply re-derived at the builder's DeltaT it would have confirmed the builder's "
                "ARITHMETIC, not the FIGURE -- and the item's whole failure mode at attempt 1 was a frame "
                "choice, not arithmetic. Sweeping dT from 40 to 80 s in 0.1 s steps converts 'the number is "
                "0.6801 given dT = 58.3' into 'the number is 0.6801 unless DeltaT for 1992 was below ~48 s', "
                "which is a claim about the module rather than about anyone's constant. The two defensible "
                "candidates sit 10.3 s and 12.8 s inside the band's lower edge. Generalizable: when a "
                "published figure depends on a chosen parameter, the gate should measure the parameter's "
                "tolerance rather than re-run the choice.")
    },
    {
        'cycle': 59,
        'what': ("the builder's NASA citation for the 1986-2005 DeltaT polynomial is recorded as UNVERIFIED "
                 "and was deliberately kept OUT of the load-bearing path of the gate, rather than accepted "
                 "on trust or used to fail the item."),
        'why': ("The capture cites eclipse.gsfc.nasa.gov for the coefficients. This run has no network and "
                "the MCP fence forbids fetching, so neither the URL nor the coefficients can be checked from "
                "disk -- and this is a run whose entire premise is that a claim nobody ran is not evidence. "
                "Failing the item over an uncheckable reference would have been wrong too: the reference is "
                "not what the REPORT row asserts. The resolution is structural rather than rhetorical -- the "
                "robustness band means the verdict survives ANY DeltaT in a 32-second window, so a "
                "misremembered coefficient cannot change it unless it were off by more than 10 s, and it is "
                "not: the cited polynomial lands 2.2 s from src/astro.js's own independently-authored "
                "polynomial, which is corroboration from a second source already in the repo. Recorded so "
                "the morning report never reads that URL as something the run checked.")
    },
    {
        'cycle': 59,
        'what': ("gate part 2 mutated the ch.48 and ch.49 paths ONE AT A TIME, because the REPORT row's "
                 "claim is not 'the number is 0.6801' but 'illumination is true elongation, not faked from "
                 "age'. M1 (+0.01 deg elongation): illum moves, fake holds. M2 (+0.01 d age): fake moves, "
                 "illum holds. src/astro.js restored byte-identical (md5 checked)."),
        'why': ("Reproducing a figure proves the probe computed something; it does not prove WHICH machinery "
                "computed it, and a probe printing two hardcoded constants would have passed part 1 "
                "perfectly. Perturbing each path in isolation and requiring the OTHER figure to hold is the "
                "discriminator: a figure that does not move under its own path's mutation is not produced by "
                "that path. It also produced the cycle's sharpest incidental finding -- M1's 0.01 deg "
                "elongation error yields exactly 0.6802, the SAME visible 4-dp artifact as attempt 1's ~58 s "
                "frame error. Two unrelated defects share one signature at 4 dp, which is precisely why "
                "cycle 58 was right that this figure has to be reasoned about in its frame rather than "
                "eyeballed against the book (whose own 0.6786 discriminates between neither).")
    },
    {
        'cycle': 59,
        'what': ("the backlog is now empty (50/50 done) and the target was still NOT declared DONE; cycle 60 "
                 "runs an explicit VALUE_LOOP candidate scan first."),
        'why': ("Same rule cycles 26 and 27 established and cycle 27 then vindicated: an EMPTY QUEUE IS NOT "
                "AN EXHAUSTED VALUE SPACE. Cycle 27 ran the scan off an all-but-drained backlog and found "
                "T-123, a real false figure in README and REPORT that no backlog row had ever captured. The "
                "asymmetry is unchanged -- declaring done sets the target's status to done, rotation finds no "
                "active target, and WRAP_UP fires immediately, discarding the 11.5 h remaining to stop_at on "
                "an unexamined premise; deferring costs one gear-1 cycle, and a candidate scan is planning "
                "work, which gear 1 permits.")
    },
])
json.dump(s, open(sp + '.tmp', 'w'), indent=1)
os.replace(sp + '.tmp', sp)
print('state: cycle', s['cycle'], 'counters', json.dumps(s['counters']))
