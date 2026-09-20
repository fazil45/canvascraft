"use client";
import { ArrowRight, LogOut, Moon, PenTool, Sun, UserIcon } from "lucide-react";
import { Button } from "./ButtonComponent";
import { useRouter } from "next/navigation";
import ThemeToggle from "./ThemeToggleComponent";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export default function NavBar() {
  const logoutRef = useRef<HTMLButtonElement>(null);
  const route = useRouter();
  const isLoggedIn = useAuth();
  const handleLogout = async () => {
    localStorage.removeItem("token");
    route.push("/");
  };

  const showLogout = () => {
    if (!logoutRef.current) {
      return;
    }
    logoutRef.current.classList.toggle("hidden");
    logoutRef.current.classList.toggle("flex");
  };

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 opacity-100 backdrop-blur-xl dark:border-white/5 dark:bg-[#0a0a0f]/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        <div className="flex items-center gap-2.5">
          <Link href={"/"}>
            <span className="text-2xl font-bold tracking-tight">
              CanvasCraft
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5"
            title="Toggle theme"
          >
            <ThemeToggle />
          </div>
          <div>
            {isLoggedIn ? (
              <div className="flex items-center justify-center gap-4">
                <div
                  className="flex cursor-pointer items-center justify-center"
                  onClick={showLogout}
                >
                  <UserIcon />
                </div>
                <button
                  onClick={() => route.push("/dashboard")}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                >
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  ref={logoutRef}
                  onClick={handleLogout}
                  className="absolute top-24 right-9 hidden cursor-pointer items-center justify-center gap-2 rounded-lg border p-2"
                >
                  Logout <LogOut />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center xl:gap-2">
                <div>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => route.push("/signin")}
                  >
                    Signin
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
