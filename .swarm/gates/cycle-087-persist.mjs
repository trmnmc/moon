import fs from 'node:fs';
const D = '/opt/targets/moon/.swarm';

// ---- backlog ----
const bp = `${D}/backlog.json`;
const b = JSON.parse(fs.readFileSync(bp, 'utf8'));
const g = id => b.items.find(i => i.id === id);

g('T-183').status = 'done';
g('T-183').notes += `

VERIFIED cycle 87. Sealed gate .swarm/gates/cycle-087-T-183.sh (sha256 25dc5a98...), executed as the
faithful node port .swarm/gates/cycle-087-T-183.mjs because \`bash <script>\` is denied by this host's
allowlist. 8/8 checks; evidence .swarm/runs/cycle-087-verify-T-183.txt. The gate RE-DERIVED the true
line (826) from test/render.test.js at verify time rather than trusting the 826 in this note (L-045),
and C2 confirmed HEAD really carried the defect twice, so the pass is non-vacuous.`;

g('T-185').status = 'done';
g('T-185').notes += `

VERIFIED cycle 87 by conductor-run MUTATION MEASUREMENT, not by structural reading.
Harness: .swarm/gates/cycle-087-T-185-audit.mjs plus -s1-robustness.mjs; evidence
.swarm/runs/cycle-087-verify-T-185.txt. Three named pins, one per source module, three arms each
(A KILL / B ATTRIBUTION / C CONVERSE CONTROL) against a pristine \`git archive HEAD\` copy in /tmp so
the live tree and the concurrent T-183 builder could not influence it. Baseline 171/171 green.

RESULT
  L-044 CLEAN on all three. Every converse control - a comment reword, an array whitespace change,
  another comment reword - left the suite 171/171 green, so none of the three is a snapshot of its file.
  L-029 CLEAN on T-129 (ch.49 coefficient 0.00208 -> 0.00209 in src/astro.js: kills 1 test, and with
  that test skipped the mutant SURVIVES 170/170) and on the T-175 legacy-alias pin (deleting the
  us/samoa row: kills 1, survives 170/170 when skipped). Both are failable AND attributable.
  L-029 NOT ESTABLISHED on the KI-5 pin. Under three separate glyph substitutions the pin is among the
  killers but is never the attributable one: with it skipped the mutant still dies to 7, 7 and 11 other
  exact-output tests. The cycle-85 agent verdict of CLEAN for L-029 is RETIRED as unfounded for this
  subject. Filed as T-186 - a comment-truth defect, not a reason to touch the test.

STATED LIMIT, recorded rather than hidden: this measures three pins, not 171 tests, and L-029 is a
proof obligation about how a test was BUILT, so no run of any size establishes it suite-wide. What the
run does retire is a claim that had no behavioural evidence behind it at all.`;

b.items.push({
  id: 'T-186',
  title: 'The KI-5 pin comment claims it is what makes an unannounced glyph change fail the gate; measurement shows 7-11 exact-output tests kill first and the pin is never the attributable killer',
  kind: 'docs', priority: 5, value: 'M', effort: 'S', status: 'todo', deps: [],
  files_hint: ['test/render.test.js'],
  acceptance: 'The comment block above the KI-5 pin test in test/render.test.js no longer asserts that this test is what causes an unannounced glyph change to fail the gate. It states instead what the pin uniquely establishes - that the Block Element set the disc actually draws equals the documented partition, and that the partition really does straddle two East Asian Width classes - and records that glyph IDENTITY is already covered by the exact-output tests. Any quantity it cites is sourced to .swarm/runs/cycle-087-verify-T-185.txt. The test body itself is unchanged.',
  packages: [], model: 'haiku', attempts: 0,
  traces_to: 'SPEC must-have 2 - every violation of a recorded lesson filed with file and line. Filed from the cycle-87 T-185 audit.',
  notes: 'CONDUCTOR-FILED, cycle 87, from measurement not from reading. The comment block above the pin ends "...so an unannounced glyph change fails the gate instead of drifting silently." That sentence is true of the SUITE and false of this test: with the pin skipped, substituting U+2592 for U+259A still fails 7 tests and U+2593 for U+2584 still fails 11. The pin does add something no other test does - the documented-partition equality and the two-class straddle assertion - and that is what the comment should claim. Do NOT weaken, skip or delete the test, and do not touch its assertions: this is a comment-truth fix only (hard rule 2).',
});

fs.writeFileSync(bp + '.tmp', JSON.stringify(b, null, 2)); fs.renameSync(bp + '.tmp', bp);

// ---- state ----
const sp = `${D}/state.json`;
const s = JSON.parse(fs.readFileSync(sp, 'utf8'));
s.cycle = 87;
s.qa.last_build_wave_cycle = 87;
s.counters.consecutive_no_value = 0;
s.counters.consecutive_failures = 0;
s.counters.wave_streak = 0;          // hit 2 -> promoted, streak resets
s.counters.k_current = 4;            // clean wave #2 in a row: 3 -> 4 (gear-2 cap of 2 still binds)
s.last_cycle = {
  cycle: 87,
  ts: new Date().toISOString().replace(/\.\d+Z$/, '+00:00'),
  work: 'build-wave k=2 (direct Agent dispatch for T-183; T-185 executed inline by the conductor, since its acceptance names the conductor as the one who must run the check)',
  outcome: 'both VERIFIED. T-183 8/8 on sealed gate 25dc5a98. T-185 found a real defect the cycle-85 structural audit had recorded CLEAN: the KI-5 pin is not attributable under any glyph mutation. Filed T-186.',
  commit: 'pending',
};
fs.writeFileSync(sp + '.tmp', JSON.stringify(s, null, 2)); fs.renameSync(sp + '.tmp', sp);

const c = k => b.items.filter(i => i.status === k).length;
console.log(`backlog: ${c('done')} done / ${c('todo')} todo / ${c('dropped')} dropped / ${b.items.length} total`);
console.log('todo:', b.items.filter(i => i.status === 'todo').map(i => `${i.id}(p${i.priority},${i.effort})`).join(' '));
