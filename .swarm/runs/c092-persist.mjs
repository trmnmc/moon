import fs from 'node:fs';
const T = '/opt/targets/moon/.swarm/';

// --- raw workflow return, saved per cycle.md step 5 ---
const qa = {
  mode: 'full',
  run_label: 'improvement-moon-2026-08-18',
  timestamp: 1787067433,
  dispatch: 'direct Agent calls (headless -p session; Workflow tool review-gated) — author fable/high, executor sonnet/medium, look fable',
  scenarios: [
    { id: 'S1', title: 'T-175: US/Samoa hemisphere — southern identity arm and northern mirror arm' },
    { id: 'S2', title: 'Astronomy is TZ-invariant and the printed name/illumination pair sits in its consistency band' },
    { id: 'S3', title: 'Output contract: deterministic within a window, 5-code-point disc, spec-pure byte stream' }
  ],
  results: [
    { scenario_id: 'S1', status: 'pass', conductor_verdict: 'PASS — re-run independently by the conductor' },
    { scenario_id: 'S2', status: 'pass', conductor_verdict: 'PASS on runnable sub-checks; the 6h-later direction check is NOT RUN, reported as not-run' },
    { scenario_id: 'S3', status: 'fail', conductor_verdict: 'EXPECTATION defect, not a product defect — see the cycle-92 decision; no backlog item filed' }
  ],
  look: {
    findings: [{
      severity: 'low',
      where: 'bin/moon.js --json, nextFullMoon',
      expected: 'instant rounded to the precision the algorithm earned (help: phase instants good to roughly an hour)',
      found: 'toISOString() millisecond precision: 2026-08-28T04:18:25.225Z — the only field escaping the rounding policy'
    }]
  },
  agents_used: 3,
  dead_agents: []
};
fs.writeFileSync(T + 'runs/cycle-092-qa-verify.json', JSON.stringify(qa, null, 2));

// --- backlog: file T-190 from the look finding ---
const b = JSON.parse(fs.readFileSync(T + 'backlog.json', 'utf8'));
b.items.push({
  id: 'T-190',
  title: '--json nextFullMoon prints millisecond precision while the help text scopes phase instants to roughly an hour — the one output field that escapes the stated rounding policy',
  kind: 'fix',
  status: 'todo',
  priority: 2,
  effort: 'S',
  model: 'haiku',
  attempts: 0,
  deps: [],
  packages: [],
  files_hint: ['bin/moon.js'],
  acceptance: 'Either the emitted instant carries no more precision than the docs claim is earned, or the help/README claim is made precise about which fields the rounding policy covers — decided as a judgment call, not both. Whichever side moves, a check pins it so the two cannot drift apart again, and the --json key set is unchanged (no new field, no removed field).',
  source: 'cycle-92 QA full pass, live-look finding (low). Conductor-verified independently: nextFullMoon stable at 2026-08-28T04:18:25.225Z across runs while illumination/age/cycleFraction/phaseAngle/julianDay are all rounded.'
});
fs.writeFileSync(T + 'backlog.json.tmp', JSON.stringify(b, null, 2));
fs.renameSync(T + 'backlog.json.tmp', T + 'backlog.json');
const c = {};
for (const i of b.items) c[i.status] = (c[i.status] || 0) + 1;
console.log('backlog:', JSON.stringify(c), 'total', b.items.length);

// --- state.json ---
const s = JSON.parse(fs.readFileSync(T + 'state.json', 'utf8'));
s.cycle = 92;
s.qa.last_full_qa_cycle = 92;
s.counters.consecutive_no_value = 0;
s.decisions.push({
  cycle: 92,
  what: 'QA scenario S3 FAILED as authored, and the failure is an EXPECTATION defect, not a product defect. No backlog item filed against it.',
  why: "S3 asserted every disc code point is drawn from the 8-glyph set the SPEC domain rules enumerate. The live disc renders U+25D6/U+25D7 (round-limb) too, so the assertion fails. But the spec's domain-rules bullet is an ABRIDGEMENT of README.md:245-249, which documents both round-limb glyphs by name, states their EAW class as Neutral, and cites the audit script that measured it; test/render.test.js pins them separately as UNDOCUMENTED_DISC_GLYPHS with a comment saying exactly why they sit outside the Block Element partition. The authoritative sources are complete and correct; the scenario author was spec-only BY DESIGN and inherited the abridgement. Recorded as a fail with its evidence rather than re-labelled a pass (hard rule 2), and no fix is filed because there is no defect to fix. SPEC.md is frozen at kickoff and is not edited mid-run."
});
s.decisions.push({
  cycle: 92,
  what: 'T-175 is now confirmed CLOSED at the user-visible surface, not only at the unit level.',
  why: 'The two-arm proof at its build cycle was a unit-level mutation proof on detectHemisphere. This cycle ran the shipped CLI end-to-end and re-ran it independently of the executor: TZ=US/Samoa renders the disc row U+25D6 U+2588 U+2591 U+2591 U+2591, byte-identical to Pacific/Apia and Australia/Sydney, and distinct from Europe/London U+2591 U+2591 U+2591 U+2588 U+25D7. The documented FAIL SIGNATURE (Samoa matching London unmirrored) is verified ABSENT. Phase name and illumination are identical across all seven zones exercised, so TZ moves the limb and nothing else.'
});
s.last_cycle = {
  cycle: 92,
  ts: '2026-08-18T15:56:00+00:00',
  work: 'QA full pass (qa-verify contract, direct Agent dispatch): spec-only scenario author -> executor -> live-look',
  outcome: 'VERIFIED. 3 scenarios: S1 pass (conductor re-ran it independently — T-175 confirmed closed end-to-end), S2 pass on runnable sub-checks with the 6h-later direction check reported NOT RUN, S3 fail adjudicated as an expectation defect against an abridged spec bullet, no item filed. Live-look returned ONE low finding, conductor-verified: --json nextFullMoon prints ms precision against a help text that scopes phase instants to roughly an hour. Filed T-190. Suite 171/171 across all 9 test files.',
  commit: ''
};
fs.writeFileSync(T + 'state.json.tmp', JSON.stringify(s, null, 2));
fs.renameSync(T + 'state.json.tmp', T + 'state.json');
console.log('state: cycle', s.cycle, 'phase', s.phase, 'last_full_qa_cycle', s.qa.last_full_qa_cycle);
console.log('decisions now', s.decisions.length);
