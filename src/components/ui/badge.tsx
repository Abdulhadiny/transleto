type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default:
    "bg-stone-100 text-stone-600 ring-1 ring-stone-200/60",
  success:
    "bg-teal-50 text-teal-700 ring-1 ring-teal-200/60",
  warning:
    "bg-amber-50 text-amber-700 ring-1 ring-amber-200/60",
  danger:
    "bg-rose-50 text-rose-700 ring-1 ring-rose-200/60",
  info:
    "bg-sky-50 text-sky-700 ring-1 ring-sky-200/60",
};

export function Badge({
  children,
  variant = "default",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-inset ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
