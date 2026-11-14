"use client";

import type { ReactNode } from "react";
import { trackEvent } from "@/lib/analytics";

export function TrackedSourceLink({ href, sourceType, className, children }: {
  href: string;
  sourceType: "notice_original" | "telegram_channel";
  className: string;
  children: ReactNode;
}) {
  return (
    <a className={className} href={href} target="_blank" rel="noopener noreferrer"
      onClick={() => trackEvent("source_link_click", { target_url: href, source_type: sourceType })}
      onAuxClick={(event) => {
        if (event.button === 1) trackEvent("source_link_click", { target_url: href, source_type: sourceType });
      }}>
      {children}
    </a>
  );
}
