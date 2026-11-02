import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel, th, td, selectCls } from "@/components/ui-kit";
import { ACADEMIC_YEAR, TERM, attendanceSummary, className, downloadCSV, feeAccount, fullName, gradeFor, money, useStore } from "@/lib/demo-store";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/reports")({
  head: () => seo("Reports", "Enrolment, attendance, academic and fee reports with CSV export and printable report cards."),
  component: Reports,
});

function Reports() {
  const st = useStore((s) => s);
  const [studentId, setStudentId] = useState(st.students[0].id);
  const active = st.students.filter((s) => s.status === "active");
  const enrol = st.classes.map((c) => ({ class: className(c), male: active.filter((s) => s.classId === c.id && s.gender === "Male").length, female: active.filter((s) => s.classId === c.id && s.gender === "Female").length }));
  const att = attendanceSummary(st.attendance);
  const attTotal = Object.values(att).reduce((a, b) => a + b, 0) || 1;
  const fees = st.classes.map((c) => { const a = active.filter((s) => s.classId === c.id).map((s) => feeAccount(st, s.id)); return { class: className(c), collected: a.reduce((x, y) => x + y.paid, 0), outstanding: a.reduce((x, y) => x + Math.max(y.balance, 0), 0) }; });

  const s = st.students.find((x) => x.id === studentId)!;
  const results = st.exams.filter((e) => e.classId === s.classId && e.status === "published").map((e) => {
    const m = e.marks[s.id];
    const pct = typeof m === "number" ? (m / e.maxMarks) * 100 : null;
    return { subject: st.subjects.find((x) => x.id === e.subjectId)?.name, m, g: pct === null ? null : gradeFor(st.gradeBands, pct) };
  });
  const nums = results.map((r) => r.m).filter((m): m is number => typeof m === "number");
  const mean = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;

  return (
    <div>
      <PageHeader title="Reports" description={`${ACADEMIC_YEAR} · ${TERM}`} crumbs={[{ label: "Reports" }]} />
      <div className="no-print grid gap-4 lg:grid-cols-3">
        <Panel title="Enrolment by class" action={<Button size="sm" variant="outline" onClick={() => downloadCSV("enrolment.csv", enrol)}>CSV</Button>}>
          <table className="w-full"><thead className="border-b"><tr><th className={th}>Class</th><th className={th}>M</th><th className={th}>F</th></tr></thead>
            <tbody className="divide-y">{enrol.map((r) => <tr key={r.class}><td className={td}>{r.class}</td><td className={td}>{r.male}</td><td className={td}>{r.female}</td></tr>)}</tbody></table>
        </Panel>
        <Panel title="Attendance summary" action={<Button size="sm" variant="outline" onClick={() => downloadCSV("attendance.csv", [att])}>CSV</Button>}>
          <ul className="space-y-3">{Object.entries(att).map(([k, v]) => <li key={k}>
            <div className="flex justify-between text-sm capitalize"><span>{k}</span><span>{v} · {Math.round((v / attTotal) * 100)}%</span></div>
            <div className="mt-1 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${(v / attTotal) * 100}%` }} /></div></li>)}</ul>
        </Panel>
        <Panel title="Fees by class" action={<Button size="sm" variant="outline" onClick={() => downloadCSV("fees-by-class.csv", fees)}>CSV</Button>}>
          <table className="w-full"><thead className="border-b"><tr><th className={th}>Class</th><th className={th}>Collected</th><th className={th}>Owed</th></tr></thead>
            <tbody className="divide-y">{fees.map((r) => <tr key={r.class}><td className={td}>{r.class}</td><td className={td}>{money(r.collected)}</td><td className={td}>{money(r.outstanding)}</td></tr>)}</tbody></table>
        </Panel>
      </div>
      <Panel className="mt-4" title="Student report card" action={<div className="no-print flex gap-2">
        <select className={selectCls} value={studentId} onChange={(e) => setStudentId(e.target.value)}>{st.students.map((x) => <option key={x.id} value={x.id}>{fullName(x)} · {x.admissionNo}</option>)}</select>
        <Button size="sm" onClick={() => window.print()}>Print</Button></div>}>
        <div className="mb-4 border-b pb-3">
          <div className="text-lg font-semibold text-navy">{st.school.name}</div>
          <div className="text-xs text-muted-foreground">{st.school.motto} · {TERM} {ACADEMIC_YEAR}</div>
          <div className="mt-2 text-sm">{fullName(s)} · {s.admissionNo} · {className(st.classes.find((c) => c.id === s.classId))}</div>
        </div>
        <table className="w-full"><thead className="border-b"><tr><th className={th}>Subject</th><th className={th}>Mark</th><th className={th}>Grade</th><th className={th}>Remark</th></tr></thead>
          <tbody className="divide-y">{results.map((r) => <tr key={r.subject}><td className={td}>{r.subject}</td><td className={td}>{r.m ?? "—"}</td><td className={td}>{r.g?.grade ?? "—"}</td><td className={td}>{r.g?.remark ?? (r.m === "ABS" ? "Absent" : "—")}</td></tr>)}</tbody></table>
        <div className="mt-3 text-sm font-medium">Mean: {mean.toFixed(1)} · {gradeFor(st.gradeBands, mean).grade}</div>
      </Panel>
    </div>
  );
}
