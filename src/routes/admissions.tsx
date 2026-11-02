import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader, Panel, StatusBadge, EmptyState, useCan, Denied, th, td, selectCls } from "@/components/ui-kit";
import { ACADEMIC_YEAR, getState, setState, uid, useStore, type Application } from "@/lib/demo-store";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/admissions")({
  head: () => seo("Admissions", "Review applications, approve and enrol new students."),
  component: Admissions,
});
const tabs = ["new", "pending", "approved", "rejected", "enrolled"] as const;

function Admissions() {
  const apps = useStore((s) => s.applications);
  const classes = useStore((s) => s.classes);
  const can = useCan("Admissions");
  const [tab, setTab] = useState<(typeof tabs)[number]>("new");
  const [open, setOpen] = useState<Application | null>(null);
  const [adm, setAdm] = useState("");
  const [classId, setClassId] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [nf, setNf] = useState({ name: "", appliedFor: "Form 1", guardianName: "", guardianPhone: "" });
  if (!can) return <Denied />;
  const update = (id: string, patch: Partial<Application>, msg: string) => { setState((s) => ({ applications: s.applications.map((a) => (a.id === id ? { ...a, ...patch } : a)) }), msg); setOpen((o) => (o ? { ...o, ...patch } : o)); };
  const enrol = (a: Application) => {
    const no = adm.trim().toUpperCase();
    if (!no) return toast.error("Assign an admission number");
    if (getState().students.some((s) => s.admissionNo === no)) return toast.error("Admission number already in use");
    if (!classId) return toast.error("Select a class");
    const [firstName, ...rest] = a.name.split(" ");
    setState((s) => ({ students: [...s.students, { id: uid(), admissionNo: no, firstName, lastName: rest.join(" "), gender: a.gender, dob: "", classId, status: "active", guardianName: a.guardianName, guardianPhone: a.guardianPhone, guardianRelation: "Guardian", address: "", enrollments: [{ year: ACADEMIC_YEAR, classId }] }] }));
    update(a.id, { status: "enrolled" }, `Enrolled applicant ${a.name} as ${no}`);
    toast.success(`${a.name} is now an enrolled student`);
    setOpen(null);
  };
  const list = apps.filter((a) => a.status === tab);
  return (
    <div>
      <PageHeader title="Admissions" description="Applicants are not students until enrolment is completed." crumbs={[{ label: "Admissions" }]} actions={<Button onClick={() => setNewOpen(true)}>New application</Button>} />
      <div className="mb-4 flex flex-wrap gap-2">{tabs.map((t) => <button key={t} onClick={() => setTab(t)} className={`rounded-full border px-4 py-1.5 text-sm capitalize ${tab === t ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`}>{t} ({apps.filter((a) => a.status === t).length})</button>)}</div>
      <Panel>
        {list.length === 0 ? <EmptyState text={`No ${tab} applications.`} /> : (
          <table className="w-full"><thead className="border-b"><tr><th className={th}>Applicant</th><th className={th}>Applying for</th><th className={th}>Guardian</th><th className={th}>Date</th><th className={th}>Status</th><th className={th} /></tr></thead>
            <tbody className="divide-y">{list.map((a) => <tr key={a.id}><td className={`${td} font-medium`}>{a.name}</td><td className={td}>{a.appliedFor}</td><td className={td}>{a.guardianName}</td><td className={td}>{a.date}</td><td className={td}><StatusBadge status={a.status} /></td><td className={td}><button className="text-primary" onClick={() => { setOpen(a); setAdm(""); setClassId(""); }}>Review</button></td></tr>)}</tbody></table>
        )}
      </Panel>
      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent>{open && <>
          <DialogHeader><DialogTitle>{open.name}</DialogTitle></DialogHeader>
          <div className="space-y-2 text-sm"><div>Applying for <b>{open.appliedFor}</b> · Guardian {open.guardianName} ({open.guardianPhone})</div>
            <div className="font-medium">Documents checklist</div>
            {(Object.entries(open.documents) as [keyof Application["documents"], boolean][]).map(([k, v]) => <label key={k} className="flex items-center gap-2"><input type="checkbox" checked={v} onChange={() => update(open.id, { documents: { ...open.documents, [k]: !v } }, `Updated documents for ${open.name}`)} />{k === "birthCert" ? "Birth certificate" : k === "reportCard" ? "Previous report card" : "Passport photo"}</label>)}
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {(open.status === "new") && <Button variant="outline" onClick={() => update(open.id, { status: "pending" }, `Moved ${open.name} to review`)}>Start review</Button>}
            {(open.status === "new" || open.status === "pending") && <><Button onClick={() => update(open.id, { status: "approved" }, `Approved ${open.name}`)}>Approve</Button><Button variant="destructive" onClick={() => window.confirm("Reject this application?") && update(open.id, { status: "rejected" }, `Rejected ${open.name}`)}>Reject</Button></>}
          </div>
          {open.status === "approved" && <div className="space-y-2 border-t pt-3"><div className="text-sm font-medium">Complete enrolment</div><Input placeholder="Admission number e.g. ADM-2600" value={adm} onChange={(e) => setAdm(e.target.value)} /><select className={`${selectCls} w-full`} value={classId} onChange={(e) => setClassId(e.target.value)}><option value="">Select class…</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.form} {c.stream}</option>)}</select><Button onClick={() => enrol(open)}>Enrol student</Button></div>}
        </>}</DialogContent>
      </Dialog>
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent><DialogHeader><DialogTitle>New application</DialogTitle></DialogHeader>
          <Input placeholder="Applicant full name" value={nf.name} onChange={(e) => setNf({ ...nf, name: e.target.value })} />
          <select className={selectCls} value={nf.appliedFor} onChange={(e) => setNf({ ...nf, appliedFor: e.target.value })}>{["Form 1", "Form 2", "Form 3", "Form 4"].map((f) => <option key={f}>{f}</option>)}</select>
          <Input placeholder="Guardian name" value={nf.guardianName} onChange={(e) => setNf({ ...nf, guardianName: e.target.value })} />
          <Input placeholder="Guardian phone" value={nf.guardianPhone} onChange={(e) => setNf({ ...nf, guardianPhone: e.target.value })} />
          <Button onClick={() => { if (!nf.name.trim() || !nf.guardianName.trim()) return toast.error("Name and guardian are required"); setState((s) => ({ applications: [{ id: uid(), ...nf, gender: "Male", date: new Date().toISOString().slice(0, 10), status: "new", documents: { birthCert: false, reportCard: false, photo: false } }, ...s.applications] }), `New application ${nf.name}`); setNewOpen(false); setNf({ name: "", appliedFor: "Form 1", guardianName: "", guardianPhone: "" }); setTab("new"); toast.success("Application added"); }}>Save application</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
