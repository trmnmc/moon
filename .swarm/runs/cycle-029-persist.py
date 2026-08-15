#!/usr/bin/env python3
"""Conductor persist for cycle 29: backlog + state, each written .tmp then renamed."""
import json
import os
import pathlib

SW = pathlib.Path('/opt/targets/moon/.swarm')


def atomic(path, obj):
    tmp = path.with_suffix(path.suffix + '.tmp')
    tmp.write_text(json.dumps(obj, indent=1, ensure_ascii=False) + '\n')
    os.replace(tmp, path)


# ---------------------------------------------------------------- backlog
bl = json.loads((SW / 'backlog.json').read_text())
items = {i['id']: i for i in bl['items']}

t125 = items['T-125']
t125['status'] = 'done'
t125['verified_cycle'] = 29
t125['evidence'] = (
    '.swarm/runs/cycle-029-verify-T-125.txt -- 30 conductor checks, 0 failed. Decisive check '
    'C2: the HEAD file survives as an exact BYTE PREFIX of the new file (3293 -> 4753 bytes, '
    '1460 appended), so the cycle-1 freeze is provably untouched rather than tidied. C5 resolves '
    'every path:NN citation against the real file (astro.js:363 is the module.exports line; '
    'args.js:17 is the compact registration; args.test.js:87 is the five-contract-keys test). '
    'C8 recomputes the counts from source and shows the frozen four are a STRICT SUBSET of the '
    'live five with the difference exactly {compact}. C9 traces every numeral to a resolved '
    'source. Failability proven separately: .swarm/runs/cycle-029-gate-mutants-out.txt kills '
    '5/5 plausible-wrong variants (frozen line deleted, frozen header reworded, test citation '
    'dropped, an export omitted, an invented quantity) and keeps the cosmetic control green. '
    'Suite 115/115, shipped code untouched.'
)

assert 'T-126' not in items, 'T-126 already exists'
bl['items'].append({
    "id": "T-126",
    "title": "The new CONTRACTS drift note cites src/args.js:15, a comment line, as where the flags are registered",
    "kind": "docs",
    "priority": 8,
    "value": "L",
    "effort": "S",
    "model": "haiku",
    "deps": [],
    "files_hint": [".swarm/CONTRACTS.md"],
    "acceptance": (
        "The drift-note sentence about the flag list cites the line that actually registers the "
        "flags. src/args.js:9 opens the OPTIONS table and src/args.js:17 is the `compact` entry; "
        "line 15 is the second line of a three-line comment inside the table. The sentence "
        "already names line 17 correctly and that half must not change."
    ),
    "packages": [],
    "attempts": 0,
    "notes": (
        "FOUND AT THE CYCLE-29 GATE, and the conductor is the author of the defect: T-125's own "
        "acceptance text told the builder to cite `src/args.js:15`, so the builder reproduced the "
        "item's own words. NOT a gate failure -- the cycle-9 and cycle-12 precedent is explicit "
        "that failing a builder for reproducing the item's own words is gate inflation, and the "
        "sentence's substantive claims (six flags registered in OPTIONS, --compact at line 17) "
        "were both verified TRUE at the gate. NOT conductor-patched either, per the standing "
        "cycle-7 rule that a conductor editing the artifact leaves nothing independent checking "
        "the conductor's wording -- which bites with particular force here, since the conductor "
        "wrote the error.\n"
        "RATCHET RULING: REJECTED, and filed anyway so it is seen and priced rather than missed "
        "(the T-116 disposition). Q1 would the target user notice? Barely -- they follow the "
        "citation to a comment line, and the correct line 17 is named in the same sentence. Q2 "
        "would they still care after 10 minutes? No. If wrap-up arrives with this still todo, "
        "that is the correct outcome, not a miss."
    ),
    "status": "todo",
    "opened_cycle": 29,
})
atomic(SW / 'backlog.json', bl)

# ------------------------------------------------------------------ state
st = json.loads((SW / 'state.json').read_text())
st['cycle'] = 29

st['decisions'].extend([
    {
        "cycle": 29,
        "what": "My own first measurement said README's headline accuracy claim was FALSE. It was not -- the claim is true and my measurement was the wrong one. Caught by measuring a second and third way before filing anything.",
        "why": "README.md:164-165 and REPORT.md:34 both assert the implementation computes the 2000-01-06 new moon at 18:15 UTC. Bisecting the `age` discontinuity off the public surface gave 18:13:43.349Z -- which rounds to 18:14 and would have made the README's figure a fabrication of exactly the kind this run has removed eight times. Two further derivations refuted my own finding: bisecting the `cycleFraction` wrap (the method test/astro.test.js:63-72 itself uses) and, independently, ternary-searching the illumination MINIMUM (which comes from the ch.48 elongation series, not the ch.49 instant tables) both land on 18:15:22.79Z and agree with EACH OTHER to 4 milliseconds. The README is right. The root cause of my bad number is real and worth recording: `age` is computed at src/astro.js:313 from the ch.49 true-phase instant tables while `cycleFraction` is computed at src/astro.js:303 from the ch.48 elongation series, so the two zero 99.4 s apart -- the same two-series split KI-7 documents, showing up at an ordinary epoch rather than an absurd one. GENERALIZABLE, and it is the lesson of the cycle: a 'the docs are wrong' finding must be measured by the method the doc's own evidence uses AND by one method independent of it, because a single derivation off a different series is indistinguishable from a real defect. Evidence: .swarm/runs/cycle-029-anchor-measure.js.",
    },
    {
        "cycle": 29,
        "what": "The scan's other candidate -- `--compact` being the only CLI flag with no positive unit assertion in test/args.test.js -- was PRICED BY MUTATION and rejected as churn rather than accepted as a coverage hole.",
        "why": "The gap is real: every other flag has a `parseArgs(['--flag'])` deepStrictEqual at args.test.js:33/43/53/63/73 and --compact has none. But 'a test is missing' is not the same claim as 'the surface is unprotected', and the SPEC's taste note names CHURN as this run's chief risk with the rule 'every added test closes a NAMED untested surface; test count is not an outcome'. So I mutated the wiring instead of arguing it: .swarm/runs/cycle-029-compact-mutants.py runs four mutants (compact <- block, compact <- json, pinned true, pinned false) and ZERO survive the full suite -- only 'pinned false' survives args.test.js alone, and cli.test.js:44 kills it end-to-end. The surface is covered at a different level. Adding the unit test would have raised the test count and closed nothing, which is the exact failure the digest warns against.",
    },
    {
        "cycle": 29,
        "what": "T-125 fixed by APPENDING a drift note to .swarm/CONTRACTS.md with every frozen line left byte-identical, rather than by correcting the stale signatures in place.",
        "why": "The obvious objection to filing this at all is that CONTRACTS.md is a frozen historical artifact -- its header reads 'FROZEN CONTRACTS -- cycle 1 ... Authored by the conductor BEFORE any builder started' -- so drift from it is expected and 'fixing' it would falsify the record of what was actually frozen. That objection is right about the FIX and wrong about the DEFECT. The defect is real because the contradiction does not stay inside .swarm/: test/args.test.js:87 is a SHIPPING test titled 'the returned object has exactly the five contract keys' which asserts five and passes, while the document it calls the contract declares four and says 'no builder may change a signature below'. The additive shape satisfies both concerns at once -- the freeze remains a perfect record, and the misleading is gone -- and the gate enforces it mechanically as a byte-prefix check rather than trusting the builder to have been careful.",
    },
    {
        "cycle": 29,
        "what": "Two gate-instrument defects were found and repaired mid-verification, each paired with a strictly stronger assertion; neither was allowed to change the standard.",
        "why": "C8 initially reported the frozen @returns as declaring ZERO keys and the live parseArgs as returning four. Both were MY regexes being narrower than the code: the first took the FIRST '@returns' in CONTRACTS.md, which belongs to computeMoon rather than parseArgs, and the second required a colon so it silently dropped the ES6 shorthand `hemisphere,`. This is the FOURTH instance this run of my own instrument being narrower than the thing it measures (cycle 8's .trim() defect, cycle 9's sentence-scope defect, cycle 19's line-wrap defect). Per that standing precedent every widening was paid for: the frozen block is now located by anchoring on the '## src/args.js' SECTION and asserted to contain parseArgs before being counted; and rather than trust my own parse of the live keys at all, the gate now requires it to EQUAL the key list extracted from the shipping test itself, plus asserts the frozen four are a strict SUBSET of the live five with the difference shown to be exactly {compact}. Separately, my C5 repair (replacing a hand-typed numeral permit-list with citation resolution) silently REMOVED the invented-quantity guard while strengthening the wrong-citation guard; I caught it while designing the failability harness and restored it as C9 in the stronger resolved form. The harness then proved the restoration does real work: the invented-quantity mutant is killed.",
    },
    {
        "cycle": 29,
        "what": "The target was NOT declared done, and this cycle's scan is the reason rather than an excuse.",
        "why": "Cycle 28's handoff named exactly two acceptable outcomes for a fresh VALUE_LOOP candidate scan: return nothing that passes the ratchet and declare done, or return a candidate and build it. The scan returned a candidate (T-125), it was built and verified, so the second branch is what happened -- an empty queue was never the question. The scan itself covered six surfaces (doc-vs-code truth, comment-vs-code gloss, untested named surfaces, hostile input, CONTRACTS.md vs reality, manifest hygiene); five came back clean under conductor re-verification, including a 19-case hostile-input matrix run against the real binary with zero stack traces and zero silent nonzero exits. The DONE question is now genuinely closer than it has been: the surfaces this run knows how to sweep are swept, and what remains on the backlog (T-116, T-126) is two ratchet-rejected cosmetics.",
    },
])

st['counters']['consecutive_no_value'] = 0
st['counters']['consecutive_failures'] = 0
# Wave autotune: clean wave (0 reverts, 0 failed verifies) -> streak 1 -> 2 -> bump fires,
# but k_current is already at the hard max 5, so it stays and the streak resets.
st['counters']['wave_streak'] = 0
st['counters']['k_current'] = 5

st['last_cycle'] = {
    "cycle": 29,
    "work": (
        "VALUE_LOOP candidate scan over six surfaces (haiku, read-only), every finding "
        "conductor-re-verified; then build-wave k=1 at haiku for T-125 -- .swarm/CONTRACTS.md "
        "declared export lists and a parseArgs signature the code no longer matches, and the "
        "contradiction reached a shipping test title. Dispatched as DIRECT Agent calls: Workflow "
        "is review-gated in a headless -p session, the documented failure-table fallback."
    ),
    "outcome": (
        "1 item verified, 0 failed, 0 reverted. 30-check gate, 0 failed, failability proven 6/6. "
        "The cycle-1 freeze is provably byte-identical (HEAD survives as an exact prefix) and the "
        "drift is recorded additively. Suite 115/115, zero shipped bytes changed. Two further "
        "scan candidates were REJECTED on evidence rather than taste: --compact's missing unit "
        "test (0 of 4 mutants survive the full suite, so it closes no real surface) and my own "
        "initial reading that README's 18:15 anchor was false (refuted by two independent "
        "derivations agreeing to 4 ms)."
    ),
    "verified": 1,
    "failed": 0,
    "reverted": 0,
}
atomic(SW / 'state.json', st)

print('backlog todo:', [i['id'] for i in bl['items'] if i['status'] == 'todo'])
print('T-125 status:', items['T-125']['status'])
print('state cycle:', st['cycle'], '| decisions:', len(st['decisions']))
