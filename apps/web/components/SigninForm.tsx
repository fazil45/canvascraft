"use client";

import { useForm } from "@tanstack/react-form";
import Input from "./InputComponent";
import ThemeToggle from "./ThemeToggleComponent";
import { useRouter } from "next/navigation";
import { Button } from "./ButtonComponent";
import { SigninSchema } from "@repo/common/types";
import FieldInfo from "./ErrorMessage";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { AuthStore } from "@/store/AuthStore";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useEffect, useState } from "react";

export function FormSignin() {
  const route = useRouter();
  const queryClient = useQueryClient();
  const { signin, signinLoading, resendVerification } = AuthStore();
  const [email, setEmail] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verified = params.get("verified");
    const error = params.get("error");

    if (verified === "success")
      toast.success("Email verified. You can sign in now.");
    if (verified === "invalid")
      toast.error("That verification link is invalid or expired.");
    if (error === "google_auth")
      toast.error("Google sign-in could not be completed.");
  }, []);

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },

    validators: {
      onChange: SigninSchema,
    },

    onSubmit: async ({ value }) => {
      setEmail(value.email);
      const result = await signin(value.email, value.password);
      setNeedsVerification(result.error === "Please verify your email first");
      if (result.success) {
        await queryClient.invalidateQueries({
          queryKey: ["current-user"],
        });
        route.push("/dashboard");
      } else if (result.error !== "Please verify your email first") {
        toast.error("Invalid inputs, please try again");
      }
    },
  });

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-white px-4 py-10 text-slate-900 sm:px-6 dark:bg-slate-950 dark:text-white">
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
        <div className="mt-2 flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
            <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
            Welcome back
          </div>
        </div>

        {/* Heading */}
        <div className="mt-3 text-center">
          <h1 className="text-xl font-bold tracking-tight sm:text-3xl">
            Sign in to your account
          </h1>

          <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
            Continue creating and collaborating on your canvas.
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className=""
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
                  onChange={(value) => {
                    setEmail(value);
                    field.handleChange(value);
                  }}
                  onBlur={field.handleBlur}
                />

                <FieldInfo
                  errors={field.state.meta.errors}
                  isTouched={field.state.meta.isTouched}
                />
              </div>
            )}
          />

          {needsVerification && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
              <p>Please verify your email before signing in.</p>
              <button
                type="button"
                onClick={() => resendVerification(email)}
                className="mt-2 font-semibold underline underline-offset-2"
              >
                Resend verification email
              </button>
            </div>
          )}

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
            className="w-full justify-center gap-2 mt-2"
          >
            {signinLoading ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              <div className="flex items-center justify-center gap-2">
                {" "}
                Sign in
                <ArrowRight className="h-4 w-4" />
              </div>
            )}
          </Button>
        </form>

        <div className="my-3 flex items-center gap-3 text-xs text-slate-400">
          <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
          OR
          <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
        </div>

        <button
          type="button"
          onClick={() => {
            window.location.href = `${process.env.NEXT_PUBLIC_HTTP_BACKEND_URL}/auth/google`;
          }}
          className="mt-3 flex w-full items-center justify-center gap-3 rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold transition-colors hover:bg-slate-50 dark:border-white/15 dark:hover:bg-white/5 cursor-pointer"
        >
          <span className="text-base font-bold">G</span>
          Continue with Google
        </button>

        {/* Footer */}
        <div className="mt-2 pt-1 text-center dark:border-white/10">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Don't have an account?{" "}
            <button
              onClick={() => route.push("/signup")}
              className="cursor-pointer font-semibold text-emerald-500 transition-colors hover:text-teal-500"
            >
              Create one
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}
