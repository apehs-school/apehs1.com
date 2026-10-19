"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  ["/admin/activities", "Page"],
  ["/admin/activities/clubs", "Clubs"],
];

export default function ActivitiesSectionLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-[#d9e0ea]">
        {tabs.map(([href, label]) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`border-b-2 px-3 py-2 text-sm font-medium ${
                active ? "border-[#0d47a1] text-[#0d47a1]" : "border-transparent text-[#24344d]"
              }`}
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
