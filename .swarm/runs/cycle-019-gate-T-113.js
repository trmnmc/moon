// CONDUCTOR GATE CHECKS (cycle 19, T-113). Authored at verification time.
//
// v2 note (recorded so the repair is auditable, per the cycle-8/9 precedent on this run):
// run 1 flagged C4a/C4b/C4c. All three were defects in THIS instrument, not the artifact:
//   - C4a swept `git ls-files`, so it hit .swarm/backlog.json, .swarm/journal.md and
//     .swarm/runs/cycle-012-verify-T-112.txt -- the RECORD of the defect, which must keep
//     the phrase to stay legible. Product scope is src/ + test/ + README.md + REPORT.md.
//   - C4b/C4c matched literal strings containing spaces, but the edit reflowed both
//     passages, so "East Asian\nWidth class" and "has not\n * been established" now span
//     line breaks (and a comment leader). Line-wrap blindness.
// Both repairs WIDEN what the check can see, so each is paired with a strictly stronger
// assertion that run 1 did not make (C4a: per-file + a family of volitional variants;
// C4d: the test comment must assert README's OWN extracted predicate, not a string I
// chose; C4e: no volitional verb may be attributed to the README). C4f then falsifies the
// normalizer itself by requiring the same checks to FAIL against HEAD.
//
// C1 scope   : every changed line in the two .js files is a comment line
// C2 numbers : every numeric token on an added line is the constant the source uses
// C3 claim   : the prose threshold equals the literal in the lineArt branch, at all 3 sites
// C4 attrib  : the false attribution is gone from the product; the test comment states
//              README's actual predicate, with no volitional verb
// C5 english : no British spelling introduced
// C6 reflow  : every clause of the pre-existing README paragraph survives
const { execFileSync } = require('child_process');
const fs = require('fs');
const ROOT = '/opt/targets/moon';
const git = (...a) => execFileSync('git', ['-C', ROOT, ...a], { encoding: 'utf8' });
let fail = 0;
const chk = (id, ok, msg) => { console.log((ok ? 'PASS ' : 'FAIL ') + id + ': ' + msg); if (!ok) fail++; };

// Normalizer: strip JS comment leaders, collapse all whitespace. Used ONLY for prose
// claims; never for scope or code-identity checks.
const prose = (s) => s.replace(/^\s*\*\/?/gm, ' ').replace(/\/\*\*?/g, ' ').replace(/\s+/g, ' ').trim();

const diff = git('diff', '-U0');
let file = null;
const added = [], removed = [], nonComment = [];
for (const l of diff.split('\n')) {
  const m = l.match(/^\+\+\+ b\/(.*)$/); if (m) { file = m[1]; continue; }
  if (/^[+-]{3}/.test(l) || /^@@/.test(l) || /^diff |^index /.test(l)) continue;
  if (l.startsWith('+')) { added.push([file, l.slice(1)]);
    if (file.endsWith('.js') && !/^\s*(\*|\/\*|\/\/)/.test(l.slice(1))) nonComment.push([file, l.slice(1)]); }
  if (l.startsWith('-')) { removed.push([file, l.slice(1)]);
    if (file.endsWith('.js') && !/^\s*(\*|\/\*|\/\/)/.test(l.slice(1))) nonComment.push([file, l.slice(1)]); }
}

// --- C1 scope ---
const files = [...new Set([...added, ...removed].map(([f]) => f))].sort();
chk('C1a', files.join(',') === 'README.md,src/render.js,test/render.test.js',
  'files changed = ' + files.join(', '));
chk('C1b', nonComment.length === 0,
  'non-comment lines touched in .js files = ' + nonComment.length +
  (nonComment.length ? ' -> ' + JSON.stringify(nonComment) : ''));
for (const f of ['src/render.js', 'test/render.test.js']) {
  const strip = (s) => s.split('\n').filter(l => !/^\s*(\*|\/\*\*?|\*\/|\/\/)/.test(l)).join('\n');
  chk('C1c:' + f, strip(git('show', 'HEAD:' + f)) === strip(fs.readFileSync(ROOT + '/' + f, 'utf8')),
    'code (comment lines stripped) byte-identical to HEAD');
}

// --- C3a: the literal the branch actually uses ---
const rsrc = fs.readFileSync(ROOT + '/src/render.js', 'utf8');
const branch = rsrc.match(/else if \(cover < ([0-9.]+)\) out \+= HALF/);
chk('C3a', !!branch, 'lineArt HALF/ROUND_LIMB threshold literal found = ' + (branch && branch[1]));
const THRESH = branch ? branch[1] : null;

// --- C2 numbers ---
const carried = new Set();
for (const [, t] of removed) for (const n of (t.match(/\d[\d.]*/g) || [])) carried.add(n);
const badNums = [];
for (const [f, t] of added) for (const n of (t.match(/\d[\d.]*/g) || []))
  if (n !== THRESH && !carried.has(n)) badNums.push([f, n, t.trim()]);
chk('C2', badNums.length === 0,
  'unsourced numeric tokens on added lines = ' + badNums.length +
  (badNums.length ? ' -> ' + JSON.stringify(badNums) : ' (only ' + THRESH + ' + tokens carried over by reflow)'));

// --- C3b/c: all three sites ---
const tsrc = fs.readFileSync(ROOT + '/test/render.test.js', 'utf8');
const readme = fs.readFileSync(ROOT + '/README.md', 'utf8');
const sites = {
  'src/render.js': prose(rsrc.split('\n').slice(57, 66).join('\n')),
  'test/render.test.js': prose(tsrc.split('\n').slice(582, 593).join('\n')),
  'README.md': prose(readme.split('\n').slice(212, 218).join('\n')),
};
for (const [f, text] of Object.entries(sites)) {
  chk('C3b:' + f, text.includes(THRESH), 'passage names the source threshold ' + THRESH);
  chk('C3c:' + f, /not only/i.test(text), 'passage explicitly denies the fully-lit-only reading');
}

// --- C4 attribution ---
const PRODUCT = ['src/render.js', 'test/render.test.js', 'README.md', 'REPORT.md'];
const VOLITIONAL = /(declines?|refus\w+|chooses?|opts?|deliberately|intentionally|explicitly)\s+(to\s+)?(establish|classif\w+)/i;
for (const f of PRODUCT) {
  const body = prose(fs.readFileSync(ROOT + '/' + f, 'utf8'));
  chk('C4a:' + f, !/declines to establish/i.test(body), 'no "declines to establish"');
  chk('C4b:' + f, !VOLITIONAL.test(body),
    'no volitional establish/classify attribution' + (VOLITIONAL.test(body) ? ' -> ' + body.match(VOLITIONAL)[0] : ''));
}
// C4c: README's OWN predicate, extracted (not a string the conductor chose).
const rp = prose(readme).match(/This repo (has not established|[a-z ]{0,40}) their East Asian Width class/i);
chk('C4c', !!rp, 'README predicate about the round limbs\' EAW class extracted = ' + (rp && JSON.stringify(rp[1])));
// C4d: the test comment must assert the SAME predicate with the same polarity.
const tc = sites['test/render.test.js'];
const negated = /(has not been established|has not established|not been established)/i.test(tc);
const readmeNegated = !!rp && /has not/i.test(rp[1]);
chk('C4d', negated && readmeNegated && /README names them/i.test(tc),
  'test comment attributes to README the same negated "established" predicate README states');
// C4e: and attributes no refusal.
chk('C4e', !VOLITIONAL.test(tc), 'test comment attributes no deliberate refusal to the README');

// --- C4f: falsify the normalizer. The same C4 checks must FAIL against HEAD, where the
// test comment still says "declines to establish". If they pass there, prose() is
// manufacturing matches and the whole C4 block is worthless.
const headTc = prose(git('show', 'HEAD:test/render.test.js').split('\n').slice(582, 593).join('\n'));
chk('C4f', /declines to establish/i.test(headTc) && VOLITIONAL.test(headTc),
  'instrument falsified: the SAME checks still catch the old wording at HEAD');

// --- C5 ---
chk('C5', !added.some(([, t]) => /behaviour|colour(?!ed by)/i.test(t)), 'no British spelling on an added line');

// --- C6 reflow: every clause of the old paragraph survives ---
const CLAUSES = ['Geometric Shapes, not Block Elements', 'outside the Neutral/Ambiguous partition above',
  'This repo has not established their East Asian Width class',
  'whether they widen the disc in an ambiguous-width terminal is unknown',
  'The disc also draws round-limb glyphs'];
const newPara = prose(readme.split('\n').slice(213, 217).join('\n'));
const lost = CLAUSES.filter(c => !newPara.includes(c));
chk('C6', lost.length === 0, 'clauses of the pre-existing paragraph lost to the reflow = ' + JSON.stringify(lost));

console.log('\n' + (fail === 0 ? 'GATE: all checks PASS' : 'GATE: ' + fail + ' CHECK(S) FAILED'));
process.exit(fail === 0 ? 0 : 1);
