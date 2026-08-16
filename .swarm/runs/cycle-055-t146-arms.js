'use strict';

/**
 * T-146 kill-attribution harness for L1 (src/render.js lineArt dark/hairline
 * boundary, `cover < 0.02` -> `cover < 0.05`).
 *
 * Runs both required arms against the CURRENT working tree:
 *
 *   Arm A (FAILABLE)    — apply the L1 mutation to src/render.js, run the
 *                          full suite with the TAP reporter, show the suite
 *                          goes RED and name which tests failed.
 *   Arm B (ATTRIBUTABLE) — with the mutation still applied, comment out only
 *                          the new test's assertion in test/render.test.js,
 *                          run again, show the suite goes GREEN. That proves
 *                          the Arm A kill belongs to the new assertion and
 *                          not to some other test.
 *
 * Both source files are restored to their original contents before this
 * script exits, success or failure (see the `finally` block), so it leaves
 * no stray mutation in the tree. It is safe to re-run from a clean tree.
 *
 * Usage:
 *   node .swarm/runs/cycle-055-t146-arms.js
 *   node .swarm/runs/cycle-055-t146-arms.js > .swarm/runs/cycle-055-t146-arms-out.txt 2>&1
 */

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const RENDER_PATH = path.join(ROOT, 'src', 'render.js');
const TEST_PATH = path.join(ROOT, 'test', 'render.test.js');

const RENDER_OLD = 'if (cover < 0.02) out += LIMB_DARK;';
const RENDER_NEW = 'if (cover < 0.05) out += LIMB_DARK;';

const ASSERT_LINE =
  "  assert.equal(renderLine(hairThin, 'north'), '░░░░▕   1%  waxing crescent');";
const ASSERT_LINE_COMMENTED =
  "  // assert.equal(renderLine(hairThin, 'north'), '░░░░▕   1%  waxing crescent'); // [T-146 arm B: disabled]";

function readOrig(p) {
  return fs.readFileSync(p, 'utf8');
}

function runSuiteTap() {
  try {
    const out = execSync('node --test --test-reporter=tap test/*.test.js', {
      cwd: ROOT,
      encoding: 'utf8',
      shell: '/bin/bash',
    });
    return { status: 0, output: out };
  } catch (err) {
    // execSync throws on non-zero exit; stdout/stderr are still captured.
    return { status: err.status, output: `${err.stdout || ''}${err.stderr || ''}` };
  }
}

function extractNotOkNames(tapOutput) {
    return tapOutput
      .split('\n')
      .filter((line) => /^not ok /.test(line.trim()))
      .map((line) => line.trim());
}

function main() {
  const renderOrig = readOrig(RENDER_PATH);
  const testOrig = readOrig(TEST_PATH);

  if (!renderOrig.includes(RENDER_OLD)) {
    throw new Error('L1 mutation anchor not found in src/render.js — file has drifted, aborting.');
  }
  if (!testOrig.includes(ASSERT_LINE)) {
    throw new Error('Expected new assertion line not found in test/render.test.js — aborting.');
  }

  let log = '';
  const say = (s) => {
    log += s + '\n';
    console.log(s);
  };

  try {
    // -----------------------------------------------------------------
    // Arm A — FAILABLE: apply the L1 mutation, new test present, expect RED.
    // -----------------------------------------------------------------
    say('='.repeat(78));
    say('ARM A — FAILABLE: L1 mutation applied, new test present. Expect RED.');
    say('='.repeat(78));

    fs.writeFileSync(RENDER_PATH, renderOrig.replace(RENDER_OLD, RENDER_NEW));
    const armA = runSuiteTap();
    say(armA.output);
    const armAFailures = extractNotOkNames(armA.output);
    say('--- Arm A summary ---');
    say(`exit status: ${armA.status} (nonzero = suite failed, as expected)`);
    say(`failing test lines (${armAFailures.length}):`);
    for (const line of armAFailures) say(`  ${line}`);

    // -----------------------------------------------------------------
    // Arm B — ATTRIBUTABLE: mutation STILL applied, comment out only the
    // new assertion, expect GREEN again.
    // -----------------------------------------------------------------
    say('');
    say('='.repeat(78));
    say('ARM B — ATTRIBUTABLE: L1 mutation still applied, new assertion');
    say('commented out. Expect GREEN (mutation survives again).');
    say('='.repeat(78));

    fs.writeFileSync(TEST_PATH, testOrig.replace(ASSERT_LINE, ASSERT_LINE_COMMENTED));
    const armB = runSuiteTap();
    say(armB.output);
    const armBFailures = extractNotOkNames(armB.output);
    say('--- Arm B summary ---');
    say(`exit status: ${armB.status} (zero = suite passed, as expected)`);
    say(`failing test lines (${armBFailures.length}):`);
    for (const line of armBFailures) say(`  ${line}`);

    say('');
    say('='.repeat(78));
    say('VERDICT');
    say('='.repeat(78));
    const armAKilled = armA.status !== 0 && armAFailures.length > 0;
    const armBGreen = armB.status === 0 && armBFailures.length === 0;
    say(`Arm A killed the mutant: ${armAKilled}`);
    say(`Arm B (assertion removed) is green again: ${armBGreen}`);
    say(`Attribution confirmed (Arm A red + Arm B green): ${armAKilled && armBGreen}`);
  } finally {
    // Always restore both files, whatever happened above.
    fs.writeFileSync(RENDER_PATH, renderOrig);
    fs.writeFileSync(TEST_PATH, testOrig);
    say('');
    say('(restored src/render.js and test/render.test.js to original contents)');
  }
}

main();
