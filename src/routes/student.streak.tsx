import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Flame, Trophy } from "lucide-react";

import { StatusPill, WatchShell } from "@/components/WatchShell";
import { attendanceQuery, classroomsQuery, rewardConfigQuery } from "@/lib/queries";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/student/streak")({
  head: () => ({
    meta: [
      { title: "Class streak — Bell Track BMG" },
      { name: "description", content: "Track your class's on-time streak and progress towards the reward." },
      { property: "og:title", content: "Class streak — Bell Track BMG" },
      { property: "og:description", content: "On-time streak progress for your class at Bacchus Marsh Grammar." },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(classroomsQuery),
      context.queryClient.ensureQueryData(rewardConfigQuery),
      context.queryClient.ensureQueryData(attendanceQuery),
    ]);
  },
  component: StreakPage,
  errorComponent: ({ error }) => <div className="p-8 text-destructive">{error.message}</div>,
  notFoundComponent: () => <div className="p-8">No streak data yet.</div>,
});

type AttendanceRow = {
  record_id: string;
  student_id: string;
  status: string;
  tap_timestamp: string;
  class_sessions: { period_label: string; classroom_id: string; session_date: string } | null;
};

function StreakPage() {
  const { data: classrooms } = useSuspenseQuery(classroomsQuery);
  const { data: config } = useSuspenseQuery(rewardConfigQuery);
  const { data: attendance } = useSuspenseQuery(attendanceQuery);
  const session = useSession();

  const threshold = config?.streak_threshold ?? 15;
  const rewardLabel = config?.reward_label ?? "Pizza Party Unlock";

  const home = classrooms.find((c) => c.classroom_id === session.destination) ?? classrooms[0];
  const streak = home?.current_streak ?? 0;
  const pct = Math.min(100, Math.round((streak / Math.max(threshold, 1)) * 100));
  const unlocked = streak >= threshold;

  const mine = (attendance as AttendanceRow[])
    .filter((a) => a.student_id === session.studentId)
    .slice(0, 6);

  return (
    <WatchShell zone={session.zone}>
      <StatusPill tone={unlocked ? "ontime" : streak > 0 ? "warn" : "late"}>
        {home ? `${home.classroom_id} · ${home.name}` : "Your class"}
      </StatusPill>

      <div className="mt-6 rounded-3xl border-4 border-warn px-6 py-8 text-center">
        <Flame className="mx-auto size-9 text-warn" />
        <div className="watch-hero mt-2 text-[5rem] text-warn">{streak}</div>
        <p className="text-xl font-semibold text-muted-foreground">day on-time streak</p>
      </div>

      <div className="mt-6">
        <div className="flex justify-between text-base font-semibold">
          <span>{rewardLabel}</span>
          <span className={cn(unlocked ? "text-ontime" : "text-muted-foreground")}>
            {streak}/{threshold}
          </span>
        </div>
        <div className="mt-2 h-4 w-full overflow-hidden rounded-full bg-card">
          <div
            className={cn("h-full rounded-full", unlocked ? "bg-ontime" : "bg-warn")}
            style={{ width: `${pct}%` }}
          />
        </div>
        {unlocked ? (
          <p className="mt-3 flex items-center justify-center gap-2 text-lg font-bold text-ontime">
            <Trophy className="size-5" /> Reward unlocked!
          </p>
        ) : (
          <p className="mt-3 text-center text-base text-muted-foreground">
            {threshold - streak} more on-time day{threshold - streak === 1 ? "" : "s"} to go.
          </p>
        )}
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Your recent taps</h2>
        <div className="mt-2 space-y-2">
          {mine.length === 0 ? (
            <p className="text-base text-muted-foreground">No taps recorded yet.</p>
          ) : (
            mine.map((a) => (
              <div key={a.record_id} className="flex items-center justify-between rounded-xl bg-card px-4 py-3">
                <span className="font-semibold">
                  {a.class_sessions?.classroom_id} · {a.class_sessions?.period_label}
                </span>
                <span className={cn("font-bold", a.status === "late" ? "text-late" : "text-ontime")}>
                  {a.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <Link
        to="/student/watch"
        className="mt-6 block rounded-2xl bg-primary px-6 py-5 text-center text-xl font-bold text-primary-foreground"
      >
        Back to watch face
      </Link>
    </WatchShell>
  );
}
