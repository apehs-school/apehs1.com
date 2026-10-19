"use client";

import { SignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AuthBrand } from "@/components/auth-brand";
import { SignUpForm } from "@/components/sign-up-form";

const appearance = {
  variables: {
    colorBackground: "#ffffff",
    colorInputBackground: "#ffffff",
    colorText: "#002147",
    colorTextSecondary: "#1a2a3a",
    colorPrimary: "#0d47a1",
  },
  elements: {
    rootBox: "auth-modal-root",
    cardBox: "auth-modal-shell",
    card: "auth-modal-card",
    header: "auth-hide",
    headerTitle: "auth-hide",
    headerSubtitle: "auth-hide",
    main: "auth-modal-clear",
    footer: "auth-modal-clear",
    footerAction: "auth-modal-clear",
    socialButtonsBlockButton: "auth-modal-field",
    formFieldInput: "auth-modal-field",
    dividerLine: "auth-modal-line",
  },
};

export function AuthOverlay({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter();

  function close() {
    router.push("/");
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") router.push("/");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  return (
    <div
      className="auth-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div className="auth-modal-frame">
        <div className="auth-modal-panel">
          <button type="button" className="auth-modal-close" onClick={close} aria-label="Close">
            ×
          </button>
          <AuthBrand />
          {mode === "sign-in" ? (
            <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" appearance={appearance} />
          ) : (
            <SignUpForm />
          )}
        </div>
      </div>
    </div>
  );
}
