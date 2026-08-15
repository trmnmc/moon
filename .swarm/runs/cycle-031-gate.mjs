// cycle 31 verification gate, part 2 — the checks that are not mutation-shaped.
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
const CWD = '/opt/targets/moon';
const sh = (c) => spawnSync('/bin/bash', ['-c', c], { cwd: CWD, encoding: 'utf8', maxBuffer: 40e6 });

console.log('=== C1  full suite, real counts ===');
const t = sh('node --test test/*.test.js 2>&1 | tail -12');
console.log(t.stdout.trim());
console.log(`suite exit = ${sh('node --test test/*.test.js >/dev/null 2>&1').status}`);

console.log('\n=== C2  behaviour frozen: src/args.js changed in COMMENTS ONLY ===');
const strip = (s) => s.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').trim();
const head = sh('git show HEAD:src/args.js').stdout;
const now = fs.readFileSync(CWD + '/src/args.js', 'utf8');
console.log(`code (comments+whitespace stripped) identical to HEAD: ${strip(head) === strip(now)}`);
console.log(`raw files differ (so the comment really did change):   ${head !== now}`);

console.log('\n=== C3  bin/moon.js, README.md, package.json byte-identical to HEAD ===');
for (const f of ['bin/moon.js', 'README.md', 'package.json']) {
  const same = sh(`git diff --quiet -- ${f}; echo $?`).stdout.trim() === '0';
  console.log(`  ${f.padEnd(14)} unchanged = ${same}`);
}

console.log('\n=== C4  zero new dependencies ===');
const pkg = JSON.parse(fs.readFileSync(CWD + '/package.json', 'utf8'));
console.log(`  dependencies=${JSON.stringify(pkg.dependencies ?? null)} devDependencies=${JSON.stringify(pkg.devDependencies ?? null)}`);
console.log(`  non-node: requires introduced in test/cli.test.js:`);
const reqs = [...fs.readFileSync(CWD + '/test/cli.test.js', 'utf8').matchAll(/require\('([^']+)'\)/g)].map((m) => m[1]);
console.log('   ', [...new Set(reqs)].join(', '));

console.log('\n=== C5  the hardcoded flag list is GONE, not stacked alongside ===');
const test = fs.readFileSync(CWD + '/test/cli.test.js', 'utf8');
console.log(`  old test name present:        ${test.includes('documents every flag it accepts')}`);
console.log(`  old literal array present:    ${/\['--json', '--block', '--compact'/.test(test)}`);
console.log(`  any literal flag-name array:  ${/\[\s*'--\w+',\s*'--\w+'/.test(test)}`);
console.log('  grep across all of test/ for the old name:');
console.log('   ', sh("grep -rn 'documents every flag' test/ || echo '(no hits)'").stdout.trim());

console.log('\n=== C6  what the three parsers actually extract right now ===');
const probe = sh(`node -e "
const fs=require('fs');const {HELP}=require('./bin/moon.js');
const src=fs.readFileSync('src/args.js','utf8');
const s=src.indexOf('const OPTIONS = {'),e=src.indexOf('\\n};',s);
const opts=[...src.slice(s,e).split('\\n')].map(l=>/^\\s*(\\w+):\\s*\\{/.exec(l)).filter(Boolean).map(m=>m[1]);
const hl=HELP.split('\\n');const hs=hl.findIndex(l=>l.trim()==='options');const help=[];
for(let i=hs+1;i<hl.length;i++){if(hl[i].trim()==='')break;const a=/^ {2}-h, --(\\S+)/.exec(hl[i])||/^ {2}--(\\S+)/.exec(hl[i]);if(a)help.push(a[1]);}
const rd=fs.readFileSync('README.md','utf8');const rs=rd.indexOf('## Options');const re2=rd.indexOf('\\n## ',rs+1);
const sec=rd.slice(rs,re2===-1?undefined:re2);const rm=[];
for(const l of sec.split('\\n')){const a=/^\\| \\\`-h\\\`, \\\`--(\\w+)\\\` \\|/.exec(l)||/^\\| \\\`--(\\w+)\\\` \\|/.exec(l);if(a)rm.push(a[1]);}
console.log('  OPTIONS:', opts.join(' '));
console.log('  HELP   :', help.join(' '));
console.log('  README :', rm.join(' '));
console.log('  counts :', opts.length, help.length, rm.length);
"`);
console.log(probe.stdout.trim() || probe.stderr.trim());

console.log('\n=== C7  working-tree scope ===');
console.log(sh('git status --porcelain').stdout.trim());
