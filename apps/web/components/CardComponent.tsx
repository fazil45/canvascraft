import { ReactNode } from "react";

export function Card({
  icon,
  className,
  title,
  description,
}: {
  icon: ReactNode;
  className?: string;
  title: string;
  description: string;
}) {
  return (
    <>
      <div className="inset  xs:h-30 xs:p-2 flex-1 rounded-2xl border border-neutral-600 shadow-xl/5 shadow-neutral-200 hover:border-white/50 hover:bg-neutral-50/10 sm:h-36 md:h-40 md:min-w-92  sm:p-4 xl:h-40 xl:min-w-90 xl:p-4 dark:border-white/30">
        <div className="xs:mb-2 xs:gap-2 md:gap-4 flex items-center justify-center sm:mb-1 xl:block">
          <div className="h-fit w-fit rounded-full border p-1 text-cyan-400 xl:mb-2 xl:p-2 dark:text-white">
            {icon}
          </div>
          <div>
            <h2 className="xs:text-xs font-medium text-black sm:m-3 sm:text-sm md:text-xl xl:m-1 xl:text-2xl dark:text-white">
              {title}
            </h2>
          </div>
        </div>
        <div>
          <h3 className="xs:text-xs mx-auto text-neutral-500 sm:text-xs md:text-sm md:ml-8 xl:text-sm dark:text-cyan-400">
            {description}
          </h3>
        </div>
      </div>
    </>
  );
}
