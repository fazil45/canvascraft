"use client";

import { Monitor, Smartphone } from "lucide-react";

export default function MobileUnsupported() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-md border border-white/10 bg-white/5">
          <Monitor className="h-9 w-9 text-white" />
        </div>

        <h1 className="text-3xl font-semibold tracking-tight">
          Desktop required
        </h1>

        <p className="mt-4 text-sm leading-6 text-white/60">
          This application is designed for larger screens and is currently
          unavailable on mobile devices.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/3 px-5 py-4 text-left">
          <Smartphone className="h-5 w-5 shrink-0 text-white/40" />

          <p className="text-sm text-white/50">
            Please open this application on a laptop or desktop computer.
          </p>
        </div>

        <p className="mt-8 text-xs text-white/30">
          CanvasCraft · Best experienced on desktop
        </p>
      </div>
    </main>
  );
}