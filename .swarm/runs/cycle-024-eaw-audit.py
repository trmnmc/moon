#!/usr/bin/env python3
"""
T-121 (effort S) -- KI-5 East Asian Width audit.

Two independent, evidence-based checks on the KI-5 known-issue claim in
README.md / test/render.test.js:

  Part 1. Cross-check the hand-typed Neutral/Ambiguous partition (pinned in
           test/render.test.js as DOCUMENTED_EAW / UNDOCUMENTED_DISC_GLYPHS)
           against authoritative Unicode Character Database (UCD) data via
           Python's `unicodedata` module.

  Part 2. Enumerate -- not merely reason about -- whether *some* single-EAW-
           class Unicode glyph set could satisfy what src/render.js actually
           needs: an N-step monotonic shading ramp plus a mirror-symmetric
           handed glyph pair.

Zero non-stdlib imports. No network. Deterministic (all iteration order is
sorted explicitly; no dict-ordering or set-ordering dependence in output).

Run from the repo root:
    python3 .swarm/runs/cycle-024-eaw-audit.py
"""

import re
import sys
import unicodedata as ud
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RENDER_JS = ROOT / "src" / "render.js"
TEST_JS = ROOT / "test" / "render.test.js"

OK = True  # flipped to False if anything required could not be established


def fail(msg):
    global OK
    OK = False
    print(f"  !! COULD NOT ESTABLISH: {msg}")


def hexcp(cp):
    return f"U+{cp:04X}"


def eaw_full(code):
    return {
        "N": "Neutral",
        "A": "Ambiguous",
        "W": "Wide",
        "Na": "Narrow",
        "H": "Halfwidth",
        "F": "Fullwidth",
    }.get(code, code)


def glyph_name(cp):
    try:
        return ud.name(chr(cp))
    except ValueError:
        return "<UNASSIGNED>"


def describe(cp):
    ch = chr(cp)
    cls = ud.east_asian_width(ch)
    return f"{hexcp(cp)} {ch!r:>4} {eaw_full(cls):<10} {glyph_name(cp)}"


# =============================================================================
# Part 1: parse the glyphs the renderer actually draws, and the glyphs the
# test file documents, straight out of the source text.
# =============================================================================


def extract_statement(text, const_name):
    """Return the RHS text of `const <const_name> = ...;` (first match), or
    None if the pattern cannot be found."""
    m = re.search(
        r"const\s+" + re.escape(const_name) + r"\s*=\s*(.*?);", text, re.DOTALL
    )
    return m.group(1) if m else None


def single_quoted_chars(rhs):
    """All single-character '...' literals appearing in an RHS fragment, in
    source order."""
    return re.findall(r"'([^'\\])'", rhs)


def parse_render_js():
    """Parse the glyph constants out of src/render.js. Returns a dict with
    keys: shade (list), limb_dark (str), hairline (dict), half (dict),
    round_limb (dict), mirror (list of (a,b)), box (dict) -- or None for any
    piece that could not be parsed, with a fail() logged."""
    text = RENDER_JS.read_text(encoding="utf-8")
    out = {}

    rhs = extract_statement(text, "SHADE")
    if rhs is None:
        fail("src/render.js: could not find `const SHADE = ...;`")
        out["shade"] = None
    else:
        out["shade"] = single_quoted_chars(rhs)
        if len(out["shade"]) < 2:
            fail(f"src/render.js: SHADE parsed to too few glyphs: {out['shade']!r}")

    rhs = extract_statement(text, "LIMB_DARK")
    if rhs is None:
        fail("src/render.js: could not find `const LIMB_DARK = ...;`")
        out["limb_dark"] = None
    else:
        chars = single_quoted_chars(rhs)
        out["limb_dark"] = chars[0] if chars else None
        if not out["limb_dark"]:
            fail(f"src/render.js: LIMB_DARK parsed with no glyph: {rhs!r}")

    for key, const_name in [("hairline", "HAIRLINE"), ("half", "HALF"), ("round_limb", "ROUND_LIMB")]:
        rhs = extract_statement(text, const_name)
        if rhs is None:
            fail(f"src/render.js: could not find `const {const_name} = ...;`")
            out[key] = None
            continue
        right_m = re.search(r"right\s*:\s*'([^'\\])'", rhs)
        left_m = re.search(r"left\s*:\s*'([^'\\])'", rhs)
        if not (right_m and left_m):
            fail(f"src/render.js: {const_name} did not parse right/left cleanly: {rhs!r}")
            out[key] = None
        else:
            out[key] = {"right": right_m.group(1), "left": left_m.group(1)}

    rhs = extract_statement(text, "MIRROR")
    if rhs is None:
        fail("src/render.js: could not find `const MIRROR = ...;`")
        out["mirror"] = None
    else:
        pairs = re.findall(r"\[\s*'([^'\\])'\s*,\s*'([^'\\])'\s*\]", rhs)
        out["mirror"] = pairs
        if not pairs:
            fail(f"src/render.js: MIRROR parsed with no pairs: {rhs!r}")

    rhs = extract_statement(text, "BOX")
    if rhs is None:
        fail("src/render.js: could not find `const BOX = ...;`")
        out["box"] = None
    else:
        box = {}
        for key in ["h", "v", "tl", "tr", "bl", "br"]:
            m = re.search(rf"\b{key}\s*:\s*'([^'\\])'", rhs)
            if m:
                box[key] = m.group(1)
        out["box"] = box if len(box) == 6 else None
        if out["box"] is None:
            fail(f"src/render.js: BOX did not parse all 6 sides: {rhs!r} -> {box!r}")

    return out


def parse_test_js():
    """Parse DOCUMENTED_EAW and UNDOCUMENTED_DISC_GLYPHS out of
    test/render.test.js. Returns (documented: dict[int,str] or None,
    undocumented: set[int] or None)."""
    text = TEST_JS.read_text(encoding="utf-8")

    m = re.search(
        r"const\s+DOCUMENTED_EAW\s*=\s*new Map\(\[(.*?)\]\s*\)\s*;", text, re.DOTALL
    )
    documented = None
    if m is None:
        fail("test/render.test.js: could not find `const DOCUMENTED_EAW = new Map([...]);`")
    else:
        pairs = re.findall(r"\[\s*(0x[0-9a-fA-F]+)\s*,\s*'([^']+)'\s*\]", m.group(1))
        if not pairs:
            fail("test/render.test.js: DOCUMENTED_EAW matched but no entries parsed")
        else:
            documented = {int(cp, 16): cls for cp, cls in pairs}

    m = re.search(
        r"const\s+UNDOCUMENTED_DISC_GLYPHS\s*=\s*new Set\(\[(.*?)\]\s*\)\s*;",
        text,
        re.DOTALL,
    )
    undocumented = None
    if m is None:
        fail("test/render.test.js: could not find `const UNDOCUMENTED_DISC_GLYPHS = new Set([...]);`")
    else:
        cps = re.findall(r"0x[0-9a-fA-F]+", m.group(1))
        if not cps:
            fail("test/render.test.js: UNDOCUMENTED_DISC_GLYPHS matched but no entries parsed")
        else:
            undocumented = {int(cp, 16) for cp in cps}

    return documented, undocumented


def part1():
    print("=" * 78)
    print("PART 1 -- hand-typed EAW partition vs. authoritative UCD data")
    print("=" * 78)
    print(f"unicodedata.unidata_version = {ud.unidata_version}")
    print(f"Python version               = {sys.version.split()[0]}")
    print()

    rjs = parse_render_js()
    documented, undocumented_test = parse_test_js()

    if rjs["shade"] is None or rjs["hairline"] is None or rjs["half"] is None or rjs["round_limb"] is None:
        fail("cannot assemble the drawn-disc glyph set; one or more source constants failed to parse")
        drawn = None
    else:
        drawn = set()
        for ch in rjs["shade"]:
            drawn.add(ord(ch))
        if rjs["limb_dark"]:
            drawn.add(ord(rjs["limb_dark"]))
        for d in (rjs["hairline"], rjs["half"], rjs["round_limb"]):
            drawn.add(ord(d["right"]))
            drawn.add(ord(d["left"]))

    print("Disc glyph constants parsed out of src/render.js (source of truth,")
    print("not re-typed):")
    if rjs["shade"] is not None:
        print(f"  SHADE      = {rjs['shade']!r}  (N={len(rjs['shade'])})")
    if rjs["limb_dark"] is not None:
        print(f"  LIMB_DARK  = {rjs['limb_dark']!r}")
    if rjs["hairline"] is not None:
        print(f"  HAIRLINE   = {rjs['hairline']!r}")
    if rjs["half"] is not None:
        print(f"  HALF       = {rjs['half']!r}")
    if rjs["round_limb"] is not None:
        print(f"  ROUND_LIMB = {rjs['round_limb']!r}")
    if rjs["mirror"] is not None:
        print(f"  MIRROR     = {rjs['mirror']!r}")
    if rjs["box"] is not None:
        print(f"  BOX (frame, NOT disc) = {rjs['box']!r}")
    print()

    if drawn is not None:
        print(f"==> Drawn DISC glyph alphabet (union of the above, excluding BOX): "
              f"{sorted(hexcp(cp) for cp in drawn)}")
    print()

    print("Documented partition/glyph sets parsed out of test/render.test.js:")
    if documented is not None:
        print(f"  DOCUMENTED_EAW keys        = {sorted(hexcp(cp) for cp in documented)}")
    if undocumented_test is not None:
        print(f"  UNDOCUMENTED_DISC_GLYPHS   = {sorted(hexcp(cp) for cp in undocumented_test)}")
    print()

    # ---- Cross-check 1: does the drawn set equal the documented set? -------
    print("-- Cross-check: drawn (src/render.js) vs. documented (test/render.test.js) --")
    if drawn is not None and documented is not None and undocumented_test is not None:
        doc_all = set(documented) | undocumented_test
        drawn_not_doc = drawn - doc_all
        doc_not_drawn = doc_all - drawn
        if drawn_not_doc:
            print(f"  DRAWN BUT NOT DOCUMENTED: {sorted(hexcp(c) for c in drawn_not_doc)}")
        if doc_not_drawn:
            print(f"  DOCUMENTED BUT NOT DRAWN: {sorted(hexcp(c) for c in doc_not_drawn)}")
        if not drawn_not_doc and not doc_not_drawn:
            print("  MATCH: the drawn disc glyph alphabet is exactly the documented set.")
    else:
        fail("cannot cross-check drawn vs. documented glyph sets (a parse step failed above)")
    print()

    # ---- Cross-check 2: documented EAW class vs. real UCD EAW class -------
    print("-- Cross-check: documented EAW class ('Neutral'/'Ambiguous') vs. real UCD class --")
    disagreements = []
    if documented is not None:
        for cp in sorted(documented):
            real = eaw_full(ud.east_asian_width(chr(cp)))
            claimed = documented[cp]
            flag = "OK" if real == claimed else "DISAGREE"
            if real != claimed:
                disagreements.append((cp, claimed, real))
            print(f"  {describe(cp):<55} documented={claimed:<10} ucd={real:<10} {flag}")
    print()
    if documented is not None:
        if disagreements:
            print(f"  {len(disagreements)} DISAGREEMENT(S) between documented partition and UCD:")
            for cp, claimed, real in disagreements:
                print(f"    {hexcp(cp)} {glyph_name(cp)}: repo says {claimed}, UCD says {real}")
        else:
            print("  0 disagreements: the documented Neutral/Ambiguous partition matches UCD exactly.")
    print()

    # ---- The previously-unestablished round-limb glyphs -------------------
    print("-- Glyphs the repo explicitly says are NOT yet classified (round limb) --")
    if undocumented_test is not None:
        for cp in sorted(undocumented_test):
            print(f"  {describe(cp)}  <-- now established by this instrument")
    print()

    return {
        "documented": documented,
        "undocumented_test": undocumented_test,
        "drawn": drawn,
        "disagreements": disagreements,
        "box": rjs["box"],
        "shade": rjs["shade"],
        "half": rjs["half"],
        "hairline": rjs["hairline"],
    }


# =============================================================================
# Part 2: enumerate the impossibility claim instead of reasoning about it.
# =============================================================================

RANGES = {
    "Block Elements": (0x2580, 0x259F),
    "Geometric Shapes": (0x25A0, 0x25FF),
    "Symbols for Legacy Computing": (0x1FB00, 0x1FBFF),
}

FRACTION_WORDS = [
    ("SEVEN EIGHTHS", 7 / 8),
    ("FIVE EIGHTHS", 5 / 8),
    ("THREE EIGHTHS", 3 / 8),
    ("ONE EIGHTH", 1 / 8),
    ("THREE QUARTERS", 3 / 4),
    ("ONE QUARTER", 1 / 4),
    ("HALF", 1 / 2),
]

FRACTION_BLOCK_RE = re.compile(
    r"^(UPPER|LOWER|LEFT|RIGHT) (" + "|".join(w for w, _ in FRACTION_WORDS) + r") BLOCK$"
)
QUADRANT_RE = re.compile(r"^QUADRANT (.+)$")
SEXTANT_RE = re.compile(r"^BLOCK SEXTANT-(\d+)$")
SHADE_NAMES = {"LIGHT SHADE": 0.25, "MEDIUM SHADE": 0.5, "DARK SHADE": 0.75}


def glyph_density(name):
    """A conservative, name-derived fill-fraction for a glyph, or None if the
    name does not match one of the strict, well-understood patterns below.
    Anything not matched is left as None (unknown) rather than guessed."""
    if name == "FULL BLOCK":
        return 1.0
    if name in SHADE_NAMES:
        return SHADE_NAMES[name]
    m = FRACTION_BLOCK_RE.match(name)
    if m:
        word = m.group(2)
        return dict(FRACTION_WORDS)[word]
    m = QUADRANT_RE.match(name)
    if m:
        rest = m.group(1)
        quads = ["UPPER LEFT", "UPPER RIGHT", "LOWER LEFT", "LOWER RIGHT"]
        count = sum(1 for q in quads if q in rest)
        return count / 4 if count else None
    m = SEXTANT_RE.match(name)
    if m:
        digits = m.group(1)
        return len(digits) / 6
    return None


def collect_pool(range_names):
    """All assigned codepoints in the named ranges: list of
    (cp, name, eaw_class, density_or_None, source_range)."""
    pool = []
    for rname in range_names:
        lo, hi = RANGES[rname]
        for cp in range(lo, hi + 1):
            ch = chr(cp)
            try:
                name = ud.name(ch)
            except ValueError:
                continue
            cls = ud.east_asian_width(ch)
            pool.append((cp, name, cls, glyph_density(name), rname))
    return pool


def find_lr_pairs(pool):
    """Codepoint pairs whose names are identical except LEFT<->RIGHT (a
    horizontal mirror, matching how src/render.js's MIRROR map and
    mirrorArt() actually swap glyphs for the southern hemisphere). Returns
    list of (cp_a, cp_b) with cp_a < cp_b, deduplicated."""
    by_name = {name: cp for cp, name, _cls, _d, _r in pool}
    seen = set()
    pairs = []
    for cp, name, _cls, _d, _r in pool:
        if "LEFT" not in name:
            continue
        candidate = name.replace("LEFT", "RIGHT")
        if candidate == name:
            continue
        other = by_name.get(candidate)
        if other is None:
            continue
        key = tuple(sorted((cp, other)))
        if key in seen:
            continue
        seen.add(key)
        pairs.append(key)
    return sorted(pairs)


def ramp_candidates(pool, cls, n, top_required):
    """Distinct-density glyphs of a given EAW class, sorted by density. If at
    least n distinct densities are available AND the maximum equals
    top_required (the density SHADE's brightest step actually needs, read
    from source), returns a chosen list of n (cp, name, density) spanning
    low->top_required. Otherwise returns None and the caller should report
    the nearest miss from the sorted list this function also returns."""
    by_density = {}
    for cp, name, c, d, _r in pool:
        if c != cls or d is None:
            continue
        # keep the lowest codepoint for each distinct density, for determinism
        if d not in by_density or cp < by_density[d][0]:
            by_density[d] = (cp, name, d)
    distinct = sorted(by_density.values(), key=lambda t: t[2])
    if len(distinct) < n or distinct[-1][2] != top_required:
        return None, distinct
    # choose n entries: force-include the max (1.0), then evenly spread the rest
    others = distinct[:-1]
    if len(others) == n - 1:
        chosen = others + [distinct[-1]]
    else:
        idxs = sorted({round(i * (len(others) - 1) / (n - 2)) for i in range(n - 1)}) if n > 2 else []
        idxs = idxs[: n - 1]
        chosen = [others[i] for i in idxs] + [distinct[-1]]
    return chosen, distinct


def pairs_with_density(pool, pairs, cls, target):
    """L/R pairs, both members in class `cls`, whose density (via
    glyph_density) both equal `target` exactly. If target is None, this
    checks for a name-symmetric pair with no density requirement at all
    (used for shape-only handed glyphs like the round limb, which no
    fraction-of-a-cell density parser can meaningfully score)."""
    dens = {cp: d for cp, _n, _c, d, _r in pool}
    clsof = {cp: c for cp, _n, c, _d, _r in pool}
    out = []
    for a, b in pairs:
        if clsof.get(a) != cls or clsof.get(b) != cls:
            continue
        if target is None:
            out.append((a, b))
        elif dens.get(a) == target and dens.get(b) == target:
            out.append((a, b))
    return out


def run_search(label, pool_ranges, n, top_required, half_density, hairline_density, note_lines):
    print("-" * 78)
    print(label)
    for line in note_lines:
        print(line)
    print("-" * 78)
    pool = collect_pool(pool_ranges)
    classes = sorted({c for _cp, _n, c, _d, _r in pool})
    print(f"EAW classes present: {[eaw_full(c) for c in classes]}")
    pairs = find_lr_pairs(pool)
    print(f"Total LEFT/RIGHT mirror-name pairs found in this pool: {len(pairs)}")
    print()

    findings = {}
    for cls in classes:
        chosen, distinct = ramp_candidates(pool, cls, n, top_required)
        half_pairs = pairs_with_density(pool, pairs, cls, half_density)
        hair_pairs = pairs_with_density(pool, pairs, cls, hairline_density)
        any_pairs = pairs_with_density(pool, pairs, cls, None)

        print(f"  Class {eaw_full(cls)}:")
        print(f"    distinct densities available: {[round(d, 3) for _cp, _n, d in distinct]}")
        if chosen is None:
            if len(distinct) < n:
                reason = f"only {len(distinct)} distinct fill-density value(s) found in this class"
            else:
                reason = (f"highest density found is {distinct[-1][2]}, short of the "
                          f"required {top_required} ('{distinct[-1][1]}' {hexcp(distinct[-1][0])} "
                          f"is the nearest miss)")
            print(f"    RAMP (need {n} steps, top={top_required}): FAIL -- {reason}")
        else:
            print(f"    RAMP (need {n} steps, top={top_required}): OK -- "
                  f"{[(hexcp(cp), nm, round(d, 3)) for cp, nm, d in chosen]}")

        if half_density is not None:
            print(f"    same-class pair at density={half_density} (the 'half-block' pair): "
                  f"{[(hexcp(x), hexcp(y)) for x, y in half_pairs] or 'NONE'}")
        if hairline_density is not None:
            print(f"    same-class pair at density={round(hairline_density, 3)} (the 'hairline' pair): "
                  f"{[(hexcp(x), hexcp(y)) for x, y in hair_pairs] or 'NONE'}")

        # round-limb-equivalent: any same-class name-mirror pair not reused
        # from the half/hairline pairs already counted above.
        used = set()
        for x, y in half_pairs[:1] + hair_pairs[:1]:
            used.add(x)
            used.add(y)
        shape_pairs = [(x, y) for x, y in any_pairs if x not in used and y not in used]
        print(f"    a third, distinct same-class handed pair (round-limb-equivalent): "
              f"{[(hexcp(x), hexcp(y)) for x, y in shape_pairs[:1]] or 'NONE'}")

        satisfied_narrow = chosen is not None and len(half_pairs) > 0
        satisfied_full = (
            chosen is not None
            and len(half_pairs) > 0
            and (hairline_density is None or len(hair_pairs) > 0)
            and len(shape_pairs) > 0
        )
        print(f"    NARROW predicate (ramp + half-density pair only) satisfied here: {satisfied_narrow}")
        print(f"    FULL predicate (ramp + half + hairline + a third handed pair) satisfied here: {satisfied_full}")
        findings[cls] = {
            "chosen": chosen,
            "half_pairs": half_pairs,
            "hair_pairs": hair_pairs,
            "shape_pairs": shape_pairs,
            "narrow": satisfied_narrow,
            "full": satisfied_full,
        }
        print()
    return findings


def part2(disc_facts):
    print("=" * 78)
    print("PART 2 -- enumerating the impossibility claim")
    print("=" * 78)
    print()

    shade_cps = [ord(c) for c in disc_facts["shade"]] if disc_facts.get("shade") else None
    half_cps = disc_facts.get("half")
    hairline_cps = disc_facts.get("hairline")

    if not shade_cps:
        fail("cannot derive ramp length/top-density requirement: SHADE did not parse")
        n_required, top_required = 4, 1.0
    else:
        n_required = len(shade_cps)
        top_required = glyph_density(glyph_name(shade_cps[-1]))
        if top_required is None:
            fail(f"cannot derive top-of-ramp density from {hexcp(shade_cps[-1])} "
                 f"({glyph_name(shade_cps[-1])}); defaulting to 1.0")
            top_required = 1.0

    if half_cps:
        half_density = glyph_density(glyph_name(ord(half_cps["left"])))
        if half_density is None:
            fail(f"cannot derive HALF-pair density from {glyph_name(ord(half_cps['left']))}")
    else:
        fail("cannot derive HALF-pair density: HALF did not parse")
        half_density = 0.5

    if hairline_cps:
        hairline_density = glyph_density(glyph_name(ord(hairline_cps["left"])))
        if hairline_density is None:
            fail(f"cannot derive HAIRLINE-pair density from {glyph_name(ord(hairline_cps['left']))}")
    else:
        fail("cannot derive HAIRLINE-pair density: HAIRLINE did not parse")
        hairline_density = None

    print("Predicate under test -- stated in plain words, with every number pulled")
    print("from the parsed source in Part 1, not assumed:")
    print(f"  Ramp: {n_required} glyphs, strictly increasing fill-density, topping out")
    print(f"        at density {top_required} (read off SHADE[-1] = "
          f"{hexcp(shade_cps[-1])} {glyph_name(shade_cps[-1])!r}).")
    print(f"  A same-class horizontally mirror-symmetric ('LEFT'<->'RIGHT'-named)")
    print(f"        pair at density {half_density} -- this is what KI-5's prose calls")
    print(f"        'a symmetric half-block pair'. This alone is the NARROW predicate,")
    print(f"        matching KI-5's literal wording.")
    if hairline_density is not None:
        print(f"  The FULL predicate additionally requires a same-class pair at density")
        print(f"        {round(hairline_density, 3)} (matching HAIRLINE, {hexcp(ord(hairline_cps['left']))} "
              f"{glyph_name(ord(hairline_cps['left']))!r}) and one more distinct same-class")
        print(f"        handed pair (matching ROUND_LIMB's role -- a shape pair with no")
        print(f"        fraction-of-cell density, so only name-symmetry is checked).")
    print(f"  NARROW is deliberately narrower than what src/render.js needs (it only")
    print(f"        checks the half-density pair KI-5's prose names); FULL is what the")
    print(f"        renderer actually needs end to end (all three handed pairs it uses).")
    print()

    findings_a = run_search(
        "Search A (KI-5's literal wording): pool = Block Elements (U+2580-U+259F) ONLY.",
        ["Block Elements"], n_required, top_required, half_density, hairline_density,
        [],
    )
    narrow_a = any(f["narrow"] for f in findings_a.values())
    full_a = any(f["full"] for f in findings_a.values())
    print(f"==> Search A -- NARROW predicate: {'SATISFYING SET EXISTS' if narrow_a else 'no satisfying set'}")
    print(f"==> Search A -- FULL predicate:   {'SATISFYING SET EXISTS' if full_a else 'no satisfying set'}")
    print()

    findings_b = run_search(
        "Search B (wider, justified pool): Block Elements + Geometric Shapes + Symbols",
        ["Block Elements", "Geometric Shapes", "Symbols for Legacy Computing"],
        n_required, top_required, half_density, hairline_density,
        ["for Legacy Computing. Geometric Shapes is included because the renderer",
         "already draws ROUND_LIMB from it (U+25D6/U+25D7). Symbols for Legacy",
         "Computing is included because it is the only other Unicode block with",
         "systematic sub-cell fill glyphs (eighth/quarter blocks, sextants) that",
         "could plausibly extend a ramp or supply a same-class mirror pair; it",
         "postdates Block Elements and was not available when KI-5 was written."],
    )
    narrow_b = any(f["narrow"] for f in findings_b.values())
    full_b = any(f["full"] for f in findings_b.values())
    print(f"==> Search B -- NARROW predicate: {'SATISFYING SET EXISTS' if narrow_b else 'no satisfying set'}")
    print(f"==> Search B -- FULL predicate:   {'SATISFYING SET EXISTS' if full_b else 'no satisfying set'}")
    if narrow_b:
        for cls, f in sorted(findings_b.items()):
            if f["narrow"]:
                print(f"    Class {eaw_full(cls)}: ramp = "
                      f"{[(hexcp(cp), nm) for cp, nm, _d in f['chosen']]}")
                print(f"                     half-pair = "
                      f"{[(hexcp(x), hexcp(y)) for x, y in f['half_pairs']]}")
    print()

    return {
        "narrow_a": narrow_a, "full_a": full_a,
        "narrow_b": narrow_b, "full_b": full_b,
        "n_required": n_required, "top_required": top_required,
        "half_density": half_density, "hairline_density": hairline_density,
    }


def main():
    p1 = part1()
    p2 = part2(p1)
    print("=" * 78)
    print("SUMMARY")
    print("=" * 78)
    print(f"Part 1 disagreements between documented partition and UCD: {len(p1['disagreements'])}")
    print(f"Part 2 Search A (Block Elements only)      NARROW predicate satisfying set exists: {p2['narrow_a']}")
    print(f"Part 2 Search A (Block Elements only)      FULL predicate satisfying set exists:   {p2['full_a']}")
    print(f"Part 2 Search B (wider, justified pool)    NARROW predicate satisfying set exists: {p2['narrow_b']}")
    print(f"Part 2 Search B (wider, justified pool)    FULL predicate satisfying set exists:   {p2['full_b']}")
    if not OK:
        print()
        print("One or more facts above could not be established by this instrument;")
        print("see the 'COULD NOT ESTABLISH' lines above for exactly what and why.")
        sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":
    main()
