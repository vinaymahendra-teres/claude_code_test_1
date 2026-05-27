"use client";

import { useEffect } from "react";
import { useConnection } from "@/lib/connection";

// Toggles `body[data-low-data]` based on the live connection state.
// Lets CSS in globals.css opt visual flourishes (the CakeArt SVG pattern,
// decorative gradients) into a flatter, lower-paint fallback when the
// link is 2G / slow-2G / OS Save-Data enabled.
//
// Body class instead of a React context so server-rendered components
// (CakeArt is used in Server Components like /orders/page) still benefit
// without becoming client-only.
export function LowDataBodyClass() {
  const { isLow } = useConnection();
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (isLow) document.body.setAttribute("data-low-data", "true");
    else document.body.removeAttribute("data-low-data");
  }, [isLow]);
  return null;
}
