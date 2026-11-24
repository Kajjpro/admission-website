/**
 * Fills the SAT question bank with original, double-checked questions until every
 * skill × difficulty has --target questions (default 35 → ~3,150 total).
 *
 *   DATABASE_URL=postgres://... npm run bank:generate -- --target 35
 *
 * Safe to stop and re-run: it counts what exists and only fills the gaps.
 * On Gemini's free tier it stops when the daily quota runs out; run it again the next day.
 */
import pg from "pg";
import { isRateLimit } from "../lib/gemini";
import { generateVerifiedBatch } from "../lib/question-gen";
import { SAT_TAXONOMY, type Difficulty, type Section } from "../lib/sat";

const args = process.argv.slice(2);
const flag = (name: string, fallback: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1]! : fallback;
};
const TARGET = Number(flag("target", "35"));
const BATCH = Number(flag("batch", "5"));
const CONCURRENCY = Number(flag("concurrency", "2"));
const ONLY = flag("skill", "");

if (!process.env.DATABASE_URL) throw new Error("Set DATABASE_URL (Supabase session pooler connection string).");
if (!process.env.GEMINI_API_KEY) throw new Error("Set GEMINI_API_KEY in .env.local.");

const db = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 4 });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Cell = { domain: string; skill: string; difficulty: Difficulty };

async function main() {
  const cells: Cell[] = (Object.keys(SAT_TAXONOMY) as Section[]).flatMap((section) =>
    Object.entries(SAT_TAXONOMY[section].domains).flatMap(([domain, skills]) =>
      skills
        .filter((skill) => !ONLY || skill === ONLY)
        .flatMap((skill) => (["easy", "medium", "hard"] as const).map((difficulty) => ({ domain, skill, difficulty }))),
    ),
  );

  const { rows } = await db.query<{ skill: string; difficulty: string; n: string }>(
    "select skill, difficulty, count(*) n from sat_questions where verified group by 1, 2",
  );
  const have = new Map(rows.map((r) => [`${r.skill}|${r.difficulty}`, Number(r.n)]));
  const queue = cells
    .map((c) => ({ ...c, missing: TARGET - (have.get(`${c.skill}|${c.difficulty}`) ?? 0) }))
    .filter((c) => c.missing > 0)
    .sort((a, b) => b.missing - a.missing);

  const totalMissing = queue.reduce((a, c) => a + c.missing, 0);
  console.log(`${cells.length} skill/difficulty cells, ${totalMissing} questions to generate (target ${TARGET} each).`);

  let added = 0;
  let rejected = 0;
  let quotaHits = 0;
  let stop = false;

  async function work(cell: (typeof queue)[number]) {
    while (cell.missing > 0 && !stop) {
      const [{ rows: examples }, { rows: existing }] = await Promise.all([
        db.query("select passage, stem, answer_type, choices, correct_answer, explanation from sat_questions where skill = $1 and verified order by random() limit 2", [cell.skill]),
        db.query("select stem from sat_questions where skill = $1 order by created_at desc limit 30", [cell.skill]),
      ]);
      try {
        const result = await generateVerifiedBatch({
          ...cell,
          count: Math.min(BATCH, cell.missing + 1),
          examples,
          existingStems: existing.map((e) => e.stem),
        });
        quotaHits = 0;
        rejected += result.rejected;
        for (const q of result.passed.slice(0, cell.missing)) {
          await db.query(
            `insert into sat_questions (section, domain, skill, difficulty, passage, stem, answer_type, choices, correct_answer, accepted_answers, explanation, source, verified)
             values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'ai',true)`,
            [q.section, q.domain, q.skill, q.difficulty, q.passage, q.stem, q.answer_type, JSON.stringify(q.choices), q.correct_answer, q.accepted_answers, q.explanation],
          );
          cell.missing--;
          added++;
        }
        console.log(`+${result.passed.length} ${cell.skill} (${cell.difficulty})  · total added ${added}, discarded ${rejected}`);
      } catch (error) {
        if (isRateLimit(error)) {
          quotaHits++;
          if (quotaHits >= 4) {
            console.log("Gemini quota exhausted. Run the same command later to continue where it stopped.");
            stop = true;
            return;
          }
          const wait = 30_000 * quotaHits;
          console.log(`Rate limited; waiting ${wait / 1000}s`);
          await sleep(wait);
        } else {
          console.log(`Error on ${cell.skill} (${cell.difficulty}): ${(error as Error).message.slice(0, 160)}`);
          await sleep(3000);
          return;
        }
      }
    }
  }

  const pending = [...queue];
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (pending.length && !stop) await work(pending.shift()!);
    }),
  );

  const { rows: total } = await db.query<{ n: string }>("select count(*) n from sat_questions where verified");
  console.log(`Done for now. Added ${added}, discarded ${rejected} that failed verification. Bank size: ${total[0]!.n}.`);
  await db.end();
}

main().catch(async (e) => {
  console.error(e);
  await db.end();
  process.exit(1);
});
