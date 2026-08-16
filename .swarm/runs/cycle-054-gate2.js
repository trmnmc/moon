#!/usr/bin/env node
'use strict';

/**
 * Cycle 54 gate, part 2 — ATTRIBUTION for the two named-behavior kills.
 *
 * Part 1 (cycle-054-gate.js) proved AG1 and CI1 go RED, but parsed for TAP `not ok`
 * lines while Node 24 defaults to the spec reporter, so it named zero killing tests.
 * "A kill you cannot attribute is not evidence" is this run's own standing rule, so
 * this re-runs the same two mutants with --test-reporter=tap and names the tests.
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');

const REPO = path.resolve(__dirname, '..', '..');
const pristineSrc = fs.readFileSync(path.join(REPO, 'src', 'astro.js'), 'utf8');
const TEST_FILES = fs
  .readdirSync(path.join(REPO, 'test'))
  .filter((f) => f.endsWith('.test.js'))
  .sort();

function freshCopy() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'moon-gate2-'));
  const archive = execFileSync('git', ['archive', 'HEAD'], { cwd: REPO, maxBuffer: 64 * 1024 * 1024 });
  execFileSync('tar', ['-x', '-C', dir], { input: archive });
  return dir;
}

function attribute(tag, find, replace) {
  console.log(`=== ${tag} ===`);
  const n = pristineSrc.split(find).length - 1;
  if (n !== 1) throw new Error(`${tag}: find occurs ${n} times`);
  const dir = freshCopy();
  try {
    fs.writeFileSync(path.join(dir, 'src', 'astro.js'), pristineSrc.split(find).join(replace), 'utf8');
    const named = [];
    for (const f of TEST_FILES) {
      const r = spawnSync(
        process.execPath,
        ['--test', '--test-reporter=tap', `test/${f}`],
        { cwd: dir, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
      );
      for (const line of (r.stdout + r.stderr).split('\n')) {
        const m = /^\s*not ok \d+ - (.+?)\s*$/.exec(line);
        if (m && !/^Subtest/.test(m[1])) named.push(`${f} :: ${m[1]}`);
      }
    }
    console.log(`  killing tests (${named.length}):`);
    for (const t of named) console.log(`    - ${t}`);
    console.log('');
    return named;
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

attribute(
  'AG1 — age re-clamped to SYNODIC_MONTH',
  `const age = jd - instants[0][0];`,
  `const age = Math.min(jd - instants[0][0], SYNODIC_MONTH);`,
);

attribute(
  'CI1 — cycleFraction re-derived FROM illumination',
  `const cycleFraction = phaseAngle / 360;`,
  `const cycleFraction = illumination;`,
);
