import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, Panel, StatusBadge, EmptyState, useCan, th, td, selectCls } from "@/components/ui-kit";
import { className, fullName, getState, setState, uid, useStore, type AttendanceStatus } from "@/lib/demo-store";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/attendance")({
  head: () => seo("Attendance", "Mark daily class attendance and review history."),
  component: Attendance,
});
const STATUSES: AttendanceStatus[] = ["present", "absent", "late", "excused"];

function Attendance() {
  const st = useStore((s) => s);
  const can = useCan("Teacher");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [classId, setClassId] = useState(st.classes[0].id);
  const existing = st.attendance.find((a) => a.date === date && a.classId === classId);
  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>({});
  const [saving, setSaving] = useState(false);
  useEffect(() => setMarks(existing ? { ...existing.marks } : {}), [date, classId, existing?.id]);
  const roster = st.students.filter((s) => s.classId === classId && s.status === "active");
  const markedCount = roster.filter((s) => marks[s.id]).length;

  const save = () => {
    if (saving) return;
    setSaving(true);
    const cur = getState().attendance.find((a) => a.date === date && a.classId === classId);
    if (cur) {
      const corrections = Object.entries(marks).filter(([sid, m]) => cur.marks[sid] && cur.marks[sid] !== m).map(([sid, m]) => ({ at: new Date().toISOString(), studentId: sid, from: cur.marks[sid], to: m }));
      if (!corrections.length && Object.keys(marks).length === Object.keys(cur.marks).length) { toast.info("No changes to save"); setSaving(false); return; }
      setState((s) => ({ attendance: s.attendance.map((a) => (a.id === cur.id ? { ...a, marks: { ...marks }, savedAt: new Date().toISOString(), corrections: [...a.corrections, ...corrections] } : a)) }), `Corrected attendance ${date}`);
      toast.success(`Attendance updated${corrections.length ? ` (${corrections.length} corrections logged)` : ""}`);
    } else {
      setState((s) => ({ attendance: [...s.attendance, { id: uid(), date, classId, marks: { ...marks }, savedAt: new Date().toISOString(), corrections: [] }] }), `Saved attendance ${date}`);
      toast.success("Attendance saved");
    }
    setSaving(false);
  };
  const history = [...st.attendance].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      <PageHeader title="Attendance" description="Unmarked students are never counted as absent." crumbs={[{ label: "Attendance" }]} />
      <Panel>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-40" />
          <select className={selectCls} value={classId} onChange={(e) => setClassId(e.target.value)}>{st.classes.map((c) => <option key={c.id} value={c.id}>{className(c)}</option>)}</select>
          <span className="text-sm text-muted-foreground">{markedCount} of {roster.length} marked · {roster.length - markedCount} unmarked</span>
          {existing && <StatusBadge status="submitted" />}
          {can && <div className="ml-auto flex gap-2"><Button variant="outline" onClick={() => setMarks(Object.fromEntries(roster.map((s) => [s.id, "present" as const])))}>Mark all present</Button><Button onClick={save} disabled={saving || markedCount === 0}>{existing ? "Save corrections" : "Save attendance"}</Button></div>}
        </div>
        {roster.length === 0 ? <EmptyState text="No active students in this class." /> : (
          <table className="w-full"><thead className="border-b"><tr><th className={th}>Student</th><th className={th}>Adm. No</th><th className={th}>Status</th></tr></thead>
            <tbody className="divide-y">{roster.map((s) => <tr key={s.id}><td className={`${td} font-medium`}>{fullName(s)}</td><td className={td}>{s.admissionNo}</td><td className={td}>
              <div className="flex flex-wrap gap-1">{STATUSES.map((k) => <button key={k} disabled={!can} onClick={() => setMarks({ ...marks, [s.id]: k })} className={`rounded-md border px-2.5 py-1 text-xs capitalize ${marks[s.id] === k ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted"}`}>{k}</button>)}</div>
            </td></tr>)}</tbody></table>
        )}
      </Panel>
      <Panel className="mt-4" title="Attendance history">
        <table className="w-full"><thead className="border-b"><tr>{["Date", "Class", "Present", "Absent", "Late", "Excused", "Corrections"].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
          <tbody className="divide-y">{history.map((a) => { const v = Object.values(a.marks); return <tr key={a.id}><td className={td}>{a.date}</td><td className={td}>{className(st.classes.find((c) => c.id === a.classId))}</td>{STATUSES.map((k) => <td key={k} className={td}>{v.filter((m) => m === k).length}</td>)}<td className={td}>{a.corrections.length}</td></tr>; })}</tbody></table>
      </Panel>
    </div>
  );
}
