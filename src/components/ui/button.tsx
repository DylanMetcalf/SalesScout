import Link from "next/link";
import { forwardRef, type ComponentProps, type ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "./cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "subtle";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-[background,border-color,color,box-shadow,transform] duration-150 select-none disabled:opacity-55 active:translate-y-px focus-visible:shadow-[var(--ring)] outline-none";
const variants: Record<Variant, string> = {
  primary: "bg-accent text-accent-fg hover:bg-accent-hover shadow-sm",
  secondary: "bg-surface text-text border border-border hover:border-accent/40 hover:text-accent-text shadow-sm",
  ghost: "text-muted hover:text-accent-text hover:bg-accent-soft/60",
  subtle: "bg-accent-soft text-accent-text hover:bg-[color-mix(in_srgb,var(--accent-soft)_80%,var(--accent)_12%)]",
  danger: "bg-surface text-weak border border-border hover:bg-weak-soft hover:border-weak/30",
};
const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm rounded-md",
  md: "h-9 px-3.5 text-[14px] rounded-md",
  lg: "h-11 px-5 text-base rounded-lg",
};

export function buttonClass(variant: Variant = "secondary", size: Size = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

type ButtonProps = ComponentProps<"button"> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "md", loading, icon, className, children, disabled, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={buttonClass(variant, size, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
});

type LinkProps = ComponentProps<typeof Link> & { variant?: Variant; size?: Size; icon?: ReactNode };

export function ButtonLink({ variant = "secondary", size = "md", icon, className, children, ...props }: LinkProps) {
  return (
    <Link className={buttonClass(variant, size, className)} {...props}>
      {icon}
      {children}
    </Link>
  );
}

type IconButtonProps = ComponentProps<"button"> & { label: string; size?: "sm" | "md" };

/** Icon-only button. `label` is required so it is announced to screen readers. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, size = "md", className, children, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex items-center justify-center rounded-md text-muted hover:text-accent-text hover:bg-accent-soft/60 transition-colors outline-none focus-visible:shadow-[var(--ring)]",
        size === "sm" ? "size-7" : "size-9",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});
