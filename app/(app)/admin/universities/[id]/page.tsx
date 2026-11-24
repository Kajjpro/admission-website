import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { saveUniversity } from "@/app/actions/admin";
import { REGIONS } from "@/lib/constants";
import { Button, Card, Input, Label, PageHeader, Select, Textarea } from "@/components/ui";
import type { University } from "@/lib/types";

export default async function EditUniversityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdmin();

  let uni: University | null = null;
  if (id !== "new") {
    const supabase = await createClient();
    const { data } = await supabase.from("universities").select("*").eq("id", id).single();
    if (!data) notFound();
    uni = data as University;
  }

  const text = (name: keyof University, label: string, multiline = false) => (
    <div className={multiline ? "sm:col-span-2" : ""}>
      <Label htmlFor={name}>{label}</Label>
      {multiline ? (
        <Textarea id={name} name={name} rows={2} defaultValue={(uni?.[name] as string) ?? ""} />
      ) : (
        <Input id={name} name={name} defaultValue={(uni?.[name] as string) ?? ""} />
      )}
    </div>
  );

  return (
    <>
      <PageHeader title={uni ? uni.name : "Add university"} description="Saving stamps today's date as “last reviewed”." />
      <Card className="p-6">
        <form action={saveUniversity} className="grid gap-4 sm:grid-cols-2">
          {uni && <input type="hidden" name="id" value={uni.id} />}
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required defaultValue={uni?.name} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="qs_rank">QS rank</Label>
              <Input id="qs_rank" name="qs_rank" type="number" min={1} max={1500} defaultValue={uni?.qs_rank ?? ""} />
            </div>
            <div>
              <Label htmlFor="deadline_status">Deadline status</Label>
              <Select id="deadline_status" name="deadline_status" defaultValue={uni?.deadline_status ?? "estimated"}>
                <option value="estimated">Estimated</option>
                <option value="confirmed">Confirmed</option>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="country">Country</Label>
            <Input id="country" name="country" required defaultValue={uni?.country} />
          </div>
          <div>
            <Label htmlFor="region">Region</Label>
            <Select id="region" name="region" defaultValue={uni?.region ?? REGIONS[0]}>
              {REGIONS.map((r) => <option key={r}>{r}</option>)}
            </Select>
          </div>
          {text("city", "City")}
          {text("platform", "Application platform")}
          <div className="sm:col-span-2">
            <Label htmlFor="deadlines">Deadlines (JSON)</Label>
            <Textarea
              id="deadlines"
              name="deadlines"
              rows={8}
              className="font-mono text-[13px]"
              defaultValue={JSON.stringify(uni?.deadlines ?? [{ round: "Regular Decision", date: "2027-01-01" }], null, 2)}
            />
            <p className="mt-1 text-xs text-slate-500">
              Each entry: {"{ \"round\": \"Early Action\", \"date\": \"2026-11-01\" }"}. Use {"\"date\": null"} with a {"\"window\""} when no date is published.
            </p>
          </div>
          {text("testing", "Testing")}
          {text("english", "English requirement")}
          {text("app_fee", "Application fee")}
          {text("website", "Official admissions URL")}
          {text("financial_aid", "Financial aid", true)}
          {text("notes", "Notes", true)}
          <div className="sm:col-span-2">
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Card>
    </>
  );
}
