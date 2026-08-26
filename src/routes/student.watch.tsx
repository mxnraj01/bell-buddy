import { useEffect, useState } from "react";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Flame, MapPin, RefreshCw, LifeBuoy } from "lucide-react";

import { StatusPill, WatchShell } from "@/components/WatchShell";
import { validateTap, type TapResult } from "@/lib/belltrack.functions";
import {
  classroomsQuery,
  formatCountdown,
  localNow,
  nextBell,
  scheduleQuery,
  urgencyFor,
  walktimesQuery,
} from "@/lib/queries";
import { setSession, useSession } from "@/lib/session";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/student/watch")({
  head: () => ({
    meta: [
      { title: "Next bell countdown — BellTrack BMG" },
      { name: "description", content: "Live bell countdown, walk-time estimate and one-tap class entry." },
      { property: "og:title", content: "Next bell countdown — BellTrack BMG" },
      { property: "og:description", content: "The BellTrack wearable face: countdown, walk time and tap in." },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(scheduleQuery),
      context.queryClient.ensureQueryData(classroomsQuery),
      context.queryClient.ensureQueryData(walktimesQuery),
    ]);
  },
  component: WatchFace,
  errorComponent: ({ error }) => <div className="p-8 text-destructive">{error.message}</div>,
  notFoundComponent: () => <div className="p-8">Nothing scheduled.</div>,
});

function WatchFace() {
  const { data: periods } = useSuspenseQuery(scheduleQuery);
  const { data: classrooms } = useSuspenseQuery(classroomsQuery);
  const { data: walktimes } = useSuspenseQuery(walktimesQuery);
  const session = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const tap = useServerFn(validateTap);
  const [result, setResult] = useState<TapResult | null>(null);

  const [now, setNow] = useState(() => localNow());
  useEffect(() => {
    const id = setInterval(() => setNow(localNow()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && !session.studentId) navigate({ to: "/student" });
  }, [session.studentId, navigate]);

  const bell = nextBell(periods, now.time);
  const destination = session.destination;
  const classroom = classrooms.find((c) => c.classroom_id === destination) ?? null;
  const walk =
    destination != null
      ? (walktimes.find((w) => w.from_zone === session.zone && w.to_classroom_id === destination)
          ?.walk_time_seconds ?? null)
      : null;
  const urgency = bell ? urgencyFor(bell.secondsUntil, walk) : "ontime";

  const mutation = useMutation({
    mutationFn: (forceLate: boolean) =>
      tap({
        data: {
          studentId: session.studentId ?? "",
          classroomId: destination ?? "",
          localDate: now.date,
          localTime: now.time,
          forceLate,
        },
      }),
    onSuccess: async (res) => {
      setResult(res);
      await queryClient.invalidateQueries();
      if (res.ok) {
        setSession({ lastRecordId: res.recordId });
        if (res.status === "late") navigate({ to: "/student/reason" });
        else setTimeout(() => navigate({ to: "/student/streak" }), 900);
      }
    },
  });

  if (result && !result.ok) {
    return (
      <WatchShell zone={session.zone}>
        <StatusPill tone="late">{result.errorType}</StatusPill>
        <div className="mt-8 rounded-2xl border border-late bg-card p-6 text-center">
          <h1 className="text-3xl font-bold">Couldn't log that tap</h1>
          <p className="mt-3 text-lg text-muted-foreground">{result.message}</p>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            onClick={() => setResult(null)}
            className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-5 text-xl font-bold text-primary-foreground"
          >
            <RefreshCw className="size-5" /> Try Again
          </button>
          <Link
            to="/student"
            className="flex items-center justify-center gap-2 rounded-2xl bg-card px-6 py-5 text-xl font-bold"
          >
            <LifeBuoy className="size-5" /> Get Help
          </Link>
        </div>
      </WatchShell>
    );
  }

  if (result && result.ok && result.status === "on-time") {
    return (
      <WatchShell zone={session.zone}>
        <StatusPill tone="ontime">On time</StatusPill>
        <div className="mt-10 text-center">
          <div className="watch-hero text-7xl text-ontime">✓</div>
          <p className="mt-6 text-2xl font-bold">
            {result.classroomId} · {result.periodLabel}
          </p>
          <p className="mt-2 text-lg text-muted-foreground">Streak now {result.streak} days</p>
        </div>
      </WatchShell>
    );
  }

  return (
    <WatchShell zone={session.zone}>
      <p className="text-center text-lg font-semibold uppercase tracking-[0.3em] text-muted-foreground">
        Next Bell in…
      </p>

      <div
        className={cn(
          "mx-auto mt-4 w-full rounded-3xl border-4 px-6 py-8 text-center",
          urgency === "ontime" && "border-ontime",
          urgency === "warn" && "border-warn",
          urgency === "late" && "border-late",
        )}
      >
        <div
          className={cn(
            "watch-hero text-[5.5rem] sm:text-[7rem]",
            urgency === "ontime" && "text-ontime",
            urgency === "warn" && "text-warn",
            urgency === "late" && "text-late",
          )}
        >
          {bell ? formatCountdown(bell.secondsUntil) : "--:--"}
        </div>
        <p className="mt-2 text-xl font-semibold text-muted-foreground">{bell?.period.period_label}</p>
      </div>

      {destination && classroom ? (
        <p className="mt-5 text-center text-xl">
          <span className="font-bold">{destination}</span> · {classroom.name} —{" "}
          <span
            className={cn(
              "font-bold",
              urgency === "ontime" && "text-ontime",
              urgency === "warn" && "text-warn",
              urgency === "late" && "text-late",
            )}
          >
            {walk}s walk
          </span>
          {urgency === "late" ? " · move now!" : urgency === "warn" ? " · cutting it close" : " · plenty of time"}
        </p>
      ) : (
        <p className="mt-5 text-center text-xl text-muted-foreground">Pick a destination for a walk estimate.</p>
      )}

      <div className="mt-8 grid gap-3">
        <Link
          to="/student/destination"
          className="flex items-center justify-center gap-3 rounded-2xl bg-card px-6 py-6 text-xl font-bold"
        >
          <MapPin className="size-6" /> {destination ? "Change Destination" : "Choose Destination"}
        </Link>
        <button
          disabled={!destination || mutation.isPending}
          onClick={() => mutation.mutate(false)}
          className="rounded-2xl bg-primary px-6 py-7 text-2xl font-bold text-primary-foreground disabled:opacity-40"
        >
          Tap to Enter Next Class →
        </button>
        <div className="grid grid-cols-2 gap-3">
          <button
            disabled={!destination || mutation.isPending}
            onClick={() => mutation.mutate(true)}
            className="rounded-2xl bg-card px-4 py-4 text-base font-semibold text-muted-foreground disabled:opacity-40"
          >
            Demo: tap in late
          </button>
          <Link
            to="/student/streak"
            className="flex items-center justify-center gap-2 rounded-2xl bg-card px-4 py-4 text-base font-semibold"
          >
            <Flame className="size-5 text-warn" /> Streak
          </Link>
        </div>
      </div>
    </WatchShell>
  );
}
