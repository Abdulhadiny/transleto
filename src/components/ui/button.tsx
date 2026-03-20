import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-amber-600 text-white hover:bg-amber-700 active:bg-amber-800 shadow-sm shadow-amber-600/20",
  secondary:
    "bg-stone-100 text-stone-700 hover:bg-stone-200 active:bg-stone-300 border border-stone-200",
  danger:
    "bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-sm shadow-rose-600/20",
  ghost:
    "bg-transparent text-stone-600 hover:bg-stone-100 active:bg-stone-200",
};

const sizeStyles: Record<Size, string> = {
  sm: "px-2.5 py-1 text-xs gap-1 sm:px-3 sm:py-1.5 sm:gap-1.5",
  md: "px-3 py-1.5 text-xs gap-1.5 sm:px-4 sm:py-2 sm:text-sm sm:gap-2",
  lg: "px-4 py-2 text-sm gap-2 sm:px-6 sm:py-2.5",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className = "", variant = "primary", size = "md", disabled, ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        disabled={disabled}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
