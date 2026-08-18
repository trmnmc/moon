// Sealed verification gate — cycle 88, item T-184.
// Authored by the CONDUCTOR before dispatch; never shown to the builder (hard rule 2).
// Run from the target root: node .swarm/gates/cycle-088-T-184.mjs
//
// T-184 acceptance (restated, not copied from the builder's notes):
//   a first-time reader scrolling REPORT.md from the top reaches what-it-is /
//   how-to-run / what-is-verified / known-issues within roughly one terminal screen,
//   WITHOUT first passing through the cycle-by-cycle run change logs; the forensic
//   detail survives IN FULL in a dated archive (archival, never deletion); and
//   test/report-issues.test.js still passes with its assertions unweakened.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const ROOT = '/opt/targets/moon';
const ARCHIVE = `${ROOT}/.swarm/REPORT-ARCHIVE-2026-08-18.md`;
const REPORT = `${ROOT}/REPORT.md`;
const GATEFILE = `${ROOT}/test/report-issues.test.js`;
const FIRST_SCREEN = 60; // "roughly one terminal screen", generously read

const FORENSIC_HEADING = /^## (What improvement run |Why run |Operational findings |Run \d+ stats|Defects found)/;

let pass = 0, fail = 0;
const say = (ok, label, extra) => {
  if (ok) { pass++; console.log(`PASS  ${label}`); }
  else { fail++; console.log(`FAIL  ${label}`); }
  if (extra) console.log(`      ${extra}`);
};
const note = (s) => console.log(`  ${s}`);

const git = (args) => execFileSync('git', ['-C', ROOT, ...args], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const headFile = (p) => { try { return git(['show', `HEAD:${p}`]); } catch { return null; } };

const headReport = headFile('REPORT.md');
const newReport = fs.existsSync(REPORT) ? fs.readFileSync(REPORT, 'utf8') : null;
const archive = fs.existsSync(ARCHIVE) ? fs.readFileSync(ARCHIVE, 'utf8') : null;

// ---- C0 non-vacuity: HEAD really carried the defect this item exists to fix ----
{
  const hl = (headReport || '').split('\n');
  const kiHead = hl.findIndex((l) => /^## Known issues \(\d+\)\s*$/.test(l));
  const runHead = hl.findIndex((l) => /^## How to run it\s*$/.test(l));
  const forHead = hl.findIndex((l) => FORENSIC_HEADING.test(l));
  note(`C0 HEAD: Known issues line ${kiHead + 1}, How to run it line ${runHead + 1}, first forensic heading line ${forHead + 1}, bytes ${Buffer.byteLength(headReport || '')}`);
  say(kiHead > 200 && runHead > 500 && forHead >= 0 && forHead < kiHead,
    'C0 defect present at HEAD (fix is non-vacuous)');
}

// ---- C1 archive exists and is substantial ----
{
  const bytes = archive ? Buffer.byteLength(archive) : 0;
  note(`C1 archive bytes = ${bytes}`);
  say(archive !== null && bytes > 15000, 'C1 dated archive exists and is substantial (>15 KB)');
}

// ---- C2 archival, never deletion: no substantive HEAD line is orphaned ----
// Every trimmed non-empty line of HEAD REPORT.md that is >= 40 chars (i.e. real prose or
// a real table row, not "---" / "```" / a short heading) must survive verbatim in the new
// REPORT.md or in the archive. Short structural fragments are excluded on purpose so the
// check measures CONTENT loss, not reflow.
{
  const survivors = new Set();
  for (const l of ((newReport || '') + '\n' + (archive || '')).split('\n')) {
    const t = l.trim();
    if (t) survivors.add(t);
  }
  const orphans = [];
  for (const l of (headReport || '').split('\n')) {
    const t = l.trim();
    if (t.length >= 40 && !survivors.has(t)) orphans.push(t);
  }
  note(`C2 substantive HEAD lines orphaned = ${orphans.length}`);
  for (const o of orphans.slice(0, 12)) note(`      ORPHAN: ${o.slice(0, 110)}`);
  say(orphans.length === 0, 'C2 every substantive HEAD line survives in REPORT.md or the archive');
}

// ---- C3 first screen carries all four anchors ----
{
  const lines = (newReport || '').split('\n').slice(0, FIRST_SCREEN);
  const head = lines.join('\n');
  const anchors = {
    'what-it-is (names the CLI)': /zero-dependency Node CLI|prints the (current )?phase of the moon/i.test(head),
    'how-to-run (a runnable command)': /node bin\/moon\.js/.test(head),
    'what-is-verified': lines.some((l) => /^#{2,3} .*verified/i.test(l)),
    'known-issues heading': lines.some((l) => /^## Known issues \(\d+\)\s*$/.test(l)),
  };
  for (const [k, v] of Object.entries(anchors)) note(`C3 ${v ? 'found' : 'MISSING'}: ${k}`);
  say(Object.values(anchors).every(Boolean), `C3 all four anchors within the first ${FIRST_SCREEN} lines`);
}

// ---- C4 no forensic change-log precedes the anchors ----
{
  const lines = (newReport || '').split('\n');
  const ki = lines.findIndex((l) => /^## Known issues \(\d+\)\s*$/.test(l));
  const forensic = lines.findIndex((l) => FORENSIC_HEADING.test(l));
  note(`C4 new REPORT.md: Known issues line ${ki + 1}, first forensic heading line ${forensic === -1 ? 'none' : forensic + 1}`);
  if (forensic !== -1) note(`      first forensic heading: ${lines[forensic]}`);
  say(ki !== -1 && (forensic === -1 || forensic > ki),
    'C4 the reader reaches known-issues before any run change log / stop postmortem / ops findings');
}

// ---- C5 the archive is findable from REPORT.md ----
{
  const ok = /REPORT-ARCHIVE-2026-08-18\.md/.test(newReport || '');
  say(ok, 'C5 REPORT.md points at the archive by filename (archival, not disappearance)');
}

// ---- C6 the report-issues gate is not weakened ----
{
  const headGate = headFile('test/report-issues.test.js') || '';
  const newGate = fs.existsSync(GATEFILE) ? fs.readFileSync(GATEFILE, 'utf8') : '';
  const count = (s, re) => (s.match(re) || []).length;
  const hA = count(headGate, /\bassert\./g), nA = count(newGate, /\bassert\./g);
  const hT = count(headGate, /^test\(/gm), nT = count(newGate, /^test\(/gm);
  const changed = headGate !== newGate;
  note(`C6 report-issues.test.js changed=${changed} · assert calls ${hA} -> ${nA} · test blocks ${hT} -> ${nT}`);
  if (changed) {
    note('      DIFF (conductor must judge it by eye; counts alone cannot prove "unweakened"):');
    try {
      for (const l of git(['diff', 'HEAD', '--', 'test/report-issues.test.js']).split('\n').slice(0, 60)) note(`      ${l}`);
    } catch { note('      (diff unavailable)'); }
  }
  say(nA >= hA && nT >= hT, 'C6 report-issues.test.js assertion and test-block counts did not decrease');
}

// ---- C7 scope: which non-.swarm files moved ----
{
  let changedFiles = [];
  try {
    changedFiles = git(['diff', '--name-only', 'HEAD']).split('\n').map((s) => s.trim()).filter(Boolean);
  } catch { /* ignore */ }
  const nonSwarm = changedFiles.filter((f) => !f.startsWith('.swarm/'));
  const allowed = new Set(['REPORT.md', 'test/report-issues.test.js']);
  note(`C7 non-.swarm files changed: [${nonSwarm.join(', ')}]`);
  say(nonSwarm.every((f) => allowed.has(f)), 'C7 blast radius confined to REPORT.md (+ the gate file, if fixed)');
}

// ---- C8 full suite green, with an instrument-failure-aware parser ----
// node v24's spec reporter prefixes its summary with U+2139, not '#'. Parsing must not
// assume either: an unreadable reporter reads as INSTRUMENT FAILURE, never as a pass.
{
  // The subject list is READ FROM DISK, never enumerated from memory: a hardcoded list
  // silently runs a subset when a test file is added, which reads as a smaller suite
  // rather than as an error. (First authoring of this gate did exactly that.)
  const files = fs.readdirSync(`${ROOT}/test`).filter((f) => f.endsWith('.test.js')).sort();
  note(`C8 subjects read from disk: ${files.length} files [${files.join(', ')}]`);
  let out = '';
  try {
    out = execFileSync('node', ['--test', ...files.map((f) => `test/${f}`)],
      { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) { out = `${e.stdout || ''}${e.stderr || ''}`; }
  const num = (k) => { const m = out.match(new RegExp(`^\\D*\\s${k}\\s+(\\d+)\\s*$`, 'm')); return m ? Number(m[1]) : null; };
  const tests = num('tests'), passed = num('pass'), failed = num('fail');
  note(`C8 parsed: tests=${tests} pass=${passed} fail=${failed}`);
  const parsedOk = tests !== null && passed !== null && failed !== null;
  if (!parsedOk) note('      INSTRUMENT FAILURE — summary unparseable; this is NOT a pass');
  say(parsedOk && failed === 0 && passed === tests && tests >= 171,
    'C8 full suite green (fail=0, pass==tests, tests >= 171 — no test deleted)');
}

console.log(`---- GATE: ${pass} passed, ${fail} failed ----`);
process.exit(fail === 0 ? 0 : 1);
