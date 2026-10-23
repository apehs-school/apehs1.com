"use client";

import { Bell } from "lucide-react";
import { useState } from "react";

export type MessageAlert = {
  id: string;
  subject: string;
  preview: string;
  unread: boolean;
  href: string;
};

export function MessageBell({ alerts, emptyHref }: { alerts: MessageAlert[]; emptyHref: string }) {
  const [open, setOpen] = useState(false);
  const unread = alerts.filter((alert) => alert.unread).length;

  return (
    <div className="message-bell">
      <button
        type="button"
        className={open ? "is-open" : undefined}
        aria-label={unread > 0 ? `${unread} new messages` : "Messages"}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <Bell size={18} aria-hidden="true" />
        <span>Messages</span>
        {unread > 0 ? <em>{unread}</em> : null}
      </button>
      {open ? (
        <div className="message-bell-list">
          {alerts.length === 0 ? (
            <p>
              No new messages.
              <a href={emptyHref}>Open messages</a>
            </p>
          ) : (
            alerts.map((alert) => (
              <a key={`${alert.href}-${alert.id}`} href={alert.href} className={alert.unread ? "is-unread" : ""}>
                <span>{alert.subject}</span>
                <small>{alert.preview}</small>
              </a>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
