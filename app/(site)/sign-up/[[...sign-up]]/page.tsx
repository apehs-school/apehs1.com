import { AuthOverlay } from "@/components/auth-overlay";
import { HomePageContent } from "@/components/home-page";
import { SetupNotice } from "@/components/setup-notice";
import { clerkEnabled } from "@/lib/env";

export const dynamic = "force-dynamic";

export default function SignUpPage() {
  if (!clerkEnabled()) {
    return (
      <main>
        <SetupNotice />
      </main>
    );
  }

  return (
    <>
      <HomePageContent />
      <AuthOverlay mode="sign-up" />
    </>
  );
}
