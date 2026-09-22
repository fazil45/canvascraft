import { cn } from "@/lib/utils";
import { Download, LogOut, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { RoomStore } from "@/store/RoomStore";

interface SideBarProps {
  className: string;
  onClick: () => void;
}

export function SideBar({ className, onClick }: SideBarProps) {
  const route = useRouter();
  const participants = RoomStore((s) => s.participants);

  return (
    <aside
      className={cn(
        "absolute top-12 right-4 z-50 w-64 overflow-hidden",
        "rounded-md border border-slate-200/80",
        "bg-white/90 shadow-xl shadow-slate-900/10 backdrop-blur-xl",
        "dark:border-white/10 dark:bg-slate-950/90 dark:shadow-black/30",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-white/10">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
            <Users className="h-4 w-4" />
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              Participants
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClick}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-white/10 dark:hover:text-white"
          title="Download canvas"
        >
          <Download className="h-4 w-4" />
        </button>
      </div>

      {/* Participants */}
      <div className="max-h-64 overflow-y-auto p-3">
        {Object.values(participants).length === 0 ? (
          <p className="py-5 text-center text-xs text-slate-400">
            No participants
          </p>
        ) : (
          <ul className="space-y-1">
            {Object.values(participants).map((p) => (
              <li
                key={p.userId}
                className="flex items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-slate-100 dark:hover:bg-white/5"
              >
                <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-emerald-500 to-teal-500 text-xs font-semibold text-white">
                  {(p.username ?? "A").charAt(0).toUpperCase()}

                  <span className="absolute right-0 bottom-0 h-2 w-2 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-950" />
                </div>

                <span className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                  {p.username ?? "Anonymous"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Exit */}
      <div className="border-t border-slate-200 p-3 dark:border-white/10">
        <button
          type="button"
          onClick={() => route.push("/dashboard")}
          className="flex w-full items-center justify-between rounded-md cursor-pointer border border-red-500/20 bg-red-500/5 px-3 py-2.5 text-sm font-medium text-red-500 transition-all hover:border-red-500/30 hover:bg-red-500/10 dark:bg-red-500/10"
        >
          <span>Exit room</span>
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}