#!/bin/bash
# Cycle 113: capture the full conductor verification evidence for T-215 into one artifact.
cd /opt/targets/moon || exit 1
OUT=.swarm/runs/cycle-113-verify-T-215.txt
exec > "$OUT" 2>&1
echo "=== conductor gate cells (cycle 113, T-215) — authored at verification time ==="
node .swarm/runs/cycle-113-gate-T-215.mjs
echo
echo "=== re-aimed cell 8 (the mis-aimed no-hardcoded-dates cell, measured properly) ==="
node .swarm/runs/cycle-113-gate-T-215b.mjs
echo
echo "=== re-aimed two-arm attribution proof against the live tree ==="
node .swarm/runs/cycle-113-gate-T-215-twoarmb.mjs
echo
echo "=== full suite, run by the conductor ==="
node --test test/*.test.js | tail -10
echo
echo "=== REPORT.md byte count (ceiling 25582) ==="
wc -c REPORT.md
echo
echo "=== dependency surface (zero-dep property) ==="
node -e 'const p=require("./package.json");console.log("dependencies:",JSON.stringify(p.dependencies||{}),"devDependencies:",JSON.stringify(p.devDependencies||{}))'
