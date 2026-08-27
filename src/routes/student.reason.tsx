import { useState } from "react";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import * as Icons from "lucide-react";

import { StatusPill, WatchShell } from "@/components/WatchShell";
import { supabase } from "@/integrations/supabase/client";
import { reasonsQuery } from "@/lib/queries";
import { setSession, useSession } from "@/lib/session";

export const Route = createFileRoute("/student/reason")({
  head: () => ({
    meta: [
      { title: "Why were you late? — Bell Track BMG" },
      { name: "description", content: "Log the reason for a late class entry on the Bell Track watch." },
      { property: "og:title", content: "Why were you late? — Bell Track BMG" },
      { property: "og:description", content: "Quick tap reason capture after a late class entry." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(reasonsQuery),
  component: ReasonPage,
  errorComponent: ({ error }) => <div className="p-8 text-destructive">{error.message}</div>,
  notFoundComponent: () => <div className="p-8">No reasons configured.</div>,
});

function ReasonPage() {
  const { data: reasons } = useSuspenseQuery(reasonsQuery);
  const session = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [picked, setPicked] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: async (code: string) => {
      if (!session.lastRecordId) return;
      const { error } = await supabase
        .from("lateness_reasons")
        .insert({ record_id: session.lastRecordId, reason_code: code });
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      setSession({ lastRecordId: null });
      navigate({ to: "/student/streak" });
    },
  });

  return (
    <WatchShell zone={session.zone}>
      <StatusPill tone="late">Late arrival logged</StatusPill>
      <h1 className="mt-6 text-center text-4xl font-bold">Why were you late?</h1>
      <p className="mt-2 text-center text-lg text-muted-foreground">One tap. No typing.</p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {reasons.map((r) => {
          const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[r.icon] ?? Icons.HelpCircle;
          const active = picked === r.reason_code;
          return (
            <button
              key={r.reason_code}
              disabled={save.isPending}
              onClick={() => {
                setPicked(r.reason_code);
                save.mutate(r.reason_code);
              }}
              className={`flex flex-col items-center gap-2 rounded-2xl px-3 py-6 text-center text-lg font-semibold transition-colors ${
                active ? "bg-warn text-warn-foreground" : "bg-card text-card-foreground"
              }`}
            >
              <Icon className="size-8" />
              {r.label}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => navigate({ to: "/student/streak" })}
        className="mt-6 w-full rounded-2xl bg-secondary px-6 py-5 text-lg font-semibold text-secondary-foreground"
      >
        Skip
      </button>
    </WatchShell>
  );
}
