"use client";

import { HandleSSOCallback } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function SignUpCallbackPage() {
  const router = useRouter();

  return (
    <HandleSSOCallback
      navigateToApp={() => router.push("/account")}
      navigateToSignIn={() => router.push("/sign-in")}
      navigateToSignUp={() => router.push("/sign-up")}
    />
  );
}
