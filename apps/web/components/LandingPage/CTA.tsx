import { ArrowRight } from "lucide-react";
import Link from "next/link";
import React from "react";

const CTA = () => {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-24">
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-slate-900 to-slate-800 p-10 text-center dark:from-slate-800 dark:to-slate-900">
        <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="relative">
          <h2 className="text-3xl font-bold text-white">
            Ready to start drawing?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-slate-400">
            Head to the dashboard to create a board, invite your team with a
            code, and start collaborating instantly.
          </p>
          <Link
            href={"/dashboard"}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition-all hover:bg-slate-100"
          >
            Go to Dashboard
            <ArrowRight className="h-4.5 w-4.5" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CTA;
