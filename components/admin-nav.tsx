"use client";

import { officeAlertCount } from "@/actions/contact";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  { href: "/admin/news", label: "News", detail: "Homepage stories and the word for today" },
  { href: "/admin/calendar", label: "Calendar", detail: "School calendar events" },
  { href: "/admin/lunch", label: "Lunch menu", detail: "Meals by date" },
  { href: "/admin/academics", label: "Academics", detail: "Programme, awards, admissions, and scholarships" },
  { href: "/admin/activities", label: "Activities", detail: "Clubs, schedule, venue, staff, cost, and attire" },
  { href: "/admin/about", label: "About", detail: "Principal, staff, history, mission, vision, values, goals, motto, and song" },
  { href: "/admin/contact", label: "Contact", detail: "Address, phone, email, and hours" },
  { href: "/admin/users", label: "User management", detail: "Accounts, admin privileges, and history" },
  { href: "/admin/files", label: "Files", detail: "Images, documents, and other stored files" },
];

export function AdminNav({ contactAlerts = 0 }: { contactAlerts?: number }) {
  const pathname = usePathname();
  const [alerts, setAlerts] = useState(contactAlerts);

  useEffect(() => {
    setAlerts(contactAlerts);
  }, [contactAlerts]);

  useEffect(() => {
    let stopped = false;
    let pending = false;
    async function pull() {
      if (pending || document.hidden) return;
      pending = true;
      try {
        const count = await officeAlertCount();
        if (!stopped) setAlerts(count);
      } catch {
        // A refresh can drop this request while the page is still open.
      } finally {
        pending = false;
      }
    }
    const timer = window.setInterval(() => void pull(), 5000);
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <aside className="admin-side">
      <strong>Admin Dashboard</strong>
      <nav>
        {links.map((link) => {
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link key={link.href} href={link.href} aria-current={active ? "page" : undefined}>
              <span>
                {link.label}
                {link.href === "/admin/contact" && alerts > 0 ? (
                  <em className="admin-alert" aria-label={`${alerts} new ${alerts === 1 ? "message" : "messages"}`}>{alerts}</em>
                ) : null}
              </span>
              <small>{link.href === "/admin/contact" && alerts > 0 ? `${alerts} new ${alerts === 1 ? "message" : "messages"}` : link.detail}</small>
            </Link>
          );
        })}
      </nav>
      <Link href="/">View site</Link>
    </aside>
  );
}
