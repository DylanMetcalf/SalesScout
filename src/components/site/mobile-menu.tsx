"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Menu as MenuIcon, X } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

/** Phone navigation: a sheet that closes on navigation, Escape or a tap outside. */
export function MobileMenu({ nav, cta, signedIn }: { nav: { href: string; label: string }[]; cta: string; signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);
  const close = () => setOpen(false);
  return (
    <div ref={ref} className="md:hidden">
      <button type="button" aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? "Close menu" : "Menu"} onClick={() => setOpen((o) => !o)} className="flex size-10 items-center justify-center rounded-full border border-border bg-surface text-text">
        {open ? <X className="size-5" aria-hidden /> : <MenuIcon className="size-5" aria-hidden />}
      </button>
      {open && (
        <nav id="mobile-menu" aria-label="Website menu" className="fixed inset-x-3 top-[72px] z-50 flex flex-col rounded-2xl border border-border bg-surface p-3 shadow-lg animate-rise">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} onClick={close} className="rounded-lg px-3 py-3 text-base font-medium hover:bg-surface-2">{n.label}</Link>
          ))}
          {signedIn && <Link href="/home" onClick={close} className="rounded-lg px-3 py-3 text-base font-medium hover:bg-surface-2">Open workspace</Link>}
          <ButtonLink href="/start" onClick={close} variant="primary" size="lg" className="mt-2 rounded-full" trailing={<ArrowRight className="size-4" />}>{cta}</ButtonLink>
        </nav>
      )}
    </div>
  );
}
