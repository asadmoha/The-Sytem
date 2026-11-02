import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader, Panel, StatusBadge, useCan, th, td, selectCls } from "@/components/ui-kit";
import { DAYS, TIME_SLOTS, className, setState, uid, useStore, type Staff } from "@/lib/demo-store";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/staff")({
  head: () => seo("Teachers & Staff", "Staff directory, roles, assignments and teaching timetables."),
  component: StaffPage,
});
const blank: Omit<Staff, "id"> = { staffNo: "", name: "", department: "Sciences", role: "Teacher", email: "", phone: "", status: "active" };

function StaffPage() {
  const st = useStore((s) => s);
  const can = useCan();
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("");
  const [edit, setEdit] = useState<(Omit<Staff, "id"> & { id?: string }) | null>(null);
  const [view, setView] = useState<Staff | null>(null);
  const rows = st.staff.filter((s) => (!q || s.name.toLowerCase().includes(q.toLowerCase()) || s.staffNo.includes(q.toUpperCase())) && (!dept || s.department === dept));
  const save = () => {
    if (!edit) return;
    if (!edit.name.trim() || !edit.staffNo.trim()) return toast.error("Name and staff ID are required");
    if (!/^\S+@\S+\.\S+$/.test(edit.email)) return toast.error("Enter a valid email");
    if (st.staff.some((s) => s.staffNo === edit.staffNo && s.id !== edit.id)) return toast.error("Staff ID already exists");
    if (edit.id) setState((s) => ({ staff: s.staff.map((x) => (x.id === edit.id ? { ...(edit as Staff) } : x)) }), `Edited staff ${edit.staffNo}`);
    else setState((s) => ({ staff: [...s.staff, { ...edit, id: uid() }] }), `Added staff ${edit.staffNo}`);
    toast.success("Staff record saved"); setEdit(null);
  };
  const lessons = view ? st.timetable.filter((t) => t.teacherId === view.id) : [];
  return (
    <div>
      <PageHeader title="Teachers & Staff" crumbs={[{ label: "Teachers & Staff" }]} actions={can && <Button onClick={() => setEdit({ ...blank })}>Add staff</Button>} />
      <Panel>
        <div className="mb-4 flex gap-2"><Input placeholder="Search name or ID" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" /><select className={selectCls} value={dept} onChange={(e) => setDept(e.target.value)}><option value="">All departments</option>{[...new Set(st.staff.map((s) => s.department))].map((d) => <option key={d}>{d}</option>)}</select></div>
        <div className="overflow-x-auto"><table className="w-full"><thead className="border-b"><tr>{["Staff ID", "Name", "Department", "Role", "Contact", "Status", ""].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
          <tbody className="divide-y">{rows.map((s) => <tr key={s.id}><td className={td}>{s.staffNo}</td><td className={`${td} font-medium`}>{s.name}</td><td className={td}>{s.department}</td><td className={td}>{s.role}</td><td className={td}>{s.email}<div className="text-xs text-muted-foreground">{s.phone}</div></td><td className={td}><StatusBadge status={s.status} /></td><td className={`${td} space-x-3`}><button className="text-primary" onClick={() => setView(s)}>Profile</button>{can && <button className="text-primary" onClick={() => setEdit({ ...s })}>Edit</button>}</td></tr>)}</tbody></table></div>
      </Panel>
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent><DialogHeader><DialogTitle>{edit?.id ? "Edit staff" : "Add staff"}</DialogTitle></DialogHeader>
          {edit && <div className="grid gap-2">
            <Input placeholder="Staff ID" value={edit.staffNo} onChange={(e) => setEdit({ ...edit, staffNo: e.target.value.toUpperCase() })} />
            <Input placeholder="Full name" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
            <select className={selectCls} value={edit.department} onChange={(e) => setEdit({ ...edit, department: e.target.value })}>{["Sciences", "Languages", "Humanities", "Administration"].map((d) => <option key={d}>{d}</option>)}</select>
            <Input placeholder="Role" value={edit.role} onChange={(e) => setEdit({ ...edit, role: e.target.value })} />
            <Input placeholder="Email" value={edit.email} onChange={(e) => setEdit({ ...edit, email: e.target.value })} />
            <Input placeholder="Phone" value={edit.phone} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} />
            <select className={selectCls} value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value as "active" })}><option value="active">Active</option><option value="inactive">Inactive</option></select>
            <Button onClick={save}>Save</Button></div>}
        </DialogContent>
      </Dialog>
      <Dialog open={!!view} onOpenChange={(o) => !o && setView(null)}>
        <DialogContent className="max-w-3xl"><DialogHeader><DialogTitle>{view?.name} — teaching timetable</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">{view?.role} · {view?.department} · {lessons.length} lessons/week · Class teacher of {st.classes.filter((c) => c.teacherId === view?.id).map((c) => className(c)).join(", ") || "none"}</p>
          <div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr><th />{DAYS.map((d) => <th key={d} className={th}>{d}</th>)}</tr></thead><tbody>{TIME_SLOTS.map((t, si) => <tr key={t}><td className="pr-2 text-muted-foreground">{t}</td>{DAYS.map((_, di) => { const l = lessons.find((x) => x.day === di && x.slot === si); return <td key={di} className="p-1">{l && <div className="rounded bg-secondary p-1.5">{st.subjects.find((s) => s.id === l.subjectId)?.code} · {className(st.classes.find((c) => c.id === l.classId))}</div>}</td>; })}</tr>)}</tbody></table></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
