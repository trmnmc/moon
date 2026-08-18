#!/usr/bin/env node
// Sealed verification gate — cycle 96, target moon.
// Authored by the conductor BEFORE dispatch, stored OUTSIDE the target repo so no
// builder can read, locate or infer it. Hash recorded in the journal.
//
// Items under gate:
//   T-193 — REPORT.md's "adversarial review pass ... 11 cycles old" is a bare decaying count.
//   T-194 — REPORT.md's trailer claims a generation time that later edits falsified,
//           beside a tag line that implies HEAD sits at that tag.
//
// Design: every check is a DECAY SIMULATION, not a prose regex verdict.
// A claim passes only if it is still true when the clock is moved forward. A bare
// count passes at today's cycle and fails at a future one; a measurement-bound or
// self-dating claim passes at both. Each check also runs a CONTROL arm against
// HEAD's REPORT.md, which MUST fail — a check that cannot fail proves nothing.

import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const TARGET = '/opt/targets/moon';
const git = (...a) => execFileSync('git', ['-C', TARGET, ...a], { encoding: 'utf8' }).trim();

const results = [];
const record = (id, pass, detail) => {
  results.push({ id, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${id}  ${detail}`);
};

// ---------------------------------------------------------------- ground truth
// Re-derived at run time from the authoritative source (L-045), never inherited
// from the backlog item's `source` field, which was measured two cycles ago.
const state = JSON.parse(readFileSync(`${TARGET}/.swarm/state.json`, 'utf8'));
const LAST_REVIEW_FIX = state.qa.last_review_fix_cycle;   // authoritative: 73
const LIVE_CYCLE = 96;                                     // this cycle
const TAG = 'v0.1-improve3';
const TAG_DISTANCE = Number(git('rev-list', '--count', `${TAG}..HEAD`));
const LAST_REPORT_COMMIT = git('log', '-1', '--format=%ad', '--date=iso-strict', '--', 'REPORT.md');

console.log(`# ground truth re-derived at run time`);
console.log(`  last_review_fix_cycle = ${LAST_REVIEW_FIX}   live cycle = ${LIVE_CYCLE}   true age = ${LIVE_CYCLE - LAST_REVIEW_FIX}`);
console.log(`  ${TAG}..HEAD = ${TAG_DISTANCE} commits   REPORT.md last committed ${LAST_REPORT_COMMIT}`);
console.log('');

const now = readFileSync(`${TARGET}/REPORT.md`, 'utf8');
const head = git('show', 'HEAD:REPORT.md');

// ------------------------------------------------------------------- helpers
function sentenceAbout(text, needle) {
  // Sentences span source lines in this document; flatten first.
  const flat = text.replace(/\s*\n\s*/g, ' ');
  const parts = flat.split(/(?<=\.)\s+(?=[A-Z*(])/);
  return parts.find((s) => s.includes(needle)) || '';
}

function trailerOf(text) {
  const i = text.lastIndexOf('\n---\n');
  return i === -1 ? '' : text.slice(i + 5);
}

// ============================================================ T-193 predicate
// Returns true when the review-pass age claim is STILL TRUE at `atCycle`.
// Three admissible forms, per the item's acceptance clause:
//   (a) self-dating  — the sentence cites the pass's own cycle, reader subtracts
//   (b) bound        — an age figure carrying its own measurement point
//   (c) no figure    — the decaying number is simply gone
// A bare age integer with no binding is the defect, and fails at any future cycle.
function t193Holds(text, atCycle) {
  const s = sentenceAbout(text, 'adversarial review pass');
  if (!s) return { ok: false, why: 'no sentence mentions the adversarial review pass' };

  const selfDates = new RegExp(`cycle\\s+${LAST_REVIEW_FIX}\\b`).test(s);
  const mp = s.match(/(?:measured|as of|counted|stated)\s+(?:at\s+)?cycle\s+(\d+)/i);

  // Age integers: any bare number the reader would read as "N cycles old".
  const ages = [...s.matchAll(/(\d+)\s+cycles?\s+(?:old|stale|ago)/gi)].map((m) => Number(m[1]));

  if (ages.length === 0) {
    if (selfDates) return { ok: true, why: `no age figure; self-dates via "cycle ${LAST_REVIEW_FIX}"` };
    return { ok: false, why: 'no age figure and no citation of the pass\'s own cycle — the fact is gone, not fixed' };
  }

  if (mp) {
    const M = Number(mp[1]);
    if (M > atCycle) return { ok: false, why: `measurement point cycle ${M} is in the future of cycle ${atCycle}` };
    const expected = M - LAST_REVIEW_FIX;
    const bad = ages.filter((a) => a !== expected);
    if (bad.length) return { ok: false, why: `age ${bad.join(',')} != ${M} - ${LAST_REVIEW_FIX} = ${expected}` };
    return { ok: true, why: `age ${expected} bound to measurement point cycle ${M} — invariant as the clock advances` };
  }

  if (selfDates) {
    const expected = atCycle - LAST_REVIEW_FIX;
    const bad = ages.filter((a) => a !== expected);
    if (bad.length) return { ok: false, why: `bare age ${bad.join(',')} decays: true age at cycle ${atCycle} is ${expected}` };
    return { ok: true, why: `age ${expected} correct at cycle ${atCycle}` };
  }

  return { ok: false, why: `bare age ${ages.join(',')} with neither measurement point nor cycle-${LAST_REVIEW_FIX} citation` };
}

// ============================================================ T-194 predicate
// Returns true when the trailer's claims are STILL TRUE given `facts`.
// The trailer must not assert a document-generation time that later commits
// falsify, and must not imply HEAD sits at the tag.
function t194Holds(text, facts) {
  const t = trailerOf(text);
  if (!t) return { ok: false, why: 'no trailer found after the final rule' };

  // -- generation-time claim
  const stamp = t.match(/(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})/);
  if (stamp) {
    const claimed = `${stamp[1]}T${stamp[2]}`;
    const actual = facts.lastReportCommit.slice(0, 16);
    const scoped = /run\s*3|WRAP_UP\s+(?:of|for)\s+run|that\s+run/i.test(t);
    const acknowledgesEdits = /(edit|revis|amend|updat|chang)\w*\s+(?:since|later|after|by)|later\s+cycles?|subsequent\s+cycles?|git log/i.test(t);
    if (claimed !== actual && !(scoped && acknowledgesEdits)) {
      return {
        ok: false,
        why: `trailer states ${claimed} as the write time; REPORT.md was last committed ${actual}, and the stamp is not scoped to its run with later edits acknowledged`,
      };
    }
  }

  // -- tag claim: must not imply HEAD is at the tag
  const mentionsTag = t.includes(TAG);
  if (mentionsTag) {
    const distance = t.match(/(\d+)\s+commits?\s+(?:since|after|past|ahead|beyond)/i);
    const qualified = /since|after|past|ahead|beyond|moved on|no longer|later|HEAD is not/i.test(t);
    if (distance) {
      if (Number(distance[1]) !== facts.tagDistance) {
        return { ok: false, why: `trailer says ${distance[1]} commits past ${TAG}; git says ${facts.tagDistance}` };
      }
    } else if (!qualified) {
      return { ok: false, why: `trailer names ${TAG} with nothing signalling HEAD has moved past it` };
    }
  }

  return { ok: true, why: 'no falsified generation stamp; tag claim does not imply HEAD sits at the tag' };
}

// ==================================================================== T-193
{
  const live = t193Holds(now, LIVE_CYCLE);
  record('G1a T-193 true now', live.ok, live.why);

  // Decay simulation — the whole point of the item. Move the clock forward far
  // enough that any unbound count is wrong, and re-ask.
  const future = t193Holds(now, LIVE_CYCLE + 54);
  record('G1b T-193 survives clock advance to cycle 150', future.ok, future.why);

  // Control: the predicate MUST fail on HEAD, or it proves nothing.
  const ctl = t193Holds(head, LIVE_CYCLE);
  record('G1c control — predicate fires on HEAD', !ctl.ok, ctl.ok ? 'VACUOUS: HEAD passes too' : `HEAD correctly fails: ${ctl.why}`);

  // The falsified literal is gone, and was really there.
  record('G1d falsified literal removed', !/11\s+cycles\s+old/.test(now), '"11 cycles old" absent from working tree');
  record('G1e control — falsified literal present at HEAD', /11\s+cycles\s+old/.test(head), '"11 cycles old" present at HEAD');
}

// ==================================================================== T-194
{
  const facts = { tagDistance: TAG_DISTANCE, lastReportCommit: LAST_REPORT_COMMIT };
  const live = t194Holds(now, facts);
  record('G2a T-194 true now', live.ok, live.why);

  // Decay simulation: four more cycles edit REPORT.md and cut no tag.
  const later = t194Holds(now, { tagDistance: TAG_DISTANCE + 4, lastReportCommit: '2026-08-19T09:00:00+00:00' });
  record('G2b T-194 survives four further edits', later.ok, later.why);

  const ctl = t194Holds(head, facts);
  record('G2c control — predicate fires on HEAD', !ctl.ok, ctl.ok ? 'VACUOUS: HEAD passes too' : `HEAD correctly fails: ${ctl.why}`);

  record('G2d falsified stamp removed', !/Generated by \/swarm WRAP_UP at 2026-08-18 01:45 UTC/.test(now), 'the 01:45 generation claim is gone');
  record('G2e control — falsified stamp present at HEAD', /Generated by \/swarm WRAP_UP at 2026-08-18 01:45 UTC/.test(head), 'the 01:45 claim is present at HEAD');
}

// ============================================== structure untouched + suite
{
  const headings = (s) => (s.match(/^#/gm) || []).length;
  const tableLines = (s) => (s.match(/^\|/gm) || []).length;
  record('G3a heading count unchanged', headings(now) === headings(head), `${headings(head)} -> ${headings(now)}`);
  record('G3b table-line count unchanged', tableLines(now) === tableLines(head), `${tableLines(head)} -> ${tableLines(now)}`);

  const changedTableLines = (() => {
    const d = git('diff', '--unified=0', '--', 'REPORT.md');
    return d.split('\n').filter((l) => /^[+-]\|/.test(l)).length;
  })();
  record('G3c no issue-table row edited', changedTableLines === 0, `${changedTableLines} table lines changed`);

  const files = git('diff', '--name-only').split('\n').filter(Boolean);
  const strayCode = files.filter((f) => !f.startsWith('.swarm/') && f !== 'REPORT.md');
  record('G3d only REPORT.md touched outside .swarm', strayCode.length === 0, strayCode.length ? strayCode.join(',') : 'none');
}

// ---------------------------------------------------------------- verdict
const failed = results.filter((r) => !r.pass);
console.log('');
console.log(`# ${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) {
  console.log(`# GATE FAILED: ${failed.map((f) => f.id).join(', ')}`);
  process.exit(1);
}
console.log('# GATE PASSED');
