"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  ["/admin/activities", "Activities"],
  ["/admin/activities/clubs", "Clubs"],
];

export default function ActivitiesSectionLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-[#d9e0ea]">
        {tabs.map(([href, label]) => {
          const active = pathname === href;
          const header = href === "/admin/activities";
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={header
                ? "mr-2 rounded-full border-b-2 border-transparent bg-[#0d47a1] px-3 py-2 text-sm font-medium text-[#f6e3a8]"
                : `rounded-full border-b-2 px-3 py-2 text-sm font-medium ${active ? "border-[#1b6b4a] bg-[#e7f6ee] text-[#1b6b4a]" : "border-transparent bg-[#fff6e4] text-[#8a5a12]"}`}
            >
              {label}
            </Link>
          );
        })}
      </div>
      {children}
    </div>
  );
}
