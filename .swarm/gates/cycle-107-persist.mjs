#!/usr/bin/env node
// cycle-107 persist — atomic writes of backlog.json and state.json (write .tmp, mv).
import { readFileSync, writeFileSync, renameSync } from 'node:fs';

const SW = '/opt/targets/moon/.swarm';
const atomic = (p, obj) => { writeFileSync(p + '.tmp', JSON.stringify(obj, null, 2) + '\n'); renameSync(p + '.tmp', p); };

// ---- backlog -------------------------------------------------------------
const backlog = JSON.parse(readFileSync(`${SW}/backlog.json`, 'utf8'));
for (const it of backlog.items) {
  if (it.id === 'T-210') {
    it.status = 'done';
    it.model = 'sonnet';
    it.notes += ' | CYCLE 107: PASSED, gate 18/18 (.swarm/gates/cycle-107-gate.mjs). Superseded rather than rewritten: '
      + 'the run-3 "six allow-list lines" sentence survives byte-identically (cell B1) and a dated clause naming run 6 / '
      + 'cycle 107 / four lines / both remaining scripts was appended inside the same physical row. Cell B8 MEASURED the '
      + 'ask against the live /opt/swarm/.claude/settings.json rather than checking that a number was stated: '
      + 'swarm-playbook.sh and swarm-warmup.sh have zero entries, swarm-budget.sh and swarm-notify.sh have entries, '
      + 'KI-2-OWNER-ACTION.md lists exactly 4 -> ask = 4. C1 is its refutation control (grant playbook in a copy, the '
      + 'ask reads 2). Line count 222 -> 222, bytes 24044 -> 24399 (cap 25586), zero new Bash( tokens.';
  }
  if (it.id === 'T-211') {
    it.status = 'done';
    it.files_hint = ['test/doc-counts.test.js', '.github/workflows/ci.yml'];
    it.notes += ' | CYCLE 107: PASSED, gate 14/14 (.swarm/gates/cycle-107b-gate.mjs) plus a separate shallow-clone '
      + 'degrade proof (.swarm/gates/cycle-107c-shallow.mjs). The escape hatch was NOT taken: the technique is packaged '
      + 'in the shipped suite. Diff is purely additive (473 insertions, 0 deletions), so the existing anchor-presence '
      + 'checks are mechanically unweakened. Proven four ways: E2 RED (the exact pre-cycle-106 false line now fails, '
      + 'and E3 shows the message names the measured 210 against the stated 208); E4 ATTRIBUTION (HEAD\'s version of '
      + 'the same file passes that identical mutation, so the kill belongs to the new code); E5 DISCRIMINATOR (a '
      + 'one-digit mutation of a TRUE count fails, which a string-matcher for one known-bad line could not do); E6 '
      + 'TRUE-NEGATIVE (a conductor-authored prose-only reword stays green). Recursion bounded at depth 1 via '
      + 'MOON_DOC_COUNTS_DEPTH and shown to BITE (E8: 172 ms depth-marked vs 8635 ms unguarded). Suite 208 -> 216 in '
      + '4.2 s -> 9.9 s. CI hazard handled with fetch-depth: 0 plus a loud runtime degrade, both verified.';
  }
}
const counts = backlog.items.reduce((a, i) => { a[i.status] = (a[i.status] || 0) + 1; return a; }, {});
atomic(`${SW}/backlog.json`, backlog);

// ---- state ---------------------------------------------------------------
const state = JSON.parse(readFileSync(`${SW}/state.json`, 'utf8'));
state.cycle = 107;
state.qa.last_build_wave_cycle = 107;
state.counters.consecutive_no_value = 0;
state.counters.consecutive_failures = 0;
state.counters.wave_streak = 0;          // hit 2 this cycle -> spent on the increment
state.counters.k_current = 3;            // min(5, 2+1); the gear-2 cap of 2 still binds
state.last_cycle = {
  n: 107,
  work: 'build-wave k=2, dispatched SEQUENTIALLY (T-210 REPORT.md KI-2 supersede; T-211 anchor-TRUTH repo test)',
  outcome: '2 verified, gates 18/18 + 14/14, 208 -> 216 green, 0 todo remaining',
};
state.backlog_counts = { done: counts.done || 0, dropped: counts.dropped || 0, todo: counts.todo || 0 };

state.decisions.push({
  cycle: 107,
  what: 'the wave\'s two items were dispatched SEQUENTIALLY inside one build-wave rather than concurrently, even though their write scopes are pairwise disjoint (REPORT.md vs test/doc-counts.test.js)',
  why: 'The disjoint-files rule in cycle.md step 4 is about WRITE collisions, and it was satisfied. What it does not cover is a READ dependency: four suites in this repo parse REPORT.md, and T-211\'s whole job was to author assertions ABOUT REPORT.md\'s content while T-210 was mutating that same file. Run concurrently in one working tree (headless dispatch has no worktrees), T-211\'s builder would have been measuring a moving document and its own verification runs would have flapped for reasons neither builder could see. Sequencing costs wall-clock, which this run has in abundance (21.5 h to stop_at) and cannot spend on anything else under a gear-2 cap of 2. Recorded because the rule as written would have permitted the concurrent dispatch, and the reason it was still wrong here generalises: disjoint WRITE scopes are not disjoint scopes when one item\'s subject matter is the other item\'s file.',
});
state.decisions.push({
  cycle: 107,
  what: 'T-210 was routed to sonnet against the routing table\'s haiku row for docs/S, under a gear whose posture is demote=true and with attempts at 0 (so the ladder offered no escalation)',
  why: 'This is a class-level override, not an item-level one, and it is worth naming as such because the run\'s standing rule (cycle 2) is that evidence about an ITEM outranks a budget posture. There is no item evidence here — T-210 had never been attempted. What there is instead is repo evidence: two haiku docs items on this repo have failed their gates (T-101 at cycle 2, T-108 at cycle 10), and cycle 10 recorded the open question in writing — whether pre-deciding an item\'s judgement calls is enough to keep docs work at haiku on THIS repo, or whether docs items here should simply open at sonnet. Cycle 10\'s own answer was that pre-deciding did NOT hold. T-210 carried three non-mechanical constraints at once (supersede-don\'t-rewrite, do-not-restate-the-four-lines, and a byte cap), which is more judgement than either failed item carried. One rung on one S-effort item is a small price for not re-running an experiment that has failed twice. It landed first-attempt with 18/18.',
});
state.decisions.push({
  cycle: 107,
  what: 'T-211 closes the anchor-presence-vs-anchor-truth gap in the SHIPPED suite; the two-sided acceptance\'s escape hatch (demonstrate infeasibility, document the limitation) was deliberately not offered as an equal option in the brief',
  why: 'doc-counts.test.js\'s own header comment asserts the constraint that "there is no non-recursive way for a test in this suite to learn the suite\'s OWN runtime test count", and three consecutive defects (cycles 104, 105, 106) rode on it. Cycle 106 refuted the premise empirically — git worktree add --detach <sha> plus node --test costs about four seconds per commit — but only inside a conductor-only artifact under .swarm/gates/. So by the time this item was dispatched, "impossible in principle" was already off the table and only the in-suite PACKAGING was open. Writing the brief as though both outcomes were equally live would have invited the cheaper one on a false premise. The two genuine difficulties were named instead and both were closed: recursion (bounded at depth 1 by an inherited env marker, shown to bite) and CI shallow checkout (fetch-depth: 0, plus a loud runtime skip that names the reason rather than reporting a clean scan).',
});
state.decisions.push({
  cycle: 107,
  what: 'the builder\'s explicit non-extension — the cycle-47 "147 tests / 146 pass" mutation-testing row and the cycle-80 "161 tests" note are NOT truth-checked — was ADJUDICATED as correct rather than filed as a follow-up gap',
  why: 'Both figures describe a THROWAWAY SCRATCH COPY\'s suite during a mutation experiment, not the state of a repo commit. Re-running the named commit\'s suite and comparing would therefore measure the wrong thing and would fail against a document that is telling the truth — a truth check there would be a defect, not a missing feature. They remain covered by the anchor-PRESENCE check, which is the correct guarantee for a figure whose measurement point is not a commit. Recorded rather than filed because the SPEC names CHURN as this run\'s chief risk and cycle 17 already established that filing a one-off row to re-word a true document is precisely that failure.',
});
state.decisions.push({
  cycle: 107,
  what: 'my own shallow-clone verdict parser read `# skipped N` only and missed node --test\'s `ℹ skipped 3`, reporting 0 skips against a transcript that plainly showed three. Twelfth instrument defect this target has caught in the conductor\'s own reporting; repaired, and the repair paid for with three strictly stronger assertions.',
  why: 'Same class as cycles 8 (.trim() eating porcelain\'s status column), 9 (sentence scope over an anaphoric claim), 19 (line-wrap blindness), 100, 101 — my regex narrower than the output it measures; here, one of node --test\'s two reporter formats. Under the standing precedent every widening is paid for: the parser now (1) requires every counted skip line to NAME shallowness in its own reason text rather than looking for the word anywhere in the output, (2) requires the skip COUNT to equal the number of such lines, and (3) adds a POSITIVE CONTROL that clones the repo with FULL history and requires zero skips — without which "skipped" could have been unconditional and the degrade path would have looked verified while proving nothing. The substantive conclusion never moved; only my verdict line was wrong, and it is corrected here rather than re-run until it agreed with me.',
});

atomic(`${SW}/state.json`, state);
console.log('backlog counts:', JSON.stringify(state.backlog_counts));
console.log('k_current:', state.counters.k_current, 'wave_streak:', state.counters.wave_streak);
