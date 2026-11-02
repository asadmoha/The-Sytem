import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Denied, PageHeader, Panel, StatusBadge, useCan, EmptyState, th, td, selectCls } from "@/components/ui-kit";
import { className, feeAccount, fullName, gradeFor, money, setState, useStore } from "@/lib/demo-store";

export const Route = createFileRoute("/students/$id")({
  head: () => ({ meta: [{ title: "Student profile · School Admin" }, { name: "description", content: "Student profile, attendance, results and fee account." }, { property: "og:title", content: "Student profile · School Admin" }, { property: "og:description", content: "Student profile and records." }, { property: "og:type", content: "profile" }, { name: "twitter:card", content: "summary" }] }),
  component: Profile,
});

function Profile() {
  const { id } = Route.useParams();
  const st = useStore((s) => s);
  const s = st.students.find((x) => x.id === id);
  const canFinance = useCan("Finance");
  const canEdit = useCan();
  const [edit, setEdit] = useState(false);
  const [draft, setDraft] = useState({ guardianPhone: s?.guardianPhone ?? "", address: s?.address ?? "", status: s?.status ?? "active" });
  if (!s) return <EmptyState text="Student not found." />;
  const cls = st.classes.find((c) => c.id === s.classId);
  const att = st.attendance.filter((a) => a.marks[s.id]).map((a) => ({ date: a.date, status: a.marks[s.id] }));
  const results = st.exams.filter((e) => e.status === "published" && e.marks[s.id] !== undefined);
  const fee = feeAccount(st, s.id);
  const nums = results.map((e) => e.marks[s.id]).filter((m): m is number => typeof m === "number");

  return (
    <div>
      <PageHeader title={fullName(s)} description={`${s.admissionNo} · ${className(cls)}`} crumbs={[{ label: "Students", to: "/students" }, { label: fullName(s) }]}
        actions={<Button variant="outline" asChild><Link to="/exams" search={{ report: s.id }}>Report card</Link></Button>} />
      <Tabs defaultValue="overview">
        <TabsList className="mb-4 flex h-auto flex-wrap">
          {["overview", "personal", "guardians", "history", "attendance", "results", "fees"].map((t) => <TabsTrigger key={t} value={t} className="capitalize">{t === "history" ? "Academic history" : t === "fees" ? "Fee account" : t}</TabsTrigger>)}
        </TabsList>
        <TabsContent value="overview">
          <div className="grid gap-4 sm:grid-cols-4">
            <Panel><div className="text-xs text-muted-foreground">Status</div><div className="mt-2"><StatusBadge status={s.status} /></div></Panel>
            <Panel><div className="text-xs text-muted-foreground">Attendance (recorded days)</div><div className="mt-1 text-xl font-semibold">{att.length ? `${att.filter((a) => a.status !== "absent").length}/${att.length}` : "—"}</div></Panel>
            <Panel><div className="text-xs text-muted-foreground">Average (published)</div><div className="mt-1 text-xl font-semibold">{nums.length ? `${(nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1)}%` : "—"}</div></Panel>
            <Panel><div className="text-xs text-muted-foreground">Fee balance</div><div className="mt-1 text-xl font-semibold">{canFinance ? money(fee.balance) : "Restricted"}</div></Panel>
          </div>
        </TabsContent>
        <TabsContent value="personal">
          <Panel title="Personal information" action={canEdit && (edit ? <Button size="sm" onClick={() => { setState((x) => ({ students: x.students.map((y) => (y.id === s.id ? { ...y, ...draft } : y)) }), `Edited student ${s.admissionNo}`); setEdit(false); toast.success("Saved"); }}>Save</Button> : <Button size="sm" variant="outline" onClick={() => setEdit(true)}>Edit</Button>)}>
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div><dt className="text-muted-foreground">Gender</dt><dd>{s.gender}</dd></div>
              <div><dt className="text-muted-foreground">Date of birth</dt><dd>{s.dob || "—"}</dd></div>
              <div><dt className="text-muted-foreground">Address</dt><dd>{edit ? <Input value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} /> : s.address || "—"}</dd></div>
              <div><dt className="text-muted-foreground">Enrollment status</dt><dd>{edit ? <select className={selectCls} value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as "active" })}><option value="active">Active</option><option value="inactive">Inactive</option></select> : <StatusBadge status={s.status} />}</dd></div>
            </dl>
          </Panel>
        </TabsContent>
        <TabsContent value="guardians">
          <Panel title="Guardian"><dl className="grid gap-4 text-sm sm:grid-cols-3"><div><dt className="text-muted-foreground">Name</dt><dd>{s.guardianName}</dd></div><div><dt className="text-muted-foreground">Relationship</dt><dd>{s.guardianRelation}</dd></div><div><dt className="text-muted-foreground">Phone</dt><dd>{edit ? <Input value={draft.guardianPhone} onChange={(e) => setDraft({ ...draft, guardianPhone: e.target.value })} /> : s.guardianPhone}</dd></div></dl></Panel>
        </TabsContent>
        <TabsContent value="history">
          <Panel title="Enrollment history"><table className="w-full"><thead><tr><th className={th}>Academic year</th><th className={th}>Class</th></tr></thead><tbody>{s.enrollments.map((e) => <tr key={e.year + e.classId}><td className={td}>{e.year}</td><td className={td}>{className(st.classes.find((c) => c.id === e.classId))}</td></tr>)}</tbody></table></Panel>
        </TabsContent>
        <TabsContent value="attendance">
          <Panel title="Attendance">{att.length ? <table className="w-full"><tbody>{att.map((a) => <tr key={a.date}><td className={td}>{a.date}</td><td className={td}><StatusBadge status={a.status} /></td></tr>)}</tbody></table> : <EmptyState text="No attendance recorded yet." />}</Panel>
        </TabsContent>
        <TabsContent value="results">
          <Panel title="Published results">{results.length ? <table className="w-full"><thead><tr><th className={th}>Exam</th><th className={th}>Subject</th><th className={th}>Mark</th><th className={th}>Grade</th></tr></thead><tbody>{results.map((e) => { const m = e.marks[s.id]; return <tr key={e.id}><td className={td}>{e.name}</td><td className={td}>{st.subjects.find((x) => x.id === e.subjectId)?.name}</td><td className={td}>{m === "ABS" ? "Absent" : `${m}/${e.maxMarks}`}</td><td className={td}>{typeof m === "number" ? gradeFor(st.gradeBands, (m / e.maxMarks) * 100).grade : "—"}</td></tr>; })}</tbody></table> : <EmptyState text="No published results." />}</Panel>
        </TabsContent>
        <TabsContent value="fees">
          {!canFinance ? <Denied /> : <Panel title="Fee account" action={<StatusBadge status={fee.status} />}>
            <dl className="grid gap-4 text-sm sm:grid-cols-4">{[["Assessed", fee.assessed], ["Discounts", fee.discount], ["Paid", fee.paid], ["Balance", fee.balance]].map(([k, v]) => <div key={k}><dt className="text-muted-foreground">{k}</dt><dd className="text-lg font-semibold">{money(v as number)}</dd></div>)}</dl>
            <Link to="/finance" className="mt-4 inline-block text-sm font-medium text-primary">Record a payment →</Link>
          </Panel>}
        </TabsContent>
      </Tabs>
    </div>
  );
}
