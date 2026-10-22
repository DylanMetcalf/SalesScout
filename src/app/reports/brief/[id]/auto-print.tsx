"use client";

import { useEffect, useRef } from "react";

/** Opens the print dialog once when the brief is opened with ?print=1. */
export function AutoPrint() {
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    const t = setTimeout(() => window.print(), 400);
    return () => clearTimeout(t);
  }, []);
  return null;
}
