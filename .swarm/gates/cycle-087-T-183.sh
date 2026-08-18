#!/usr/bin/env bash
# SEALED VERIFY GATE - cycle 87 - T-183. Authored by the conductor BEFORE dispatch.
# The builder never sees this file.
set -u
cd /opt/targets/moon || exit 9
pass=0; fail=0
chk(){ if [ "$2" = "0" ]; then echo "PASS  $1"; pass=$((pass+1)); else echo "FAIL  $1"; fail=$((fail+1)); fi; }

# C1: the stale citation is gone from every doc, in BOTH spellings (with and without test/).
n=$(cat REPORT.md README.md .swarm/CONTRACTS.md 2>/dev/null | grep -c "render\.test\.js:629")
echo "  C1 residual :629 citations = $n"
if [ "$n" -eq 0 ]; then chk "C1 zero residual render.test.js:629 citations" 0; else chk "C1 zero residual render.test.js:629 citations" 1; fi

# C2: NON-VACUITY - the pre-fix tree really did carry the defect, twice.
old=$(git show HEAD:REPORT.md | grep -c "render\.test\.js:629")
echo "  C2 occurrences at HEAD = $old"
if [ "$old" -eq 2 ]; then chk "C2 defect present at HEAD (non-vacuous fix)" 0; else chk "C2 defect present at HEAD (non-vacuous fix)" 1; fi

# C3: TRUE-LINE RE-DERIVATION at verify time from the authoritative source (L-045),
# never from the planning note's remembered 826.
true_line=$(grep -n "KI-5 pin: disc glyph set matches the documented East Asian Width partition" test/render.test.js | grep "^[0-9]*:test(" | cut -d: -f1)
echo "  C3 KI-5 pin test truly declared at test/render.test.js:$true_line"
if [ -n "$true_line" ]; then chk "C3 KI-5 pin test locatable by name" 0; else chk "C3 KI-5 pin test locatable by name" 1; fi

# C4: every render.test.js citation left in the docs names that re-derived true line.
bad=0
for L in $(cat REPORT.md README.md .swarm/CONTRACTS.md 2>/dev/null | grep -oE "render\.test\.js:[0-9]+" | cut -d: -f2); do
  if [ "$L" != "$true_line" ]; then echo "  C4 offender: render.test.js:$L (expected $true_line)"; bad=1; fi
done
chk "C4 every render.test.js citation resolves to the KI-5 pin line" "$bad"

# C5: the cited line, read live, IS the KI-5 pin test declaration.
line_text=$(sed -n "${true_line}p" test/render.test.js)
echo "  C5 line $true_line reads: $line_text"
if echo "$line_text" | grep -q "KI-5 pin: disc glyph set"; then r=0; else r=1; fi
chk "C5 cited line is the KI-5 pin test declaration" "$r"

# C6: NO COLLATERAL CITATION ROT - every other file:line citation in the docs still in range.
rot=0
for c in $(cat REPORT.md README.md .swarm/CONTRACTS.md 2>/dev/null | grep -oE "(test|src|bin)/[A-Za-z0-9_.-]+\.js:[0-9]+"); do
  f=${c%:*}; L=${c##*:}
  if [ ! -f "$f" ]; then echo "  C6 missing file: $c"; rot=1; continue; fi
  tot=$(wc -l < "$f")
  if [ "$L" -gt "$tot" ]; then echo "  C6 out of range: $c (file has $tot lines)"; rot=1; fi
done
chk "C6 all doc file:line citations resolve in range" "$rot"

# C7: SCOPE - only REPORT.md touched by this item (ignoring conductor .swarm bookkeeping).
touched=$(git diff --name-only HEAD -- . | grep -v "^\.swarm/" | tr "\n" " ")
echo "  C7 non-.swarm files changed: [$touched]"
if [ "$(echo "$touched" | tr -d " ")" = "REPORT.md" ]; then r=0; else r=1; fi
chk "C7 scope limited to REPORT.md" "$r"

# C8: the whole suite, run by the conductor.
# INSTRUMENT NOTE (re-sealed pre-run): node v24's default spec reporter prefixes the
# summary with U+2139, not '#'. The original '^# fail 0$' match could never fire and
# would have failed C8 against a green suite. Match the prefix loosely and, per L-041,
# require the tests/pass/fail lines to actually PARSE rather than trusting absence.
out=$(node --test test/*.test.js 2>&1 | tail -25)
echo "$out" | grep -E "(tests|pass|fail) [0-9]+$"
tot=$(echo "$out" | grep -oE "tests [0-9]+$" | grep -oE "[0-9]+$")
pss=$(echo "$out" | grep -oE " pass [0-9]+$" | grep -oE "[0-9]+$")
fl=$(echo "$out" | grep -oE " fail [0-9]+$" | grep -oE "[0-9]+$")
if [ -z "$tot" ] || [ -z "$pss" ] || [ -z "$fl" ]; then
  echo "  C8 INSTRUMENT FAILURE: could not parse the suite summary"; r=1
elif [ "$fl" = "0" ] && [ "$pss" = "$tot" ] && [ "$tot" -gt 0 ]; then r=0; else r=1; fi
chk "C8 full suite green (fail=0 and pass==tests)" "$r"

echo "---- GATE: $pass passed, $fail failed ----"
[ "$fail" -eq 0 ]
