"use client";

import { ArrowLeft, Check, Mail, Pencil, UserRound, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import axios from "axios";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export default function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: user, isLoading, isError } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  if (isLoading) {
    return <ProfileShell>Loading profile...</ProfileShell>;
  }

  if (isError || !user) {
    return (
      <ProfileShell>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          We could not load your profile.
        </p>
        <button
          onClick={() => router.push("/signin")}
          className="mt-5 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-slate-900"
        >
          Sign in
        </button>
      </ProfileShell>
    );
  }

  const startEditing = () => {
    setName(user.name);
    setIsEditing(true);
  };

  const saveProfile = async () => {
    setIsSaving(true);
    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_HTTP_BACKEND_URL}/me`,
        { name },
        { withCredentials: true },
      );
      await queryClient.invalidateQueries({ queryKey: ["current-user"] });
      setIsEditing(false);
      toast.success("Profile updated");
    } catch (error) {
      toast.error(
        axios.isAxiosError(error)
          ? (error.response?.data?.error ?? "Could not update profile")
          : "Could not update profile",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ProfileShell>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-100 text-3xl font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
          {user.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.photo}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            user.name.charAt(0).toUpperCase()
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
            CanvasCraft member
          </p>
          {isEditing ? (
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 w-full max-w-sm rounded-md border border-slate-300 bg-transparent px-3 py-2 text-xl font-semibold outline-none focus:border-emerald-500 dark:border-white/20"
              maxLength={20}
              autoFocus
            />
          ) : (
            <h2 className="mt-1 text-2xl font-semibold">{user.name}</h2>
          )}
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Your account details
          </p>
        </div>
        {isEditing ? (
          <div className="flex gap-2 self-start">
            <button
              onClick={saveProfile}
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => setIsEditing(false)}
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium dark:border-white/20"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={startEditing}
            className="inline-flex items-center gap-2 self-start rounded-md border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-white/20 dark:hover:bg-white/10"
          >
            <Pencil className="h-4 w-4" />
            Edit profile
          </button>
        )}
      </div>

      <dl className="mt-8 divide-y divide-slate-200 border-y border-slate-200 dark:divide-white/10 dark:border-white/10">
        <div className="flex items-center gap-4 py-5">
          <UserRound className="h-5 w-5 text-slate-400" />
          <div>
            <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">
              Name
            </dt>
            <dd className="mt-1 text-sm font-medium">{user.name}</dd>
          </div>
        </div>
        <div className="flex items-center gap-4 py-5">
          <Mail className="h-5 w-5 text-slate-400" />
          <div>
            <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">
              Email
            </dt>
            <dd className="mt-1 text-sm font-medium">{user.email}</dd>
          </div>
        </div>
      </dl>
    </ProfileShell>
  );
}

function ProfileShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gray-50 text-slate-900 dark:bg-[#0a0a0f] dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-xl dark:border-white/5 dark:bg-[#0a0a0f]/80">
        <div className="flex max-w-3xl items-center gap-3 px-6 py-4">
          <button
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5"
            title="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-semibold">Profile</h1>
        </div>
      </header>
      <section className="flex flex-1 px-6 py-10 sm:px-10 lg:px-16">
        <div className="w-full rounded-md border-y border-slate-200 bg-white p-6 sm:p-10 dark:border-white/10 dark:bg-white/5">
          {children}
        </div>
      </section>
    </main>
  );
}
