"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin/news", label: "News", detail: "Homepage stories and the word for today" },
  { href: "/admin/calendar", label: "Calendar", detail: "School calendar events" },
  { href: "/admin/lunch", label: "Lunch menu", detail: "Meals by date" },
  { href: "/admin/academics", label: "Academics", detail: "Programme, awards, admissions, and scholarships" },
  { href: "/admin/activities", label: "Activities", detail: "Clubs, schedule, venue, staff, cost, and attire" },
  { href: "/admin/about", label: "About", detail: "Principal, staff, history, mission, vision, values, goals, motto, and song" },
  { href: "/admin/contact", label: "Contact", detail: "Address, phone, email, and hours" },
  { href: "/admin/files", label: "Files", detail: "Images, documents, and other stored files" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <aside className="admin-side">
      <strong>Admin Dashboard</strong>
      <nav>
        {links.map((link) => {
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link key={link.href} href={link.href} aria-current={active ? "page" : undefined}>
              <span>{link.label}</span>
              <small>{link.detail}</small>
            </Link>
          );
        })}
      </nav>
      <Link href="/">View site</Link>
    </aside>
  );
}
