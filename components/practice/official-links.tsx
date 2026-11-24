import { ExternalLink } from "lucide-react";
import { Card, CardHeader } from "@/components/ui";

const LINKS = [
  { href: "https://satsuitequestionbank.collegeboard.org/", title: "College Board Question Bank", note: "Official questions, filter by skill and difficulty" },
  { href: "https://bluebook.collegeboard.org/", title: "Bluebook practice tests", note: "Full-length adaptive tests in the real testing app" },
  { href: "https://www.khanacademy.org/digital-sat", title: "Khan Academy Digital SAT", note: "Official free course with College Board" },
  { href: "https://satsuite.collegeboard.org/practice", title: "All official practice", note: "Practice tests, answer explanations, score guides" },
];

export function OfficialLinks() {
  return (
    <Card>
      <CardHeader title="Official practice" description="Free from College Board. Log full-test scores under Scores." />
      <ul className="divide-y divide-line">
        {LINKS.map((l) => (
          <li key={l.href}>
            <a href={l.href} target="_blank" rel="noreferrer" className="flex items-start gap-2 px-5 py-3 hover:bg-slate-50">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{l.title}</p>
                <p className="text-xs text-slate-500">{l.note}</p>
              </div>
              <ExternalLink className="mt-0.5 size-3.5 shrink-0 text-slate-400" />
            </a>
          </li>
        ))}
      </ul>
    </Card>
  );
}
