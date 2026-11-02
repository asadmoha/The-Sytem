import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, Panel, EmptyState, useCan, selectCls } from "@/components/ui-kit";
import { setState, uid, useStore } from "@/lib/demo-store";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/announcements")({
  head: () => seo("Announcements", "Post and manage notices for students, parents and staff."),
  component: Announcements,
});

function Announcements() {
  const ann = useStore((s) => s.announcements);
  const can = useCan();
  const [f, setF] = useState({ title: "", body: "", audience: "All" });
  const post = () => {
    if (!f.title.trim() || !f.body.trim()) return toast.error("Title and message are required.");
    setState((s) => ({ announcements: [{ id: uid(), ...f, date: new Date().toISOString().slice(0, 10), read: false }, ...s.announcements] }), `Posted announcement: ${f.title}`);
    setF({ title: "", body: "", audience: "All" });
    toast.success("Announcement posted");
  };
  return (
    <div>
      <PageHeader title="Announcements" crumbs={[{ label: "Announcements" }]} />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {!ann.length && <EmptyState text="No announcements yet." />}
          {ann.map((a) => (
            <Panel key={a.id}>
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-primary/12 p-2 text-primary"><Megaphone className="size-4" /></div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-navy">{a.title}</h3><span className="rounded-full bg-secondary px-2 py-0.5 text-xs">{a.audience}</span></div>
                  <p className="mt-1 text-sm text-muted-foreground">{a.body}</p>
                  <div className="mt-2 text-xs text-muted-foreground">{a.date}</div>
                </div>
                {can && <button className="text-xs text-destructive" onClick={() => { if (confirm("Delete this announcement?")) setState((s) => ({ announcements: s.announcements.filter((x) => x.id !== a.id) }), `Deleted announcement: ${a.title}`); }}>Delete</button>}
              </div>
            </Panel>
          ))}
        </div>
        {can && <Panel title="New announcement">
          <div className="flex flex-col gap-3">
            <Input placeholder="Title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
            <Textarea placeholder="Message" rows={5} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} />
            <select className={selectCls} value={f.audience} onChange={(e) => setF({ ...f, audience: e.target.value })}>{["All", "Staff", "Parents", "Form 1", "Form 2", "Form 3", "Form 4"].map((x) => <option key={x}>{x}</option>)}</select>
            <Button onClick={post}>Post</Button>
          </div>
        </Panel>}
      </div>
    </div>
  );
}
