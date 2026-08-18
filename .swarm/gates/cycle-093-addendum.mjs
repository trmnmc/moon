#!/usr/bin/env node
// cycle 93 addendum: stamp the work commit into state.last_cycle.commit, re-touch the heartbeat
// so next_wakeup_at describes the real end of the cycle, and journal the dashboard render.
import fs from 'node:fs'

const SW = '/opt/targets/moon/.swarm'
const RUNFILE = '/opt/swarm/runs/current.json'
const now = Math.floor(Date.now() / 1000)
const NEXT = now + 90
const STOP = 1787142067

const st = JSON.parse(fs.readFileSync(`${SW}/state.json`, 'utf8'))
st.last_cycle.commit = '230e659'
fs.writeFileSync(`${SW}/state.json.tmp`, JSON.stringify(st, null, 2))
fs.renameSync(`${SW}/state.json.tmp`, `${SW}/state.json`)

const rf = JSON.parse(fs.readFileSync(RUNFILE, 'utf8'))
rf.heartbeat.ts = now
rf.heartbeat.next_wakeup_at = NEXT
fs.writeFileSync(RUNFILE + '.tmp', JSON.stringify(rf, null, 2))
fs.renameSync(RUNFILE + '.tmp', RUNFILE)
fs.writeFileSync('/opt/swarm/runs/current.json.bak', JSON.stringify(rf, null, 2))

const block = `
### cycle 93 addendum — dashboard render + commit stamp

dashboard: rendered \`SWARM/runs/dashboard.html\` with \`SWARM/runs/c093-dash.mjs\`, same discipline as c086–c092 — anchors grepped out of the live page at run time, split/join so every duplicated template region moves together, all journal-derived strings HTML-escaped, assertions re-read the file from disk. Substitutions: gen 1, next 1, banner 2, stats 3, targets 2, decisions list 1. The page moved 40,684 → 40,699 bytes.

**One of my own render assertions failed and the fix was to its AIM, not to its strictness.** \`no stale 171/171 anywhere\` fired on this sentence, which is a PRIOR RUN's history and was true when written:

\`\`\`
...and the run wrapped up ~14.4 h early. Definition-of-done re-verified by running
commands (171/171 green, no dependencies key, no lockfile, no node_modules)...
\`\`\`

The check exists to catch a live-state figure left behind after the count moves, so it was re-aimed at the banner / stats / targets regions instead of the whole page, and a companion assertion was added requiring that historical sentence to still be PRESENT — so the re-aim cannot be used later to quietly scrub history. \`SWARM/runs/c093-dash-audit.mjs\` re-checks the written file: **19/19 pass**. This is the third instrument-aim defect this cycle (gate check 3, and now this), all three in checks that grade PROSE rather than structure; the pattern is worth a candidate lesson at WRAP_UP.

heartbeat re-touch: \`next_wakeup_at\` was written as ${1787070237 + 90} at the persist and the cycle ran past it. Re-touched to ${NEXT} so the field describes the actual end of the cycle. Clamp re-checked against hard rule 8: ${NEXT} + 900 = ${NEXT + 900}, well inside stop_at ${STOP} (${Math.floor((STOP - NEXT) / 60)} minutes of run remaining), so the clamp does not bind. On the VPS \`bin/swarm-pacer.sh\` is the firing mechanism and reads this field; no ScheduleWakeup chain is relied on from a \`-p\` session.

TOOL OBSERVATION, restated not acted on (hard rule 5 — \`templates/\` is read-only mid-run): the rendered dashboard still has no \`<!DOCTYPE>\`, no \`<html>\` and no \`<body>\`. Inherited fragment from \`templates/dashboard.template.html\`, unchanged since at least cycle 88 and now carried for a sixth consecutive cycle. Browsers render it and the stale-banner script works, so the phone viewer is not broken. For the morning report, not for a live edit.

commit: this addendum. The cycle-93 work commit is \`230e659\`, now stamped into \`state.last_cycle.commit\`.
`
fs.appendFileSync(`${SW}/journal.md`, block)
console.log(JSON.stringify({ now, next: NEXT, minutes_left: Math.floor((STOP - NEXT) / 60) }))
