"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setDailyGoal } from "@/app/actions/practice";
import { Button, Card, CardHeader, Input, Label, Select } from "@/components/ui";
import { SAT_TAXONOMY, type Section } from "@/lib/sat";

export function CustomSetBuilder() {
  const router = useRouter();
  const [section, setSection] = useState<Section | "">("");
  const [domain, setDomain] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [count, setCount] = useState(10);
  const domains = section ? Object.keys(SAT_TAXONOMY[section].domains) : [];

  function start() {
    const params = new URLSearchParams();
    if (section) params.set("section", section);
    if (domain) params.set("domain", domain);
    if (difficulty) params.set("difficulty", difficulty);
    params.set("count", String(count));
    router.push(`/practice/session?${params}`);
  }

  return (
    <Card>
      <CardHeader title="Custom set" />
      <div className="space-y-3 p-5">
        <Select value={section} onChange={(e) => { setSection(e.target.value as Section | ""); setDomain(""); }} aria-label="Section">
          <option value="">Both sections</option>
          <option value="rw">Reading & Writing</option>
          <option value="math">Math</option>
        </Select>
        <Select value={domain} onChange={(e) => setDomain(e.target.value)} disabled={!section} aria-label="Domain">
          <option value="">All domains</option>
          {domains.map((d) => <option key={d}>{d}</option>)}
        </Select>
        <div className="grid grid-cols-2 gap-2">
          <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} aria-label="Difficulty">
            <option value="">Any difficulty</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </Select>
          <Select value={count} onChange={(e) => setCount(Number(e.target.value))} aria-label="Number of questions">
            {[5, 10, 20, 30].map((n) => <option key={n} value={n}>{n} questions</option>)}
          </Select>
        </div>
        <Button className="w-full" onClick={start}>Start</Button>
      </div>
    </Card>
  );
}

export function GoalSetter({ goal }: { goal: number }) {
  const [value, setValue] = useState(goal);
  const [pending, start] = useTransition();
  return (
    <Card className="p-5">
      <Label htmlFor="goal">Daily goal (questions)</Label>
      <div className="flex gap-2">
        <Input id="goal" type="number" min={1} max={100} value={value} onChange={(e) => setValue(Number(e.target.value))} />
        <Button variant="secondary" disabled={pending || value === goal} onClick={() => start(() => setDailyGoal(value))}>Save</Button>
      </div>
    </Card>
  );
}
