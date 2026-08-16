#!/usr/bin/env node
'use strict';

/**
 * cycle 53 — CONDUCTOR'S INDEPENDENT GATE for T-144.
 *
 * Authored by the conductor at verification time, before reading the builder's
 * classification report, and deliberately NOT derived from the builder's harness.
 * Its purpose is to re-derive, from scratch, the one judgement that matters:
 * for each SURVIVING mutant, is it observably different from the truth?
 *
 *   HOLE     — a witness exists on the reachable domain (this script prints it).
 *   BOUNDARY — no witness can exist. This script can NEVER prove that; it can only
 *              report "no difference over a domain of size N, enumerated as follows".
 *              That report is INPUT to the conductor's judgement, never the verdict.
 *
 * The cycle-52 lesson this encodes: "I looked and found no difference" is not a
 * BOUNDARY. So every no-difference result is printed WITH its domain size and the
 * domain's construction, so the conductor can ask "did I look where it could differ?"
 *
 * Both modules under test are pure, dependency-free and enumerable, so the domains
 * below are exhaustive over a stated finite space rather than sampled — and both
 * terminate in well under a second.
 *
 * Usage:  node .swarm/runs/cycle-053-gate.js .swarm/runs/cycle-053-mutants.json
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');

// ---------------------------------------------------------------------------
// Domains — exhaustive over a finite, stated space
// ---------------------------------------------------------------------------

/**
 * argv domain: every sequence of length 0..3 drawn from an alphabet that includes
 * each accepted flag, the short form, both hemisphere flags (so last-one-wins is
 * visited in both orders and in repeats), and each malformed shape that reaches a
 * distinct EUSAGE branch.  11 tokens -> 1 + 11 + 121 + 1331 = 1464 cases.
 */
function argvDomain() {
  const ALPHABET = [
    '--json',
    '--south',
    '--north',
    '--block',
    '--compact',
    '--help',
    '-h',
    '--bogus', // ERR_PARSE_ARGS_UNKNOWN_OPTION
    'positional', // ERR_PARSE_ARGS_UNEXPECTED_POSITIONAL
    '--json=1', // ERR_PARSE_ARGS_INVALID_OPTION_VALUE
    '--', // terminator
  ];
  const cases = [[]];
  let frontier = [[]];
  for (let len = 1; len <= 3; len++) {
    const next = [];
    for (const seq of frontier) {
      for (const tok of ALPHABET) next.push([...seq, tok]);
    }
    cases.push(...next);
    frontier = next;
  }
  // Plus the documented no-argv call.
  cases.push(undefined);
  return cases;
}

/**
 * timezone domain: every key the real table can be asked about, built by READING
 * the pristine source's own table literals (so the domain cannot silently miss a
 * zone), plus each documented northern counter-example named in its comments, plus
 * prefix probes, case/whitespace variants, and every non-string shape the contract
 * says resolves to the default.
 */
function zoneDomain(pristineHemisphereSrc) {
  const zones = new Set();

  // Every quoted lowercase zone-ish literal in the source: this sweeps
  // NORTHERN_ZONES, SOUTHERN_ZONES and SOUTHERN_PREFIXES without hardcoding them.
  for (const m of pristineHemisphereSrc.matchAll(/'([a-z0-9_+\-/]+)'/g)) {
    zones.add(m[1]);
    if (m[1].endsWith('/')) {
      // prefix -> probe a member and a near-miss
      zones.add(m[1] + 'somewhere');
      zones.add(m[1].slice(0, -1));
    }
  }

  // Documented northern counter-examples (from the source's own NOTE comments).
  // These are the zones a table edit is most likely to swallow.
  for (const z of [
    'africa/lagos', 'africa/kampala', 'africa/libreville', 'africa/sao_tome',
    'africa/mogadishu', 'africa/juba', 'africa/douala', 'africa/malabo',
    'africa/bangui', 'africa/accra', 'africa/abidjan', 'africa/cairo',
    'america/bogota', 'america/caracas', 'america/boa_vista', 'america/guyana',
    'america/paramaribo', 'america/cayenne', 'america/panama', 'america/new_york',
    'asia/singapore', 'asia/kuching', 'asia/kuala_lumpur', 'asia/brunei',
    'asia/manila', 'asia/colombo', 'asia/tokyo',
    'pacific/tarawa', 'pacific/kiritimati', 'pacific/honolulu', 'pacific/guam',
    'pacific/majuro', 'pacific/chuuk', 'pacific/pohnpei', 'pacific/kosrae',
    'pacific/palau', 'pacific/wake',
    'indian/maldives', 'indian/mauritius', 'indian/reunion',
    'europe/london', 'utc', 'gmt', 'etc/gmt+5', 'etc/utc',
  ]) zones.add(z);

  const out = [];
  for (const z of zones) {
    out.push(z);
    out.push(z.toUpperCase());
    // Mixed case as real hosts report it, e.g. "america/Lima".
    out.push(z.replace(/\/([a-z])/, (_, c) => '/' + c.toUpperCase()));
    out.push('  ' + z + '  ');
  }
  // Non-string and edge shapes the contract routes to DEFAULT_HEMISPHERE.
  out.push('', '   ', 'not/a/zone', 'south', 'antarctica', undefined, null, 123, {}, [], true, NaN);
  return out;
}

// ---------------------------------------------------------------------------
// Module loading
// ---------------------------------------------------------------------------

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'moon-c53-gate-'));
let loadCounter = 0;

/** Load a module from a source STRING, fresh, with no cache reuse. */
function loadFromSource(src, basename) {
  const file = path.join(tmpRoot, `${basename}-${loadCounter++}.js`);
  fs.writeFileSync(file, src, 'utf8');
  return require(file);
}

/** Deterministic, total stringification so any two outputs are comparable. */
function show(v) {
  if (v instanceof Error) return `${v.code || v.name}: ${v.message}`;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function callArgs(mod, argv) {
  try {
    return show(mod.parseArgs(argv));
  } catch (err) {
    return show(err);
  }
}

function callZone(mod, zone) {
  try {
    return show(mod.detectHemisphere(zone));
  } catch (err) {
    return show(err);
  }
}

// ---------------------------------------------------------------------------
// Discrimination
// ---------------------------------------------------------------------------

const SPECS = {
  'src/args.js': {
    basename: 'args',
    domain: () => argvDomain(),
    call: callArgs,
    label: (input) => (input === undefined ? '(no argv)' : JSON.stringify(input)),
    describe: 'every argv sequence of length 0..3 over an 11-token alphabet (each flag, -h, an unknown option, a positional, a flag-with-value, and --), plus the no-argv call',
  },
  'src/hemisphere.js': {
    basename: 'hemisphere',
    domain: (src) => zoneDomain(src),
    call: callZone,
    label: (input) => JSON.stringify(input) ?? String(input),
    describe: 'every zone/prefix literal parsed out of the pristine table itself (x4 case+whitespace variants), every northern counter-example named in the source comments, and every non-string shape',
  },
};

function main() {
  const catalogPath = process.argv[2];
  if (!catalogPath) {
    console.error('usage: node cycle-053-gate.js <mutants.json>');
    process.exit(2);
  }
  const mutants = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

  const pristine = {};
  for (const rel of Object.keys(SPECS)) {
    pristine[rel] = fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8');
  }

  const truth = {};
  const domains = {};
  for (const [rel, spec] of Object.entries(SPECS)) {
    truth[rel] = loadFromSource(pristine[rel], spec.basename);
    domains[rel] = spec.domain(pristine[rel]);
    console.log(`domain ${rel}: ${domains[rel].length} inputs — ${spec.describe}`);
  }
  console.log('');

  let holes = 0;
  let noDiff = 0;

  for (const m of mutants) {
    const rel = m.file;
    const spec = SPECS[rel];
    if (!spec) throw new Error(`${m.id}: unknown file ${rel}`);
    const src = pristine[rel];

    // Independent uniqueness assertion — the conductor does not take the builder's
    // word that a mutant lands where its label says.
    const first = src.indexOf(m.find);
    if (first === -1) {
      console.log(`${String(m.id).padEnd(5)} STALE      find string absent from ${rel}`);
      continue;
    }
    if (src.indexOf(m.find, first + 1) !== -1) {
      console.log(`${String(m.id).padEnd(5)} AMBIGUOUS  find string occurs more than once in ${rel}`);
      continue;
    }

    const mutSrc = src.split(m.find).join(m.replace);
    if (mutSrc === src) {
      console.log(`${String(m.id).padEnd(5)} NO-OP      replace is identical to find`);
      continue;
    }

    let mutMod;
    try {
      mutMod = loadFromSource(mutSrc, spec.basename);
    } catch (err) {
      console.log(`${String(m.id).padEnd(5)} LOAD-ERROR ${err.message.split('\n')[0]}`);
      continue;
    }

    const witnesses = [];
    for (const input of domains[rel]) {
      const a = spec.call(truth[rel], input);
      const b = spec.call(mutMod, input);
      if (a !== b) {
        witnesses.push({ input, truth: a, mutant: b });
        if (witnesses.length >= 3) break;
      }
    }

    if (witnesses.length) {
      holes++;
      console.log(`${String(m.id).padEnd(5)} DIFFERS    ${rel} — ${m.note || ''}`);
      for (const w of witnesses) {
        console.log(`      input:  ${spec.label(w.input)}`);
        console.log(`      truth:  ${w.truth}`);
        console.log(`      mutant: ${w.mutant}`);
      }
    } else {
      noDiff++;
      console.log(
        `${String(m.id).padEnd(5)} NO-DIFF    ${rel} — over ${domains[rel].length} enumerated inputs. ` +
          'NOT a proof of equivalence; the conductor must argue from the mutated line where a difference could live.',
      );
    }
  }

  console.log('');
  console.log(`mutants examined: ${mutants.length}  observably different: ${holes}  no-difference-over-domain: ${noDiff}`);
  fs.rmSync(tmpRoot, { recursive: true, force: true });
}

main();
