import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore, type Role } from "@/lib/demo-store";

export function PageHeader({ title, description, crumbs, actions }: { title: string; description?: string; crumbs?: { label: string; to?: string }[]; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {crumbs && (
          <nav className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
            <Link to="/" className="hover:text-foreground">Overview</Link>
            {crumbs.map((c) => (
              <span key={c.label} className="flex items-center gap-1">
                <ChevronRight className="size-3" />
                {c.to ? <Link to={c.to} className="hover:text-foreground">{c.label}</Link> : c.label}
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-2xl font-semibold tracking-tight text-navy">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="no-print flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, action, children, className }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-xl border bg-card p-5 shadow-[var(--shadow-card)]", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-navy">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

const tones: Record<string, string> = {
  active: "bg-success/12 text-success", paid: "bg-success/12 text-success", present: "bg-success/12 text-success",
  published: "bg-success/12 text-success", approved: "bg-success/12 text-success", enrolled: "bg-primary/12 text-primary",
  inactive: "bg-muted text-muted-foreground", draft: "bg-muted text-muted-foreground", excused: "bg-info/12 text-info",
  pending: "bg-warning/20 text-warning-foreground", new: "bg-info/12 text-info", late: "bg-warning/20 text-warning-foreground",
  due: "bg-warning/20 text-warning-foreground", partial: "bg-info/12 text-info", submitted: "bg-info/12 text-info",
  overdue: "bg-destructive/12 text-destructive", absent: "bg-destructive/12 text-destructive", rejected: "bg-destructive/12 text-destructive",
  reversed: "bg-destructive/12 text-destructive", unmarked: "bg-muted text-muted-foreground",
};
export function StatusBadge({ status }: { status: string }) {
  return <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize", tones[status] ?? "bg-muted")}>{status}</span>;
}

export function EmptyState({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">{text}</div>;
}

export function useCan(...allowed: Role[]) {
  const roles = useStore((s) => s.roles);
  return roles.includes("Administrator") || roles.some((r) => allowed.includes(r));
}
export function Denied() {
  return <EmptyState text="You don't have permission to view this. Ask an administrator to grant the required role." />;
}

export function Pager({ page, pages, setPage }: { page: number; pages: number; setPage: (n: number) => void }) {
  return (
    <div className="mt-3 flex items-center justify-end gap-2 text-sm">
      <span className="text-muted-foreground">Page {page} of {Math.max(pages, 1)}</span>
      <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-md border px-3 py-1 disabled:opacity-40">Prev</button>
      <button disabled={page >= pages} onClick={() => setPage(page + 1)} className="rounded-md border px-3 py-1 disabled:opacity-40">Next</button>
    </div>
  );
}

export const th = "px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground";
export const td = "px-3 py-2.5 text-sm";
export const selectCls = "h-9 rounded-md border bg-card px-3 text-sm";
