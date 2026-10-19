"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

export function DevotionalTap({ verse, reference }: { verse: string; reference: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(true);
  if (!open || pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up")) return null;

  const message = `“${verse}” — ${reference}`;

  return (
    <div className="word-banner">
      <p className="word-banner-label">Word for today</p>
      <div className="word-banner-track">
        <div className="word-banner-run">
          <span>{message}</span>
          <span aria-hidden="true">{message}</span>
        </div>
      </div>
      <div className="word-banner-actions">
        <Button nativeButton={false} size="sm" variant="outline" render={<a href="/word" />}>
          Read more
        </Button>
        <Button variant="ghost" size="icon-xs" type="button" onClick={() => setOpen(false)} aria-label="Close devotional">
          ×
        </Button>
      </div>
    </div>
  );
}
