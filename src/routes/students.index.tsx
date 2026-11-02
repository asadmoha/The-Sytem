import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, Upload, UserPlus, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, Panel, Pager, StatusBadge, EmptyState, th, td, selectCls } from "@/components/ui-kit";
import { ACADEMIC_YEAR, className, downloadCSV, fullName, setState, uid, useStore, type Student } from "@/lib/demo-store";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/students/")({
  head: () => seo("Students", "Search, filter and manage the student directory."),
  component: Students,
});

type SortKey = "admissionNo" | "name" | "class";
const PAGE = 10;

function Students() {
  const students = useStore((s) => s.students);
  const classes = useStore((s) => s.classes);
  const [q, setQ] = useState("");
  const [form, setForm] = useState("");
  const [stream, setStream] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState<{ k: SortKey; dir: 1 | -1 }>({ k: "admissionNo", dir: 1 });
  const [page, setPage] = useState(1);
  const cls = (id: string) => classes.find((c) => c.id === id);

  const rows = useMemo(() => {
    const ql = q.toLowerCase();
    return students
      .filter((s) => !ql || fullName(s).toLowerCase().includes(ql) || s.admissionNo.toLowerCase().includes(ql) || s.guardianName.toLowerCase().includes(ql))
      .filter((s) => !form || cls(s.classId)?.form === form)
      .filter((s) => !stream || cls(s.classId)?.stream === stream)
      .filter((s) => !status || s.status === status)
      .sort((a, b) => {
        const v = (s: Student) => (sort.k === "name" ? fullName(s) : sort.k === "class" ? className(cls(s.classId)) : s.admissionNo);
        return v(a).localeCompare(v(b)) * sort.dir;
      });
  }, [students, q, form, stream, status, sort, classes]);
  const pages = Math.ceil(rows.length / PAGE);
  const view = rows.slice((page - 1) * PAGE, page * PAGE);
  const toggle = (k: SortKey) => setSort((s) => ({ k, dir: s.k === k ? (s.dir === 1 ? -1 : 1) : 1 }));

  const onImport = (file: File) => {
    file.text().then((t) => {
      const lines = t.trim().split(/\r?\n/).slice(1);
      const existing = new Set(students.map((s) => s.admissionNo));
      const added: Student[] = [];
      let skipped = 0;
      for (const line of lines) {
        const [admissionNo, firstName, lastName, gender, guardianName, guardianPhone] = line.split(",").map((x) => x.replace(/"/g, "").trim());
        if (!admissionNo || !firstName || existing.has(admissionNo)) { skipped++; continue; }
        existing.add(admissionNo);
        added.push({ id: uid(), admissionNo, firstName, lastName: lastName ?? "", gender: gender === "Female" ? "Female" : "Male", dob: "", classId: classes[0].id, status: "active", guardianName: guardianName ?? "", guardianPhone: guardianPhone ?? "", guardianRelation: "Guardian", address: "", enrollments: [{ year: ACADEMIC_YEAR, classId: classes[0].id }] });
      }
      setState((s) => ({ students: [...s.students, ...added] }), `Imported ${added.length} students`);
      toast.success(`Imported ${added.length} students${skipped ? `, skipped ${skipped} (duplicate or invalid)` : ""}`);
    });
  };

  return (
    <div>
      <PageHeader title="Students" description={`${rows.length} of ${students.length} students`} crumbs={[{ label: "Students" }]}
        actions={<>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm font-medium hover:bg-muted" title="CSV columns: admissionNo,firstName,lastName,gender,guardianName,guardianPhone">
            <Upload className="size-4" />Import CSV<input type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && onImport(e.target.files[0])} />
          </label>
          <Button variant="outline" onClick={() => downloadCSV("students.csv", rows.map((s) => ({ admissionNo: s.admissionNo, name: fullName(s), class: className(cls(s.classId)), gender: s.gender, guardian: s.guardianName, phone: s.guardianPhone, status: s.status })))}><Download />Export</Button>
          <Button asChild><Link to="/students/new"><UserPlus />Register student</Link></Button>
        </>} />
      <Panel>
        <div className="mb-4 flex flex-wrap gap-2">
          <Input placeholder="Search name, admission no. or guardian" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} className="max-w-xs" />
          <select className={selectCls} value={form} onChange={(e) => { setForm(e.target.value); setPage(1); }}><option value="">All forms</option>{[...new Set(classes.map((c) => c.form))].map((f) => <option key={f}>{f}</option>)}</select>
          <select className={selectCls} value={stream} onChange={(e) => { setStream(e.target.value); setPage(1); }}><option value="">All streams</option>{[...new Set(classes.map((c) => c.stream))].map((f) => <option key={f}>{f}</option>)}</select>
          <select className={selectCls} defaultValue={ACADEMIC_YEAR}><option>{ACADEMIC_YEAR}</option></select>
          <select className={selectCls} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}><option value="">Any status</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
        </div>
        {view.length === 0 ? <EmptyState text="No students match these filters." /> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b"><tr>
                <th className={th}><button onClick={() => toggle("admissionNo")} className="inline-flex items-center gap-1">Adm. No <ArrowUpDown className="size-3" /></button></th>
                <th className={th}><button onClick={() => toggle("name")} className="inline-flex items-center gap-1">Name <ArrowUpDown className="size-3" /></button></th>
                <th className={th}><button onClick={() => toggle("class")} className="inline-flex items-center gap-1">Class <ArrowUpDown className="size-3" /></button></th>
                <th className={th}>Gender</th><th className={th}>Guardian</th><th className={th}>Status</th><th className={th} />
              </tr></thead>
              <tbody className="divide-y">{view.map((s) => (
                <tr key={s.id} className="hover:bg-muted/50">
                  <td className={td}>{s.admissionNo}</td>
                  <td className={`${td} font-medium`}>{fullName(s)}</td>
                  <td className={td}>{className(cls(s.classId))}</td>
                  <td className={td}>{s.gender}</td>
                  <td className={td}>{s.guardianName}<div className="text-xs text-muted-foreground">{s.guardianPhone}</div></td>
                  <td className={td}><StatusBadge status={s.status} /></td>
                  <td className={td}><Link to="/students/$id" params={{ id: s.id }} className="text-sm font-medium text-primary">View</Link></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
        <Pager page={page} pages={pages} setPage={setPage} />
      </Panel>
    </div>
  );
}
