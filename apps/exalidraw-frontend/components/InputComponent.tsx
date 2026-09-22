import { cn } from "@/lib/utils";
import { ReactNode, Ref } from "react";

interface Input {
  title?: string;
  disabled?:boolean
  type: string;
  placeholder: string;
  value?: string;
  onChange?: (val: string) => void;
  error?: string;
  onBlur?:()=>void;
  className?:string
}

export default function Input({
  title,
  type,
  placeholder,
  onChange,
  onBlur,
  value,
  className,
  disabled
}: Input) {
  return (
    <div className="xl:m-2   xs:m-3 md:m-3">
      <label className="dark:text-neutral-300 text-neutral-800">{title}</label>
      <input
        onChange={(e)=>onChange!(e.target.value)}
        type={type}
        disabled={disabled}
        onBlur={onBlur}
        placeholder={placeholder}
        value={value}
        className={cn("xs:p-1 rounded-lg border dark:border-white border-neutral-700 w-full xl:p-2 hover:border-cyan-400/60 xs:placeholder:text-xs dark:placeholder:text-neutral-400 placeholder:text-neutral-600 text-neutral-900 outline-none dark:text-neutral-300",className)}
      />  
    </div>
  );
}
