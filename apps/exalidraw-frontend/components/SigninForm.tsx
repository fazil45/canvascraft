"use client";

import { useForm } from "@tanstack/react-form";
import Input from "./InputComponent";
import ThemeToggle from "./ThemeToggleComponent";
import { useRouter } from "next/navigation";
import { Button } from "./ButtonComponent";
import { SigninSchema } from "@repo/common/types";
import FieldInfo from "./ErrorMessage";
import { AuthStore } from "@/store/AuthStore";
import { ArrowRight, Sparkles } from "lucide-react";

export function FormSignin() {
  const route = useRouter();
  const { signin } = AuthStore();

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },

    validators: {
      onChange: SigninSchema,
    },

    onSubmit: async ({ value }) => {
      signin(value.email, value.password, route);
    },
  });

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-white px-4 py-10 text-slate-900 dark:bg-slate-950 dark:text-white sm:px-6">
      {/* Same subtle glow as landing page */}
      <div className="pointer-events-none absolute top-0 left-1/2 h-72 w-96 -translate-x-1/2 rounded-full bg-emerald-500/5 blur-[100px] dark:bg-emerald-500/10" />

      {/* Theme */}
      <div className="absolute top-5 right-5">
        <ThemeToggle />
      </div>

      {/* Card */}
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8 dark:border-white/10 dark:bg-slate-900 dark:shadow-black/20">
        {/* Logo */}
        <button
          onClick={() => route.push("/")}
          className="mx-auto block text-2xl font-bold tracking-tight"
        >
          Canvas
          <span className="bg-linear-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
            Craft
          </span>
        </button>

        {/* Badge */}
        <div className="mt-6 flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
            <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
            Welcome back
          </div>
        </div>

        {/* Heading */}
        <div className="mt-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Sign in to your account
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
            Continue creating and collaborating on your canvas.
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="mt-8 space-y-5"
        >
          <form.Field
            name="email"
            children={(field) => (
              <div>
                <Input
                  title="Email"
                  type="email"
                  placeholder="you@example.com"
                  value={field.state.value}
                  onChange={field.handleChange}
                  onBlur={field.handleBlur}
                />

                <FieldInfo
                  errors={field.state.meta.errors}
                  isTouched={field.state.meta.isTouched}
                />
              </div>
            )}
          />

          <form.Field
            name="password"
            children={(field) => (
              <div>
                <Input
                  title="Password"
                  type="password"
                  placeholder="Enter your password"
                  value={field.state.value}
                  onChange={field.handleChange}
                  onBlur={field.handleBlur}
                />

                <FieldInfo
                  errors={field.state.meta.errors}
                  isTouched={field.state.meta.isTouched}
                />
              </div>
            )}
          />

          <Button
            variant="secondary"
            size="lg"
            type="submit"
            className="w-full justify-center gap-2"
          >
            Sign in
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-7 border-t border-slate-200 pt-6 text-center dark:border-white/10">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Don't have an account?{" "}
            <button
              onClick={() => route.push("/signup")}
              className="font-semibold text-emerald-500 transition-colors hover:text-teal-500"
            >
              Create one
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}