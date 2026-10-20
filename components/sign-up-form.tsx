"use client";

import { useSignUp } from "@clerk/nextjs";
import { useState } from "react";
import { saveAccountProfile } from "@/actions/profile";
import { AddressFields, PhoneField, ProfileHero, ProfileSteps, QuestionFields, StatusPicker } from "@/components/account-profile-forms";
import { jamaicaParishes, securityQuestions } from "@/lib/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Step = "account" | "code" | "profile";

function readable(error: { longMessage?: string; message?: string; errors?: { longMessage?: string; message?: string }[] } | null | undefined) {
  return error?.longMessage || error?.errors?.[0]?.longMessage || error?.errors?.[0]?.message || error?.message || "Something went wrong. Please try again.";
}

export function SignUpForm() {
  const { signUp } = useSignUp();
  const [step, setStep] = useState<Step>("account");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [profileCard, setProfileCard] = useState<"details" | "security">("details");
  const [home, setHome] = useState({ street: "", apt: "", town: "", parish: "", phone: "", status: "parent" });
  const [question, setQuestion] = useState<string>(securityQuestions[0]);
  const [questionTwo, setQuestionTwo] = useState<string>(securityQuestions[1]);

  async function createAccount(formData: FormData) {
    setError("");
    const firstName = String(formData.get("firstName") ?? "").trim();
    const lastName = String(formData.get("lastName") ?? "").trim();
    const nextEmail = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");
    if (!firstName || !lastName) return setError("Enter your first and last name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) return setError("Enter a valid email address.");
    if (password.length < 15) return setError("Password must be at least 15 characters.");
    if (password !== confirmPassword) return setError("Password confirmation does not match.");
    setPending(true);
    try {
      const created = await signUp.password({
        firstName,
        lastName,
        emailAddress: nextEmail,
        password,
        legalAccepted: true,
      });
      if (created.error) {
        setError(readable(created.error));
        return;
      }
      const sent = await signUp.verifications.sendEmailCode();
      if (sent.error) {
        setError(readable(sent.error));
        return;
      }
      setEmail(nextEmail);
      setStep("code");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  async function verifyCode(formData: FormData) {
    setError("");
    const nextCode = String(formData.get("code") ?? "").replace(/\s/g, "");
    if (!/^\d{6}$/.test(nextCode)) return setError("Enter the 6-digit code from your email.");
    setPending(true);
    try {
      const verified = await signUp.verifications.verifyEmailCode({ code: nextCode });
      if (verified.error) {
        setError(readable(verified.error));
        return;
      }
      setStep("profile");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  async function resendCode() {
    setError("");
    setPending(true);
    const sent = await signUp.verifications.sendEmailCode();
    setPending(false);
    if (sent.error) setError(readable(sent.error));
  }

  async function saveProfile(formData: FormData) {
    setError("");
    setPending(true);
    try {
      const finished = await signUp.finalize();
      const saved = await saveAccountProfile({
        ...home,
        question,
        answer: String(formData.get("answer") ?? ""),
        questionTwo,
        answerTwo: String(formData.get("answerTwo") ?? ""),
      });
      if (saved.error) {
        setError(finished.error && saved.error.startsWith("Sign in") ? readable(finished.error) : saved.error);
        return;
      }
      window.location.assign("/account");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  async function continueWithGoogle() {
    setError("");
    const result = await signUp.sso({
      strategy: "oauth_google",
      redirectUrl: "/sign-up/sso-callback",
      redirectCallbackUrl: "/sign-up",
    });
    if (result.error) setError(readable(result.error));
  }

  return (
    <div className={`auth-steps${step === "profile" ? " is-profile" : ""}`}>
      {step === "account" ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void createAccount(new FormData(event.currentTarget));
          }}
          className="auth-modal-card grid gap-3 bg-white px-6 pt-2 pb-6 text-foreground"
        >
          <h1 className="text-center text-base font-medium text-[#0b1f3a]">Create your account</h1>
          <Button variant="outline" type="button" onClick={continueWithGoogle}>Continue with Google</Button>
          <p className="text-center text-sm text-muted-foreground">or</p>
          <div className="grid grid-cols-2 gap-3">
            <Label className="grid gap-2">First name<Input name="firstName" autoComplete="given-name" required /></Label>
            <Label className="grid gap-2">Last name<Input name="lastName" autoComplete="family-name" required /></Label>
          </div>
          <Label className="grid gap-2">Email address<Input name="email" type="email" autoComplete="email" required /></Label>
          <Label className="grid gap-2">Password<Input name="password" type="password" autoComplete="new-password" minLength={15} required /></Label>
          <Label className="grid gap-2">Confirm password<Input name="confirmPassword" type="password" autoComplete="new-password" minLength={15} required /></Label>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" disabled={pending}>{pending ? "Sending code..." : "Continue"}</Button>
          <p className="text-center text-sm">Already have an account? <a className="font-medium text-primary" href="/sign-in">Sign in</a></p>
        </form>
      ) : null}

      {step === "code" ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void verifyCode(new FormData(event.currentTarget));
          }}
          className="auth-modal-card auth-step-in grid gap-3 bg-white px-6 pt-2 pb-6 text-foreground"
        >
          <h1 className="text-center text-base font-medium text-[#0b1f3a]">Verify your email</h1>
          <p className="text-center text-sm text-[#52627a]">Enter the 6-digit code sent to {email}.</p>
          <Label className="grid gap-2">
            Verification code
            <Input name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(event) => setCode(event.target.value)} required />
          </Label>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" disabled={pending}>{pending ? "Checking code..." : "Verify email"}</Button>
          <button type="button" className="text-sm font-medium text-[#0d47a1]" onClick={resendCode} disabled={pending}>Resend code</button>
        </form>
      ) : null}

      {step === "profile" && profileCard === "details" ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            const next = {
              street: String(formData.get("street") ?? ""),
              apt: String(formData.get("apt") ?? ""),
              town: String(formData.get("town") ?? ""),
              parish: String(formData.get("parish") ?? ""),
              phone: String(formData.get("phone") ?? ""),
              status: String(formData.get("status") ?? "parent"),
            };
            if (next.street.trim().length < 3) return setError("Enter your street address.");
            if (next.town.trim().length < 2) return setError("Enter your town.");
            if (!jamaicaParishes.includes(next.parish as (typeof jamaicaParishes)[number])) return setError("Choose your parish.");
            if (!/^[0-9+() -]{7,20}$/.test(next.phone.trim())) return setError("Enter a valid phone number.");
            setError("");
            setHome(next);
            setProfileCard("security");
          }}
          className="profile-card auth-step-in"
        >
          <ProfileSteps current="details" />
          <ProfileHero kind="address" title="Account information" detail="Your email is verified. Tell us a little more." />
          <AddressFields street={home.street} apt={home.apt} town={home.town} parish={home.parish} />
          <PhoneField phone={home.phone} />
          <StatusPicker status={home.status} />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button className="profile-action" type="submit">Next</Button>
        </form>
      ) : null}

      {step === "profile" && profileCard === "security" ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void saveProfile(new FormData(event.currentTarget));
          }}
          className="profile-card auth-step-slide"
        >
          <ProfileSteps current="security" />
          <ProfileHero kind="security" title="Security questions" detail="Choose two questions and enter an answer for each." />
          <QuestionFields question={question} questionTwo={questionTwo} onQuestion={setQuestion} onQuestionTwo={setQuestionTwo} />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button className="profile-action" type="submit" disabled={pending}>{pending ? "Saving..." : "Finish"}</Button>
          <button type="button" className="profile-link" onClick={() => { setError(""); setProfileCard("details"); }}>Back</button>
        </form>
      ) : null}
    </div>
  );
}
