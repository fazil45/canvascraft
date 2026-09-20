"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Users,
  Trash2,
  PenTool,
  KeyRound,
  ArrowRightCircle,
  Sun,
  Moon,
  Layers,
  ArrowLeft,
  Search,
} from "lucide-react";
import NavBar from "@/components/NavBar";
import { useRouter } from "next/navigation";
import Input from "@/components/InputComponent";
import FieldInfo from "@/components/ErrorMessage";
import { Button } from "@/components/ButtonComponent";
import { useForm } from "@tanstack/react-form";
import { RoomStore } from "@/store/RoomStore";
import z, { strictObject } from "zod";
import { getRoomId } from "@/lib/roomid";

const RoomSchema = z.object({
  createSlug: z
    .string()
    .min(3, "Code should atleast have 3 characters")
    .max(20, "Code should not exceed have 8 characters")
    .regex(/[A-Z]/, "Should use One Uppercase")
    .regex(/[0-9]/, "Should use One number"),
});

export default function Dashboard() {
  const route = useRouter();

  const formatDate = (dateStr: Date) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const {
    fetchRoom,
    roomsCreated,
    deleteRoom,
    isLoading,
    createRoom,
    roomCreationLoading,
  } = RoomStore();

  useEffect(() => {
    fetchRoom();
    console.log(roomsCreated);
  }, []);

  const createForm = useForm({
    defaultValues: {
      createSlug: "",
    },
    validators: { onChange: RoomSchema },
    onSubmit: async ({ value }) => {
      createRoom(value.createSlug);
      fetchRoom();
      createForm.reset();
    },
  });

  const joinForm = useForm({
    defaultValues: {
      joinSlug: "",
    },
    onSubmit: async ({ value }) => {
      await enterRoom(value.joinSlug);
      joinForm.reset();
    },
  });

  const enterRoom = async (slug: string) => {
    const roomId = await getRoomId(slug);

    route.push(`/canvas/${roomId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900 transition-colors dark:bg-[#0a0a0f] dark:text-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur-xl dark:border-white/5 dark:bg-[#0a0a0f]/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => route.back()}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5"
              title="Back to landing"
            >
              <ArrowLeft className="h-4.5 w-4.5" />
            </button>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl font-bold tracking-tight">
                Dashboard
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2"></div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid gap-5 sm:grid-cols-2">
          {/* Create card */}
          <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:border-slate-300 hover:shadow-lg dark:border-white/5 dark:bg-white/5 dark:hover:border-white/10">
            <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-emerald-500/5 blur-2xl transition-opacity group-hover:opacity-100" />
            <div className="relative">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/10">
                <Plus className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-lg font-semibold">Create a new room</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Start with a blank canvas and invite others with a room code.
              </p>
              <div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    createForm.handleSubmit();
                  }}
                >
                  <createForm.Field name="createSlug">
                    {(field) => (
                      <div className="flex items-center justify-center">
                        <div className="flex flex-col">
                          <Input
                            placeholder="Create Room Code like Room1"
                            type="text"
                            onChange={field.handleChange}
                            onBlur={field.handleBlur}
                            value={field.state.value}
                          />
                          <FieldInfo
                            errors={field.state.meta.errors}
                            isTouched={field.state.meta.isTouched}
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={roomCreationLoading}
                          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                        >
                          <Plus className="h-4.5 w-4.5" />
                          {roomCreationLoading ? "Creating..." : "Create room"}
                        </button>
                      </div>
                    )}
                  </createForm.Field>
                </form>
              </div>
            </div>
          </div>

          {/* Join card */}
          <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:border-slate-300 hover:shadow-lg dark:border-white/5 dark:bg-white/5 dark:hover:border-white/10">
            <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-sky-500/5 blur-2xl" />
            <div className="relative">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 dark:bg-sky-500/10">
                <KeyRound className="h-6 w-6 text-sky-600 dark:text-sky-400" />
              </div>
              <h2 className="text-lg font-semibold">Join with a code</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Have a code from someone? Enter it to join their room.
              </p>
              <div className="mt-5 flex items-center gap-2">
                <div className="relative">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      joinForm.handleSubmit();
                    }}
                  >
                    <joinForm.Field name="joinSlug">
                      {(field) => (
                        <div className="flex items-center justify-center">
                          <div className="flex flex-col">
                            <Input
                              placeholder="Paste Room code"
                              type="text"
                              onChange={field.handleChange}
                              onBlur={field.handleBlur}
                              value={field.state.value}
                            />
                            <FieldInfo
                              errors={field.state.meta.errors}
                              isTouched={field.state.meta.isTouched}
                            />
                          </div>

                          <div className="xs:gap-2 flex items-center justify-center xl:gap-3">
                            <button
                              type="submit"
                              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                            >
                              <ArrowRightCircle className="h-4 w-4" />
                              Join
                            </button>
                          </div>
                        </div>
                      )}
                    </joinForm.Field>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Board list */}
        <div className="mt-10">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
              <Layers className="h-4 w-4" />
              Your rooms
            </h2>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-xl border border-slate-200 bg-white dark:border-white/5 dark:bg-white/5"
                />
              ))}
            </div>
          ) : roomsCreated.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 dark:border-white/10 dark:bg-white/5">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-white/5">
                <PenTool className="h-6 w-6 text-slate-400 dark:text-slate-500" />
              </div>
              <p className="text-base font-medium text-slate-700 dark:text-slate-200">
                No Rooms yet
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Create your first room to start drawing
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-white/5 dark:bg-white/5">
              <div className="hidden grid-cols-12 gap-4 border-b border-slate-100 px-5 py-2.5 text-xs font-medium tracking-wide text-slate-400 uppercase sm:grid dark:border-white/5 dark:text-slate-500">
                <div className="col-span-4">Code</div>
                <div className="col-span-3">Updated</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-white/5">
                {roomsCreated.map((room) => (
                  <div
                    key={room.id}
                    onClick={() => enterRoom(String(room.slug))}
                    className="group grid cursor-pointer grid-cols-12 items-center gap-4 px-5 py-3.5 transition-colors hover:bg-slate-50 dark:hover:bg-white/5"
                  >
                    <div className="col-span-4 hidden sm:block">
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold tracking-widest text-slate-600 dark:bg-white/10 dark:text-slate-300">
                        {room.slug}
                      </span>
                    </div>
                    <div className="col-span-3 hidden text-sm text-slate-500 sm:block dark:text-slate-400">
                      {formatDate(room.createdAt)}
                    </div>
                    <div className="col-span-2 flex items-center justify-end gap-8">
                      <button
                        onClick={() => {
                          deleteRoom(room.id);
                          fetchRoom();
                        }}
                        className="cursor-pointer rounded-md p-1.5 text-slate-400 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          enterRoom(room.slug)
                        }}
                        className="cursor-pointer rounded-md p-1.5 text-slate-400 transition-all group-hover:opacity-100 hover:bg-blue-50 hover:text-blue-500 dark:hover:bg-blue-500/10 dark:hover:text-blue-400"
                      >
                        Join  
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
