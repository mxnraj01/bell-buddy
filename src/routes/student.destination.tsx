import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Delete } from "lucide-react";

import { WatchShell } from "@/components/WatchShell";
import { classroomsQuery, walktimesQuery } from "@/lib/queries";
import { setSession, useSession } from "@/lib/session";

export const Route = createFileRoute("/student/destination")({
  head: () => ({
    meta: [
      { title: "Where are you headed? — BellTrack BMG" },
      { name: "description", content: "Enter your classroom code to get a live walk-time estimate." },
      { property: "og:title", content: "Where are you headed? — BellTrack BMG" },
      { property: "og:description", content: "Classroom code entry on the BellTrack wearable simulation." },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(classroomsQuery),
      context.queryClient.ensureQueryData(walktimesQuery),
    ]);
  },
  component: DestinationPage,
  errorComponent: ({ error }) => <div className="p-8 text-destructive">{error.message}</div>,
  notFoundComponent: () => <div className="p-8">No classrooms configured.</div>,
});

function DestinationPage() {
  const { data: classrooms } = useSuspenseQuery(classroomsQuery);
  const { data: walktimes } = useSuspenseQuery(walktimesQuery);
  const session = useSession();
  const navigate = useNavigate();
  const [code, setCode] = useState("");

  const match = classrooms.find((c) => c.classroom_id.slice(1) === code);
  const walk = match
    ? (walktimes.find((w) => w.from_zone === session.zone && w.to_classroom_id === match.classroom_id)
        ?.walk_time_seconds ?? null)
    : null;

  const confirm = (classroomId: string) => {
    setSession({ destination: classroomId });
    navigate({ to: "/student/watch" });
  };

  return (
    <WatchShell zone={session.zone}>
      <h1 className="text-center text-4xl font-bold">Where are you headed?</h1>

      <div className="mx-auto mt-5 w-full max-w-sm rounded-2xl border-2 border-dashed border-border px-6 py-5 text-center">
        <div className="watch-hero text-5xl text-warn">
          {match ? match.classroom_id : code ? `?${code}` : "— — —"}
        </div>
        <p className="mt-2 text-base text-muted-foreground">
          {match ? `${match.name} · ${walk}s walk from ${session.zone}` : "Enter room number"}
        </p>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        {classrooms.slice(0, 3).map((c) => (
          <button
            key={c.classroom_id}
            onClick={() => confirm(c.classroom_id)}
            className="rounded-xl bg-card px-3 py-3 text-center"
          >
            <div className="text-xl font-bold">{c.classroom_id}</div>
            <div className="truncate text-xs text-muted-foreground">{c.corridor_zone}</div>
          </button>
        ))}
      </div>

      <div className="mx-auto mt-4 grid w-full max-w-sm grid-cols-3 gap-2">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <button
            key={d}
            onClick={() => setCode((c) => (c.length >= 3 ? c : c + d))}
            className="rounded-xl bg-card py-4 font-mono text-3xl font-bold"
          >
            {d}
          </button>
        ))}
        <button
          onClick={() => setCode("")}
          className="rounded-xl bg-card py-4 text-base font-semibold text-muted-foreground"
        >
          Clear
        </button>
        <button
          onClick={() => setCode((c) => (c.length >= 3 ? c : c + "0"))}
          className="rounded-xl bg-card py-4 font-mono text-3xl font-bold"
        >
          0
        </button>
        <button
          onClick={() => setCode((c) => c.slice(0, -1))}
          className="flex items-center justify-center rounded-xl bg-card py-4"
          aria-label="Backspace"
        >
          <Delete className="size-7" />
        </button>
      </div>

      <button
        disabled={!match}
        onClick={() => match && confirm(match.classroom_id)}
        className="mt-5 w-full rounded-2xl bg-primary px-6 py-6 text-2xl font-bold text-primary-foreground disabled:bg-secondary disabled:text-muted-foreground"
      >
        Confirm Destination →
      </button>
    </WatchShell>
  );
}
