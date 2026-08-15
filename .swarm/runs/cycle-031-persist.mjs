// cycle 31 step 7: atomic persist of backlog.json + state.json.
import fs from 'node:fs';
const DIR = '/opt/targets/moon/.swarm/';
const asciiJson = (o) =>
  [...JSON.stringify(o, null, 1)]
    .map((c) => (c.charCodeAt(0) < 128 ? c : '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0')))
    .join('') + '\n';
const write = (name, obj) => { fs.writeFileSync(DIR + name + '.tmp', asciiJson(obj)); fs.renameSync(DIR + name + '.tmp', DIR + name); };

// --- backlog ---
const b = JSON.parse(fs.readFileSync(DIR + 'backlog.json', 'utf8'));
const it = b.items.find((i) => i.id === 'T-128');
if (!it) throw new Error('T-128 missing');
it.status = 'done';
it.closed_cycle = 31;
it.verified_cycle = 31;
it.evidence =
  '.swarm/runs/cycle-031-verify-T-128.txt -- 9-mutant battery, 9/9 behave as required, 0 misbehaving. ' +
  'Decisive mutant M8 (partial drift: `compact` renamed to `terse` in BOTH OPTIONS and HELP, README left stale) ' +
  'fails on the README edge specifically, proving all three edges are checked rather than two. ' +
  'M9 is the false-positive control (a commented-out decoy entry inside OPTIONS must NOT read as a seventh flag): stayed green. ' +
  'M2 is the direction the replaced hardcoded test was blind to (flag removed from OPTIONS while both docs still advertise it). ' +
  'Behaviour frozen and machine-checked: src/args.js with comments+whitespace stripped is IDENTICAL to HEAD, and ' +
  'bin/moon.js / README.md / package.json are byte-identical to HEAD. 119/119 green (117 at cycle start; +3 new, -1 replaced). ' +
  'Restore proven: after nine mutants were written into four files, all four compare byte-identical to their pre-battery contents.';
it.notes += '\nCLOSED CYCLE 31 at sonnet, attempt 1, no revert. All three sources were confirmed in agreement (6/6/6, set-equal) before and after. ' +
  'The builder needed no export change: parseArgs was already exported, and the OPTIONS keys are read out of src/args.js source text with a ' +
  'non-vacuity guard, then cross-checked live -- every extracted name must be accepted by the real parseArgs, and an unregistered name must be ' +
  'rejected with code EUSAGE. That liveness pairing is what stops the source-text parse from silently reading a comment or a stale block. ' +
  'The -h alias was handled by DECISION rather than by omission: it is an alternate spelling of --help, not a seventh flag, so it is not a set ' +
  'member -- but both document parsers now REQUIRE the exact alias shape on the --help row and assert they saw it, so dropping "-h, " fails ' +
  'loudly (conductor mutant M7 confirms). The replaced test\'s exit-0 half was folded in and strengthened: --help output must equal the HELP ' +
  'constant byte-for-byte.';
write('backlog.json', b);

// --- state ---
const s = JSON.parse(fs.readFileSync(DIR + 'state.json', 'utf8'));
s.cycle = 31;
s.phase = 'VALUE_LOOP';
s.counters.consecutive_no_value = 0;
s.counters.consecutive_failures = 0;
// Wave autotune: clean k=1 wave (0 reverts, 0 failed verifies) -> streak 1 -> 2 -> bump
// k_current, but it is already at the hard max of 5, so it stays and the streak resets.
s.counters.wave_streak = 0;
s.counters.k_current = 5;
s.last_cycle = {
  cycle: 31,
  work: 'VALUE_LOOP candidate scan (3 candidates rejected as already-closed) + build-wave [T-128] k=1 at sonnet',
  outcome: '1 verified, 119/119 green, 0 reverted, 9/9 conductor mutants behave as required',
  ts: new Date(1786760400 * 1000).toISOString(),
};
s.decisions.push({
  cycle: 31,
  what: 'DONE is still not declarable: the candidate scan cost three probes to find one ratchet-passing item, but it did find one',
  why:
    'Cycle 30 set the standing rule that a DONE declaration needs a scan that comes back EMPTY. This scan did not. ' +
    'Three candidates were probed and all three came back already-closed by earlier cycles -- (a) the hemisphere table vs the IANA ' +
    'reference latitudes, which test/hemisphere.test.js:327 has cross-checked against /usr/share/zoneinfo since an earlier cycle ' +
    '(conductor re-ran it independently: 418/418 canonical zones agree, 0 reverse mismatches, 0 dead table entries, and the one ' +
    'north-under-a-southern-prefix case, Indian/Maldives, is correctly carved out); (b) an early-closed stdout pipe and the CLI exit-code ' +
    'matrix, both clean -- no EPIPE crash in any of five modes, exit 0/0/0/2/2/2/0 exactly as documented; (c) the next-full-moon line\'s ' +
    'year-suppression branch, already pinned in both directions by T-106 in test/regressions.test.js. The fourth probe found T-128. ' +
    'Hit rate is falling and that is the signal to record, but three misses is not an empty scan.',
});
write('state.json', s);
console.log('persisted: backlog items =', b.items.length, '| state.cycle =', s.cycle, '| decisions =', s.decisions.length);
