"""Builds supabase/seed_us_colleges.sql from the College Scorecard institution file.

Download "Most-Recent-Cohorts-Institution" from https://collegescorecard.ed.gov/data/ and run:
    python3 scripts/build-us-colleges.py path/to/Most-Recent-Cohorts-Institution.csv

Keeps currently operating public and private nonprofit colleges that mainly award bachelor's
degrees, publish an admission rate, and have at least 300 undergraduates.
"""
import csv
import re
import sys
from collections import Counter

# Our curated names -> Scorecard INSTNM, so curated rows gain stats instead of being duplicated.
CURATED = {
    "Massachusetts Institute of Technology": "Massachusetts Institute of Technology",
    "Stanford University": "Stanford University",
    "Harvard University": "Harvard University",
    "California Institute of Technology": "California Institute of Technology",
    "University of Chicago": "University of Chicago",
    "University of Pennsylvania": "University of Pennsylvania",
    "Cornell University": "Cornell University",
    "University of California, Berkeley": "University of California-Berkeley",
    "Yale University": "Yale University",
    "Johns Hopkins University": "Johns Hopkins University",
    "Princeton University": "Princeton University",
    "Columbia University": "Columbia University in the City of New York",
    "Northwestern University": "Northwestern University",
    "University of Michigan": "University of Michigan-Ann Arbor",
    "University of California, Los Angeles": "University of California-Los Angeles",
    "Carnegie Mellon University": "Carnegie Mellon University",
    "New York University": "New York University",
    "Duke University": "Duke University",
    "University of Texas at Austin": "The University of Texas at Austin",
    "Brown University": "Brown University",
    "University of Illinois Urbana-Champaign": "University of Illinois Urbana-Champaign",
    "University of California, San Diego": "University of California-San Diego",
    "University of Washington": "University of Washington-Seattle Campus",
    "Purdue University": "Purdue University-Main Campus",
    "Boston University": "Boston University",
    "Georgia Institute of Technology": "Georgia Institute of Technology-Main Campus",
    "Rice University": "Rice University",
    "University of Southern California": "University of Southern California",
    "Dartmouth College": "Dartmouth College",
    "Washington University in St. Louis": "Washington University in St Louis",
}
SOURCE = "U.S. Department of Education, College Scorecard (most recent cohorts, released Nov 2026)"


def num(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def q(v):
    if v is None:
        return "null"
    if isinstance(v, (int, float)):
        return str(v)
    return "'" + str(v).replace("'", "''") + "'"


def clean_name(n):
    n = n.replace("-Main Campus", "").replace(" Main Campus", "")
    return n.replace("-", " – ") if " University-" in n or " College-" in n else n


def stats(r):
    sat25 = num(r["SATVR25"]), num(r["SATMT25"])
    sat75 = num(r["SATVR75"]), num(r["SATMT75"])
    rate = num(r["ADM_RATE"])
    return {
        "scorecard_id": int(r["UNITID"]),
        "state": r["STABBR"],
        "ownership": "public" if r["CONTROL"] == "1" else "private",
        "acceptance_rate": round(rate, 4) if rate is not None else None,
        "sat_avg": int(num(r["SAT_AVG"])) if num(r["SAT_AVG"]) else None,
        "sat_25": int(sum(sat25)) if None not in sat25 else None,
        "sat_75": int(sum(sat75)) if None not in sat75 else None,
        "act_mid": int(num(r["ACTCMMID"])) if num(r["ACTCMMID"]) else None,
        "undergrad_size": int(num(r["UGDS"])) if num(r["UGDS"]) else None,
        "tuition_out_of_state": int(num(r["TUITIONFEE_OUT"])) if num(r["TUITIONFEE_OUT"]) else None,
        "cost_of_attendance": int(num(r["COSTT4_A"])) if num(r["COSTT4_A"]) else None,
        "intl_share": round(num(r["UGDS_NRA"]), 4) if num(r["UGDS_NRA"]) is not None else None,
        "grad_rate": round(num(r["C150_4"]), 4) if num(r["C150_4"]) is not None else None,
        "median_earnings": int(num(r["MD_EARN_WNE_P10"])) if num(r["MD_EARN_WNE_P10"]) else None,
        "stats_source": SOURCE,
    }


def main(path):
    rows = list(csv.DictReader(open(path, encoding="utf-8-sig")))
    sel = [
        r for r in rows
        if r["PREDDEG"] == "3" and r.get("CURROPER", "1") == "1" and num(r["ADM_RATE"]) is not None
        and r["CONTROL"] in ("1", "2") and (num(r["UGDS"]) or 0) >= 300
    ]
    by_name = {r["INSTNM"]: r for r in sel}
    curated_ids = {by_name[s]["UNITID"] for s in CURATED.values() if s in by_name}
    dupes = {n for n, c in Counter(clean_name(r["INSTNM"]) for r in sel).items() if c > 1}
    # Names already used by our curated (often non-U.S.) universities, e.g. Heidelberg University.
    dupes |= set(re.findall(r"^\('((?:[^']|'')*)', '", open("supabase/seed_universities.sql").read(), re.M))

    out = [f"-- Generated by scripts/build-us-colleges.py from College Scorecard. {len(sel)} U.S. colleges.",
           "-- Public-domain U.S. government data. Safe to re-run.", "begin;"]
    for ours, theirs in CURATED.items():
        r = by_name.get(theirs)
        if not r:
            continue
        s = stats(r)
        sets = ", ".join(f"{k} = {q(v)}" for k, v in s.items())
        out.append(f"update public.universities set {sets} where name = {q(ours)};")

    cols = ["name", "country", "city", "region", "website", "curated", "deadline_status", "deadlines"]
    stat_cols = list(stats(sel[0]).keys())
    values = []
    for r in sel:
        if r["UNITID"] in curated_ids:
            continue
        name = clean_name(r["INSTNM"])
        if name in dupes:
            name = f"{name} ({r['CITY']}, {r['STABBR']})"
        url = r["INSTURL"].strip()
        if url and not url.startswith("http"):
            url = "https://" + url
        base = [name, "United States", f"{r['CITY']}, {r['STABBR']}", "North America", url or None, "false", "estimated", "[]"]
        s = stats(r)
        vals = [q(v) for v in base[:5]] + ["false", "'estimated'", "'[]'::jsonb"] + [q(s[c]) for c in stat_cols]
        values.append("(" + ", ".join(vals) + ")")

    all_cols = cols + stat_cols
    updates = ", ".join(f"{c} = excluded.{c}" for c in stat_cols if c != "scorecard_id")
    for i in range(0, len(values), 300):
        out.append(f"insert into public.universities ({', '.join(all_cols)}) values\n" + ",\n".join(values[i:i + 300]) +
                   f"\non conflict (scorecard_id) do update set {updates};")
    out.append("commit;")
    open("supabase/seed_us_colleges.sql", "w").write("\n".join(out) + "\n")
    print(f"{len(sel)} selected, {len(curated_ids)} merged into curated rows, {len(values)} inserted")


if __name__ == "__main__":
    main(sys.argv[1])
