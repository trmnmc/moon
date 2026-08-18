// cycle 91 — persist: backlog (file T-189), state.json, journal append + runfile mirror, runfile.
import fs from 'node:fs';

const DIR = '/opt/targets/moon/.swarm';
const RUNFILE = '/opt/swarm/runs/current.json';
const now = Math.floor(Date.now() / 1000);
const NEXT = now + 90; // value cycle -> base 90s (cycle.md step 9; no pacing multiplier)
const TS = new Date(now * 1000).toISOString().replace('.000Z', '+00:00');

// ---- backlog ----
const bl = JSON.parse(fs.readFileSync(`${DIR}/backlog.json`, 'utf8'));
if (bl.items.some((i) => i.id === 'T-189')) throw new Error('T-189 already filed');
bl.items.push({
  id: 'T-189',
  title:
    "KI-5 has no reader-runnable check: README.md:224-225 documents the East Asian Width split in prose only, so a reader must reason about EAW classes to tell whether THEIR terminal renders the disc ragged",
  kind: 'polish',
  status: 'todo',
  priority: 1,
  effort: 'S',
  model: 'haiku',
  attempts: 0,
  deps: [],
  packages: [],
  files_hint: ['README.md'],
  acceptance:
    "README.md's KI-5 prose carries a one-line command a reader can paste, whose output DIFFERS visibly in an affected terminal and not otherwise. The observable must be verified to actually differ before it ships (the SPEC's standing condition on this nice-to-have, and the exact condition cycle 62's attempt failed). No new flag, no source change, no glyph-set change: README.md only.",
  notes:
    "SPEC nice-to-have #1. Cycle 62's attempt was DISPROVED at the gate: top-right vs bottom-right corner alignment cannot differ under the failure mode, because all six frame glyphs are EAW Ambiguous and both borders scale together. The new premise is the opposite and is already machine-pinned at test/render.test.js:785-792 — the disc glyph set STRADDLES the partition (Neutral: U+2591 and U+2590; Ambiguous: U+2592 U+2593 U+2588 U+258C U+258F U+2595). Sharpest pair: U+258C (Ambiguous) vs U+2590 (Neutral), two half-block glyphs a reader expects to be identical-width mirror images, on opposite sides of the class boundary. Equal counts of each on two rows differ in width iff the terminal renders Ambiguous as double — a discriminator an unaffected terminal cannot produce, not a comparison against a remembered value. files_hint excludes REPORT.md deliberately so test/report-issues.test.js's table anchors stay untouched.",
});
fs.writeFileSync(`${DIR}/backlog.json.tmp`, JSON.stringify(bl, null, 2));
fs.renameSync(`${DIR}/backlog.json.tmp`, `${DIR}/backlog.json`);

// ---- state.json ----
const st = JSON.parse(fs.readFileSync(`${DIR}/state.json`, 'utf8'));
st.cycle = 91;
st.phase = 'VALUE_LOOP';
st.counters.consecutive_no_value = 0;
st.decisions.push(
  {
    cycle: 91,
    what: 'DONE determination DEFERRED: the definition of done is fully met, but the target is not DONE',
    why:
      'DONE requires both clauses. Every definition-of-done clause was re-verified at run time this cycle (suite 171/171; no deps/lockfile/node_modules; KI-8 ask 1,783 bytes naming the exact file and line; REPORT.md 60,774 -> 22,461 bytes with forensics archived; T-175 closed two-arm). The second clause fails: journal re-archive passed the ratchet on entry (418,997 bytes, over the SPEC nice-to-have threshold) and was built this cycle, and T-189 passes it now. Declaring DONE over a live spec-traceable candidate would be a false close.',
  },
  {
    cycle: 91,
    what: 'The three-pass gate for improvement run 4: review-fix satisfied in substance, QA full QUEUED, TASTE deliberately not re-run',
    why:
      'state.json.qa records last_review_fix_cycle 73 / last_full_qa_cycle 76 / last_taste_cycle 81 — all RUN-3 cycles, so run 4 has strictly run none of the three. review-fix: all six run-4 items passed a sealed, independently-authored, baseline-armed gate, two caught by their own baseline arm pre-dispatch; a reviewer pass over twice-gated doc edits is churn under the two-source rule. QA full: NOT satisfied and worth one cycle — T-175 changed src/hemisphere.js, the only source change this run and a user-visible wrong answer; queued as the next cycle work ahead of T-189. TASTE: run 3 cycle 81 returned exactly three findings (T-177/T-178/T-179), all dropped as features this run non-goals forbid by name, and the user-visible surface has changed since by exactly one timezone hemisphere; re-running would re-derive forbidden findings. Reported at WRAP_UP as not-run with this reason, never as passed.',
  },
);
st.last_cycle = {
  cycle: 91,
  ts: TS,
  work:
    'inline housekeeping (no dispatch) — journal re-archive at the SPEC ~400 KB threshold, plus the DONE determination',
  outcome:
    'VERIFIED. Journal 418,997 -> 94,068 bytes; cycles 66-84 (24 blocks) moved verbatim to .swarm/journal-archive-run3-cycles-66-84.md. Independent gate against git HEAD: all 4,280 pre-archive body lines survive byte-for-byte in exactly one of the two files, run-3 and run-4 regions both IDENTICAL. Suite 171/171 before and after. One instrument defect caught pre-run (byte-accounting off-by-one: two join newlines, not one). DONE determination: definition of done fully met, but NOT DONE — T-189 (KI-5 reader-runnable check) passes the ratchet. Next cycle: QA full pass, then T-189.',
  commit: 'pending — stamped by the cycle 91 addendum',
};
fs.writeFileSync(`${DIR}/state.json.tmp`, JSON.stringify(st, null, 2));
fs.renameSync(`${DIR}/state.json.tmp`, `${DIR}/state.json`);

// ---- runfile ----
const rf = JSON.parse(fs.readFileSync(RUNFILE, 'utf8'));
rf.heartbeat = { ts: now, next_wakeup_at: NEXT, pid: 2291454, limp: false, degraded_tiers: [] };
rf.cycles_since_recycle = 6;
Object.assign(rf.budget, {
  source: 'probe',
  gear: 2,
  gear_target: 2,
  ratio: 0.39,
  mode: 'guest',
  k_cap: 2,
  promote: false,
  demote: true,
  window_tokens: 33991432,
  window_cost_usd: 26.87,
  tokens_per_hour: 14274000,
  projected_depletion_at: 0,
  last_probe_ts: now,
  last_real_probe_ts: now,
  probe_failures: 2,
  probe_note:
    'bin/swarm-budget.sh DENIED for the 18th consecutive run (KI-2); bin/swarm-notify.sh poll denied with it, so the control channel was read from runs/control.json on disk (pending[] empty, no inject array, nothing to triage). The underlying PROBE_CMD (npx ccusage@latest blocks --json --token-limit max) was run BY HAND and SUCCEEDED, but returned NO tokenLimitStatus this cycle, so the 130,591,250 limit is CARRIED FORWARD from cycles 89-90, not re-measured - the two-cycle streak of a freshly measured limit ends here and is recorded as carried rather than quietly reused. Active block 13:00-18:00Z at 15:22Z: 33,991,432 tokens and $26.87, 142.9 min in, i.e. 237.9k tokens/min = 14.27M/hour - DOWN again from cycle 90 246.8k/min, so the window is still cooling. Remaining 96.60M over 157.1 min = 614.9k/min target at the guest-forced dial of 1.0, so rho = 0.39, the gear-5 band. Guest mode clamps reachable gears to 3 and the weekly governor ceiling clamps to 2, so gear 2 stands - the FOURTH consecutive cycle where measured rho would license a higher gear and the posture refuses it. ccusage projection 71.37M against the 130.59M limit, no depletion risk. The weekly block below is STILL carried forward, not re-measured. probe_failures HELD at 2, not incremented: the script never launched, so it returned neither probe_ok true nor false.',
});
fs.writeFileSync(`${RUNFILE}.tmp`, JSON.stringify(rf, null, 2));
fs.renameSync(`${RUNFILE}.tmp`, RUNFILE);
fs.copyFileSync(RUNFILE, `${RUNFILE}.bak`);

// ---- journal append: block + wakeup line + runfile mirror ----
const block = fs.readFileSync(`${DIR}/runs/c091-journal-block.md`, 'utf8');
const wakeup = `\nnext wakeup: ${NEXT} (${new Date(NEXT * 1000).toISOString()}, +90s from the persist). Base 90s, the cycle.md step-9 default for a cycle that produced verified value — cycle 90's 900s was reasoned from being a judgment pass with no dispatch, and this cycle both produced verified value and queues a real QA pass, so the default applies unmodified. There is no pacing multiplier: gears change what a cycle burns, never whether it happens. Clamp checked: ${NEXT} + 900 = ${NEXT + 900}, far inside stop_at 1787142067, so hard rule 8 does not bind. Firing is the pacer's job on the VPS (\`swarm-pacer.timer\`, which reads this field and stamps it forward by 7200s at spawn), not a ScheduleWakeup chain, which does not sustain across a headless \`-p\` session.\n\nrunfile-mirror:\n\`\`\`json\n${JSON.stringify(rf)}\n\`\`\`\n`;
fs.appendFileSync(`${DIR}/journal.md`, '\n' + block + wakeup);
fs.unlinkSync(`${DIR}/runs/c091-journal-block.md`);

console.log('backlog: ' + bl.items.length + ' items, todo=' + bl.items.filter((i) => i.status === 'todo').length);
console.log('state:   cycle ' + st.cycle + ' phase ' + st.phase + ' decisions ' + st.decisions.length);
console.log('runfile: heartbeat ts ' + now + ' next ' + NEXT + ' gear ' + rf.budget.gear);
console.log('journal: ' + fs.statSync(`${DIR}/journal.md`).size + ' bytes');
