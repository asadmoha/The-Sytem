import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, Panel, EmptyState, th, td } from "@/components/ui-kit";
import { setState, useStore, type Role } from "@/lib/demo-store";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/settings")({
  head: () => seo("Settings", "School profile, grading scale, demo roles and audit log."),
  component: Settings,
});
const ROLES: Role[] = ["Administrator", "Teacher", "Admissions", "Finance", "Read-only"];

function Settings() {
  const st = useStore((s) => s);
  const [school, setSchool] = useState(st.school);
  const [bands, setBands] = useState(st.gradeBands);
  const toggleRole = (r: Role) => {
    const next = st.roles.includes(r) ? st.roles.filter((x) => x !== r) : [...st.roles, r];
    if (!next.length) return toast.error("Keep at least one role.");
    setState(() => ({ roles: next }), `Demo roles set to ${next.join(", ")}`);
  };
  const saveBands = () => {
    const mins = bands.map((b) => b.min);
    if (mins.some((m) => m < 0 || m > 100) || new Set(mins).size !== mins.length) return toast.error("Minimums must be unique values between 0 and 100.");
    setState(() => ({ gradeBands: [...bands].sort((a, b) => b.min - a.min) }), "Updated grading scale");
    toast.success("Grading scale saved");
  };
  return (
    <div>
      <PageHeader title="Settings" crumbs={[{ label: "Settings" }]} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="School profile">
          <div className="grid gap-3">
            {(["name", "motto", "formLabel", "streamLabel"] as const).map((k) => (
              <label key={k} className="grid gap-1 text-sm"><span className="text-xs text-muted-foreground capitalize">{k.replace("Label", " label")}</span>
                <Input value={school[k]} onChange={(e) => setSchool({ ...school, [k]: e.target.value })} /></label>
            ))}
            <Button onClick={() => { if (!school.name.trim()) return toast.error("School name is required."); setState(() => ({ school }), "Updated school profile"); toast.success("Profile saved"); }}>Save profile</Button>
          </div>
        </Panel>
        <Panel title="Demo roles" action={<span className="text-xs text-muted-foreground">Preview what each role can do</span>}>
          <div className="flex flex-wrap gap-2">{ROLES.map((r) => (
            <button key={r} onClick={() => toggleRole(r)} className={`rounded-full border px-3 py-1.5 text-sm ${st.roles.includes(r) ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`}>{r}</button>
          ))}</div>
        </Panel>
        <Panel title="Grading scale">
          <table className="w-full"><thead className="border-b"><tr><th className={th}>Min %</th><th className={th}>Grade</th><th className={th}>Remark</th></tr></thead>
            <tbody className="divide-y">{bands.map((b, i) => <tr key={i}>
              <td className={td}><Input className="h-8 w-20" type="number" value={b.min} onChange={(e) => setBands(bands.map((x, j) => (j === i ? { ...x, min: Number(e.target.value) } : x)))} /></td>
              <td className={td}><Input className="h-8 w-16" value={b.grade} onChange={(e) => setBands(bands.map((x, j) => (j === i ? { ...x, grade: e.target.value } : x)))} /></td>
              <td className={td}><Input className="h-8" value={b.remark} onChange={(e) => setBands(bands.map((x, j) => (j === i ? { ...x, remark: e.target.value } : x)))} /></td></tr>)}</tbody></table>
          <Button className="mt-3" onClick={saveBands}>Save scale</Button>
        </Panel>
        <Panel title="Audit log">
          {!st.audit.length ? <EmptyState text="No changes recorded this session." /> : (
            <ul className="max-h-80 divide-y overflow-y-auto">{st.audit.map((a, i) => <li key={i} className="py-2 text-sm"><div>{a.action}</div><div className="text-xs text-muted-foreground">{new Date(a.at).toLocaleString()}</div></li>)}</ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
