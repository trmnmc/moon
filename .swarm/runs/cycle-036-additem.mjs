import fs from 'node:fs'
const p = '.swarm/backlog.json'
const b = JSON.parse(fs.readFileSync(p, 'utf8'))
if (b.items.some((i) => i.id === 'T-133')) { console.log('already present'); process.exit(0) }
b.items.push({
  id: 'T-133',
  kind: 'docs',
  status: 'todo',
  priority: 3,
  effort: 'S',
  model: 'sonnet',
  attempts: 0,
  opened_cycle: 36,
  title: 'The --json docs describe cycleFraction as temporal ("position through the synodic month") but it is angular (elongation/360) and disagrees with age by up to ~21 hours',
  why: 'The --json surface is advertised in bin/moon.js HELP as "structured output for scripting (stable, documented below)", so its field descriptions are a contract. cycleFraction is computed at src/astro.js:303 as phaseAngle/360 - an ANGULAR fraction of the elongation circle. `age` (src/astro.js:313) is genuine elapsed days since the true ch.49 new-moon instant. Both the README field table and the HELP fields block describe cycleFraction as "position through the synodic month", which reads as temporal, and nothing warns that the two fields are not convertible. Measured by the conductor over 175,320 hourly samples across 2020-2040 (.swarm/runs/cycle-036-probe-cyclefraction.js): the circular gap between cycleFraction and age/lunation reaches 0.029790 cycle = 21.11 h against this lunation TRUE length, and 0.032488 cycle = 23.03 h against the mean synodic month. So a script computing elapsed days as cycleFraction * 29.53 is wrong by up to most of a day. The repo already carries exactly this kind of correction for exactly this kind of trap - the "Caution on phaseAngle" block - and this is the second such field with no such note. The gap is ALREADY KNOWN to the code: test/astro.test.js:242 pins circDiff(cycleFraction, elapsed/SYNODIC) < 0.035 with the comment "may lead/lag mean time by the periodic corrections (up to ~0.9 d ~ 0.03 cycle)". The test knows; the documentation does not.',
  acceptance: 'The --json documentation in BOTH README.md and bin/moon.js\'s HELP string tells a scripting reader that cycleFraction is an angular quantity (the Moon-Sun elongation as a fraction of the circle), NOT elapsed time, and that converting it to days is wrong by up to roughly 21 hours mid-cycle; it directs the reader to the `age` field for elapsed time. The note must also state the part that is true: the endpoints hold - at a true new moon cycleFraction is 0 and at a true full moon it is 0.5, each to within about 0.001 of a cycle (~45 minutes). The two documents must agree with each other. NO behavior change: src/ is untouched and the only edit to bin/moon.js is inside the HELP template literal.',
  files_hint: ['README.md', 'bin/moon.js'],
  packages: [],
  deps: [],
  notes: 'VALUE_LOOP ratchet ACCEPTED (contrast T-116/T-126/T-130, all rejected). Q1 would the target user notice? YES - a scripting consumer who reads two fields that both claim to describe cycle position and converts between them lands up to 21 h out, which for a tool whose headline question is "which night is the full moon" is a wrong night. Q2 would they still care after 10 minutes? YES - it changes the number their script computes, unlike a spelling.\nCONDUCTOR ROUTING RULING: the value-routing table sends kind=docs effort=S to haiku, and gear 1 (allocator trickle) would normally hold it there. Routed to SONNET instead. The haiku row is scoped to "formatting, scaffolding, boilerplate"; this item is a precision-of-claim correction that has to state a numerical distinction accurately, and cheap-tiering it is how a doc gains a confident sentence that is subtly wrong. Gear 1 explicitly permits S-effort sonnet builds. Fable was NOT chosen despite the correctness-core flavor: allow_premium_pct is 0 this week.\nCONDUCTOR OWNERSHIP RULING on bin/moon.js: line 7 of that file reads "Conductor-owned file; builders do not edit it." That comment is about the entry point\'s LOGIC (the file is a thin shell; every real decision lives in src/). It is lifted for this item, in writing, scoped to the HELP template literal ONLY - no executable line of bin/moon.js may change. The alternative, patching HELP from the conductor, would violate the standing cycle-7 rule that the conductor does not edit the artifact, because then nothing independent checks the conductor\'s own wording - and the conductor is the author of this item\'s wording. Fixing only README.md was rejected as well: it would leave `moon --help` telling the reader the wrong thing, and cli.test.js gates only the field NAME sets, not the prose, so nothing would catch the split.',
})
fs.writeFileSync(p + '.tmp', JSON.stringify(b, null, 1))
fs.renameSync(p + '.tmp', p)
console.log('T-133 filed; items now', b.items.length)
