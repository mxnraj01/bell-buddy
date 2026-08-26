import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { validateTapCore } from "./belltrack.server";

const tapSchema = z.object({
  studentId: z.string(),
  classroomId: z.string(),
  localDate: z.string(), // YYYY-MM-DD
  localTime: z.string(), // HH:MM:SS
  forceLate: z.boolean().optional(),
});

export type TapResult =
  | {
      ok: true;
      status: "on-time" | "late";
      recordId: string;
      periodLabel: string;
      classroomId: string;
      streak: number;
      rewardUnlocked: boolean;
      threshold: number;
    }
  | { ok: false; errorType: string; message: string };

export const validateTap = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => tapSchema.parse(data))
  .handler(async ({ data }): Promise<TapResult> => validateTapCore(data));
