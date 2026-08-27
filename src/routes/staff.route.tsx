import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { BarChart3, Clock, Footprints, ScrollText, Settings } from "lucide-react";

export const Route = createFileRoute("/staff")({
  component: StaffLayout,
  errorComponent: ({ error }) => <div className="p-8 text-destructive">{error.message}</div>,
  notFoundComponent: () => <div className="p-8">Page not found.</div>,
});

const NAV = [
  { to: "/staff", label: "Dashboard", icon: BarChart3, exact: true },
  { to: "/staff/schedule", label: "Bell schedule", icon: Clock, exact: false },
  { to: "/staff/walktimes", label: "Walk times", icon: Footprints, exact: false },
  { to: "/staff/config", label: "Rewards & reasons", icon: Settings, exact: false },
  { to: "/staff/logs", label: "Logs", icon: ScrollText, exact: false },
] as const;

function StaffLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Bacchus Marsh Grammar
            </div>
            <h1 className="text-2xl font-bold">Bell Track — Staff</h1>
          </div>
          <Link to="/student" className="text-sm font-semibold text-muted-foreground hover:text-foreground">
            Student view →
          </Link>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-2">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: n.exact }}
              activeProps={{ className: "bg-primary text-primary-foreground" }}
              inactiveProps={{ className: "text-muted-foreground hover:bg-secondary" }}
              className="flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold"
            >
              <n.icon className="size-4" />
              {n.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
