import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";
import type { TapResult } from "./belltrack.functions";

function serverClient() {
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"]!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export type TapInput = {
  studentId: string;
  classroomId: string;
  localDate: string;
  localTime: string;
  forceLate?: boolean | undefined;
};

/**
 * ValidateTap(studentID, timestamp) — Section 7 of the design doc.
 * Rejected taps are written to error_log rather than failing silently.
 */
export async function validateTapCore(input: TapInput): Promise<TapResult> {
  const db = serverClient();
  const raw = JSON.stringify(input);

  const fail = async (errorType: string, message: string): Promise<TapResult> => {
    await db.from("error_log").insert({
      student_id_attempted: input.studentId,
      error_type: errorType,
      raw_input: raw,
    });
    return { ok: false, errorType, message };
  };

  // 1. Enrolment check
  const { data: student } = await db
    .from("students")
    .select("student_id")
    .eq("student_id", input.studentId)
    .maybeSingle();
  if (!student) return fail("Unregistered ID", "Unregistered ID tap — see a teacher.");

  // 2. Matching scheduled class for this timestamp.
  //    Taps in the transition window before a bell count towards the upcoming class.
  const { data: periods } = await db
    .from("bell_schedule")
    .select("period_label, bell_time, end_time, period_type")
    .order("bell_time");
  const list = periods ?? [];
  const secs = (t: string) => {
    const [h, m, s] = t.split(":").map(Number);
    return (h ?? 0) * 3600 + (m ?? 0) * 60 + (s ?? 0);
  };
  const nowSecs = secs(input.localTime);
  const TRANSITION = 15 * 60; // tap in up to 15 min before the bell
  const GRACE = 2 * 60; // still "on time" for 2 min after the bell

  const upcoming = list.find((p) => secs(p.bell_time) - nowSecs > 0 && secs(p.bell_time) - nowSecs <= TRANSITION);
  const current = list.find((p) => input.localTime >= p.bell_time && input.localTime < p.end_time);
  const period = upcoming ?? current;
  if (!period) return fail("No matching class", "No class scheduled right now.");


  const { data: classroom } = await db
    .from("classrooms")
    .select("classroom_id, current_streak")
    .eq("classroom_id", input.classroomId)
    .maybeSingle();
  if (!classroom) return fail("No matching class", "That room isn't on the timetable.");

  // 3. Get or create the class session
  let { data: session } = await db
    .from("class_sessions")
    .select("*")
    .eq("classroom_id", input.classroomId)
    .eq("session_date", input.localDate)
    .eq("bell_time", period.bell_time)
    .maybeSingle();

  if (!session) {
    const created = await db
      .from("class_sessions")
      .insert({
        classroom_id: input.classroomId,
        session_date: input.localDate,
        bell_time: period.bell_time,
        period_label: period.period_label,
        current_streak: classroom.current_streak,
      })
      .select("*")
      .single();
    if (created.error || !created.data) {
      return fail("Session error", "Couldn't log that tap — see a teacher.");
    }
    session = created.data;
  }

  // 4. Duplicate tap check
  const { data: existing } = await db
    .from("attendance_records")
    .select("record_id")
    .eq("student_id", input.studentId)
    .eq("session_id", session.session_id)
    .eq("valid", true)
    .maybeSingle();
  if (existing) return fail("Duplicate tap", "You've already tapped into this class.");

  // 5. Record the valid tap
  const status: "on-time" | "late" =
    input.forceLate || input.localTime > period.bell_time ? "late" : "on-time";

  const inserted = await db
    .from("attendance_records")
    .insert({
      student_id: input.studentId,
      session_id: session.session_id,
      status,
      valid: true,
      tap_timestamp: new Date().toISOString(),
    })
    .select("record_id")
    .single();
  if (inserted.error || !inserted.data) {
    return fail("Write error", "Couldn't log that tap — see a teacher.");
  }

  // 6. UpdateStreak()
  let streak = classroom.current_streak;
  if (status === "late") {
    streak = 0;
    await db.from("class_sessions").update({ broken: true, current_streak: 0 }).eq("session_id", session.session_id);
  } else if (!session.counted && !session.broken) {
    streak = classroom.current_streak + 1;
    await db
      .from("class_sessions")
      .update({ counted: true, current_streak: streak })
      .eq("session_id", session.session_id);
  }
  await db.from("classrooms").update({ current_streak: streak }).eq("classroom_id", input.classroomId);

  const { data: config } = await db
    .from("reward_config")
    .select("streak_threshold")
    .eq("id", 1)
    .maybeSingle();
  const threshold = config?.streak_threshold ?? 15;

  return {
    ok: true,
    status,
    recordId: inserted.data.record_id,
    periodLabel: period.period_label,
    classroomId: input.classroomId,
    streak,
    rewardUnlocked: status === "on-time" && streak >= threshold,
    threshold,
  };
}
