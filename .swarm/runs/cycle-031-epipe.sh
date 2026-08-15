#!/bin/sh
# cycle 31 conductor scratch: does the CLI survive a consumer that closes the pipe early?
cd /opt/targets/moon || exit 9
for mode in "" "--json" "--block" "--help"; do
  printf '=== moon %s | head -c 1 ===\n' "$mode"
  # shellcheck disable=SC2086
  node bin/moon.js $mode 2>/tmp/moon-epipe-err.txt | head -c 1 >/dev/null
  st=$?
  printf 'head exit=%s\n' "$st"
  printf 'stderr: '
  if [ -s /tmp/moon-epipe-err.txt ]; then
    head -8 /tmp/moon-epipe-err.txt
  else
    printf '(empty)\n'
  fi
done

printf '\n=== exit codes, stdout intact ===\n'
node bin/moon.js >/dev/null 2>&1;        printf 'default   exit=%s\n' "$?"
node bin/moon.js --help >/dev/null 2>&1; printf 'help      exit=%s\n' "$?"
node bin/moon.js --json >/dev/null 2>&1; printf 'json      exit=%s\n' "$?"
node bin/moon.js --nope >/dev/null 2>&1; printf 'bad flag  exit=%s\n' "$?"
node bin/moon.js extra >/dev/null 2>&1;  printf 'posarg    exit=%s\n' "$?"
