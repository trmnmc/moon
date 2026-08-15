import json, time, shutil, datetime, io

NOW = int(time.time())
TS = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
STOP = 1786807947
REMAIN = round((STOP - NOW) / 3600.0, 2)

T = '/opt/targets/moon/.swarm/'
RUNFILE = '/opt/swarm/runs/current.json'


def atomic(path, obj):
    with open(path + '.tmp', 'w') as f:
        json.dump(obj, f, indent=1, ensure_ascii=False)
    shutil.move(path + '.tmp', path)


# ---------------- state.json ----------------
s = json.load(open(T + 'state.json'))
s['cycle'] = 46
s['phase'] = 'VALUE_LOOP'
s['qa']['last_full_qa_cycle'] = 46
s['counters']['consecutive_no_value'] = 0
s['counters']['consecutive_failures'] = 0
s['counters']['wave_streak'] = 0
s['last_cycle'] = {
    'cycle': 46,
    'work': 'QA (conductor-inline end-to-end) - T-141',
    'outcome': 'GATE PASS - 28/28 e2e checks, 10/10 mutants killed, 144/144 suite green, 1 unpinned surface filed as T-142',
    'ts': TS,
}
s['decisions'].append({
    'cycle': 46,
    'what': "T-141's end-to-end QA was run CONDUCTOR-INLINE with zero agent tiers spent, and the harness derived its hemisphere expectation from README's own north|south table rather than from the renderer",
    'why': "Two constraints met here. Gear 1 under a 0%-premium trickle posture makes any agent-dispatched QA the expensive option, and cycle.md step 5's FALLBACK explicitly permits conductor-inline QA when the workflow is unavailable (Workflow is review-gated in a headless -p session). For a stdout CLI the conductor can execute the real binary itself, which is strictly stronger evidence than a subagent's report of having done so - hard rule 2 says agent returns are claims, and this removes the claim step entirely. The harder problem was self-agreement: a QA harness that computes its expectation from the same renderer it is testing proves only that the code equals itself. Parsing README's 15-row north|south table into a mirror map, asserting the map is an involution, and requiring mirror(--north disc) == --south disc sources the contract from documentation and the behaviour from the binary, so the two can genuinely disagree. Mutant M1 (--south made a no-op) confirms it: it dies against C11.",
})
s['decisions'].append({
    'cycle': 46,
    'what': 'Three defects in my OWN mutation instrument were found and repaired mid-verification - fifth instance this run of my instrument being narrower than what it measures - and one of them had misreported a generator bug as a gap in the harness under test',
    'why': "The dangerous one was M9. It came back SURVIVED, which reads as 'the QA harness fails to check the disc width'. It was not: the generator had declared the mutation applied because a cosmetic edit changed the file's text, while the 5-cell constant it meant to change was never found (my regex \\bCELLS never matches inside LINE_CELLS - underscore is a word character). Left alone I would have filed a false gap against a harness that was working. The repair is structural rather than per-mutant, per the cycles 8/9/19/29 precedent that every widening is paid for with a stronger assertion: exact unique source anchors replace regexes, and a NO-OP GUARD now compares the mutated binary's observable output against the unmutated one and reports NO-OP MUTANT rather than SURVIVED. The guard then failed twice itself, both in the safe direction (refusing to credit kills it could not see) - first because its probes pinned TZ=UTC, where M10's 'always north' is genuinely invisible, then because no probe combined --json with --help. The extracted rule is written into the file: a guard must be at least as observant as the harness it polices.",
})
s['decisions'].append({
    'cycle': 46,
    'what': "The QA found zero divergences, so the one finding filed (T-142) came from MEASURING which end-to-end surfaces the shipping suite pins - replaying the same ten mutants against `node --test` instead of against the harness",
    'why': "A clean QA pass is a statement about today; the harness is a throwaway in .swarm/runs/, so any surface only it checks becomes unprotected the moment this run ends. Rather than argue about which checks deserve to be shipping tests - the exact shape of the CHURN the SPEC's taste note names as this run's chief risk - the question was made mechanical. Against a green 144/0 baseline in an identical copy, 9 of 10 mutants are killed by the existing suite and exactly one is not: --help's precedence over --json. That converts 'we should probably add some CLI tests' into one named, measured, untested surface, which is precisely the form the SPEC rule 'every added test closes a NAMED untested surface; test count is not an outcome' demands. The other nine are evidence AGAINST writing more tests, and are recorded as such.",
})
s['decisions'].append({
    'cycle': 46,
    'what': 'The target was NOT declared DONE even though T-141 - the item cycle 45 named as the last thing standing between this target and DONE - closed this cycle with evidence',
    'why': "The DONE rule has two conjuncts and only one is settled. The definition of done was re-verified green at cycle 44, but the second conjunct requires that no VALUE_LOOP candidate passes the ratchet, and the standing rule from cycles 26/30/31 is that this must be established by a scan that comes back EMPTY, not inferred from a drained backlog. No scan ran this cycle. More decisively, this cycle CREATED a passing candidate: T-142 is a measured unpinned surface in the shipping suite, so the conjunct is now demonstrably false rather than merely unexamined - declaring done would have been a false claim of completeness, not a premature one. The cost asymmetry cycle 26 named is unchanged: DONE sets every target status to done, rotation then finds no active target, and early WRAP_UP fires, discarding ~6.7 h of remaining clock. Deferring costs one gear-1 cycle.",
})
atomic(T + 'state.json', s)
print('state.json: cycle 46, phase', s['phase'], ', decisions', len(s['decisions']))

# ---------------- backlog.json ----------------
b = json.load(open(T + 'backlog.json'))
for it in b['items']:
    if it['id'] == 'T-141':
        it['status'] = 'done'
        it['closed_cycle'] = 46
        it['notes'] = it['notes'] + (
            ' CLOSED cycle 46 by conductor-inline QA: 28/28 end-to-end checks green against the real '
            'binary (.swarm/runs/cycle-046-verify-T-141.txt), harness proven failable by 10/10 mutants '
            'killed with 0 survivors and 0 no-ops (cycle-046-verify-T-141-mutants.txt), full suite '
            '144/144 green. Zero divergences from README were found, so no fix items were filed from '
            'the QA itself; the single finding (T-142) came from the separate suite-coverage '
            'measurement, not from a failing check.')

b['items'].append({
    'id': 'T-142',
    'kind': 'test',
    'status': 'todo',
    'priority': 5,
    'value': 'M',
    'effort': 'S',
    'model': 'sonnet',
    'attempts': 0,
    'opened_cycle': 46,
    'title': "--help's precedence over --json is the ONE end-to-end surface no shipping test pins",
    'why': "Measured, not guessed (.swarm/runs/cycle-046-suite-gap.js). Ten mutants, each breaking one "
           "documented end-to-end behaviour, were run against `node --test test/*.test.js` in throwaway "
           "copies with a green 144/0 baseline. Nine are killed by the existing suite. The tenth - "
           "changing `if (opts.help)` to `if (opts.help && !opts.json)` in bin/moon.js, so that "
           "`moon --json --help` emits JSON instead of the usage text - leaves the suite at 144 pass / 0 "
           "fail. bin/moon.js orders the help branch before the json branch deliberately; nothing "
           "currently holds that order in place.",
    'acceptance': "A shipping test asserts, by executing the real binary, that `--json --help` produces "
                  "byte-identical output to `--help` alone and exits 0. The test must FAIL against the "
                  "M6 mutation (`if (opts.help && !opts.json)`) - demonstrate this by applying the mutant "
                  "to a scratch copy, never to the repo - and pass against HEAD. One test; do not also add "
                  "assertions for the nine surfaces already measured as pinned, which would be the exact "
                  "test-count churn the SPEC taste note forbids.",
    'files_hint': ['test/cli.test.js'],
    'packages': [],
    'deps': [],
    'notes': "Filed at the cycle-46 gate from a conductor measurement, not from an agent suggestion and "
             "not from a failing QA check - the end-to-end QA itself found zero divergences. Priority 5: "
             "below the closed must-haves but above the three cosmetic ratchet-rejects (T-116, T-130, "
             "T-139), because unlike those it closes a surface that is measurably unprotected rather than "
             "rewording a true sentence. Routed to sonnet rather than the haiku the docs/S table row would "
             "give: cycle 5 established on this run that test-authoring is build-class work, and gear 1 "
             "permits S-effort sonnet builds.",
})
atomic(T + 'backlog.json', b)
todo = [i for i in b['items'] if i['status'] == 'todo']
print('backlog: %d items, %d todo, %d done' % (
    len(b['items']), len(todo), len([i for i in b['items'] if i['status'] == 'done'])))

# ---------------- runfile ----------------
r = json.load(open(RUNFILE))
r['heartbeat'] = dict(ts=NOW, next_wakeup_at=NOW + 600, pid=326222, limp=False, degraded_tiers=[])
r['cycles_since_recycle'] = 18
r['budget']['last_probe_ts'] = NOW
r['budget']['weekly'] = dict(ok=True, weekly_used_pct=79.0, opus_used_pct=96,
                             week_elapsed_pct=73.58, weekly_heat=1.0737, opus_heat=1.3047,
                             ceiling=5, promote_blocked=True)
r['budget']['probe_note'] = (
    "cycle 46: probe NOT invoked (46th consecutive cycle). KI-2 RE-GREPPED this cycle, not inherited: "
    "/opt/swarm/.claude/settings.json carries swarm-notify at lines 6 and 7 and still NO entry of any "
    "form for swarm-budget.sh or swarm-playbook.sh, so no cwd rescues those two. probe_failures stays 34 "
    "-- an attempt not made is not a failure. Gear rests on runs/allocator.json (source=probe), freshness "
    "CHECKED not assumed: week_elapsed_pct advanced 73.30 -> 73.58 since cycle 45. posture=trickle, "
    "allow_premium_pct 0, allow_overall_pct 0, weekly_used_pct 79.0, opus_used_pct 96, dial 0.3. "
    "weekly_heat 79.0/73.58 = 1.0737 < 1.1 -> governor disengaged, ceiling 5; opus_heat 96/73.58 = 1.3047 "
    "> 1.2 -> promote stays blocked. Trickle + guest 1-3 clamp -> gear 1, k_cap 1. week_resets_at "
    "1786942799 is after stop_at 1786807947, so gear 1 is structural for the rest of the run. "
    "COOLING REVERSED -- and this corrects my own cycle-45 conclusion. Cycle 45 recorded that two "
    "consecutive cycles of widening margin 'confirm the cycle-43 rise was a fluctuation'. This cycle "
    "weekly_used_pct moved 78.0 -> 79.0 while elapsed advanced only 0.28, so weekly_heat rose 1.0641 -> "
    "1.0737 and the margin to the 1.1 governor threshold NARROWED 0.0359 -> 0.0263, tighter than at cycle "
    "43. Two points were never enough to confirm a trend and the record should not have said they were. "
    "No practical effect: still below 1.1, and gear 1 is floor-clamped by the trickle posture regardless. "
    "KI-2 NARROWED FURTHER: cycle 45 concluded the fix was `cd /opt/swarm && bin/swarm-notify.sh poll`. "
    "This cycle the BARE relative form `bin/swarm-notify.sh poll` succeeded with no cd at all, because a "
    "pacer-spawned session already has cwd=/opt/swarm. The cd is sufficient, not necessary; the real "
    "constraint is only that cwd must be /opt/swarm.")
atomic(RUNFILE, r)
shutil.copyfile(RUNFILE, RUNFILE + '.bak')
print('runfile: heartbeat', NOW, 'cycles_since_recycle', r['cycles_since_recycle'])

# ---------------- journal ----------------
block = open(T + 'runs/cycle-046-journal.md').read()
block = block.replace('{TS}', TS).replace('{NOW}', str(NOW)).replace('{REMAIN}', str(REMAIN))
with open(T + 'journal.md', 'a') as f:
    f.write(block)
    f.write('\n### cycle 46 runfile-mirror\n\n')
    f.write(json.dumps(r, ensure_ascii=False))
    f.write('\n')
print('journal: appended cycle 46 block + runfile-mirror at', TS)
print('REMAIN_H', REMAIN)
