import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, Panel, useCan, th, td, selectCls } from "@/components/ui-kit";
import { ACADEMIC_YEAR, TERM, className, fullName, setState, uid, useStore } from "@/lib/demo-store";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/classes")({
  head: () => seo("Classes & Subjects", "Forms, streams, classes, subjects, assignments and promotions."),
  component: Classes,
});

function Classes() {
  const st = useStore((s) => s);
  const can = useCan();
  const [nc, setNc] = useState({ form: "Form 1", stream: "", teacherId: st.staff[0].id, room: "" });
  const [ns, setNs] = useState({ name: "", code: "", department: "Sciences" });
  const [promo, setPromo] = useState({ from: st.classes[0].id, to: st.classes[1].id, year: String(Number(ACADEMIC_YEAR) + 1) });
  const fl = st.school.formLabel, sl = st.school.streamLabel;
  return (
    <div>
      <PageHeader title="Classes & Subjects" description={`Academic year ${ACADEMIC_YEAR} · ${TERM}`} crumbs={[{ label: "Classes & Subjects" }]} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Classes">
          <table className="w-full"><thead className="border-b"><tr><th className={th}>{fl}</th><th className={th}>{sl}</th><th className={th}>Class teacher</th><th className={th}>Room</th><th className={th}>Students</th></tr></thead>
            <tbody className="divide-y">{st.classes.map((c) => <tr key={c.id}><td className={td}>{c.form}</td><td className={td}>{c.stream}</td><td className={td}>
              {can ? <select className={selectCls} value={c.teacherId} onChange={(e) => setState((s) => ({ classes: s.classes.map((x) => (x.id === c.id ? { ...x, teacherId: e.target.value } : x)) }), `Assigned class teacher for ${className(c)}`)}>{st.staff.filter((s) => s.department !== "Administration").map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select> : st.staff.find((s) => s.id === c.teacherId)?.name}
            </td><td className={td}>{c.room}</td><td className={td}>{st.students.filter((s) => s.classId === c.id && s.status === "active").length}</td></tr>)}</tbody></table>
          {can && <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
            <select className={selectCls} value={nc.form} onChange={(e) => setNc({ ...nc, form: e.target.value })}>{["Form 1", "Form 2", "Form 3", "Form 4"].map((f) => <option key={f}>{f}</option>)}</select>
            <Input className="w-28" placeholder={sl} value={nc.stream} onChange={(e) => setNc({ ...nc, stream: e.target.value })} />
            <Input className="w-24" placeholder="Room" value={nc.room} onChange={(e) => setNc({ ...nc, room: e.target.value })} />
            <Button onClick={() => { if (!nc.stream.trim()) return toast.error(`${sl} name required`); if (st.classes.some((c) => c.form === nc.form && c.stream.toLowerCase() === nc.stream.trim().toLowerCase())) return toast.error("Class already exists"); setState((s) => ({ classes: [...s.classes, { id: uid(), ...nc, stream: nc.stream.trim() }] }), `Created class ${nc.form} ${nc.stream}`); setNc({ ...nc, stream: "", room: "" }); toast.success("Class added"); }}>Add class</Button>
          </div>}
        </Panel>
        <Panel title="Subjects">
          <table className="w-full"><thead className="border-b"><tr><th className={th}>Code</th><th className={th}>Subject</th><th className={th}>Department</th></tr></thead><tbody className="divide-y">{st.subjects.map((s) => <tr key={s.id}><td className={td}>{s.code}</td><td className={td}>{s.name}</td><td className={td}>{s.department}</td></tr>)}</tbody></table>
          {can && <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
            <Input className="w-40" placeholder="Subject name" value={ns.name} onChange={(e) => setNs({ ...ns, name: e.target.value })} />
            <Input className="w-20" placeholder="Code" value={ns.code} onChange={(e) => setNs({ ...ns, code: e.target.value.toUpperCase() })} />
            <Button onClick={() => { if (!ns.name.trim() || !ns.code.trim()) return toast.error("Name and code required"); if (st.subjects.some((s) => s.code === ns.code)) return toast.error("Code already used"); setState((s) => ({ subjects: [...s.subjects, { id: uid(), ...ns }] }), `Added subject ${ns.code}`); setNs({ name: "", code: "", department: "Sciences" }); toast.success("Subject added"); }}>Add subject</Button>
          </div>}
        </Panel>
      </div>
      {can && <Panel className="mt-4" title="Promotion & transfers">
        <p className="mb-3 text-sm text-muted-foreground">Moves all active students to a new class for the next year. Previous enrolment records are kept in each student's academic history.</p>
        <div className="flex flex-wrap items-center gap-2">
          From <select className={selectCls} value={promo.from} onChange={(e) => setPromo({ ...promo, from: e.target.value })}>{st.classes.map((c) => <option key={c.id} value={c.id}>{className(c)}</option>)}</select>
          to <select className={selectCls} value={promo.to} onChange={(e) => setPromo({ ...promo, to: e.target.value })}>{st.classes.map((c) => <option key={c.id} value={c.id}>{className(c)}</option>)}</select>
          for year <Input className="w-24" value={promo.year} onChange={(e) => setPromo({ ...promo, year: e.target.value })} />
          <Button onClick={() => {
            const affected = st.students.filter((s) => s.classId === promo.from && s.status === "active");
            if (promo.from === promo.to) return toast.error("Choose a different destination class");
            if (!affected.length) return toast.error("No active students in that class");
            if (!window.confirm(`Promote ${affected.length} students (${affected.slice(0, 3).map(fullName).join(", ")}…)?`)) return;
            setState((s) => ({ students: s.students.map((x) => (affected.some((a) => a.id === x.id) ? { ...x, classId: promo.to, enrollments: [...x.enrollments, { year: promo.year, classId: promo.to }] } : x)) }), `Promoted ${affected.length} students`);
            toast.success(`${affected.length} students promoted`);
          }}>Promote</Button>
        </div>
      </Panel>}
    </div>
  );
}
