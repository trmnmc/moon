# cycle 069 — raw seat return, T-163 (fable, builder seat)

Verbatim return value of the dispatched agent. Dispatch was a DIRECT Agent call, not the
Workflow tool (headless `-p` session; Workflow is review-gated there — the documented
SKILL.md fallback). Claims below are the seat's; the conductor re-derived the pinned value
independently and re-ran both arms itself — see cycle-069-verify-wave.txt.

---

T-163 complete. All evidence below.

**Chosen instant:** 2026-01-08T05:00:00.000Z (ms = 1767848400000), inside the 1000-3000 consistency domain. Chosen from a scan of whole-hour 2026 instants (own script, published formulas only) because its scaled illumination fractional part .2724 sits centrally in the requested 0.15-0.35 window, and the correctly rounded value 0.7358 has no trailing zero, so JSON serialization is unambiguous.

**Independent derivation** (own throwaway script at /opt/swarm/runs/.c69-t163-derive.js, now deleted — implemented the published formulas directly, imported nothing from the repo):
- JD(UT) = 1767848400000/86400000 + 2440587.5 = 2461048.7083333335
- t = (JD − 2451545)/365.25 = 26.0197 yr → ΔT = 62.92 + 0.32217t + 0.005589t² = 75.087 s = 0.000869059 d
- T = (JD + ΔT − 2451545)/36525 = 0.260197377204
- D (47.2) = 235.184607, M (47.3) = 4.387566, M′ (47.4) = 100.857718 (all mod 360)
- Elongation terms: +6.289 sin M′ = +6.176414; −2.100 sin M = −0.160656; +1.274 sin(2D−M′) = +0.210523; +0.658 sin 2D = +0.616855; +0.214 sin 2M′ = −0.079179; +0.110 sin D = −0.090310
- elongation = 241.858255 (mod 360); i = |180 − 241.858255| = 61.858255°
- k = (1 + cos 61.858255)/2 = (1 + 0.47165447)/2 = 0.73582724
- k·10⁴ = 7358.2724 → **frac = .2724; margin from the .5 boundary = 0.2276, from the digit boundary below = 0.2724.** Expected --json illumination: **0.7358**.
- Cross-check after derivation: scratch CLI at the pinned instant printed `"illumination":0.7358` — agreement; no disagreement to report.

**Discrimination:** Math.ceil → 7359 → 0.7359 (killed by this test). Math.trunc/Math.floor → 7358, identical to round at this instant — this test does not discriminate them; they stay killed by T-155 (frac .7276, where they yield 0.9251). Stated in the test's header comment.

**Two-arm results** (full copy incl. .git/.swarm at /opt/swarm/runs/.c69-scratch-t163; mutants never touched the real tree):
- Baseline HEAD copy: 150/150 green. Unmutated + new test: 151 tests / 151 pass / 0 fail.
- **Arm A** (new test present, bin/moon.js:88 Math.round→Math.ceil): RED — 151 tests / 150 pass / 1 fail. Sole failing test, verbatim: `--json illumination at 2026-01-08T05:00Z equals the hand-derived Meeus value 0.7358 exactly`. Notably T-155 stayed green under ceil, confirming the gap.
- **Arm B** (test file reverted to HEAD, same ceil mutant): SURVIVED green — 150 tests / 150 pass / 0 fail. The Arm A kill is attributable solely to the new test.
- **Math.trunc mutant** (new test present): RED — 151/150/1; killer, verbatim: `--json illumination at 2026-01-05T19:00Z equals the hand-derived Meeus value 0.9252 exactly` (T-155).
- **Math.floor mutant** (new test present): RED — 151/150/1; same T-155 killer, verbatim as above.
- Final unmutated scratch run: 151/151 green.

**State:** /opt/targets/moon/test/contracts.test.js modified by pure addition — 89 insertions, 0 deletions (grep of the diff shows zero removed lines), so the T-155 block is byte-identical. `git -C /opt/targets/moon status --porcelain` shows exactly ` M test/contracts.test.js`. Real-tree suite: 151/151 green. Scratch copy and derivation script deleted and confirmed gone. Not committed (conductor is sole committer).

**Not verified:** nothing material. (One note: the derivation script and the implementation share the same published formula set by design, so agreement was expected; independence rests on the value being computed by separately written code, plus the scan that selected the instant before any comparison with the CLI.)
