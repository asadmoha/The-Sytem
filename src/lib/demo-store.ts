// DEMO DATA LAYER — all records below are fictional sample data held in memory.
// Nothing here is persisted; refreshing the page resets it. Replace with a real
// backend (Lovable Cloud) to store actual school records.
import { useSyncExternalStore } from "react";

export type AttendanceStatus = "present" | "absent" | "late" | "excused";
export type Student = {
  id: string;
  admissionNo: string;
  firstName: string;
  lastName: string;
  gender: "Male" | "Female";
  dob: string;
  classId: string;
  status: "active" | "inactive";
  guardianName: string;
  guardianPhone: string;
  guardianRelation: string;
  address: string;
  enrollments: { year: string; classId: string }[];
};
export type Staff = {
  id: string;
  staffNo: string;
  name: string;
  department: string;
  role: string;
  email: string;
  phone: string;
  status: "active" | "inactive";
};
export type SchoolClass = { id: string; form: string; stream: string; teacherId: string; room: string };
export type Subject = { id: string; name: string; code: string; department: string };
export type Application = {
  id: string;
  name: string;
  gender: "Male" | "Female";
  appliedFor: string;
  guardianName: string;
  guardianPhone: string;
  date: string;
  status: "new" | "pending" | "approved" | "rejected" | "enrolled";
  documents: { birthCert: boolean; reportCard: boolean; photo: boolean };
};
export type AttendanceRecord = {
  id: string;
  date: string;
  classId: string;
  marks: Record<string, AttendanceStatus>;
  savedAt: string;
  corrections: { at: string; studentId: string; from: AttendanceStatus; to: AttendanceStatus }[];
};
export type TimetableEntry = { id: string; classId: string; day: number; slot: number; subjectId: string; teacherId: string; room: string };
export type Exam = {
  id: string;
  name: string;
  term: string;
  classId: string;
  subjectId: string;
  maxMarks: number;
  date: string;
  status: "draft" | "submitted" | "published";
  marks: Record<string, number | "ABS" | undefined>;
};
export type Payment = {
  id: string;
  receiptNo: string;
  studentId: string;
  amount: number;
  method: string;
  date: string;
  reversed?: boolean;
  note?: string;
};
export type Announcement = { id: string; title: string; body: string; audience: string; date: string; read: boolean };
export type GradeBand = { min: number; grade: string; remark: string };

export const ACADEMIC_YEAR = "2026";
export const TERM = "Term 3";
export const TIME_SLOTS = ["08:00–08:40", "08:40–09:20", "09:20–10:00", "10:20–11:00", "11:00–11:40", "12:00–12:40", "14:00–14:40"];
export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

const subjects: Subject[] = [
  { id: "sub1", name: "Mathematics", code: "MAT", department: "Sciences" },
  { id: "sub2", name: "English", code: "ENG", department: "Languages" },
  { id: "sub3", name: "Kiswahili", code: "KIS", department: "Languages" },
  { id: "sub4", name: "Biology", code: "BIO", department: "Sciences" },
  { id: "sub5", name: "Chemistry", code: "CHE", department: "Sciences" },
  { id: "sub6", name: "Physics", code: "PHY", department: "Sciences" },
  { id: "sub7", name: "History", code: "HIS", department: "Humanities" },
  { id: "sub8", name: "Geography", code: "GEO", department: "Humanities" },
];

const staffNames = [
  ["Grace Wanjiru", "Sciences", "Head of Department"],
  ["Peter Otieno", "Sciences", "Teacher"],
  ["Amina Hassan", "Languages", "Teacher"],
  ["John Kamau", "Humanities", "Teacher"],
  ["Mary Achieng", "Languages", "Teacher"],
  ["David Mwangi", "Sciences", "Teacher"],
  ["Fatuma Ali", "Administration", "Bursar"],
  ["Samuel Kiprop", "Administration", "Admissions Officer"],
  ["Lucy Njeri", "Humanities", "Deputy Principal"],
  ["Ibrahim Yusuf", "Sciences", "Teacher"],
];
const staff: Staff[] = staffNames.map(([name, department, role], i) => ({
  id: `st${i + 1}`,
  staffNo: `STF-${String(101 + i)}`,
  name,
  department,
  role,
  email: `${name.split(" ")[0].toLowerCase()}@demo-school.test`,
  phone: `+254 700 ${String(100000 + i * 1371).slice(0, 6)}`,
  status: i === 9 ? "inactive" : "active",
}));

const classes: SchoolClass[] = [
  { id: "c1", form: "Form 1", stream: "East", teacherId: "st1", room: "R101" },
  { id: "c2", form: "Form 1", stream: "West", teacherId: "st2", room: "R102" },
  { id: "c3", form: "Form 2", stream: "East", teacherId: "st3", room: "R201" },
  { id: "c4", form: "Form 3", stream: "East", teacherId: "st4", room: "R301" },
  { id: "c5", form: "Form 4", stream: "East", teacherId: "st5", room: "R401" },
];

const first = ["Brian", "Faith", "Kevin", "Mercy", "Hassan", "Joy", "Dennis", "Halima", "Collins", "Esther", "Ian", "Wambui", "Abdi", "Sharon", "Victor", "Zainab", "Tony", "Purity", "Eric", "Naomi"];
const last = ["Mutua", "Odhiambo", "Kariuki", "Chebet", "Omar", "Wekesa", "Njoroge", "Said", "Kiplagat", "Atieno"];
let seed = 7;
const rand = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);

const students: Student[] = Array.from({ length: 48 }, (_, i) => {
  const f = first[i % first.length];
  const l = last[(i * 3) % last.length];
  const classId = classes[i % classes.length].id;
  return {
    id: `s${i + 1}`,
    admissionNo: `ADM-${String(2400 + i)}`,
    firstName: f,
    lastName: l,
    gender: i % 2 === 0 ? "Male" : "Female",
    dob: `20${10 + (i % 4)}-0${1 + (i % 9)}-1${i % 9}`,
    classId,
    status: i % 13 === 12 ? "inactive" : "active",
    guardianName: `${first[(i + 5) % first.length]} ${l}`,
    guardianPhone: `+254 71${i % 10} ${String(200000 + i * 4111).slice(0, 6)}`,
    guardianRelation: i % 3 === 0 ? "Mother" : i % 3 === 1 ? "Father" : "Guardian",
    address: "Nairobi",
    enrollments: [{ year: ACADEMIC_YEAR, classId }],
  };
});

const today = new Date().toISOString().slice(0, 10);
const attendance: AttendanceRecord[] = classes.slice(0, 3).map((c, ci) => {
  const marks: Record<string, AttendanceStatus> = {};
  students.filter((s) => s.classId === c.id && s.status === "active").forEach((s, i) => {
    marks[s.id] = (i + ci) % 9 === 0 ? "absent" : (i + ci) % 7 === 0 ? "late" : (i + ci) % 11 === 0 ? "excused" : "present";
  });
  return { id: `att${ci}`, date: today, classId: c.id, marks, savedAt: new Date().toISOString(), corrections: [] };
});

const timetable: TimetableEntry[] = [];
classes.forEach((c, ci) => {
  for (let d = 0; d < 5; d++)
    for (let s = 0; s < TIME_SLOTS.length; s++) {
      const sub = subjects[(d * 3 + s + ci) % subjects.length];
      const t = staff.filter((x) => x.department === sub.department && x.role !== "Bursar");
      timetable.push({ id: `tt-${c.id}-${d}-${s}`, classId: c.id, day: d, slot: s, subjectId: sub.id, teacherId: t[(s + ci) % t.length]?.id ?? "st1", room: c.room });
    }
});

const exams: Exam[] = [];
classes.forEach((c, ci) => {
  subjects.slice(0, 6).forEach((sub, si) => {
    const marks: Exam["marks"] = {};
    students.filter((s) => s.classId === c.id).forEach((s) => {
      marks[s.id] = rand() < 0.04 ? "ABS" : Math.round(30 + rand() * 65);
    });
    exams.push({
      id: `ex-${c.id}-${sub.id}`,
      name: "Mid-Term Exam",
      term: TERM,
      classId: c.id,
      subjectId: sub.id,
      maxMarks: 100,
      date: "2026-10-14",
      status: (ci + si) % 5 === 0 ? "submitted" : "published",
      marks,
    });
  });
});

export const FEE_PER_TERM: Record<string, number> = { "Form 1": 18000, "Form 2": 18000, "Form 3": 20000, "Form 4": 22000 };
const payments: Payment[] = [];
students.forEach((s, i) => {
  const fee = FEE_PER_TERM[classes.find((c) => c.id === s.classId)!.form];
  const ratio = i % 5 === 0 ? 0 : i % 4 === 0 ? 0.5 : 1;
  if (ratio > 0)
    payments.push({ id: `p${i}`, receiptNo: `RCP-${String(5000 + i)}`, studentId: s.id, amount: Math.round(fee * ratio), method: i % 2 ? "Bank" : "M-Pesa", date: "2026-09-0" + (1 + (i % 9)) });
});

const applications: Application[] = [
  ["Ruth Kemunto", "Female", "Form 1", "new"],
  ["Allan Barasa", "Male", "Form 1", "new"],
  ["Salma Noor", "Female", "Form 2", "pending"],
  ["Felix Ouma", "Male", "Form 1", "pending"],
  ["Diana Moraa", "Female", "Form 3", "approved"],
  ["Mark Kibet", "Male", "Form 1", "rejected"],
].map(([name, gender, appliedFor, status], i) => ({
  id: `app${i}`,
  name,
  gender: gender as "Male" | "Female",
  appliedFor,
  guardianName: `Parent of ${name.split(" ")[0]}`,
  guardianPhone: `+254 722 00${i}${i}${i}${i}`,
  date: `2026-10-${10 + i}`,
  status: status as Application["status"],
  documents: { birthCert: true, reportCard: i % 2 === 0, photo: i !== 1 },
}));

const announcements: Announcement[] = [
  { id: "an1", title: "Term 3 closing date", body: "School closes on 28 November. Report cards will be issued on the last day.", audience: "All", date: "2026-10-28", read: false },
  { id: "an2", title: "Form 4 national exam timetable", body: "Candidates should collect the final timetable from the Deputy Principal's office.", audience: "Form 4", date: "2026-10-25", read: false },
  { id: "an3", title: "Staff meeting Friday", body: "All teaching staff to meet in the staffroom at 3:30pm.", audience: "Staff", date: "2026-10-20", read: true },
];

const gradeBands: GradeBand[] = [
  { min: 80, grade: "A", remark: "Excellent" },
  { min: 70, grade: "B", remark: "Very good" },
  { min: 60, grade: "C", remark: "Good" },
  { min: 50, grade: "D", remark: "Fair" },
  { min: 0, grade: "E", remark: "Needs improvement" },
];

export type AuditEntry = { at: string; action: string };
export type Role = "Administrator" | "Teacher" | "Admissions" | "Finance" | "Read-only";

type State = {
  school: { name: string; motto: string; formLabel: string; streamLabel: string };
  students: Student[];
  staff: Staff[];
  classes: SchoolClass[];
  subjects: Subject[];
  applications: Application[];
  attendance: AttendanceRecord[];
  timetable: TimetableEntry[];
  exams: Exam[];
  payments: Payment[];
  discounts: { id: string; studentId: string; amount: number; reason: string }[];
  announcements: Announcement[];
  gradeBands: GradeBand[];
  audit: AuditEntry[];
  roles: Role[];
};

let state: State = {
  school: { name: "Riverside Secondary School", motto: "Knowledge & Integrity", formLabel: "Form", streamLabel: "Stream" },
  students, staff, classes, subjects, applications, attendance, timetable, exams, payments,
  discounts: [{ id: "d1", studentId: "s3", amount: 2000, reason: "Sibling discount (approved)" }],
  announcements, gradeBands, audit: [], roles: ["Administrator"],
};
const listeners = new Set<() => void>();
export function setState(fn: (s: State) => Partial<State>, audit?: string) {
  const patch = fn(state);
  state = { ...state, ...patch };
  if (audit) state = { ...state, audit: [{ at: new Date().toISOString(), action: audit }, ...state.audit] };
  listeners.forEach((l) => l());
}
export function getState() {
  return state;
}
export function useStore<T>(sel: (s: State) => T): T {
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => sel(state),
    () => sel(state),
  );
}

// ---------- Business rules (shared) ----------
export const className = (c?: SchoolClass) => (c ? `${c.form} ${c.stream}` : "—");
export const fullName = (s: Student) => `${s.firstName} ${s.lastName}`;

export function feeAssessed(st: State, studentId: string) {
  const s = st.students.find((x) => x.id === studentId);
  const c = st.classes.find((x) => x.id === s?.classId);
  return c ? FEE_PER_TERM[c.form] ?? 0 : 0;
}
export function feeAccount(st: State, studentId: string) {
  const assessed = feeAssessed(st, studentId);
  const discount = st.discounts.filter((d) => d.studentId === studentId).reduce((a, d) => a + d.amount, 0);
  const paid = st.payments.filter((p) => p.studentId === studentId && !p.reversed).reduce((a, p) => a + p.amount, 0);
  const balance = assessed - discount - paid;
  const status: "paid" | "partial" | "overdue" | "due" = balance <= 0 ? "paid" : paid > 0 ? "partial" : st.students.findIndex((s) => s.id === studentId) % 2 === 0 ? "overdue" : "due";
  return { assessed, discount, paid, balance, status };
}
export function validatePayment(amount: number, balance: number): string | null {
  if (!Number.isFinite(amount) || amount <= 0) return "Enter an amount greater than zero.";
  if (amount > balance) return `Amount exceeds the outstanding balance of ${balance.toLocaleString()}.`;
  return null;
}
export function gradeFor(bands: GradeBand[], pct: number) {
  return [...bands].sort((a, b) => b.min - a.min).find((b) => pct >= b.min) ?? bands[bands.length - 1];
}
export function attendanceSummary(records: AttendanceRecord[]) {
  const c = { present: 0, absent: 0, late: 0, excused: 0 };
  records.forEach((r) => Object.values(r.marks).forEach((m) => c[m]++));
  return c;
}
export const money = (n: number) => `KES ${n.toLocaleString()}`;
export function toCSV(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const keys = Object.keys(rows[0]);
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [keys.join(","), ...rows.map((r) => keys.map((k) => esc(r[k])).join(","))].join("\n");
}
export function downloadCSV(name: string, rows: Record<string, unknown>[]) {
  const blob = new Blob([toCSV(rows)], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}
export const uid = () => Math.random().toString(36).slice(2, 10);
