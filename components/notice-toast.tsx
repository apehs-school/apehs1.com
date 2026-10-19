"use client";

import { useEffect, useRef } from "react";
import { Toaster, toast } from "sonner";

export function NoticeToast({ notice }: { notice: string | null }) {
  const shown = useRef<string | null>(null);

  useEffect(() => {
    if (!notice || shown.current === notice) return;
    shown.current = notice;
    const message = notice.includes("|") ? notice.slice(notice.indexOf("|") + 1) : notice;
    toast.success(message);
    document.cookie = "apehs-notice=; Max-Age=0; path=/";
  }, [notice]);

  return <Toaster position="top-center" richColors closeButton />;
}
