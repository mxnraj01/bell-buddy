import { createFileRoute, Link } from "@tanstack/react-router";
import { GraduationCap, ShieldCheck, Watch } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BellTrack — Bacchus Marsh Grammar lateness tracker" },
      {
        name: "description",
        content:
          "BellTrack is a proof-of-concept lateness system for Bacchus Marsh Grammar: a wearable watch simulation for students and a staff dashboard for bells, walktimes and streaks.",
      },
      { property: "og:title", content: "BellTrack — Bacchus Marsh Grammar" },
      {
        property: "og:description",
        content: "Wearable bell countdown for students, live attendance and streak dashboard for staff.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="watch flex min-h-screen flex-col items-center justify-center bg-background px-6 text-foreground">
      <div className="w-full max-w-xl text-center">
        <div className="mb-3 flex items-center justify-center gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-ontime">
          <Watch className="size-4" /> BellTrack
        </div>
        <h1 className="text-5xl font-bold tracking-tight">Bacchus Marsh Grammar</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          On-time, every bell. Choose how you're using BellTrack today.
        </p>

        <div className="mt-10 grid gap-4">
          <Link
            to="/student"
            className="flex items-center justify-center gap-3 rounded-2xl bg-ontime px-6 py-8 text-2xl font-bold text-ontime-foreground transition-transform hover:scale-[1.01]"
          >
            <GraduationCap className="size-7" /> I'm a Student
          </Link>
          <Link
            to="/staff"
            className="flex items-center justify-center gap-3 rounded-2xl border border-border bg-card px-6 py-8 text-2xl font-bold text-card-foreground transition-colors hover:bg-secondary"
          >
            <ShieldCheck className="size-7" /> I'm Staff
          </Link>
        </div>

        <p className="mt-10 text-xs uppercase tracking-widest text-muted-foreground">
          BellTrack — BMG · Proof of concept
        </p>
      </div>
    </div>
  );
}
