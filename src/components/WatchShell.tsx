import { useEffect, useState, type ReactNode } from "react";

import { localNow } from "@/lib/queries";
import { cn } from "@/lib/utils";

export function WatchShell({
  zone,
  children,
  className,
}: {
  zone: string;
  children: ReactNode;
  className?: string;
}) {
  const [clock, setClock] = useState("--:--");
  useEffect(() => {
    const tick = () => setClock(localNow().clock);
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="watch min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-6 py-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-muted-foreground">
            <span aria-hidden className="inline-block size-2 rounded-full bg-ontime" />
            BMG — {zone}
          </div>
          <div className="font-mono text-3xl font-bold text-ontime">{clock}</div>
        </header>
        <main className={cn("flex flex-1 flex-col justify-center py-6", className)}>{children}</main>
      </div>
    </div>
  );
}

export function StatusPill({
  tone,
  children,
}: {
  tone: "ontime" | "warn" | "late";
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "mx-auto rounded-full px-5 py-2 text-center text-base font-semibold uppercase tracking-wide",
        tone === "ontime" && "bg-ontime text-ontime-foreground",
        tone === "warn" && "bg-warn text-warn-foreground",
        tone === "late" && "bg-late text-late-foreground",
      )}
    >
      {children}
    </div>
  );
}
