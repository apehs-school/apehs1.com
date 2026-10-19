"use client";

import { Show, UserButton } from "@clerk/nextjs";

export function AuthLinks({ part = "links" }: { part?: "links" | "avatar" }) {
  if (part === "avatar") {
    return (
      <Show when="signed-in">
        <span className="inline-flex items-center px-2">
          <UserButton>
          <UserButton.MenuItems>
            <UserButton.Link
              label="Admin Dashboard"
              href="/admin"
              labelIcon={
                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z"
                  />
                </svg>
              }
            />
            <UserButton.Action label="manageAccount" />
            <UserButton.Action label="signOut" />
          </UserButton.MenuItems>
          </UserButton>
        </span>
      </Show>
    );
  }

  return (
    <Show when="signed-out">
      <a className="border-b-2 border-transparent px-3 py-3 text-[13px] font-medium tracking-wide text-[#0b1f3a] uppercase hover:border-[#c9a227] hover:text-[#0d47a1]" href="/sign-in">Sign in</a>
      <a className="border-b-2 border-transparent px-3 py-3 text-[13px] font-medium tracking-wide text-[#0b1f3a] uppercase hover:border-[#c9a227] hover:text-[#0d47a1]" href="/sign-up">Sign up</a>
    </Show>
  );
}
