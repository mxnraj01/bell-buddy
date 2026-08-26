import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { WatchShell } from "@/components/WatchShell";
import { CORRIDOR_ZONES, setSession, useSession } from "@/lib/session";
import { studentsQuery } from "@/lib/queries";

export const Route = createFileRoute("/student/")({
  head: () => ({
    meta: [
      { title: "Pair your watch — BellTrack BMG" },
      { name: "description", content: "Pick the student wearing this BellTrack watch to start the demo." },
      { property: "og:title", content: "Pair your watch — BellTrack BMG" },
      { property: "og:description", content: "Simulated wearable pairing for the BellTrack proof of concept." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(studentsQuery),
  component: StudentPicker,
  errorComponent: ({ error }) => <div className="p-8 text-destructive">{error.message}</div>,
  notFoundComponent: () => <div className="p-8">No students found.</div>,
});

function StudentPicker() {
  const { data: students } = useSuspenseQuery(studentsQuery);
  const session = useSession();
  const navigate = useNavigate();

  return (
    <WatchShell zone={session.zone}>
      <h1 className="text-center text-4xl font-bold">Who's wearing this watch?</h1>
      <p className="mt-2 text-center text-lg text-muted-foreground">Tap your name to pair.</p>

      <div className="mt-6">
        <label className="mb-2 block text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Current corridor
        </label>
        <div className="flex flex-wrap gap-2">
          {CORRIDOR_ZONES.map((z) => (
            <button
              key={z}
              onClick={() => setSession({ zone: z })}
              className={`rounded-xl px-4 py-3 text-base font-semibold ${
                session.zone === z ? "bg-ontime text-ontime-foreground" : "bg-card text-card-foreground"
              }`}
            >
              {z}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid max-h-[45vh] grid-cols-2 gap-3 overflow-y-auto pr-1">
        {students.map((s) => (
          <button
            key={s.student_id}
            onClick={() => {
              setSession({ studentId: s.student_id, studentName: s.name, destination: null });
              navigate({ to: "/student/watch" });
            }}
            className="rounded-2xl bg-card px-4 py-5 text-left"
          >
            <div className="text-xl font-bold leading-tight">{s.name}</div>
            <div className="font-mono text-sm text-muted-foreground">{s.student_id}</div>
          </button>
        ))}
      </div>
    </WatchShell>
  );
}
