import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard, Users, UserPlus, Briefcase, BookOpen, ClipboardCheck, CalendarDays,
  GraduationCap, Wallet, FileBarChart, Megaphone, Settings, Bell, Search, School, ChevronDown,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, SidebarInset,
} from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ACADEMIC_YEAR, TERM, fullName, setState, useStore } from "@/lib/demo-store";

const groups = [
  { label: "General", items: [{ title: "Overview", url: "/", icon: LayoutDashboard }] },
  {
    label: "People",
    items: [
      { title: "Students", url: "/students", icon: Users },
      { title: "Admissions", url: "/admissions", icon: UserPlus },
      { title: "Teachers & Staff", url: "/staff", icon: Briefcase },
    ],
  },
  {
    label: "Academics",
    items: [
      { title: "Classes & Subjects", url: "/classes", icon: BookOpen },
      { title: "Attendance", url: "/attendance", icon: ClipboardCheck },
      { title: "Timetable", url: "/timetable", icon: CalendarDays },
      { title: "Examinations & Results", url: "/exams", icon: GraduationCap },
    ],
  },
  {
    label: "Administration",
    items: [
      { title: "Fees & Finance", url: "/finance", icon: Wallet },
      { title: "Reports", url: "/reports", icon: FileBarChart },
      { title: "Announcements", url: "/announcements", icon: Megaphone },
      { title: "Settings", url: "/settings", icon: Settings },
    ],
  },
] as const;

function AppSidebar() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const school = useStore((s) => s.school);
  const active = (u: string) => (u === "/" ? path === "/" : path.startsWith(u));
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-1 py-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <School className="size-4" />
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <div className="truncate text-sm font-semibold text-sidebar-accent-foreground">School Admin</div>
            <div className="truncate text-xs text-sidebar-foreground/70">{school.name}</div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((g) => (
          <SidebarGroup key={g.label}>
            <SidebarGroupLabel className="text-sidebar-foreground/50">{g.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {g.items.map((it) => (
                  <SidebarMenuItem key={it.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={active(it.url)}
                      tooltip={it.title}
                      className="data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
                    >
                      <Link to={it.url}>
                        <it.icon />
                        <span>{it.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}

function GlobalSearch() {
  const [q, setQ] = useState("");
  const students = useStore((s) => s.students);
  const staff = useStore((s) => s.staff);
  const navigate = useNavigate();
  const ql = q.toLowerCase();
  const hits = q.length < 2 ? [] : [
    ...students.filter((s) => fullName(s).toLowerCase().includes(ql) || s.admissionNo.toLowerCase().includes(ql)).slice(0, 5)
      .map((s) => ({ key: s.id, label: fullName(s), sub: s.admissionNo, go: () => navigate({ to: "/students/$id", params: { id: s.id } }) })),
    ...staff.filter((s) => s.name.toLowerCase().includes(ql)).slice(0, 3)
      .map((s) => ({ key: s.id, label: s.name, sub: s.role, go: () => navigate({ to: "/staff" }) })),
  ];
  return (
    <div className="relative hidden w-full max-w-sm md:block">
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search students, staff…" className="pl-9 bg-muted border-transparent" />
      {q.length >= 2 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border bg-popover p-1 shadow-lg">
          {hits.length === 0 && <div className="p-3 text-sm text-muted-foreground">No matches</div>}
          {hits.map((h) => (
            <button key={h.key} onClick={() => { h.go(); setQ(""); }} className="flex w-full justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-accent">
              <span>{h.label}</span><span className="text-muted-foreground">{h.sub}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Notifications() {
  const ann = useStore((s) => s.announcements);
  const unread = ann.filter((a) => !a.read).length;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button aria-label="Notifications" className="relative rounded-full p-2 hover:bg-muted">
          <Bell className="size-5" />
          {unread > 0 && <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">{unread}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="text-sm font-semibold">Notifications</span>
          <button className="text-xs text-primary" onClick={() => setState((s) => ({ announcements: s.announcements.map((a) => ({ ...a, read: true })) }))}>Mark all read</button>
        </div>
        {ann.map((a) => (
          <Link key={a.id} to="/announcements" className="block border-b px-4 py-3 last:border-0 hover:bg-muted"
            onClick={() => setState((s) => ({ announcements: s.announcements.map((x) => (x.id === a.id ? { ...x, read: true } : x)) }))}>
            <div className="flex items-center gap-2 text-sm font-medium">{!a.read && <span className="size-2 rounded-full bg-primary" />}{a.title}</div>
            <div className="text-xs text-muted-foreground">{a.date} · {a.audience}</div>
          </Link>
        ))}
      </PopoverContent>
    </Popover>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const roles = useStore((s) => s.roles);
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="bg-background">
          <header className="no-print sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-card/95 px-4 backdrop-blur">
            <SidebarTrigger />
            <GlobalSearch />
            <div className="ml-auto flex items-center gap-3">
              <span className="hidden rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground sm:inline">{ACADEMIC_YEAR} · {TERM}</span>
              <Notifications />
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 rounded-full p-1 pr-2 hover:bg-muted">
                  <span className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">AM</span>
                  <span className="hidden text-sm font-medium sm:inline">Demo Admin</span>
                  <ChevronDown className="size-4 text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Roles: {roles.join(", ")}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild><Link to="/settings">Settings & roles</Link></DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <div className="no-print border-b bg-warning/15 px-4 py-1.5 text-center text-xs text-warning-foreground">
            Demo mode — all records are fictional and reset when the page reloads.
          </div>
          <main className="mx-auto w-full max-w-7xl flex-1 p-4 md:p-6">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
