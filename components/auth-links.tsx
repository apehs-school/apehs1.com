"use client";

import { Show, UserButton } from "@clerk/nextjs";
import { AccountInformationPage, SecurityQuestionsPage } from "@/components/account-profile-forms";

export function AuthLinks({ part = "links", showAdmin = false }: { part?: "links" | "avatar"; showAdmin?: boolean }) {
  if (part === "avatar") {
    return (
      <Show when="signed-in">
        <span className="inline-flex items-center px-2">
          <UserButton
            appearance={{
              variables: {
                colorPrimary: "#0b1f3a",
                colorBackground: "#ffffff",
                borderRadius: "2px",
              },
              elements: {
                navbar: "apehs-account-nav",
                navbarButton: "apehs-account-tab",
                navbarButton__account: "apehs-tab-profile",
                navbarButton__security: "apehs-tab-security",
                navbarButton__accountInfo: "apehs-tab-account",
                "navbarButton__account-info": "apehs-tab-account",
                navbarButton__securityQuestions: "apehs-tab-questions",
                "navbarButton__security-questions": "apehs-tab-questions",
                profileSection: "apehs-account-section",
                profileSectionTitleText: "apehs-account-section-title",
              },
            }}
          >
          <UserButton.UserProfilePage label="Account information" url="account-info" labelIcon={<PageIcon kind="account" />}>
            <AccountInformationPage />
          </UserButton.UserProfilePage>
          <UserButton.UserProfilePage label="Security questions" url="security-questions" labelIcon={<PageIcon kind="security" />}>
            <SecurityQuestionsPage />
          </UserButton.UserProfilePage>
          <UserButton.MenuItems>
            {showAdmin ? (
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
            ) : null}
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

function PageIcon({ kind }: { kind: "account" | "security" }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      {kind === "account" ? (
        <path fill="currentColor" d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-3.3 0-8 1.7-8 5v1h16v-1c0-3.3-4.7-5-8-5z" />
      ) : (
        <path fill="currentColor" d="M7 10V8a5 5 0 0 1 10 0v2h1a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2zm2 0h6V8a3 3 0 0 0-6 0z" />
      )}
    </svg>
  );
}
