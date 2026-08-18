// Addendum check, cycle 96. The sealed gate covered the DEFECTS. This covers the one
// NEW claim the T-193 builder introduced that the gate did not: re-anchoring "42" to
// the review pass specifically ("not the 42-cycle-stale pass run 2 measured").
// A builder's arithmetic is a claim; this re-derives it from two independent
// authorities the document itself already carries.
import { readFileSync } from 'node:fs';
const rep = readFileSync('/opt/targets/moon/REPORT.md', 'utf8');

const run2End = Number(rep.match(/never invoked in (\d+) cycles/)[1]);
const oldReviewFix = Number(rep.match(/last_review_fix_cycle`?:? (\d+)/)[1]);
const derived = run2End - oldReviewFix;

console.log(`run 2 ran               : ${run2End} cycles      (REPORT KI-2 row: "never invoked in ${run2End} cycles")`);
console.log(`review-fix cycle then   : ${oldReviewFix}             (REPORT correction note, line ~138)`);
console.log(`staleness run 2 measured: ${run2End} - ${oldReviewFix} = ${derived}`);
console.log(`figure asserted in prose: 42`);
console.log(derived === 42 ? 'G4 PASS — attribution of "42" to the review pass is confirmed'
                           : `G4 FAIL — prose says 42, re-derivation says ${derived}`);
process.exit(derived === 42 ? 0 : 1);
