import { Layers, MousePointer2, Share2, Zap } from "lucide-react";
import React from "react";

const Features = () => {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-20">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            icon: Zap,
            color: "text-emerald-500",
            bg: "bg-emerald-50 dark:bg-emerald-500/10",
            title: "Realtime sync",
            desc: "Every stroke appears instantly for all collaborators",
          },
          {
            icon: MousePointer2,
            color: "text-teal-500",
            bg: "bg-teal-50 dark:bg-teal-500/10",
            title: "Live cursors",
            desc: "See where everyone is drawing in real time",
          },
          {
            icon: Share2,
            color: "text-sky-500",
            bg: "bg-sky-50 dark:bg-sky-500/10",
            title: "Share by code",
            desc: "Give someone a code and they are in",
          },
          {
            icon: Layers,
            color: "text-amber-500",
            bg: "bg-amber-50 dark:bg-amber-500/10",
            title: "7 drawing tools",
            desc: "Shapes, arrows, freehand, text and more",
          },
        ].map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:border-slate-300 hover:shadow-md dark:border-white/5 dark:bg-white/5 dark:hover:border-white/10"
          >
            <div
              className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${f.bg}`}
            >
              <f.icon className={`h-5.5 w-5.5 ${f.color}`} />
            </div>
            <h3 className="text-base font-semibold">{f.title}</h3>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
              {f.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Features;
