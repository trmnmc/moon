# Conductor's cycle-21 verification gate for T-117 (.github/workflows/ci.yml).
# Authored AT VERIFICATION TIME, after the builder returned. The builder never saw it.
# Every assertion is derived from the repo itself (package.json, SPEC.md non-goals),
# never from the builder's narrative.
import json
import os
import subprocess
import sys

import yaml

ROOT = "/opt/targets/moon"
WF = os.path.join(ROOT, ".github/workflows/ci.yml")

fails = []
notes = []


def check(name, ok, detail):
    (notes if ok else fails).append(
        "%-4s %-38s %s" % ("PASS" if ok else "FAIL", name, detail)
    )


pkg = json.load(open(os.path.join(ROOT, "package.json")))
raw = open(WF).read()
wf = yaml.safe_load(raw)

# 1. It is valid YAML at all, and a mapping.
check("yaml-parses", isinstance(wf, dict), "top level is %s" % type(wf).__name__)

# 2. Triggers. NOTE: bare `on:` is the YAML 1.1 boolean True, not the string "on".
#    Reading wf["on"] here would raise KeyError and a sloppy gate would call that a
#    missing trigger. GitHub parses the raw text, so the key we must look up is True.
trig_key = True if True in wf else "on"
trig = wf.get(trig_key)
trig_names = set(trig.keys()) if isinstance(trig, dict) else set(trig or [])
check(
    "trigger-push",
    "push" in trig_names,
    "triggers = %s" % sorted(str(t) for t in trig_names),
)
check("trigger-pull-request", "pull_request" in trig_names, "pull_request present")

jobs = wf.get("jobs") or {}
check("has-one-job", len(jobs) == 1, "jobs = %s" % sorted(jobs))
job = list(jobs.values())[0]
steps = job.get("steps") or []

# 3. The run command must be one the repo actually defines. Resolve it, don't assume.
runs = [s["run"].strip() for s in steps if "run" in s]
check("exactly-one-run-step", len(runs) == 1, "run steps = %r" % runs)
cmd = runs[0] if runs else ""
scripts = pkg.get("scripts", {})
if cmd.startswith("npm test") or cmd.startswith("npm run test"):
    resolved = scripts.get("test")
    check("npm-test-is-defined", bool(resolved), "package.json scripts.test = %r" % resolved)
    check(
        "resolves-to-test_cmd",
        resolved == "node --test test/*.test.js",
        "%r resolves to %r" % (cmd, resolved),
    )
else:
    check(
        "resolves-to-test_cmd",
        cmd == "node --test test/*.test.js",
        "run command = %r" % cmd,
    )

# 4. The no-lockfile trap: this repo has NO package-lock.json, so `npm ci` would
#    abort the job. A workflow that uses it is broken even though it looks idiomatic.
has_lock = os.path.exists(os.path.join(ROOT, "package-lock.json"))
check("no-lockfile-confirmed", not has_lock, "package-lock.json present = %s" % has_lock)
check(
    "no-npm-ci",
    "npm ci" not in raw,
    "workflow does not invoke `npm ci` against a lockless repo",
)
check(
    "no-cache-npm",
    "cache" not in raw,
    "no setup-node cache: key (cache needs a lockfile and would fail)",
)

# 5. Node matrix must satisfy package.json engines, and must not be empty/degenerate.
engines = pkg.get("engines", {}).get("node", "")
matrix = (job.get("strategy") or {}).get("matrix") or {}
versions = []
for v in matrix.values():
    if isinstance(v, list):
        versions = [int(str(x).split(".")[0]) for x in v]
check("matrix-non-empty", len(versions) >= 1, "node matrix = %s" % versions)
floor = int("".join(c for c in engines if c.isdigit()) or 0)
check(
    "matrix-honors-engines",
    bool(versions) and all(v >= floor for v in versions),
    "engines %r floor=%d, matrix=%s" % (engines, floor, versions),
)
check(
    "matrix-includes-floor",
    floor in versions,
    "the minimum supported version %d is actually exercised" % floor,
)

# 6. Third-party actions pinned to at least a major tag.
uses = [s["uses"] for s in steps if "uses" in s]
check(
    "actions-pinned",
    bool(uses) and all("@" in u and u.split("@")[1] for u in uses),
    "uses = %s" % uses,
)

# 7. SPEC non-goals: nothing the repo does not have, and no publish.
for banned, why in [
    ("publish", "repo is no-npm-publish per SPEC non-goals"),
    ("eslint", "repo has no linter"),
    ("coverage", "repo has no coverage tooling"),
    ("badge", "no badge was in scope"),
    ("npm install", "zero-dep repo needs no install step"),
]:
    check("no-%s" % banned.replace(" ", "-"), banned not in raw.lower(), why)

# 8. Zero new dependencies anywhere in the merged diff.
diff = subprocess.run(
    ["git", "-C", ROOT, "diff", "--name-only", "HEAD~1", "HEAD"],
    capture_output=True, text=True,
).stdout.split()
check("single-file-change", diff == [".github/workflows/ci.yml"], "changed = %s" % diff)
check("deps-untouched", not pkg.get("dependencies"), "package.json dependencies = {}")

print("\n".join(notes))
if fails:
    print("\n".join(fails))
    print("\nGATE FAIL: %d check(s) failed" % len(fails))
    sys.exit(1)
print("\nGATE PASS: %d/%d static checks" % (len(notes), len(notes)))
