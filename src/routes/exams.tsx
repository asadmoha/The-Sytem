import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, Panel, StatusBadge, EmptyState, useCan, th, td, selectCls } from "@/components/ui-kit";
import { className, fullName, gradeFor, setState, useStore, type Exam } from "@/lib/demo-store";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/exams")({
  head: () => seo("Examinations & Results", "Enter marks, review mark sheets and publish exam results."),
  component: Exams,
});

function Exams() {
  const st = useStore((s) => s);
  const canEnter = useCan("Teacher");
  const canPublish = useCan();
  const [classId, setClassId] = useState(st.classes[0].id);
  const classExams = st.exams.filter((e) => e.classId === classId);
  const [examId, setExamId] = useState(classExams[0]?.id ?? "");
  useEffect(() => { if (!classExams.find((e) => e.id === examId)) setExamId(classExams[0]?.id ?? ""); }, [classId]);
  const exam = st.exams.find((e) => e.id === examId);
  const roster = st.students.filter((s) => s.classId === classId);
  const [draft, setDraft] = useState<Exam["marks"]>({});
  useEffect(() => setDraft(exam ? { ...exam.marks } : {}), [examId]);
  const locked = exam?.status === "published";

  const save = (status?: Exam["status"]) => {
    if (!exam) return;
    for (const [k, v] of Object.entries(draft)) {
      if (typeof v === "number" && (v < 0 || v > exam.maxMarks)) {
        const s = st.students.find((x) => x.id === k);
        return toast.error(`Mark for ${s ? fullName(s) : k} must be between 0 and ${exam.maxMarks}.`);
      }
    }
    setState((s) => ({ exams: s.exams.map((e) => (e.id === exam.id ? { ...e, marks: draft, status: status ?? e.status } : e)) }),
      `${status ? `Set ${status}` : "Saved marks"}: ${exam.name} ${st.subjects.find((x) => x.id === exam.subjectId)?.code} ${className(st.classes.find((c) => c.id === classId))}`);
    toast.success(status ? `Mark sheet ${status}` : "Marks saved");
  };

  // Class ranking across published exams
  const published = classExams.filter((e) => e.status === "published");
  const ranking = roster.map((s) => {
    const vals = published.map((e) => e.marks[s.id]).filter((m): m is number => typeof m === "number");
    const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    return { s, avg, g: gradeFor(st.gradeBands, avg) };
  }).sort((a, b) => b.avg - a.avg);

  return (
    <div>
      <PageHeader title="Examinations & Results" description="Enter marks, submit for review and publish results." crumbs={[{ label: "Examinations & Results" }]}
        actions={<>
          <select className={selectCls} value={classId} onChange={(e) => setClassId(e.target.value)}>{st.classes.map((c) => <option key={c.id} value={c.id}>{className(c)}</option>)}</select>
          <select className={selectCls} value={examId} onChange={(e) => setExamId(e.target.value)}>{classExams.map((e) => <option key={e.id} value={e.id}>{st.subjects.find((s) => s.id === e.subjectId)?.name} · {e.name}</option>)}</select>
        </>} />
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2" title={exam ? <span className="flex items-center gap-2">Mark sheet <StatusBadge status={exam.status} /></span> : "Mark sheet"}
          action={exam && <div className="flex gap-2">
            {canEnter && !locked && <Button size="sm" variant="outline" onClick={() => save()}>Save</Button>}
            {canEnter && exam.status === "draft" && <Button size="sm" onClick={() => save("submitted")}>Submit</Button>}
            {canPublish && exam.status === "submitted" && <Button size="sm" onClick={() => save("published")}>Publish</Button>}
            {canPublish && locked && <Button size="sm" variant="outline" onClick={() => save("draft")}>Unlock</Button>}
          </div>}>
          {!exam ? <EmptyState text="No exams set up for this class." /> : (
            <table className="w-full"><thead className="border-b"><tr><th className={th}>Student</th><th className={th}>Mark / {exam.maxMarks}</th><th className={th}>Grade</th></tr></thead>
              <tbody className="divide-y">{roster.map((s) => {
                const m = draft[s.id];
                const g = typeof m === "number" ? gradeFor(st.gradeBands, (m / exam.maxMarks) * 100) : null;
                return <tr key={s.id}><td className={td}>{fullName(s)} <span className="text-xs text-muted-foreground">{s.admissionNo}</span></td>
                  <td className={td}>{locked || !canEnter ? (m ?? "—") : (
                    <Input className="h-8 w-24" value={m ?? ""} onChange={(e) => {
                      const v = e.target.value.trim().toUpperCase();
                      setDraft({ ...draft, [s.id]: v === "" ? undefined : v === "ABS" ? "ABS" : Number(v) });
                    }} />)}</td>
                  <td className={td}>{g ? `${g.grade} · ${g.remark}` : m === "ABS" ? "Absent" : "—"}</td></tr>;
              })}</tbody></table>
          )}
        </Panel>
        <Panel title="Class ranking (published)">
          {!published.length ? <EmptyState text="No published results yet." /> : (
            <ol className="divide-y">{ranking.slice(0, 10).map((r, i) => <li key={r.s.id} className="flex items-center justify-between py-2 text-sm">
              <span><span className="mr-2 text-muted-foreground">{i + 1}.</span>{fullName(r.s)}</span>
              <span className="font-medium text-navy">{r.avg.toFixed(1)} · {r.g.grade}</span></li>)}</ol>
          )}
        </Panel>
      </div>
    </div>
  );
}
