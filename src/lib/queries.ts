import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

async function unwrap<T>(p: PromiseLike<{ data: T | null; error: { message: string } | null }>) {
  const { data, error } = await p;
  if (error) throw new Error(error.message);
  return (data ?? []) as T;
}

export const studentsQuery = queryOptions({
  queryKey: ["students"],
  queryFn: () => unwrap(supabase.from("students").select("*").order("name")),
});

export const classroomsQuery = queryOptions({
  queryKey: ["classrooms"],
  queryFn: () => unwrap(supabase.from("classrooms").select("*").order("classroom_id")),
});

export const scheduleQuery = queryOptions({
  queryKey: ["bell_schedule"],
  queryFn: () => unwrap(supabase.from("bell_schedule").select("*").order("bell_time")),
});

export const walktimesQuery = queryOptions({
  queryKey: ["walktimes"],
  queryFn: () => unwrap(supabase.from("walktimes").select("*")),
});

export const reasonsQuery = queryOptions({
  queryKey: ["reason_categories"],
  queryFn: () => unwrap(supabase.from("reason_categories").select("*").order("sort_order")),
});

export const rewardConfigQuery = queryOptions({
  queryKey: ["reward_config"],
  queryFn: async () => {
    const { data, error } = await supabase.from("reward_config").select("*").eq("id", 1).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  },
});

export const attendanceQuery = queryOptions({
  queryKey: ["attendance"],
  queryFn: () =>
    unwrap(
      supabase
        .from("attendance_records")
        .select(
          "record_id, student_id, status, valid, tap_timestamp, class_sessions(period_label, classroom_id, session_date), lateness_reasons(reason_code)",
        )
        .order("tap_timestamp", { ascending: false })
        .limit(200),
    ),
});

export const errorLogQuery = queryOptions({
  queryKey: ["error_log"],
  queryFn: () =>
    unwrap(supabase.from("error_log").select("*").order("logged_at", { ascending: false }).limit(200)),
});

export const sessionsQuery = queryOptions({
  queryKey: ["class_sessions"],
  queryFn: () =>
    unwrap(supabase.from("class_sessions").select("*").order("session_date", { ascending: false })),
});

/** Local (browser) date + time strings used for bell math. */
export function localNow(d = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`,
    clock: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

export type Period = { period_label: string; bell_time: string; end_time: string; period_type: string };

/** Next bell after `time` (HH:MM:SS); wraps to tomorrow's first bell. */
export function nextBell(periods: Period[], time: string) {
  const upcoming = periods.find((p) => p.bell_time > time);
  const target = upcoming ?? periods[0];
  if (!target) return null;
  const secs = (t: string) => {
    const [h, m, s] = t.split(":").map(Number);
    return (h ?? 0) * 3600 + (m ?? 0) * 60 + (s ?? 0);
  };
  let delta = secs(target.bell_time) - secs(time);
  if (delta < 0) delta += 24 * 3600;
  return { period: target, secondsUntil: delta };
}

export function formatCountdown(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  if (m >= 60) {
    return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export type Urgency = "ontime" | "warn" | "late";

export function urgencyFor(secondsUntil: number, walkSeconds: number | null): Urgency {
  if (walkSeconds == null) {
    if (secondsUntil <= 60) return "late";
    if (secondsUntil <= 180) return "warn";
    return "ontime";
  }
  if (secondsUntil < walkSeconds) return "late";
  if (secondsUntil < walkSeconds * 1.5 + 30) return "warn";
  return "ontime";
}
