// cycle 31: append T-128 to the backlog atomically (write .tmp, then rename).
import fs from 'node:fs';
const P = '/opt/targets/moon/.swarm/backlog.json';
const b = JSON.parse(fs.readFileSync(P, 'utf8'));
if (b.items.some((i) => i.id === 'T-128')) { console.log('T-128 already present'); process.exit(0); }
b.items.push({
  id: 'T-128',
  title: "The FLAG table is documented in three places with no gate holding them in agreement, and src/args.js claims a link that does not exist",
  kind: 'fix',
  priority: 3,
  value: 'M',
  effort: 'S',
  model: 'sonnet',
  deps: [],
  files_hint: ['test/cli.test.js', 'src/args.js'],
  acceptance:
    "Set equality between the option names src/args.js actually registers and the flag names PARSED at test time out of each documented source: the HELP string's `options` block in bin/moon.js and README.md's `## Options` table. Names must be parsed from the sources at test time, never restated as a literal array -- cli.test.js:178 already hardcodes exactly such a list and is the thing being replaced. Separately: src/args.js's OPTIONS doc comment asserts the table is kept there 'so the help text and the parser can never drift apart', which is false -- HELP is an unrelated string literal in bin/moon.js. Correct that comment to describe what is actually true once the gate exists. Behavior frozen: no change to which flags are accepted, no bin/moon.js edit, no README content change.",
  packages: [],
  attempts: 0,
  notes:
    "Found by the cycle-31 VALUE_LOOP candidate scan. Direct sibling of T-127 (cycle 30), which pinned the --json FIELD names across three documents; the FLAG set itself was left unpinned. Today the only check is cli.test.js:178, a hardcoded six-name literal asserted to be PRESENT in --help output: it is one-directional and blind to src/args.js, so removing --compact from OPTIONS -- or adding a flag to it -- keeps the suite green while both documents go stale. README's `## Options` table has never been read by any test at all. The false comment at src/args.js:6-7 is the doc-truth half: it advertises a drift guarantee the code does not provide.\nRATCHET: Q1 would the target user (the next person to change this code) notice? Yes -- the flag set is the CLI's contract surface and drift there ships a flag documented in two places and accepted in neither. Q2 still care after ten minutes? Yes -- standing gate.\nNOT CHURN: conductor pre-verified that all three sources currently AGREE (OPTIONS json/south/north/block/compact/help+short h; HELP options block and README table both list --json/--block/--compact/--south/--north/-h,--help). The test therefore pins a true claim; the builder must STOP and report rather than 'fix' either side if it finds a disagreement.",
  status: 'todo',
  opened_cycle: 31,
});
// Re-escape non-ASCII back to \uXXXX so the rewrite touches ONLY the appended item.
// JSON.stringify emits em-dashes literally; the file on disk stores them escaped, and a
// plain round-trip would show four unrelated items as modified.
const text = JSON.stringify(b, null, 1).replace(/[-￿]/g, (c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
const ascii = [...text].map((c) => (c.charCodeAt(0) < 128 ? c : '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'))).join('');
fs.writeFileSync(P + '.tmp', ascii + '\n');
fs.renameSync(P + '.tmp', P);
console.log('T-128 appended; items =', b.items.length);
