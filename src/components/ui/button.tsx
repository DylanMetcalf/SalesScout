import Link from "next/link";
import { forwardRef, type ComponentProps, type ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "./cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "subtle";
type Size = "sm" | "md" | "lg" | "xl";
type Shape = "default" | "pill";

const base =
  "group inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-[background,border-color,color,box-shadow,transform] duration-150 select-none disabled:opacity-55 active:translate-y-px focus-visible:shadow-[var(--ring)] outline-none";
const variants: Record<Variant, string> = {
  primary: "bg-accent text-accent-fg font-semibold shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_8px_20px_-10px_var(--accent)] hover:bg-accent-hover hover:shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_12px_26px_-10px_var(--accent)] hover:-translate-y-px",
  secondary: "bg-surface text-text border border-border hover:border-accent/40 hover:text-accent-text shadow-sm",
  ghost: "text-muted hover:text-accent-text hover:bg-accent-soft/60",
  subtle: "bg-accent-soft text-accent-text hover:bg-[color-mix(in_srgb,var(--accent-soft)_80%,var(--accent)_12%)]",
  danger: "bg-surface text-weak border border-border hover:bg-weak-soft hover:border-weak/30",
};
const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-9 px-3.5 text-[14px]",
  lg: "h-11 px-5 text-base",
  xl: "h-12 px-6 text-[16px]",
};
const radius: Record<Size, string> = { sm: "rounded-md", md: "rounded-md", lg: "rounded-lg", xl: "rounded-lg" };

/** `cn` doesn't merge Tailwind classes, so shape and size are options rather than className overrides. */
export function buttonClass(variant: Variant = "secondary", size: Size = "md", className?: string, shape: Shape = "default") {
  return cn(base, variants[variant], sizes[size], shape === "pill" ? "rounded-full" : radius[size], className);
}

type ButtonProps = ComponentProps<"button"> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  /** Shown after the label and nudged forward on hover: use for "go somewhere" actions. */
  trailing?: ReactNode;
  /** "pill" for the public site's calls to action. */
  shape?: Shape;
};

const Trailing = ({ children }: { children: ReactNode }) => (
  <span aria-hidden className="inline-flex transition-transform duration-150 group-hover:translate-x-0.5">{children}</span>
);

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "md", loading, icon, trailing, shape, className, children, disabled, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={buttonClass(variant, size, className, shape)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : icon}
      {children}
      {trailing && !loading && <Trailing>{trailing}</Trailing>}
    </button>
  );
});

type LinkProps = ComponentProps<typeof Link> & { variant?: Variant; size?: Size; icon?: ReactNode; trailing?: ReactNode; shape?: Shape };

export function ButtonLink({ variant = "secondary", size = "md", icon, trailing, shape, className, children, ...props }: LinkProps) {
  return (
    <Link className={buttonClass(variant, size, className, shape)} {...props}>
      {icon}
      {children}
      {trailing && <Trailing>{trailing}</Trailing>}
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
