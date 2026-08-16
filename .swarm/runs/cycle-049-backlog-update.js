// Cycle 49 backlog mutation, run once by the conductor. Kept as the record of exactly
// what was written, so the commit fingerprints the mutation and not just its result.
const fs = require("fs");
const bp = "/opt/targets/moon/.swarm/backlog.json";
const b = JSON.parse(fs.readFileSync(bp, "utf8"));

const t116 = b.items.find(i => i.id === "T-116");
t116.status = "done";
t116.notes += "\nCYCLE-49 GATE PASS: built at haiku, k=1 (gear-1 cap). Conductor-authored gate, five checks, all green -- diff is exactly 1 file / 2 lines (:193 colour->color, :227 Licence->License); zero residual colour|licence anywhere in README; both US forms present at the true lines; the src/ centre terms of art (astro.js:38/:239, render.js:45) provably untouched, since git status lists README.md alone; 145/145 suite unchanged. The KI-8 half (no LICENSE file at the repo root) remains OPEN and out of scope by design -- it needs a copyright holder only the repo owner can name.";

const t147 = b.items.find(i => i.id === "T-147");
t147.notes = (t147.notes ? t147.notes + "\n" : "") + "CYCLE-49 SCOPE ADDITION (conductor, not an agent): landing T-116 falsified two prose claims in REPORT.md that are NOT line-number citations, and so were not already inside this item. REPORT.md:122 ends the KI-8 row with an 'Adjacent:' clause saying README's Licence heading disagrees with package.json's spelling -- the heading now agrees. REPORT.md:144-147 opens 'Three backlog items remain todo' and lists T-116 as ratchet-rejected at cycles 20/21/22/47 -- T-116 is now done, so both the count and the entry are wrong. Folded into this item rather than filed as a new one on purpose: WRAP_UP regenerates REPORT.md from the template, so a separate build cycle for it would be churn -- but the falsified claims are recorded here so the regeneration cannot silently reproduce them.";

fs.writeFileSync(bp + ".tmp", JSON.stringify(b, null, 2));
fs.renameSync(bp + ".tmp", bp);

const todo = b.items.filter(i => i.status === "todo");
console.log("backlog:", b.items.length, "items |", todo.length, "todo |", b.items.filter(i => i.status === "done").length, "done");
console.log("todo now:", todo.map(i => i.id + "(p" + i.priority + "," + i.model + ")").join(" "));
