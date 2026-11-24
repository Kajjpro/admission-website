"use client";

import { useState } from "react";
import { createEssay } from "@/app/actions/essays";
import { Button, Card, CardHeader, Input, Label, Select, Textarea } from "@/components/ui";
import { ESSAY_TYPES } from "@/lib/constants";
import type { EssayType } from "@/lib/types";

export function NewEssayForm() {
  const [type, setType] = useState<EssayType>("personal_statement");
  return (
    <Card className="h-fit">
      <CardHeader title="New essay" />
      <form action={createEssay} className="space-y-4 p-5">
        <div>
          <Label htmlFor="essay_type">Type</Label>
          <Select id="essay_type" name="essay_type" value={type} onChange={(e) => setType(e.target.value as EssayType)}>
            {Object.entries(ESSAY_TYPES).map(([value, { label }]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" placeholder={type === "supplemental" ? "e.g. Columbia — Why Columbia" : ESSAY_TYPES[type].label} />
        </div>
        <div>
          <Label htmlFor="prompt">Prompt</Label>
          <Textarea id="prompt" name="prompt" rows={3} placeholder="Paste the essay prompt" />
        </div>
        <div>
          <Label htmlFor="word_limit">Word limit</Label>
          <Input id="word_limit" name="word_limit" type="number" min={50} key={type} defaultValue={ESSAY_TYPES[type].defaultLimit} />
        </div>
        <Button type="submit" className="w-full">Create essay</Button>
      </form>
    </Card>
  );
}
