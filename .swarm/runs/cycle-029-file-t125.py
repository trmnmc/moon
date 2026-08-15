#!/usr/bin/env python3
"""Conductor, cycle 29: file T-125 into the backlog atomically (.tmp then rename)."""
import json
import os
import pathlib

BL = pathlib.Path('/opt/targets/moon/.swarm/backlog.json')
data = json.loads(BL.read_text())

assert not any(i['id'] == 'T-125' for i in data['items']), 'T-125 already exists'
# cycle 24 recorded a dispatch slip from assuming the id tail; read the ids instead.
print('existing ids:', sorted(i['id'] for i in data['items']))

item = {
    "id": "T-125",
    "title": ".swarm/CONTRACTS.md declares export lists and a parseArgs signature the code no longer matches",
    "kind": "docs",
    "priority": 3,
    "value": "M",
    "effort": "S",
    "model": "haiku",
    "deps": [],
    "files_hint": [".swarm/CONTRACTS.md"],
    "acceptance": (
        "The reader of .swarm/CONTRACTS.md can no longer be misled about what the modules "
        "export today, WITHOUT any frozen contract line being altered. Every existing line of "
        "the file stays byte-identical -- the freeze is a historical record and rewriting it "
        "would falsify what was actually frozen at cycle 1. The file gains ONE new clearly "
        "headed section recording the three measured divergences, each naming the current "
        "source of truth by file:line: (1) src/astro.js:363 exports "
        "{computeMoon, nextFullMoon, PHASE_NAMES, PHASE_ILLUMINATION_CONSISTENCY_DOMAIN}, "
        "where the frozen block declares {computeMoon, PHASE_NAMES}; (2) src/args.js:106-112 "
        "returns a fifth key `compact`, absent from the frozen @returns; (3) src/args.js:15 "
        "registers a sixth flag --compact, absent from the frozen flags line. The section must "
        "also name test/args.test.js:87, whose test title says 'the five contract keys' while "
        "the frozen block declares four -- that is the contradiction that reaches the shipped "
        "suite. No src/, test/, README.md, REPORT.md or package.json change."
    ),
    "packages": [],
    "attempts": 0,
    "route_class": None,
    "notes": (
        "FOUND AT THE CYCLE-29 VALUE_LOOP CANDIDATE SCAN (surface 5), and every divergence was "
        "CONDUCTOR-VERIFIED independently before filing rather than taken on the scanner's word: "
        "`grep -n 'module.exports' src/*.js bin/moon.js` gives the real astro.js export list, and "
        "src/args.js:106-112 plus its OPTIONS table at :9-18 give the real parseArgs shape.\n\n"
        "WHY IT PASSES THE RATCHET, stated against the obvious objection. The objection is that "
        "CONTRACTS.md is a FROZEN historical artifact -- its own header reads 'FROZEN CONTRACTS "
        "-- cycle 1 ... Authored by the conductor BEFORE any builder started' -- so drift from it "
        "is expected and correcting it would destroy the record of what was frozen. That objection "
        "is right about the FIX and wrong about the DEFECT, which is why the acceptance forbids "
        "touching a single frozen line and requires an additive drift note instead.\n"
        "The defect is real because the contradiction does not stay inside .swarm/. "
        "test/args.test.js:87 is a SHIPPING test whose title asserts 'the five contract keys' and "
        "whose body asserts five, while the document it calls the contract declares four. A "
        "maintainer who greps 'contract' lands on a green test and an authoritative-sounding file "
        "that disagree, and the file says 'no builder may change a signature below'. Q1 (would the "
        "target user notice?) -- the declared audience is 'the next person to change this code', "
        "and this is the file that tells them what they may not change. Q2 (would they still care "
        "after 10 minutes?) -- it is a permanent factual contradiction between two files in the "
        "repo, one claiming authority over the other.\n\n"
        "SISTER CANDIDATE REJECTED THIS SAME CYCLE, recorded so the retro sees both halves of the "
        "judgement. The scan also reported --compact as the only CLI flag with no positive "
        "`parseArgs(['--compact'])` unit assertion in test/args.test.js (verified: true, every "
        "other flag has one at :33/:43/:53/:63/:73). The conductor PRICED that gap by mutation "
        "rather than accepting it as a hole -- .swarm/runs/cycle-029-compact-mutants.py -- and "
        "ZERO of four mutants survive the full suite: only 'compact pinned false' survives "
        "args.test.js alone, and cli.test.js:44 kills it end-to-end. So the surface is covered at "
        "a different level, and adding the unit test would close no named untested surface. The "
        "SPEC's taste note names CHURN as this run's chief risk and its rule is 'every added test "
        "closes a NAMED untested surface; test count is not an outcome'. Rejected on evidence, "
        "not on taste.\n\n"
        "MODEL: opens at haiku per the routing table (docs/S, attempts 0, so the ladder offers no "
        "escalation) under a brief with both judgement calls already decided by the conductor -- "
        "the additive-not-destructive shape, and the exact three divergences with their file:line "
        "sources. This is the THIRD test of the open question cycle 10 recorded against itself "
        "(whether pre-deciding shrinks a docs item enough to hold at haiku on this repo, given "
        "T-101 cycle 2 and T-108 cycle 10 both failed there). If it fails, the ladder escalates it "
        "to sonnet and the retro gets an evidential answer instead of a speculative one."
    ),
    "status": "todo",
    "opened_cycle": 29,
}

data['items'].append(item)

tmp = BL.with_suffix('.json.tmp')
tmp.write_text(json.dumps(data, indent=1, ensure_ascii=False) + '\n')
os.replace(tmp, BL)
print('filed T-125; backlog now has', len(data['items']), 'items')
print('todo:', [i['id'] for i in data['items'] if i['status'] == 'todo'])
