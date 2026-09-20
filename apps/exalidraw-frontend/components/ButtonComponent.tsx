import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  className?: string;
  variant: "primary" | "secondary";
  onClick?: () => void;
  size: "sm" | "lg";
  type?: "submit" | "reset" | "button" | undefined;
}

export const Button = ({
  children,
  className,
  variant,
  onClick,
  size,
  type,
}: ButtonProps) => {
  const baseStyles =
    "transition-all duration-300 flex items-center justify-center cursor-pointer  xl:rounded-md rounded-sm dark:text-shadow-xs/25 text-shadow-lg";
  const varientStyle = {
    primary:
      "text-emerald-500/80  border-emerald-500/80 border-1 hover:bg-emerald-500/40 shadow-xl/20 font-medium hover:text-emerald-200 hover:border-emerald-600  hover:scale-[1.02]",
    secondary:
      "bg-emerald-500 border-emerald-500  text-white font-semibold hover:bg-emerald-500/70 shadow-lg shadow-emerald-500/30  hover:scale-[1.02] inline-flex ",
  };
  const sizeStyles = {
    sm: " py-1 px-3 text-xs xl:py-1 xl:px-4 xl:text-lg",
    lg: "py-1 px-6 text-lg xl:py-1 xl:px-12 xl:text-xl",
  };
  return (
    <button
      className={cn(
        `${sizeStyles[size]} ${baseStyles} ${varientStyle[variant]}`,
        className,
      )}
      onClick={onClick}
      type={type}
    >
      {children}
    </button>
  );
};
