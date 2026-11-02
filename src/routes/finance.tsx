import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, Panel, StatusBadge, Pager, useCan, Denied, th, td, selectCls } from "@/components/ui-kit";
import { className, downloadCSV, feeAccount, fullName, money, setState, uid, useStore, validatePayment } from "@/lib/demo-store";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/finance")({
  head: () => seo("Fees & Finance", "Student fee balances, payments, receipts and reversals."),
  component: Finance,
});

function Finance() {
  const st = useStore((s) => s);
  const can = useCan("Finance");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pay, setPay] = useState({ studentId: st.students[0].id, amount: "", method: "M-Pesa" });
  if (!can) return <div><PageHeader title="Fees & Finance" /><Denied /></div>;

  const rows = st.students.filter((s) => s.status === "active").map((s) => ({ s, a: feeAccount(st, s.id) }))
    .filter((r) => (filter === "all" || r.a.status === filter) && (fullName(r.s) + r.s.admissionNo).toLowerCase().includes(q.toLowerCase()));
  const pages = Math.ceil(rows.length / 10);
  const totals = st.students.filter((s) => s.status === "active").reduce((t, s) => { const a = feeAccount(st, s.id); return { assessed: t.assessed + a.assessed, paid: t.paid + a.paid, bal: t.bal + Math.max(a.balance, 0) }; }, { assessed: 0, paid: 0, bal: 0 });
  const selBal = feeAccount(st, pay.studentId).balance;

  const record = () => {
    const amt = Number(pay.amount);
    const err = validatePayment(amt, selBal);
    if (err) return toast.error(err);
    const receiptNo = `RCP-${5000 + st.payments.length + 100}`;
    const s = st.students.find((x) => x.id === pay.studentId)!;
    setState((x) => ({ payments: [{ id: uid(), receiptNo, studentId: pay.studentId, amount: amt, method: pay.method, date: new Date().toISOString().slice(0, 10) }, ...x.payments] }), `Recorded payment ${receiptNo} for ${fullName(s)}`);
    setPay({ ...pay, amount: "" });
    toast.success(`Payment recorded · ${receiptNo}`);
  };
  const reverse = (id: string) => {
    const reason = window.prompt("Reason for reversal?");
    if (!reason) return;
    const p = st.payments.find((x) => x.id === id)!;
    setState((x) => ({ payments: x.payments.map((y) => (y.id === id ? { ...y, reversed: true, note: reason } : y)) }), `Reversed ${p.receiptNo}: ${reason}`);
    toast.success("Payment reversed");
  };

  return (
    <div>
      <PageHeader title="Fees & Finance" description="Term fee accounts and payments." crumbs={[{ label: "Fees & Finance" }]}
        actions={<Button variant="outline" onClick={() => downloadCSV("fee-balances.csv", rows.map((r) => ({ admissionNo: r.s.admissionNo, name: fullName(r.s), class: className(st.classes.find((c) => c.id === r.s.classId)), ...r.a })))}>Export CSV</Button>} />
      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        {[["Assessed this term", totals.assessed], ["Collected", totals.paid], ["Outstanding", totals.bal]].map(([l, v]) => (
          <Panel key={l as string}><div className="text-xs text-muted-foreground">{l}</div><div className="mt-1 text-xl font-semibold text-navy">{money(v as number)}</div></Panel>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2" title="Fee accounts" action={<div className="flex gap-2">
          <Input className="h-9 w-44" placeholder="Search…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
          <select className={selectCls} value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }}>{["all", "paid", "partial", "due", "overdue"].map((f) => <option key={f}>{f}</option>)}</select>
        </div>}>
          <div className="overflow-x-auto"><table className="w-full"><thead className="border-b"><tr><th className={th}>Student</th><th className={th}>Assessed</th><th className={th}>Paid</th><th className={th}>Balance</th><th className={th}>Status</th></tr></thead>
            <tbody className="divide-y">{rows.slice((page - 1) * 10, page * 10).map(({ s, a }) => <tr key={s.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setPay({ ...pay, studentId: s.id })}>
              <td className={td}>{fullName(s)} <span className="text-xs text-muted-foreground">{s.admissionNo}</span></td><td className={td}>{money(a.assessed - a.discount)}</td><td className={td}>{money(a.paid)}</td><td className={td}>{money(Math.max(a.balance, 0))}</td><td className={td}><StatusBadge status={a.status} /></td></tr>)}</tbody></table></div>
          <Pager page={page} pages={pages} setPage={setPage} />
        </Panel>
        <Panel title="Record payment">
          <div className="flex flex-col gap-3">
            <select className={selectCls} value={pay.studentId} onChange={(e) => setPay({ ...pay, studentId: e.target.value })}>{st.students.filter((s) => s.status === "active").map((s) => <option key={s.id} value={s.id}>{fullName(s)} · {s.admissionNo}</option>)}</select>
            <div className="text-xs text-muted-foreground">Outstanding: {money(Math.max(selBal, 0))}</div>
            <Input type="number" placeholder="Amount (KES)" value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} />
            <select className={selectCls} value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value })}>{["M-Pesa", "Bank", "Cash", "Cheque"].map((m) => <option key={m}>{m}</option>)}</select>
            <Button onClick={record}>Record payment</Button>
          </div>
        </Panel>
      </div>
      <Panel className="mt-4" title="Recent payments">
        <div className="overflow-x-auto"><table className="w-full"><thead className="border-b"><tr><th className={th}>Receipt</th><th className={th}>Student</th><th className={th}>Amount</th><th className={th}>Method</th><th className={th}>Date</th><th className={th}></th></tr></thead>
          <tbody className="divide-y">{st.payments.slice(0, 12).map((p) => { const s = st.students.find((x) => x.id === p.studentId); return <tr key={p.id}>
            <td className={td}>{p.receiptNo}</td><td className={td}>{s ? fullName(s) : "—"}</td><td className={td}>{money(p.amount)}</td><td className={td}>{p.method}</td><td className={td}>{p.date}</td>
            <td className={td}>{p.reversed ? <span title={p.note}><StatusBadge status="reversed" /></span> : <button className="text-xs text-destructive" onClick={() => reverse(p.id)}>Reverse</button>}</td></tr>; })}</tbody></table></div>
      </Panel>
    </div>
  );
}
