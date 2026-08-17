// cycle 76 QA gate — conductor-authored AT VERIFICATION TIME.
// Nothing here was shown to the author, the executor or the look agent.
// Six checks: G1/G2 independently re-run two of the five scenarios; G3-G6 adjudicate
// the four look findings I intend to act on (or refuse).
'use strict';
const { execFileSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = '/opt/targets/moon';
const BIN = path.join(ROOT, 'bin', 'moon.js');
const { computeMoon } = require(path.join(ROOT, 'src', 'astro.js'));
const { detectHemisphere } = require(path.join(ROOT, 'src', 'hemisphere.js'));

let fails = 0;
const ok = (c, m) => { if (!c) fails++; console.log(`  [${c ? 'PASS' : 'FAIL'}] ${m}`); };
const run = (args, env) => {
  const r = spawnSync('node', [BIN, ...args], { cwd: ROOT, encoding: 'utf8', env: { ...process.env, ...(env || {}) } });
  return { code: r.status, out: r.stdout, err: r.stderr };
};
// count the final line even without a trailing newline
const lines = (s) => (s === '' ? 0 : s.replace(/\n$/, '').split('\n').length);

// ---------------------------------------------------------------- G1
// Re-run of scenario S4 (the flag-INTERACTION axis — the one axis the SPEC says no
// prior sweep covered). My own driver, my own counting, fresh invocations.
console.log('=== G1 — S4 re-run by the conductor: line-count contract + --block --compact ===');
{
  const d = run([]), c = run(['--compact']), b = run(['--block']), bc = run(['--block', '--compact']);
  for (const [n, r] of [['default', d], ['--compact', c], ['--block', b], ['--block --compact', bc]]) {
    ok(r.code === 0 && r.err === '', `${n}: exit 0 and stderr empty :: exit=${r.code} stderrBytes=${Buffer.byteLength(r.err)}`);
  }
  console.log(`    line counts: default=${lines(d.out)} compact=${lines(c.out)} block=${lines(b.out)} block+compact=${lines(bc.out)}`);
  ok(lines(d.out) === 2, `default is exactly 2 lines :: ${lines(d.out)}`);
  ok(lines(c.out) === 1, `--compact is exactly 1 line :: ${lines(c.out)}`);
  ok(lines(b.out) >= 3, `--block is >= 3 lines :: ${lines(b.out)}`);
  ok(lines(bc.out) === lines(b.out) - 1, `--block --compact drops EXACTLY one line :: ${lines(b.out)} -> ${lines(bc.out)}`);
  ok(bc.out !== c.out, '--block --compact is still a framed block, not the compact single line');
  // Discriminator the scenario did NOT ask for: prove the dropped line is the
  // next-full-moon line specifically, not merely "some" line. A --compact that
  // truncated the frame would also drop exactly one line and pass the count check.
  const bl = b.out.replace(/\n$/, '').split('\n');
  const bcl = bc.out.replace(/\n$/, '').split('\n');
  const dropped = bl.filter((l) => !bcl.includes(l));
  console.log(`    dropped line(s): ${JSON.stringify(dropped)}`);
  ok(dropped.length === 1 && /next full moon/i.test(dropped[0]),
    'the dropped line is the next-full-moon line, not a truncated frame row');
  ok(bcl.every((l) => bl.includes(l)), '--block --compact introduces no line --block did not have');
}

// ---------------------------------------------------------------- G2
// Spot-check of the AUTHOR'S DERIVATION (cycle.md step 6.7). The author derived
// illumination = (1 - cos e)/2 from the Domain rule k=(1+cos i)/2 with i = 180 - e.
// I re-derive it myself from the Domain rules and test it against a fresh invocation.
console.log('=== G2 — author derivation re-checked against the Domain rules ===');
{
  const r = run(['--json']);
  const j = JSON.parse(r.out);
  const e = j.phaseAngle;
  // Domain rule: k = (1 + cos i)/2, Meeus i = 180 deg at new. Contract: e = 0 at new.
  // So i = 180 - e, cos(180 - e) = -cos e, hence k = (1 - cos e)/2.
  const k = (1 - Math.cos((e * Math.PI) / 180)) / 2;
  const illErr = j.illumination - k;
  const cfErr = j.cycleFraction - e / 360;
  console.log(`    fresh: phase=${j.phase} e=${e} illum=${j.illumination} kFromDomainRule=${k.toFixed(6)}`);
  console.log(`    illErr=${illErr.toFixed(6)}  cfErr=${cfErr.toFixed(6)}  age=${j.age}`);
  ok(Math.abs(illErr) <= 0.011, `illumination matches the Domain-rule formula :: |${illErr.toFixed(6)}| <= 0.011`);
  ok(Math.abs(cfErr) <= 0.003, `cycleFraction = phaseAngle/360 :: |${cfErr.toFixed(6)}| <= 0.003`);
  // The author's own falsifiability claim, tested: the WRONG convention must be
  // discriminable at tonight's angle, else the check is vacuous tonight.
  const kWrong = (1 + Math.cos((e * Math.PI) / 180)) / 2;
  console.log(`    wrong-convention value would be ${kWrong.toFixed(6)} (delta ${Math.abs(kWrong - k).toFixed(4)})`);
  ok(Math.abs(kWrong - j.illumination) > 0.011,
    'the sign-flipped convention IS discriminated at tonight angle — the check is not vacuous');
  ok(j.age >= 0 && j.age < 29.84, `age inside the Domain-rule lunation bound :: ${j.age} < 29.84`);
}

// ---------------------------------------------------------------- G3
// Look finding 1 — REPORT.md test counts. The agent said 148 "does not match the tree".
// I check its framing too, not just its conclusion: 148 is a HISTORICAL claim about
// run 2 and may be legitimate; a how-to-run comment is a LIVE claim and may not be.
console.log('=== G3 — look finding 1: REPORT.md test-count claims ===');
{
  // INSTRUMENT REPAIR (first draft of this gate hand-typed six test filenames and
  // silently missed two — contracts.test.js and manifest.test.js — reading 143 where
  // the suite has 159. Fifth instance this run of my own instrument being narrower
  // than the thing it measures. The file list is now DERIVED, never typed, and the
  // repair is paid for with two strictly stronger assertions below.)
  const files = fs.readdirSync(path.join(ROOT, 'test')).filter((f) => f.endsWith('.test.js')).sort();
  console.log(`    test files (globbed, not typed): ${files.length} :: ${files.join(' ')}`);
  const counts = (s) => {
    const g = (k) => {
      const m = (s || '').match(new RegExp(`^[^\\n]*?[#ℹ] ${k} (\\d+)`, 'm'));
      return m ? Number(m[1]) : null;
    };
    return { tests: g('tests'), pass: g('pass'), fail: g('fail') };
  };
  const suite = spawnSync('node', ['--test', ...files.map((f) => `test/${f}`)], { cwd: ROOT, encoding: 'utf8' });
  const agg = counts(suite.stdout);
  const actual = agg.tests, pass = agg.pass, fail = agg.fail;
  console.log(`    suite now (aggregate): tests=${actual} pass=${pass} fail=${fail}`);
  // STRONGER #1: every figure must be genuinely PARSED. The first draft read
  // fail=undefined and still rendered a verdict; a null must now fail the gate.
  ok(actual !== null && pass !== null && fail !== null,
    `all three summary figures parsed from real output (no silent nulls) :: ${JSON.stringify(agg)}`);
  // STRONGER #2: sum the files independently and require it to equal the aggregate.
  // A runner that silently skips a file — the exact failure my typed list produced —
  // now cannot pass, because the two routes would disagree.
  let sum = 0;
  for (const f of files) {
    const one = spawnSync('node', ['--test', `test/${f}`], { cwd: ROOT, encoding: 'utf8' });
    const c = counts(one.stdout);
    sum += c.tests || 0;
    console.log(`      ${f}: tests=${c.tests} fail=${c.fail}`);
  }
  console.log(`    per-file sum=${sum}  aggregate=${actual}`);
  ok(sum === actual, `per-file sum equals the aggregate — no file silently skipped :: ${sum} vs ${actual}`);
  const rep = fs.readFileSync(path.join(ROOT, 'REPORT.md'), 'utf8').split('\n');
  const cite = (n) => `REPORT.md:${n}: ${rep[n - 1].trim()}`;
  console.log(`    ${cite(8)}`);
  console.log(`    ${cite(362)}`);
  console.log(`    ${cite(377)}`);
  ok(fail === 0, `suite is green :: tests=${actual} pass=${pass} fail=${fail}`);
  ok(actual >= 148, `suite is at or above the SPEC's 148-test floor :: ${actual}`);
  ok(/cycles 48.65/.test(rep[7]), 'line 8 is scoped to run 2 (cycles 48-65) — a HISTORICAL claim, not a live one');
  ok(/145 . \*\*148\*\*/.test(rep[376]), 'line 377 is a run-2 delta row — also historical');
  // The live one:
  ok(/node --test/.test(rep[361]) && /155 tests/.test(rep[361]),
    'line 362 is a HOW-TO-RUN command annotated "# 155 tests" — a live, output-cited claim');
  ok(155 !== 148 && 155 !== actual,
    `155 matches neither the document's own run-2 figure (148) nor the tree (${actual}) — stale in BOTH frames`);
}

// ---------------------------------------------------------------- G4
// Look finding 3 — the "~21 hours" cycleFraction bound. Already measured at 23.03 h by
// cycle 73 and filed as T-168 against README.md ALONE. The question this gate settles is
// narrower and is the part that is new: does the SHIPPING BINARY carry the same figure?
console.log('=== G4 — look finding 3: is the stale 21 h figure inside the product itself? ===');
{
  const src = fs.readFileSync(BIN, 'utf8').split('\n');
  const hits = src.map((l, i) => [i + 1, l]).filter(([, l]) => /21 hours/.test(l));
  hits.forEach(([n, l]) => console.log(`    bin/moon.js:${n}: ${l.trim()}`));
  ok(hits.length === 1, `the figure is inside bin/moon.js (the shipped --help text), not only in README :: ${hits.length} site(s)`);
  const help = run(['--help']);
  ok(help.code === 0 && /21 hours/.test(help.out),
    'and it is really EMITTED to the user by --help, not merely present in a source comment');
  const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8').split('\n');
  const rHits = readme.map((l, i) => [i + 1, l]).filter(([, l]) => /about 21 hours/.test(l));
  rHits.forEach(([n, l]) => console.log(`    README.md:${n}: ${l.trim()}`));
  ok(rHits.length >= 1, 'README carries it too (the site T-168 already covers)');
}

// ---------------------------------------------------------------- G5
// Look finding 2 — "the docs say 18:15 but the binary computes 18:13:43".
// This run has BEEN HERE: the cycle-29 decision entry records the conductor making
// exactly this claim and then REFUTING ITSELF. Two series, two answers. So this check
// does not ask "is 18:15 right" — it asks WHICH ROUTE each number comes from.
console.log('=== G5 — look finding 2: adjudicating 18:15 vs 18:13:43 against the cycle-29 record ===');
{
  const toISO = (jd) => new Date((jd - 2440587.5) * 86400000).toISOString();
  // Route A (ch.49 true-phase instant tables): newJD = julianDay - age.
  const probe = computeMoon(new Date('2000-01-10T00:00:00Z'));
  const routeA = probe.julianDay - probe.age;
  console.log(`    route A  ch.49 (julianDay - age)      : ${toISO(routeA)}`);
  // Route B (ch.48 elongation series): bisect the cycleFraction wrap 0.99.. -> 0.00..
  let lo = Date.parse('2000-01-06T12:00:00Z'), hi = Date.parse('2000-01-07T00:00:00Z');
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (computeMoon(new Date(mid)).cycleFraction > 0.5) lo = mid; else hi = mid;
  }
  const routeB = new Date((lo + hi) / 2).toISOString();
  console.log(`    route B  ch.48 (cycleFraction wrap)   : ${routeB}`);
  const aMin = toISO(routeA).slice(11, 16), bMin = routeB.slice(11, 16);
  console.log(`    published Meeus instant              : 2000-01-06T18:14 (README's cited source)`);
  ok(aMin === '18:13', `route A rounds to 18:14 and is NOT 18:15 :: ${aMin}`);
  ok(bMin === '18:15', `route B IS 18:15 — the docs' number is produced by the shipped code :: ${bMin}`);
  ok(Math.abs(Date.parse(routeB) - (routeA - 2440587.5) * 86400000 - 0) > 0,
    'the two routes disagree — the KI-7 two-series split, at an ordinary epoch');
  const gapSec = (Date.parse(routeB) - new Date((routeA - 2440587.5) * 86400000).getTime()) / 1000;
  console.log(`    gap between the two series: ${gapSec.toFixed(1)} s`);
  ok(gapSec > 90 && gapSec < 110, `gap reproduces cycle 29's measured 99.4 s :: ${gapSec.toFixed(1)} s`);
}

// ---------------------------------------------------------------- G6
// Look finding 4 — detectHemisphere('US/Samoa'). Verified at unit level by the agent;
// the part that decides whether it is a DEFECT or a non-observable is whether the
// shipped binary can ever reach it on any host.
console.log('=== G6 — look finding 4: the US/Samoa legacy alias ===');
{
  const got = detectHemisphere('US/Samoa');
  console.log(`    detectHemisphere('US/Samoa') -> ${got}   (Pago Pago is 14.28 S)`);
  ok(got === 'north', `the unit-level defect reproduces :: got ${got}, correct answer is south`);
  // Sibling legacy aliases the table DOES carry — proves the omission is a gap in an
  // existing defensive layer, not the absence of any such layer.
  for (const z of ['NZ', 'Brazil/East', 'Chile/Continental', 'Pacific/Samoa']) {
    console.log(`    detectHemisphere('${z}') -> ${detectHemisphere(z)}`);
  }
  ok(detectHemisphere('Pacific/Samoa') === 'south',
    'Pacific/Samoa (the SAME islands, the other legacy alias) IS handled — the omission is one row, not a missing layer');
  // Is it user-observable on this host?
  const live = run(['--json'], { TZ: 'US/Samoa' });
  const lj = JSON.parse(live.out);
  const icu = spawnSync('node', ['-e', 'process.stdout.write(Intl.DateTimeFormat().resolvedOptions().timeZone)'],
    { encoding: 'utf8', env: { ...process.env, TZ: 'US/Samoa' } }).stdout;
  console.log(`    TZ=US/Samoa -> ICU resolves to '${icu}' -> binary prints hemisphere '${lj.hemisphere}'`);
  ok(lj.hemisphere === 'south',
    'NOT user-observable on this host: ICU canonicalises before detection, so the live output is correct');
}

console.log(`\nGATE cycle 76: ${fails === 0 ? 'PASS' : 'FAIL'} (${fails} failed check(s))`);
process.exit(fails === 0 ? 0 : 1);
