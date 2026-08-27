import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, Flame, Users } from "lucide-react";

import { attendanceQuery, classroomsQuery, errorLogQuery, rewardConfigQuery, studentsQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/staff/")({
  head: () => ({
    meta: [
      { title: "Staff dashboard — Bell Track BMG" },
      { name: "description", content: "Live lateness, on-time rate and class streaks across Bacchus Marsh Grammar." },
      { property: "og:title", content: "Staff dashboard — Bell Track BMG" },
      { property: "og:description", content: "Live attendance, streaks and reward progress for staff." },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(attendanceQuery),
      context.queryClient.ensureQueryData(classroomsQuery),
      context.queryClient.ensureQueryData(studentsQuery),
      context.queryClient.ensureQueryData(errorLogQuery),
      context.queryClient.ensureQueryData(rewardConfigQuery),
    ]);
  },
  component: StaffDashboard,
  errorComponent: ({ error }) => <div className="p-8 text-destructive">{error.message}</div>,
  notFoundComponent: () => <div className="p-8">Nothing to show yet.</div>,
});

type AttendanceRow = {
  record_id: string;
  student_id: string;
  status: string;
  tap_timestamp: string;
  class_sessions: { period_label: string; classroom_id: string; session_date: string } | null;
  lateness_reasons: { reason_code: string }[] | null;
};

function Stat({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  icon: typeof Users;
  tone?: "ontime" | "late" | "warn";
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
        <Icon
          className={cn(
            "size-4",
            tone === "ontime" && "text-ontime",
            tone === "late" && "text-late",
            tone === "warn" && "text-warn",
          )}
        />
      </div>
      <div className="mt-2 text-4xl font-bold">{value}</div>
    </div>
  );
}

function StaffDashboard() {
  const { data: attendance } = useSuspenseQuery(attendanceQuery);
  const { data: classrooms } = useSuspenseQuery(classroomsQuery);
  const { data: students } = useSuspenseQuery(studentsQuery);
  const { data: errors } = useSuspenseQuery(errorLogQuery);
  const { data: config } = useSuspenseQuery(rewardConfigQuery);

  const rows = attendance as AttendanceRow[];
  const today = new Date().toISOString().slice(0, 10);
  const todays = rows.filter((r) => r.class_sessions?.session_date === today);
  const late = todays.filter((r) => r.status === "late").length;
  const onTime = todays.length - late;
  const rate = todays.length ? Math.round((onTime / todays.length) * 100) : 100;
  const threshold = config?.streak_threshold ?? 15;
  const names = new Map(students.map((s) => [s.student_id, s.name]));

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Taps today" value={todays.length} icon={Users} />
        <Stat label="On time" value={onTime} icon={CheckCircle2} tone="ontime" />
        <Stat label="Late" value={late} icon={AlertTriangle} tone="late" />
        <Stat label="On-time rate" value={`${rate}%`} icon={Flame} tone="warn" />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-bold">Class streaks</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {classrooms.map((c) => {
            const pct = Math.min(100, Math.round((c.current_streak / Math.max(threshold, 1)) * 100));
            return (
              <div key={c.classroom_id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-bold">{c.classroom_id}</span>
                  <span className="text-sm text-muted-foreground">{c.corridor_zone}</span>
                </div>
                <p className="text-sm text-muted-foreground">{c.name}</p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-secondary">
                    <div
                      className={cn("h-full", c.current_streak >= threshold ? "bg-ontime" : "bg-warn")}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="font-mono text-sm font-bold">
                    {c.current_streak}/{threshold}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Latest taps</h2>
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-secondary text-secondary-foreground">
              <tr>
                <th className="px-4 py-2">Student</th>
                <th className="px-4 py-2">Room</th>
                <th className="px-4 py-2">Period</th>
                <th className="px-4 py-2">Time</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Reason</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 15).map((r) => (
                <tr key={r.record_id} className="border-t border-border bg-card">
                  <td className="px-4 py-2 font-semibold">{names.get(r.student_id) ?? r.student_id}</td>
                  <td className="px-4 py-2 font-mono">{r.class_sessions?.classroom_id}</td>
                  <td className="px-4 py-2">{r.class_sessions?.period_label}</td>
                  <td className="px-4 py-2 font-mono">
                    {new Date(r.tap_timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className={cn("px-4 py-2 font-bold", r.status === "late" ? "text-late" : "text-ontime")}>
                    {r.status}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {r.lateness_reasons?.[0]?.reason_code ?? "—"}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-muted-foreground" colSpan={6}>
                    No taps recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Rejected taps</h2>
        <p className="text-sm text-muted-foreground">
          {errors.length} logged issue{errors.length === 1 ? "" : "s"} — see the Logs tab for detail.
        </p>
      </section>
    </div>
  );
}
