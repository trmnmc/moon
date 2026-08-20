# KI-2 Owner Action: Permission Grant for `swarm-playbook.sh` and `swarm-warmup.sh`

## ACTION: Add these four lines to `/opt/swarm/.claude/settings.json`

In the `permissions.allow` array, insert:

```
    "Bash(/opt/swarm/bin/swarm-playbook.sh:*)",
    "Bash(bash /opt/swarm/bin/swarm-playbook.sh:*)",
    "Bash(/opt/swarm/bin/swarm-warmup.sh:*)",
    "Bash(bash /opt/swarm/bin/swarm-warmup.sh:*)"
```

Place these alongside the already-granted entries for `swarm-budget.sh` and `swarm-notify.sh`.

## WHY

The swarm CLI cannot run its own core scripts. `swarm-playbook.sh` (load-bearing for every kickoff and WRAP_UP ledger distillation) and `swarm-warmup.sh` (needed for interactive `/swarm warmup` mode) have no permission grant in settings.json. Every invocation is denied. The root cause is confirmed: these exact command forms are simply not listed in `permissions.allow`. It is not a path-form mismatch, sandbox policy, or cwd effect—it is a missing entry. This has been the blocker for 32 runs across two improvement cycles.

## DENIAL COUNT AND PROVENANCE

32 runs as of 2026-08-20, improvement run #6 (moon). This tally is hand-carried and predates mechanical logging: 31 denials from aphorism-cli improvement run #5 (2026-08-20) plus 1 reproduction at kickoff of run #6. Only six lines in `/opt/swarm/playbook/applied.log` carry an explicit denial note; the number 32 is not derivable from any artifact in the repo.

## NOTE: `swarm-budget.sh` and `swarm-notify.sh` are already granted

Do not add grant lines for `swarm-budget.sh` or `swarm-notify.sh`. Both are now allowlisted and executed successfully at cycle 103 and 104 in this run. Older writeups claiming these scripts were unreachable are stale.

## SEPARATE TOOLING ISSUE: Environment-variable prefix defeats exact-path entries

`swarm-budget.sh` fails when invoked as `RUNFILE=... /opt/swarm/bin/swarm-budget.sh` even though the bare command runs. The environment-variable prefix defeats the exact-path allowlist entry. The fix is a `--runfile <path>` flag on the script itself, not an additional permission line.

## FULL FORENSIC HISTORY

For the complete eight-probe evidence table, see `/opt/swarm/playbook/HANDOFF-allowlist-2026-08-17.md`.
