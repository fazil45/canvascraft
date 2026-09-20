import { useAuth } from "@/hooks/useAuth";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const Hero = () => {
  const isLoggedIn = useAuth();
  return (
    <section className="relative overflow-hidden">
      <div className="absolute top-0 left-1/2 h-100 w-150 -translate-x-1/2 rounded-full bg-emerald-500/5 blur-[120px] dark:bg-emerald-500/10" />
      <div className="relative mx-auto max-w-6xl px-6 pt-20 pb-16 text-center">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
          <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
          Realtime collaborative whiteboard
        </div>
        <h1 className="mx-auto max-w-3xl text-5xl leading-[1.05] font-bold tracking-tight sm:text-6xl">
          Sketch ideas together,
          <br />
          <span className="bg-linear-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
            on one canvas.
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-slate-600 dark:text-slate-400">
          Create shared whiteboards, draw shapes, sketch ideas, and watch your
          teammates' cursors move in real time.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={isLoggedIn ? "/dashboard" : "/signup"}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition-all hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            Get started
            <ArrowRight className="h-4.5 w-4.5" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Hero;
