
## cycle 107 addendum | 2026-08-20T11:16:00+00:00 | moon | BUILD — the CI half of T-211, verified on GitHub's runner rather than reasoned about

The cycle-107 gate proved T-211 locally and named CI as the one surface still unproven at
gate time. It is proven now, by the cycle-21 method: push it and read GitHub's own execution
log, because a workflow file is the artifact where static review is systematically weakest —
every wrong version of it is also well-formed yaml.

Run `32362877911`, commit `62705e5`, both matrix legs:

```
test (22)  # tests 216   # pass 216   # fail 0   # skipped 0
test (20)  # tests 216   # pass 216   # fail 0   # skipped 0
```

**`skipped 0` is the discriminator, not `fail 0`.** A green CI proves very little here: had
`fetch-depth: 0` been wrong, missing, or ineffective, the runner's checkout would have carried
one commit, the shallow guard would have fired, and the job would still have gone GREEN — with
`skipped 3`. That is precisely the outcome that looks validated while having skipped the check.
Zero skips on a runner the conductor does not control means the historical commits were really
present, `git worktree add --detach` really ran there, and the suite really re-measured itself
at cycle 104's and cycle 105's commits. The guarantee HOLDS in CI; it does not merely degrade
politely.

Two things this does not prove, stated rather than implied: the shallow-clone degrade path is
verified locally (loud skip, with a full-clone control showing zero skips) and is now
unexercised in CI by construction, which is the correct arrangement but does mean CI is not
watching it. And the 6-commit cost bound has only ever been exercised at 2.

nothing dispatched · nothing verified beyond the CI read · no state, backlog or item change.
