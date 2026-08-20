#!/usr/bin/env bash
# cycle-107 gate, part C — does the T-211 test degrade LOUDLY on a shallow clone?
# CI now uses fetch-depth: 0, so this path is the fallback that protects anyone who
# clones shallowly. A silent pass here would be the exact defect the item removes.
set -u
SC=$(mktemp -d)
git clone --quiet --depth 1 file:///opt/targets/moon "$SC/moon"
cp /opt/targets/moon/test/doc-counts.test.js "$SC/moon/test/doc-counts.test.js"
cd "$SC/moon" || exit 9
echo "is-shallow: $(git rev-parse --is-shallow-repository)"
node --test test/doc-counts.test.js > "$SC/out.txt" 2>&1
echo "exit=$?"
grep -E '^# (tests|pass|fail|skipped)' "$SC/out.txt"
echo "--- skip lines (must name a reason) ---"
grep -iE 'skip|shallow' "$SC/out.txt" | head -12
rm -rf "$SC"
