"use client";

import { AuthLinks } from "@/components/auth-links";
import { MessageBell, type MessageAlert } from "@/components/message-bell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const aboutLinks = [
  ["/principal", "Principal's message"],
  ["/staff", "Academic staff"],
  ["/history", "History and milestones"],
  ["/mission", "Mission"],
  ["/vision", "Vision"],
  ["/core", "Core values"],
  ["/goals", "Goals"],
  ["/motto", "Motto"],
  ["/song", "School song"],
];

const academicLinks = [
  ["/awards", "Awards and achievements"],
  ["/admissions", "Admission"],
  ["/scholarship", "Scholarship awarded"],
];

const linkClass =
  "border-b-2 border-transparent px-3 py-3 text-[13px] font-medium tracking-wide text-[#0b1f3a] uppercase hover:border-[#c9a227] hover:text-[#0d47a1]";
const itemClass = "text-sm text-foreground";

export function SiteNav({ alerts = [] }: { alerts?: MessageAlert[] }) {
  return (
    <nav className="border-t border-[#e6ebf2] bg-[#f4f6f8]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-2">
        <div className="flex flex-wrap items-center">
          <a className={linkClass} href="/">
            Home
          </a>
          <Menu label="About us" href="/about" links={aboutLinks} />
          <Menu label="Academics" href="/academics" links={academicLinks} />
          <a className={linkClass} href="/calendar">
            Calendar
          </a>
          <a className={linkClass} href="/extra">
            Activities
          </a>
          <a className={linkClass} href="/menu">
            Lunch menu
          </a>
          {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? (
            <AuthLinks />
          ) : (
            <a className={linkClass} href="/sign-in">
              Sign in
            </a>
          )}
          <a className={linkClass} href="/contact">
            Contact
          </a>
          <MessageBell alerts={alerts} />
          {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? <AuthLinks part="avatar" /> : null}
        </div>
        <a
          href="/pay"
          className={cn(buttonVariants({ size: "sm" }), "bg-[#c9a227] text-[#0b1f3a] hover:bg-[#d4b44a]")}
        >
          Make a payment
        </a>
      </div>
    </nav>
  );
}

function Menu({ label, href, links }: { label: string; href: string; links: string[][] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={linkClass}>{label}</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem className={itemClass} nativeButton={false} render={<a href={href} />}>
          {label}
        </DropdownMenuItem>
        {links.map(([path, text]) => (
          <DropdownMenuItem key={path} className={itemClass} nativeButton={false} render={<a href={path} />}>
            {text}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
