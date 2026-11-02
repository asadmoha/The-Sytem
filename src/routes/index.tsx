import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Bar, BarChart, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Users, Briefcase, ClipboardCheck, Wallet, UserPlus, GraduationCap, FileBarChart, AlertTriangle, ArrowRight, Megaphone } from "lucide-react";
import { Panel, PageHeader, StatusBadge } from "@/components/ui-kit";
import { Input } from "@/components/ui/input";
import { DAYS, TIME_SLOTS, attendanceSummary, className, feeAccount, money, useStore, getState } from "@/lib/demo-store";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () => seo("Overview", "Daily overview of enrolment, attendance, fees and academic performance."),
  component: Dashboard,
});

const ATT_COLORS = ["var(--chart-2)", "var(--chart-4)", "var(--chart-3)", "var(--chart-5)"];

function Metric({ to, icon: Icon, label, value, sub }: { to: string; icon: typeof Users; label: string; value: string; sub: string }) {
  return (
    <Link to={to} className="group rounded-xl border bg-card p-5 shadow-[var(--shadow-card)] transition hover:border-primary/40">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="flex size-9 items-center justify-center rounded-lg bg-secondary text-primary"><Icon className="size-4" /></span>
      </div>
      <div className="mt-3 text-2xl font-semibold text-navy">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
    </Link>
  );
}

function Dashboard() {
  const st = useStore((s) => s);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const active = st.students.filter((s) => s.status === "active");
  const dayRecords = st.attendance.filter((a) => a.date === date);
  const att = attendanceSummary(dayRecords);
  const marked = att.present + att.absent + att.late + att.excused;
  const classesMarked = new Set(dayRecords.map((r) => r.classId));
  const complete = classesMarked.size === st.classes.length;
  const accounts = active.map((s) => feeAccount(st, s.id));
  const assessed = accounts.reduce((a, x) => a + x.assessed - x.discount, 0);
  const collected = accounts.reduce((a, x) => a + x.paid, 0);
  const outstanding = assessed - collected;
  const cnt = (k: string) => accounts.filter((a) => a.status === k).length;

  const published = st.exams.filter((e) => e.status === "published");
  const scores = published.flatMap((e) => Object.values(e.marks).filter((m): m is number => typeof m === "number").map((m) => (m / e.maxMarks) * 100));
  const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
  const pass = scores.length ? (scores.filter((s) => s >= 50).length / scores.length) * 100 : null;
  const bySubject = st.subjects.map((sub) => {
    const sc = published.filter((e) => e.subjectId === sub.id).flatMap((e) => Object.values(e.marks).filter((m): m is number => typeof m === "number"));
    return { name: sub.code, avg: sc.length ? Math.round(sc.reduce((a, b) => a + b, 0) / sc.length) : 0 };
  }).filter((x) => x.avg > 0);
  const perStudent = new Map<string, number[]>();
  published.forEach((e) => Object.entries(e.marks).forEach(([sid, m]) => typeof m === "number" && perStudent.set(sid, [...(perStudent.get(sid) ?? []), m])));
  const atRisk = [...perStudent.values()].filter((v) => v.reduce((a, b) => a + b, 0) / v.length < 50).length;

  const pieData = [
    { name: "Present", value: att.present }, { name: "Absent", value: att.absent },
    { name: "Late", value: att.late }, { name: "Excused", value: att.excused },
  ];
  const tasks = [
    ...st.classes.filter((c) => !classesMarked.has(c.id)).map((c) => ({ t: `Attendance not submitted: ${className(c)}`, to: "/attendance" })),
    ...(st.exams.filter((e) => e.status === "submitted").length ? [{ t: `${st.exams.filter((e) => e.status === "submitted").length} mark sheets awaiting review`, to: "/exams" }] : []),
    ...(st.applications.filter((a) => a.status === "new" || a.status === "pending").length ? [{ t: `${st.applications.filter((a) => a.status === "new" || a.status === "pending").length} admissions pending`, to: "/admissions" }] : []),
    ...(cnt("overdue") ? [{ t: `${cnt("overdue")} fee accounts overdue`, to: "/finance" }] : []),
  ];
  const quick = [
    { l: "Register Student", to: "/students/new", i: UserPlus }, { l: "Add Teacher", to: "/staff", i: Briefcase },
    { l: "Record Attendance", to: "/attendance", i: ClipboardCheck }, { l: "Create Examination", to: "/exams", i: GraduationCap },
    { l: "Record Payment", to: "/finance", i: Wallet }, { l: "Generate Report", to: "/reports", i: FileBarChart },
  ];
  const [ttClass, setTtClass] = useState(st.classes[0].id);
  const tt = st.timetable.filter((t) => t.classId === ttClass);
  const sub = (id: string) => getState().subjects.find((s) => s.id === id);
  const staffName = (id: string) => getState().staff.find((s) => s.id === id)?.name.split(" ")[0];

  return (
    <div>
      <PageHeader title={`Welcome back`} description={`${st.school.name} at a glance`} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric to="/students" icon={Users} label="Enrolled students" value={String(active.length)} sub={`${st.students.length - active.length} inactive · ${st.classes.length} classes`} />
        <Metric to="/staff" icon={Briefcase} label="Teachers & staff" value={String(st.staff.filter((s) => s.status === "active").length)} sub={`${st.staff.filter((s) => s.role.includes("Teacher") || s.role.includes("Head")).length} teaching`} />
        <Metric to="/attendance" icon={ClipboardCheck} label="Today's attendance" value={complete && marked ? `${Math.round(((att.present + att.late) / marked) * 100)}%` : `${classesMarked.size}/${st.classes.length} classes`} sub={complete ? "All classes marked" : "Rate shown once all classes submit"} />
        <Metric to="/finance" icon={Wallet} label="Outstanding fees" value={money(outstanding)} sub={`${cnt("overdue")} overdue accounts`} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Panel title="Student Attendance" action={<Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-8 w-36" />}>
          {marked === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No attendance recorded for this date.</p>
          ) : (
            <div className="flex items-center gap-4">
              <div className="h-36 w-36"><ResponsiveContainer><PieChart><Pie data={pieData} dataKey="value" innerRadius={42} outerRadius={64} paddingAngle={2}>{pieData.map((_, i) => <Cell key={i} fill={ATT_COLORS[i]} />)}</Pie></PieChart></ResponsiveContainer></div>
              <ul className="space-y-2 text-sm">{pieData.map((p, i) => <li key={p.name} className="flex items-center gap-2"><span className="size-2.5 rounded-full" style={{ background: ATT_COLORS[i] }} />{p.name}<b className="ml-auto pl-4">{p.value}</b></li>)}</ul>
            </div>
          )}
          {!complete && marked > 0 && <p className="mt-2 text-xs text-warning-foreground">Incomplete: {st.classes.length - classesMarked.size} classes not yet marked.</p>}
          <Link to="/reports" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">View attendance report <ArrowRight className="size-4" /></Link>
        </Panel>

        <Panel title="Fees Collection">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Assessed (net)</dt><dd className="font-medium">{money(assessed)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Collected</dt><dd className="font-medium text-success">{money(collected)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Outstanding</dt><dd className="font-medium text-destructive">{money(outstanding)}</dd></div>
          </dl>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${assessed ? (collected / assessed) * 100 : 0}%` }} /></div>
          <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
            {["paid", "partial", "due", "overdue"].map((k) => <div key={k} className="rounded-lg bg-muted p-2"><div className="text-lg font-semibold text-navy">{cnt(k)}</div><StatusBadge status={k} /></div>)}
          </div>
          <Link to="/finance" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">View finance records <ArrowRight className="size-4" /></Link>
        </Panel>

        <Panel title="Academic Performance">
          {avg === null ? <p className="text-sm text-muted-foreground">No published results yet.</p> : (
            <>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div><div className="text-xl font-semibold text-navy">{avg.toFixed(1)}%</div><div className="text-xs text-muted-foreground">Average</div></div>
                <div><div className="text-xl font-semibold text-navy">{pass!.toFixed(0)}%</div><div className="text-xs text-muted-foreground">Pass rate</div></div>
                <div><div className="text-xl font-semibold text-destructive">{atRisk}</div><div className="text-xs text-muted-foreground">Need attention</div></div>
              </div>
              <div className="mt-3 h-32"><ResponsiveContainer><BarChart data={bySubject}><CartesianGrid vertical={false} stroke="var(--border)" /><XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis hide domain={[0, 100]} /><Tooltip /><Bar dataKey="avg" fill="var(--chart-1)" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
              <p className="text-xs text-muted-foreground">Mid-Term Exam · {published.length} published mark sheets</p>
            </>
          )}
          <Link to="/exams" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">Examination reports <ArrowRight className="size-4" /></Link>
        </Panel>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Panel title="Today's Tasks & Alerts" className="lg:col-span-2">
          <ul className="divide-y">
            {tasks.map((t) => <li key={t.t}><Link to={t.to} className="flex items-center gap-3 py-2.5 text-sm hover:text-primary"><AlertTriangle className="size-4 text-warning" />{t.t}<ArrowRight className="ml-auto size-4 text-muted-foreground" /></Link></li>)}
            {st.announcements.slice(0, 2).map((a) => <li key={a.id}><Link to="/announcements" className="flex items-center gap-3 py-2.5 text-sm hover:text-primary"><Megaphone className="size-4 text-primary" />{a.title}<ArrowRight className="ml-auto size-4 text-muted-foreground" /></Link></li>)}
          </ul>
        </Panel>
        <Panel title="Quick Actions">
          <div className="grid grid-cols-2 gap-2">
            {quick.map((q) => <Link key={q.l} to={q.to} className="flex flex-col items-center gap-2 rounded-lg border p-3 text-center text-xs font-medium hover:border-primary hover:bg-accent"><q.i className="size-5 text-primary" />{q.l}</Link>)}
          </div>
        </Panel>
      </div>

      <Panel className="mt-6" title="Class Timetable" action={<select className="h-8 rounded-md border bg-card px-2 text-sm" value={ttClass} onChange={(e) => setTtClass(e.target.value)}>{st.classes.map((c) => <option key={c.id} value={c.id}>{className(c)}</option>)}</select>}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-separate border-spacing-1 text-xs">
            <thead><tr><th className="w-24 text-left text-muted-foreground">Time</th>{DAYS.map((d) => <th key={d} className="text-left font-medium text-muted-foreground">{d}</th>)}</tr></thead>
            <tbody>{TIME_SLOTS.slice(0, 5).map((slot, si) => (
              <tr key={slot}><td className="text-muted-foreground">{slot}</td>{DAYS.map((_, di) => { const e = tt.find((t) => t.day === di && t.slot === si); return <td key={di} className="rounded-md bg-secondary p-2"><div className="font-medium text-secondary-foreground">{e ? sub(e.subjectId)?.name : "—"}</div><div className="text-muted-foreground">{e && staffName(e.teacherId)} · {e?.room}</div></td>; })}</tr>
            ))}</tbody>
          </table>
        </div>
        <Link to="/timetable" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">Full timetable <ArrowRight className="size-4" /></Link>
      </Panel>
    </div>
  );
}
