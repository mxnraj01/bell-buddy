import { useSyncExternalStore } from "react";

export type BellSession = {
  studentId: string | null;
  studentName: string | null;
  zone: string;
  destination: string | null;
  staffName: string | null;
  lastRecordId: string | null;
};

const KEY = "belltrack.session";

const empty: BellSession = {
  studentId: null,
  studentName: null,
  zone: "Science Wing",
  destination: null,
  staffName: null,
  lastRecordId: null,
};

let cache: BellSession = empty;
const listeners = new Set<() => void>();

function read(): BellSession {
  if (typeof window === "undefined") return empty;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? { ...empty, ...(JSON.parse(raw) as Partial<BellSession>) } : empty;
  } catch {
    return empty;
  }
}

function subscribe(cb: () => void) {
  if (typeof window !== "undefined" && cache === empty) cache = read();
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function setSession(patch: Partial<BellSession>) {
  cache = { ...read(), ...patch };
  window.localStorage.setItem(KEY, JSON.stringify(cache));
  listeners.forEach((l) => l());
}

export function clearSession() {
  cache = empty;
  window.localStorage.removeItem(KEY);
  listeners.forEach((l) => l());
}

export function useSession(): BellSession {
  return useSyncExternalStore(
    subscribe,
    () => cache,
    () => empty,
  );
}

export const CORRIDOR_ZONES = [
  "Science Wing",
  "Gym Corridor",
  "Library Corridor",
  "Arts Corridor",
  "Main Corridor",
];
