"use client";

import { useForm } from "@tanstack/react-form";
import Input from "./InputComponent";
import ThemeToggle from "./ThemeToggleComponent";
import { useRouter } from "next/navigation";
import { Button } from "./ButtonComponent";
import { CreateUserSchema } from "@repo/common/types";
import FieldInfo from "./ErrorMessage";
import { AuthStore } from "@/store/AuthStore";
import { ArrowRight, Sparkles } from "lucide-react";

export function FormSignup() {
  const route = useRouter();
  const { signup } = AuthStore();

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },

    validators: {
      onChange: CreateUserSchema,
    },

    onSubmit: async ({ value }) => {
      signup(value.name, value.email, value.password, route);
    },
  });

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-neutral-200 px-4 py-4 text-slate-900 dark:bg-slate-950 dark:text-neutral-200 sm:px-6">

      {/* Theme Toggle */}
      <div className="absolute top-5 right-5 z-20">
        <ThemeToggle />
      </div>

      {/* Signup Card */}
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-900/5 sm:p-8 dark:border-white/10 dark:bg-slate-900 dark:shadow-black/20">
        {/* Logo */}
        <button
          type="button"
          onClick={() => route.push("/")}
          className="mx-auto block text-2xl font-bold tracking-tight"
        >
          Canvas
          <span className="bg-linear-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
            Craft
          </span>
        </button>

        {/* Badge */}
        <div className="mt-3 flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
            <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
            Start collaborating
          </div>
        </div>

        {/* Heading */}
        <div className="mt-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Create your account
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
            Create your account and start sketching together.
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="mt-2 space-y-5"
        >
          {/* Name */}
          <form.Field
            name="name"
            children={(field) => (
              <div>
                <Input
                  title="Name"
                  type="text"
                  placeholder="Your name"
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

          {/* Email */}
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

          {/* Password */}
          <form.Field
            name="password"
            children={(field) => (
              <div>
                <Input
                  title="Password"
                  type="password"
                  placeholder="Create a password"
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

          {/* Submit */}
          <Button
            type="submit"
            variant="secondary"
            size="lg"
            className="w-full justify-center gap-2"
          >
            Create account
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        {/* Sign in */}
        <div className="mt-4 border-t border-slate-200 pt-6 text-center dark:border-white/10">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => route.push("/signin")}
              className="font-semibold text-emerald-500 transition-colors hover:text-teal-500"
            >
              Sign in
            </button>
          </p>
        </div>

        {/* Footer */}
        <p className="mt-3 text-center text-xs text-slate-400 dark:text-slate-600">
          Sketch ideas together, on one canvas.
        </p>
      </div>
    </main>
  );
}