// Non-vacuity probe for the cycle-19 gate: the C3 checks must FAIL against HEAD.
// A gate that also passes the un-fixed text is measuring nothing.
const { execFileSync } = require('child_process');
const git = (...a) => execFileSync('git', ['-C', '/opt/targets/moon', ...a], { encoding: 'utf8' });
const prose = (s) => s.replace(/^\s*\*\/?/gm, ' ').replace(/\/\*\*?/g, ' ').replace(/\s+/g, ' ').trim();
const HEAD = {
  'src/render.js': prose(git('show', 'HEAD:src/render.js').split('\n').slice(57, 66).join('\n')),
  'test/render.test.js': prose(git('show', 'HEAD:test/render.test.js').split('\n').slice(582, 593).join('\n')),
  'README.md': prose(git('show', 'HEAD:README.md').split('\n').slice(212, 218).join('\n')),
};
let vacuous = 0;
for (const [f, text] of Object.entries(HEAD)) {
  const b = text.includes('0.88');
  const c = /not only/i.test(text);
  console.log(f);
  console.log('  C3b (names 0.88) at HEAD : ' + b + (b ? '   <-- VACUOUS' : '   (correctly absent)'));
  console.log('  C3c (denies fully-lit)   : ' + c + (c ? '   <-- VACUOUS' : '   (correctly absent)'));
  console.log('  HEAD text: ' + text.slice(0, 200));
  if (b || c) vacuous++;
}
console.log('\n' + (vacuous === 0
  ? 'NON-VACUOUS: every C3 check fails against HEAD and passes only against the fix'
  : 'VACUOUS at ' + vacuous + ' site(s)'));
process.exit(vacuous === 0 ? 0 : 1);
