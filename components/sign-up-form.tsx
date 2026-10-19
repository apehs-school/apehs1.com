"use client";

import { useSignIn, useSignUp } from "@clerk/nextjs";
import { useActionState, useEffect, useState } from "react";
import { signUpAccount, type SignUpState } from "@/actions/sign-up";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: SignUpState = { error: null, ticket: null };

function readable(error: { longMessage?: string; message?: string } | null | undefined) {
  return error?.longMessage || error?.message || "Something went wrong. Please try again.";
}

export function SignUpForm() {
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const [state, formAction, pending] = useActionState(signUpAccount, initialState);
  const [clientError, setClientError] = useState("");

  useEffect(() => {
    if (!state.ticket) return;
    let active = true;

    async function finishSignIn(ticket: string) {
      const signedIn = await signIn.ticket({ ticket });
      if (!active) return;
      if (signedIn.error) {
        setClientError(readable(signedIn.error));
        return;
      }
      const finished = await signIn.finalize();
      if (!active) return;
      if (finished.error) {
        setClientError(readable(finished.error));
        return;
      }
      window.location.assign("/account");
    }

    void finishSignIn(state.ticket);
    return () => {
      active = false;
    };
  }, [signIn, state.ticket]);

  async function continueWithGoogle() {
    setClientError("");
    const result = await signUp.sso({
      strategy: "oauth_google",
      redirectUrl: "/sign-up/sso-callback",
      redirectCallbackUrl: "/sign-up",
    });
    if (result.error) setClientError(readable(result.error));
  }

  const error = clientError || state.error;

  return (
    <form action={formAction} className="auth-modal-card grid gap-3 bg-white px-6 pt-2 pb-6 text-foreground">
      <h1 className="text-center text-base font-medium text-[#0b1f3a]">Create your account</h1>
      <Button variant="outline" type="button" onClick={continueWithGoogle}>
        Continue with Google
      </Button>
      <p className="text-center text-sm text-muted-foreground">or</p>
      <div className="grid grid-cols-2 gap-3">
        <Label className="grid gap-2">First name<Input name="firstName" autoComplete="given-name" required /></Label>
        <Label className="grid gap-2">Last name<Input name="lastName" autoComplete="family-name" required /></Label>
      </div>
      <Label className="grid gap-2">Email address<Input name="email" type="email" autoComplete="email" required /></Label>
      <Label className="grid gap-2">Password<Input name="password" type="password" autoComplete="new-password" minLength={8} required /></Label>
      <Label className="grid gap-2">Confirm password<Input name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required /></Label>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Creating account..." : "Continue"}
      </Button>
      <p className="text-center text-sm">
        Already have an account? <a className="font-medium text-primary" href="/sign-in">Sign in</a>
      </p>
    </form>
  );
}
