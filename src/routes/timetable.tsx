import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader, Panel, useCan, selectCls } from "@/components/ui-kit";
import { DAYS, TIME_SLOTS, className, setState, useStore } from "@/lib/demo-store";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/timetable")({
  head: () => seo("Timetable", "Weekly class timetables with subject and teacher assignments."),
  component: Timetable,
});

function Timetable() {
  const st = useStore((s) => s);
  const can = useCan();
  const [classId, setClassId] = useState(st.classes[0].id);
  const [editing, setEditing] = useState<string | null>(null);
  const entries = st.timetable.filter((t) => t.classId === classId);
  const cls = st.classes.find((c) => c.id === classId);

  const update = (id: string, patch: { subjectId?: string; teacherId?: string }) => {
    const e = st.timetable.find((x) => x.id === id)!;
    const teacherId = patch.teacherId ?? e.teacherId;
    const clash = st.timetable.find((x) => x.id !== id && x.day === e.day && x.slot === e.slot && x.teacherId === teacherId);
    if (clash) {
      toast.error(`Teacher clash: already teaching ${className(st.classes.find((c) => c.id === clash.classId))} at this time.`);
      return;
    }
    setState((s) => ({ timetable: s.timetable.map((x) => (x.id === id ? { ...x, ...patch } : x)) }), `Updated timetable for ${className(cls)}`);
    toast.success("Lesson updated");
  };

  return (
    <div>
      <PageHeader title="Timetable" description="Click a lesson to change its subject or teacher." crumbs={[{ label: "Timetable" }]}
        actions={<select className={selectCls} value={classId} onChange={(e) => setClassId(e.target.value)}>{st.classes.map((c) => <option key={c.id} value={c.id}>{className(c)}</option>)}</select>} />
      <Panel title={`${className(cls)} · Room ${cls?.room}`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-separate border-spacing-1">
            <thead><tr><th className="w-28 text-left text-xs font-medium text-muted-foreground">Time</th>{DAYS.map((d) => <th key={d} className="text-left text-xs font-medium uppercase text-muted-foreground">{d}</th>)}</tr></thead>
            <tbody>
              {TIME_SLOTS.map((t, si) => (
                <tr key={t}>
                  <td className="text-xs text-muted-foreground">{t}</td>
                  {DAYS.map((_, di) => {
                    const e = entries.find((x) => x.day === di && x.slot === si);
                    if (!e) return <td key={di} className="rounded-md bg-muted p-2" />;
                    const sub = st.subjects.find((s) => s.id === e.subjectId);
                    const tch = st.staff.find((s) => s.id === e.teacherId);
                    return (
                      <td key={di} className="rounded-md border bg-secondary/50 p-2 align-top">
                        {editing === e.id && can ? (
                          <div className="flex flex-col gap-1">
                            <select className={selectCls} value={e.subjectId} onChange={(ev) => update(e.id, { subjectId: ev.target.value })}>{st.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
                            <select className={selectCls} value={e.teacherId} onChange={(ev) => update(e.id, { teacherId: ev.target.value })}>{st.staff.filter((s) => s.department !== "Administration").map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
                            <button className="text-xs text-primary" onClick={() => setEditing(null)}>Done</button>
                          </div>
                        ) : (
                          <button className="w-full text-left" onClick={() => setEditing(e.id)}>
                            <div className="text-sm font-medium text-navy">{sub?.name}</div>
                            <div className="text-xs text-muted-foreground">{tch?.name}</div>
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
