import { createFileRoute, useNavigate, useBlocker } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader, Panel, selectCls } from "@/components/ui-kit";
import { ACADEMIC_YEAR, className, getState, setState, uid, useStore } from "@/lib/demo-store";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/students/new")({
  head: () => seo("Register student", "Register a new student in four guided steps."),
  component: NewStudent,
});

const steps = ["Student", "Guardian", "Placement", "Review"];
const empty = { firstName: "", lastName: "", gender: "", dob: "", address: "", guardianName: "", guardianRelation: "", guardianPhone: "", admissionNo: "", classId: "" };

export function validateStep(step: number, f: typeof empty, existing: string[]) {
  const e: Partial<Record<keyof typeof empty, string>> = {};
  if (step === 0) {
    if (!f.firstName.trim()) e.firstName = "First name is required";
    if (!f.lastName.trim()) e.lastName = "Last name is required";
    if (!f.gender) e.gender = "Select gender";
    if (!f.dob) e.dob = "Date of birth is required";
  }
  if (step === 1) {
    if (!f.guardianName.trim()) e.guardianName = "Guardian name is required";
    if (!f.guardianRelation) e.guardianRelation = "Select relationship";
    if (!/^\+?[\d\s]{9,15}$/.test(f.guardianPhone)) e.guardianPhone = "Enter a valid phone number";
  }
  if (step === 2) {
    if (!f.admissionNo.trim()) e.admissionNo = "Admission number is required";
    else if (existing.includes(f.admissionNo.trim().toUpperCase())) e.admissionNo = "This admission number already exists";
    if (!f.classId) e.classId = "Select a class";
  }
  return e;
}

function NewStudent() {
  const classes = useStore((s) => s.classes);
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [f, setF] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const dirty = JSON.stringify(f) !== JSON.stringify(empty) && !done;
  useBlocker({ shouldBlockFn: () => dirty && !window.confirm("You have unsaved changes. Leave this page?"), enableBeforeUnload: dirty });

  const set = (k: keyof typeof empty) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const next = () => {
    const e = validateStep(step, f, getState().students.map((s) => s.admissionNo.toUpperCase()));
    setErrors(e);
    if (!Object.keys(e).length) setStep(step + 1);
  };
  const submit = () => {
    if (saving) return;
    const e = validateStep(2, f, getState().students.map((s) => s.admissionNo.toUpperCase()));
    if (Object.keys(e).length) { setErrors(e); setStep(2); return; }
    setSaving(true);
    const id = uid();
    setState((s) => ({ students: [...s.students, { id, admissionNo: f.admissionNo.trim().toUpperCase(), firstName: f.firstName.trim(), lastName: f.lastName.trim(), gender: f.gender as "Male", dob: f.dob, address: f.address, classId: f.classId, status: "active", guardianName: f.guardianName, guardianPhone: f.guardianPhone, guardianRelation: f.guardianRelation, enrollments: [{ year: ACADEMIC_YEAR, classId: f.classId }] }] }), `Registered student ${f.admissionNo}`);
    setDone(true);
    toast.success(`${f.firstName} ${f.lastName} registered`);
    setTimeout(() => navigate({ to: "/students/$id", params: { id } }), 0);
  };
  const field = (k: keyof typeof empty, label: string, input: React.ReactNode) => (
    <div className="space-y-1.5"><Label>{label}</Label>{input}{errors[k] && <p className="text-xs text-destructive">{errors[k]}</p>}</div>
  );

  return (
    <div className="max-w-3xl">
      <PageHeader title="Register student" crumbs={[{ label: "Students", to: "/students" }, { label: "Register" }]} />
      <ol className="mb-6 flex gap-2">{steps.map((s, i) => (
        <li key={s} className={`flex flex-1 items-center gap-2 rounded-lg border p-3 text-sm ${i === step ? "border-primary bg-accent" : "bg-card"}`}>
          <span className={`flex size-6 items-center justify-center rounded-full text-xs ${i < step ? "bg-success text-success-foreground" : i === step ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{i < step ? <Check className="size-3" /> : i + 1}</span>{s}
        </li>))}</ol>
      <Panel>
        <div className="grid gap-4 sm:grid-cols-2">
          {step === 0 && <>
            {field("firstName", "First name", <Input value={f.firstName} onChange={set("firstName")} />)}
            {field("lastName", "Last name", <Input value={f.lastName} onChange={set("lastName")} />)}
            {field("gender", "Gender", <select className={`${selectCls} w-full`} value={f.gender} onChange={set("gender")}><option value="">Select…</option><option>Male</option><option>Female</option></select>)}
            {field("dob", "Date of birth", <Input type="date" value={f.dob} onChange={set("dob")} />)}
            {field("address", "Home address (optional)", <Input value={f.address} onChange={set("address")} />)}
          </>}
          {step === 1 && <>
            {field("guardianName", "Guardian full name", <Input value={f.guardianName} onChange={set("guardianName")} />)}
            {field("guardianRelation", "Relationship", <select className={`${selectCls} w-full`} value={f.guardianRelation} onChange={set("guardianRelation")}><option value="">Select…</option><option>Mother</option><option>Father</option><option>Guardian</option></select>)}
            {field("guardianPhone", "Phone number", <Input value={f.guardianPhone} onChange={set("guardianPhone")} placeholder="+254 7…" />)}
          </>}
          {step === 2 && <>
            {field("admissionNo", "Admission number", <Input value={f.admissionNo} onChange={set("admissionNo")} placeholder="ADM-2500" />)}
            {field("classId", `Class for ${ACADEMIC_YEAR}`, <select className={`${selectCls} w-full`} value={f.classId} onChange={set("classId")}><option value="">Select…</option>{classes.map((c) => <option key={c.id} value={c.id}>{className(c)}</option>)}</select>)}
          </>}
          {step === 3 && (
            <dl className="col-span-2 grid grid-cols-2 gap-3 text-sm">
              {[["Name", `${f.firstName} ${f.lastName}`], ["Gender", f.gender], ["Date of birth", f.dob], ["Guardian", `${f.guardianName} (${f.guardianRelation})`], ["Phone", f.guardianPhone], ["Admission no.", f.admissionNo.toUpperCase()], ["Class", className(classes.find((c) => c.id === f.classId))]].map(([k, v]) => (
                <div key={k}><dt className="text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>))}
            </dl>
          )}
        </div>
        <div className="mt-6 flex justify-between">
          <Button variant="outline" disabled={step === 0} onClick={() => setStep(step - 1)}>Back</Button>
          {step < 3 ? <Button onClick={next}>Continue</Button> : <Button onClick={submit} disabled={saving}>{saving ? "Saving…" : "Confirm registration"}</Button>}
        </div>
      </Panel>
    </div>
  );
}
