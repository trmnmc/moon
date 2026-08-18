// cycle 94 — atomic persist of state.json (backlog.json is untouched this cycle unless
// items are passed in). Every write is .tmp + rename, per cycle.md step 7.
//
// Usage: node c094-persist.mjs <now-epoch> <phase> [--done]
import { readFileSync, writeFileSync, renameSync } from 'node:fs';

const T = '/opt/targets/moon';
const SP = `${T}/.swarm/state.json`;
const now = Number(process.argv[2]);
const phase = process.argv[3];
const iso = new Date(now * 1000).toISOString().replace('.000Z', '+00:00');

const s = JSON.parse(readFileSync(SP, 'utf8'));

s.cycle = 94;
s.phase = phase;

// burn attribution (cycle.md Multi-target failover, advisory): the window_tokens delta
// since the previous cycle is credited to the PREVIOUS cycle's target — same target here.
const PREV = 44442732, NOW_TOKENS = 54384781;
const delta = NOW_TOKENS - PREV;
s.counters.window_tokens_attributed = (s.counters.window_tokens_attributed ?? 0) + delta;
console.log(`burn attribution: +${delta.toLocaleString()} -> ${s.counters.window_tokens_attributed.toLocaleString()}`);

// consecutive_no_value: this cycle produced verified value (a whole claim class
// re-derived, a prior-record error corrected), so it stays 0.
s.counters.consecutive_no_value = 0;

s.decisions.push(
  {
    cycle: 94,
    what: 'The standing-claim audit cycle 93 queued was run INLINE by the conductor rather than dispatched. Reason recorded so it is not re-litigated: the work is mechanical re-derivation, which hard rule 2 makes the conductor\'s job regardless — dispatching it would have added a claim layer the conductor then had to strip. One agent WAS dispatched, for RECALL only (enumerate falsifiable doc claims, explicitly forbidden from returning verdicts), because the conductor\'s own grep is the narrow instrument that has failed four times in this project.',
  },
  {
    cycle: 94,
    what: 'Every standing checkable claim in README.md and REPORT.md re-derived against HEAD at run time: 15 claims, ZERO stale. Citations (test/render.test.js:829, test/astro.test.js:491/:294, src/astro.js:358/:281/:346, astro.js:71-74, bin/swarm-watchdog.sh:275-285), the KI-7 4000-point figure, the EAW glyph partition, the 5-9 column width claim, package.json shape, the KI-8 open shape, the KI-3 remote/push claim, and "source requires only node:* and sibling modules" all hold. Suite 175/175 green with coverage proven arithmetically (9 files sum to 175).',
  },
  {
    cycle: 94,
    what: 'FOUR instrument defects this cycle, all the conductor\'s own, all fixed with the failing passes kept on disk: (1) a TAP `# tests N` regex against node\'s `ℹ tests N` reporter, (2) a citation marker chosen from the wrong half of a two-line construct, (3) a hand-written six-file list standing in for the nine-file test_cmd glob — which made a 141-test subset read as the suite, (4) a coverage check that graded whether a FILENAME APPEARED IN PROSE. All four re-encode something the repo already states instead of asking the repo. This is L-043/L-045 violated by the conductor\'s own instruments, not by the repo\'s tests, and it is now the strongest candidate lesson of the run.',
  },
  {
    cycle: 94,
    what: 'RECORD CORRECTION: cycle 91\'s definition-of-done evidence line stated the repo root is exactly "README.md REPORT.md RETRO.md bin package.json src test". It omits .github/, which has held a CI workflow since cycle 22 (commit 00d411f) — the listing skipped dotfiles. The definition-of-done clause it supported (no lockfile, no node_modules) is unaffected and still holds; the evidence line was incomplete. This cycle\'s check lists dotfiles explicitly so the same omission cannot recur.',
  },
  {
    cycle: 94,
    what: 'NAMED GAP, deliberately NOT built: nothing in the suite pins the Meeus 49.a/49.b sub-second agreement, which REPORT.md:71 cites as the product\'s load-bearing correctness evidence. It fails this SPEC\'s two-source rule — it is neither a filed defect nor a lesson the repo violates — so building it would be manufactured work under a frozen contract. Reported as a gap for the owner and the next run, never as covered.',
  },
  {
    cycle: 94,
    what: 'The recall-only agent EARNED ITS DISPATCH, and this is the cycle\'s most useful finding about method. It enumerated 101 falsifiable claims and flagged five as possible rot; the conductor CONFIRMED FOUR with live evidence and REFUTED one. All four sit outside what the conductor\'s own grep reached, because the grep hunted numbers and citations while three of the four are FALSE RATIONALES and stale prose framings carrying no number at all. Splitting recall (agent) from truth (conductor) is what made them visible; a single instrument doing both would have scored a clean 15/15 and declared the target DONE over four real defects.',
  },
  {
    cycle: 94,
    what: 'NOT DONE. The definition of done remains fully met, but the second DONE condition fails again: four VALUE_LOOP candidates pass the ratchet and are filed as T-191 (README asserts the clone URL is withheld to avoid a 404 while the repo has a public working remote that REPORT.md already prints), T-192 (the KI-9 hand-off says the watchdog has been inert for three consecutive runs; the watchdog log shows it inert during run 4 at 16:41Z today, so four), T-193 (the adversarial review pass is described as "11 cycles old" — a bare decaying number, now 21), T-194 (REPORT.md\'s trailer claims a generation time four later cycles of edits falsified). T-191 and T-192 both mislead a reader about something they would act on.',
  },
  {
    cycle: 94,
    what: 'REFUTED, and recorded so it is not re-filed: the agent suspected REPORT.md:138\'s "state.json recorded last_review_fix_cycle: 23" was stale because the key is absent from state.json. The key EXISTS, nested as qa.last_review_fix_cycle = 73; the agent read only the top level. And the sentence is a parenthetical describing an EARLIER REVISION\'S error, correctly framed as history — a claim that names its own past reading cannot rot. Checked-and-clean, which this SPEC names as a valid reportable outcome.',
  },
);

s.last_cycle = {
  cycle: 94,
  ts: iso,
  work: 'VALUE_LOOP standing-claim audit (inline conductor re-derivation, 4 passes) + one recall-only Explore agent (101 claims enumerated)',
  outcome:
    'VERIFIED. 4 real defects found and FILED (T-191..T-194), 0 built — filing is this work type\'s output; the build wave is next cycle\'s. The conductor\'s own 15-claim mechanical sweep came back ZERO stale; all four defects came from the agent\'s 101-claim enumeration, because three of them are false RATIONALES carrying no number for a grep to catch. Suite 175/175 green with coverage proven arithmetically (9 files sum to 175). 4 conductor instrument defects found and fixed with the failing passes kept on disk. 1 prior-record error corrected (cycle 91\'s repo-root listing omitted .github). 1 agent suspicion refuted. NOT DONE: four candidates pass the ratchet.',
  commit: 'PENDING',
};

writeFileSync(SP + '.tmp', JSON.stringify(s, null, 2));
renameSync(SP + '.tmp', SP);
console.log(`state.json written: cycle ${s.cycle} phase ${s.phase} decisions ${s.decisions.length}`);
