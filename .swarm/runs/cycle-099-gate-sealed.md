# SEALED VERIFICATION GATE — cycle 99, target moon

Authored by the conductor at 2026-08-19T22:14Z, BEFORE the build wave was dispatched.
Builders never see this file. Hash recorded in the journal at dispatch time; the file is
committed unchanged at step 7 so the seal is checkable after the fact.

Baseline measured before dispatch (conductor-run, real output in the journal):
- `npm test` -> tests 175 / pass 175 / fail 0.
- Discriminator baseline for T-203: inserting one blank line at README.md:5 (shifting every
  line below it, including the exit-2 sentence at 174) left the suite at **175/175 GREEN**.
  The citation class is currently INVISIBLE to every gate in the repo. This is the "unfixed
  baseline" column; the fix must flip it to RED.

## T-201 — CLI wire-through proof for `-h` and hemisphere last-one-wins

G1. `npm test` green, total tests strictly greater than 175.
G2. `git diff --name-only <pre>..<post>` for this item lists ONLY `test/cli.test.js`.
    Any src/ or bin/ change fails the gate outright — acceptance says the behaviour is
    already correct.
G3. The new checks are SPAWNS, not parseArgs calls. Read each new test body: it must reach
    the binary through `run(`/`runFailing(`/`runAtFixedInstant(`/`execFileSync`. A new test
    that calls `parseArgs(` for either surface fails the gate — that is the exact defect
    the item exists to close.
G4. Two-arm proof, `-h`, conductor-run:
    arm A: mutate `src/args.js` to drop the `short: 'h'` alias -> suite must go RED and the
           failing-test names must INCLUDE the new `-h` test by name.
    arm B: same mutation with the new `-h` test deleted -> suite must go GREEN.
    Revert the mutation.
G5. Two-arm proof, last-one-wins, conductor-run:
    arm A: mutate hemisphere resolution so the FIRST flag wins instead of the last -> suite
           RED, failing names include the new last-one-wins test.
    arm B: same mutation, new test removed -> GREEN.
    Revert. Both orders (`--south --north` and `--north --south`) must be covered, and the
    assertion must read RENDERED OUTPUT, not a parsed options object.
G6. Converse control: at least one new assertion that must stay GREEN under the G4/G5
    mutations (proving the new checks are not snapshot tests that die on everything).

## T-203 — decayed README citation + the gate that cannot see it

G7. `grep -rn "README:171" test/` returns NO hits.
G8. `npm test` green, tests >= 175.
G9. **The discriminator.** Re-run the exact baseline mutation: insert one blank line at
    README.md:5, run `npm test`. It must now go **RED**, and the failing test must be a
    citation check that NAMES the stale citation (file, cited line, expected text). Revert
    README, suite green again. Baseline column (blind, 175/175 green) vs fixed column (red)
    both reported in the journal.
G10. `.swarm/CONTRACTS.md` is UNCHANGED. That file's own freeze clause forbids builder
     edits; the item's files_hint naming it was a planning slip, and the conductor scoped it
     out at dispatch. A diff touching it fails the gate.
G11. A reader following any surviving citation lands on the sentence that makes the promise:
     resolve every `README:N` (or equivalent) citation left in test/ by hand against the
     current README and confirm the cited line carries the quoted text.

## Standing gate checks

- Full `npm test` run by the conductor, never by an agent report.
- Test count never below the 175 baseline (SPEC).
- No new dependencies, runtime or dev (`git diff package.json` must be empty).
- collision-scan: N/A — this target is a terminal CLI with no browser-served classic
  scripts. Recorded as not-applicable, never as passed.
