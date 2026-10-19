"use client";

import { Bell } from "lucide-react";
import { useState } from "react";

export type MessageAlert = {
  id: string;
  subject: string;
  preview: string;
  unread: boolean;
};

export function MessageBell({ alerts }: { alerts: MessageAlert[] }) {
  const [open, setOpen] = useState(false);
  if (alerts.length === 0) return null;
  const unread = alerts.filter((alert) => alert.unread).length;

  return (
    <div className="relative">
      <button
        type="button"
        className="relative inline-flex items-center px-3 py-3 text-[#0b1f3a]"
        aria-label={unread > 0 ? `${unread} new messages` : "Messages"}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <Bell className="size-5" />
        {unread > 0 ? (
          <span className="absolute top-2 right-1 flex size-4 items-center justify-center rounded-full bg-[#c62828] text-[10px] font-semibold text-white">
            {unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute top-full right-0 z-40 w-80 rounded-xl border bg-white p-2 text-left shadow-xl">
          {alerts.map((alert) => (
            <a
              key={alert.id}
              href={`/contact?chat=${alert.id}`}
              className={`block rounded-lg px-3 py-2 hover:bg-[#f4f6f8] ${alert.unread ? "font-semibold" : ""}`}
            >
              <span className="block text-sm text-[#0b1f3a]">{alert.subject}</span>
              <span className="mt-1 block text-sm font-normal text-[#52627a]">{alert.preview}</span>
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}
