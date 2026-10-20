"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getMyProfile, saveAccountDetails, saveAccountProfile, saveSecurityQuestions, verifyAccountPassword } from "@/actions/profile";
import { AuthBrand } from "@/components/auth-brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { jamaicaParishes, securityQuestions, statusChoices } from "@/lib/profile";

export function QuestionFields({
  question,
  questionTwo,
  onQuestion,
  onQuestionTwo,
}: {
  question: string;
  questionTwo: string;
  onQuestion: (value: string) => void;
  onQuestionTwo: (value: string) => void;
}) {
  return (
    <>
      <label className="profile-field" data-tone="gold">
        Security question
        <select value={question} onChange={(event) => onQuestion(event.target.value)}>
          {securityQuestions.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        <Input name="answer" autoComplete="off" placeholder="Your answer" required />
      </label>
      <label className="profile-field" data-tone="teal">
        Second security question
        <select value={questionTwo} onChange={(event) => onQuestionTwo(event.target.value)}>
          {securityQuestions.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        <Input name="answerTwo" autoComplete="off" placeholder="Your answer" required />
      </label>
    </>
  );
}

export function AddressFields({
  street,
  apt,
  town,
  parish,
}: {
  street: string;
  apt: string;
  town: string;
  parish: string;
}) {
  return (
    <>
      <label className="profile-field" data-tone="blue">
        Street address
        <Input name="street" autoComplete="address-line1" required defaultValue={street} />
      </label>
      <div className="profile-pair">
        <label className="profile-field" data-tone="gold">
          Apt, suite, or unit
          <Input name="apt" autoComplete="address-line2" defaultValue={apt} />
        </label>
        <label className="profile-field" data-tone="teal">
          Town
          <Input name="town" autoComplete="address-level2" required defaultValue={town} />
        </label>
      </div>
      <label className="profile-field" data-tone="violet">
        Parish
        <select name="parish" required defaultValue={parish}>
          <option value="">Select a parish</option>
          {jamaicaParishes.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </label>
    </>
  );
}

export function PhoneField({ phone }: { phone: string }) {
  return (
    <label className="profile-field" data-tone="blue">
      Phone number
      <Input name="phone" type="tel" autoComplete="tel" required defaultValue={phone} />
    </label>
  );
}

export function StatusPicker({ status }: { status: string }) {
  const choices = statusChoices(status);
  const selected = choices.some(([value]) => value === status) ? status : "parent";
  return (
    <fieldset className="profile-field" data-tone="rose">
      <legend>Status</legend>
      <div className="profile-status">
        {choices.map(([value, label]) => (
          <label key={value} className={`profile-status-option tone-${value}`}>
            <input type="radio" name="status" value={value} defaultChecked={value === selected} required />
            <StatusGlyph kind={value} />
            <span>{label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function StatusGlyph({ kind }: { kind: string }) {
  if (kind === "parent") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3zm8 0a3 3 0 1 0-3-3 3 3 0 0 0 3 3zM8 13c-2.7 0-6 1.3-6 4v1h8v-1c0-1.2.5-2.2 1.3-3.1A8 8 0 0 0 8 13zm8 0c-.7 0-1.4.1-2 .3 1.5 1 2.5 2.3 2.5 3.7v1H22v-1c0-2.7-3.3-4-6-4z" /></svg>
    );
  }
  if (kind === "staff" || kind === "teacher") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 3 3 8l9 5 7-3.9V16h2V8zm-5 11.2V17c0 1.7 2.2 3 5 3s5-1.3 5-3v-2.8l-5 2.8z" /></svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6 4h9a3 3 0 0 1 3 3v13H8a2 2 0 0 0-2 2V4zm2 2v12h8V7a1 1 0 0 0-1-1z" /></svg>
  );
}

export function ProfileSteps({ current }: { current: "details" | "security" }) {
  return (
    <div className="profile-steps">
      <span className={current === "details" ? "is-current" : "is-done"}>1 Address</span>
      <i className="profile-step-line" />
      <span className={current === "security" ? "is-current" : ""}>2 Security</span>
    </div>
  );
}

export function ProfileHero({ kind, title, detail }: { kind: "address" | "security"; title: string; detail: string }) {
  return (
    <div className={`profile-hero profile-hero-${kind}`}>
      <span className="profile-hero-art" aria-hidden="true">
        {kind === "address" ? (
          <svg width="28" height="28" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 14.5 9 2.5 2.5 0 0 1 12 11.5z" /></svg>
        ) : (
          <svg width="28" height="28" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5zm-1.2 13.2-3-3 1.4-1.4 1.6 1.6 3.6-3.6 1.4 1.4z" /></svg>
        )}
      </span>
      <span>
        <strong>{title}</strong>
        <small>{detail}</small>
      </span>
    </div>
  );
}

export function RequiredProfileForm({
  street,
  apt,
  town,
  parish,
  phone,
  status,
  question,
  questionTwo,
}: {
  street: string;
  apt: string;
  town: string;
  parish: string;
  phone: string;
  status: string;
  question: string;
  questionTwo: string;
}) {
  const router = useRouter();
  const { signOut } = useClerk();
  const [card, setCard] = useState<"details" | "security">("details");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [details, setDetails] = useState({ street, apt, town, parish, phone, status });
  const [firstQuestion, setFirstQuestion] = useState(question);
  const [secondQuestion, setSecondQuestion] = useState(questionTwo);

  if (done) return null;

  function readDetails(formData: FormData) {
    return {
      street: String(formData.get("street") ?? ""),
      apt: String(formData.get("apt") ?? ""),
      town: String(formData.get("town") ?? ""),
      parish: String(formData.get("parish") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      status: String(formData.get("status") ?? ""),
    };
  }

  return (
    <div className="auth-overlay profile-gate">
      <div className="auth-modal-frame">
        <div className="auth-modal-panel">
          <AuthBrand />
          {card === "details" ? (
            <form
              className="profile-card auth-step-in"
              onSubmit={(event) => {
                event.preventDefault();
                const next = readDetails(new FormData(event.currentTarget));
                if (next.street.trim().length < 3) return setError("Enter your street address.");
                if (next.town.trim().length < 2) return setError("Enter your town.");
                if (!jamaicaParishes.includes(next.parish as (typeof jamaicaParishes)[number])) return setError("Choose your parish.");
                if (!/^[0-9+() -]{7,20}$/.test(next.phone.trim())) return setError("Enter a valid phone number.");
                setError("");
                setDetails(next);
                setCard("security");
              }}
            >
              <ProfileSteps current="details" />
              <ProfileHero kind="address" title="Complete your account" detail="Address, phone, and status are required for every account." />
              <AddressFields street={details.street} apt={details.apt} town={details.town} parish={details.parish} />
              <PhoneField phone={details.phone} />
              <StatusPicker status={details.status} />
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button className="profile-action" type="submit">Next</Button>
              <button type="button" className="profile-link" onClick={() => signOut({ redirectUrl: "/" })}>Sign out</button>
            </form>
          ) : (
            <form
              className="profile-card auth-step-slide"
              onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                setError("");
                setPending(true);
                void saveAccountProfile({
                  ...details,
                  question: firstQuestion,
                  answer: String(formData.get("answer") ?? ""),
                  questionTwo: secondQuestion,
                  answerTwo: String(formData.get("answerTwo") ?? ""),
                }).then((saved) => {
                  setPending(false);
                  if (saved.error) {
                    setError(saved.error);
                    return;
                  }
                  setDone(true);
                  router.refresh();
                });
              }}
            >
              <ProfileSteps current="security" />
              <ProfileHero kind="security" title="Security questions" detail="Choose two questions and enter an answer for each." />
              <QuestionFields question={firstQuestion} questionTwo={secondQuestion} onQuestion={setFirstQuestion} onQuestionTwo={setSecondQuestion} />
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button className="profile-action" type="submit" disabled={pending}>{pending ? "Saving..." : "Save and continue"}</Button>
              <button type="button" className="profile-link" onClick={() => { setError(""); setCard("details"); }}>Back</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export function AccountInformationPage() {
  return <ProfileEditor mode="details" />;
}

export function SecurityQuestionsPage() {
  return <ProfileEditor mode="questions" />;
}

function ProfileEditor({ mode }: { mode: "details" | "questions" }) {
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof getMyProfile>> | null>(null);
  const [ready, setReady] = useState(false);
  const [phase, setPhase] = useState<"view" | "verify" | "edit">("view");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [question, setQuestion] = useState(securityQuestions[0]);
  const [questionTwo, setQuestionTwo] = useState(securityQuestions[1]);

  useEffect(() => {
    void getMyProfile().then((next) => {
      if (next) {
        setQuestion(next.question || securityQuestions[0]);
        setQuestionTwo(next.questionTwo || securityQuestions[1]);
        const filled = mode === "details"
          ? Boolean(next.street && next.town && next.parish && next.phone)
          : Boolean(next.questionsSaved && next.question && next.questionTwo);
        if (!filled) setPhase("edit");
      }
      setProfile(next);
      setReady(true);
    });
  }, [mode]);

  if (!ready) return <p className="account-profile-page">Loading your account...</p>;
  if (!profile) return <p className="account-profile-page">Sign in to update this information.</p>;

  if (phase === "view") {
    return mode === "details"
      ? <SavedDetails profile={profile} onEdit={() => { setError(""); setPhase("verify"); }} />
      : <SavedQuestions profile={profile} onEdit={() => { setError(""); setPhase("verify"); }} />;
  }

  if (phase === "verify") {
    return <VerifyIdentity onCancel={() => setPhase("view")} onVerified={() => setPhase("edit")} />;
  }

  return (
    <form
      className="account-profile-page profile-card"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const formData = new FormData(form);
        const nextDetails = {
          street: String(formData.get("street") ?? ""),
          apt: String(formData.get("apt") ?? ""),
          town: String(formData.get("town") ?? ""),
          parish: String(formData.get("parish") ?? ""),
          phone: String(formData.get("phone") ?? ""),
          status: String(formData.get("status") ?? ""),
        };
        const nextAnswers = {
          answer: String(formData.get("answer") ?? ""),
          answerTwo: String(formData.get("answerTwo") ?? ""),
        };
        setError("");
        setPending(true);
        const request = mode === "details"
          ? saveAccountDetails(nextDetails)
          : saveSecurityQuestions({
              question,
              questionTwo,
              ...nextAnswers,
            });
        void request.then((result) => {
          setPending(false);
          if (result.error) {
            setError(result.error);
            return;
          }
          setProfile((current) => current && (mode === "details"
            ? { ...current, ...nextDetails }
            : { ...current, question, questionTwo, ...nextAnswers, questionsSaved: true }));
          setPhase("view");
          if (mode === "questions") form.reset();
        });
      }}
    >
      <ProfileHero
        kind={mode === "details" ? "address" : "security"}
        title={mode === "details" ? "Account information" : "Security questions"}
        detail={mode === "details" ? "Update the address, phone number, and status on this account." : "Choose two questions and enter the answers again to save a change."}
      />
      {mode === "details" ? (
        <>
          <AddressFields street={profile.street} apt={profile.apt} town={profile.town} parish={profile.parish} />
          <PhoneField phone={profile.phone} />
          <StatusPicker status={profile.status} />
        </>
      ) : (
        <QuestionFields question={question} questionTwo={questionTwo} onQuestion={setQuestion} onQuestionTwo={setQuestionTwo} />
      )}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button className="profile-action" type="submit" disabled={pending}>{pending ? "Saving..." : "Save"}</Button>
      {(mode === "details" ? Boolean(profile.street) : profile.questionsSaved) ? (
        <button type="button" className="profile-link" onClick={() => setPhase("view")}>Cancel</button>
      ) : null}
    </form>
  );
}

const statusNames: Record<string, string> = {
  student: "Student",
  parent: "Parent/Guardian",
  staff: "Staff",
  teacher: "Teacher",
};

function SavedDetails({
  profile,
  onEdit,
}: {
  profile: { street: string; apt: string; town: string; parish: string; phone: string; status: string };
  onEdit: () => void;
}) {
  return (
    <div className="account-profile-page profile-card">
      <ProfileHero kind="address" title="Account information" detail="The address, phone, and status saved on this account." />
      <dl className="profile-readout">
        <div data-tone="blue"><dt>Street address</dt><dd>{profile.street}</dd></div>
        <div className="profile-readout-pair">
          <div data-tone="gold"><dt>Apt, suite, or unit</dt><dd>{profile.apt || "None"}</dd></div>
          <div data-tone="teal"><dt>Town</dt><dd>{profile.town}</dd></div>
        </div>
        <div data-tone="violet"><dt>Parish</dt><dd>{profile.parish}</dd></div>
        <div data-tone="blue"><dt>Phone number</dt><dd>{profile.phone}</dd></div>
        <div data-tone="rose"><dt>Status</dt><dd>{statusNames[profile.status] || profile.status}</dd></div>
      </dl>
      <Button className="profile-action" type="button" onClick={onEdit}>Update information</Button>
    </div>
  );
}

function SavedQuestions({
  profile,
  onEdit,
}: {
  profile: { question: string; answer: string; questionTwo: string; answerTwo: string };
  onEdit: () => void;
}) {
  return (
    <div className="account-profile-page profile-card">
      <ProfileHero kind="security" title="Security questions" detail="The questions and answers saved on this account." />
      <dl className="profile-readout">
        <div data-tone="gold">
          <dt>Security question</dt>
          <dd>{profile.question}</dd>
          <dd className="profile-answer">{profile.answer || "Saved earlier in protected form. Verify, then enter it again to display it."}</dd>
        </div>
        <div data-tone="teal">
          <dt>Second security question</dt>
          <dd>{profile.questionTwo}</dd>
          <dd className="profile-answer">{profile.answerTwo || "Saved earlier in protected form. Verify, then enter it again to display it."}</dd>
        </div>
      </dl>
      <Button className="profile-action" type="button" onClick={onEdit}>Update questions</Button>
    </div>
  );
}

function VerifyIdentity({ onVerified, onCancel }: { onVerified: () => void; onCancel: () => void }) {
  const { user } = useUser();
  const passwordAccount = user?.passwordEnabled !== false;
  const [codeSent, setCodeSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function sendCode() {
    const email = user?.primaryEmailAddress;
    if (!email) return setError("No email is available for this account.");
    setPending(true);
    setError("");
    try {
      await email.prepareVerification({ strategy: "email_code" });
      setCodeSent(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The code could not be sent.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      className="account-profile-page profile-card auth-step-slide"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        setPending(true);
        setError("");
        const finish = passwordAccount
          ? verifyAccountPassword(String(formData.get("password") ?? ""))
          : user?.primaryEmailAddress?.attemptVerification({ code: String(formData.get("code") ?? "").replace(/\s/g, "") }).then(() => ({ error: null })).catch((caught: unknown) => ({
              error: caught instanceof Error ? caught.message : "That code does not match.",
            }));
        void Promise.resolve(finish).then((result) => {
          setPending(false);
          if (!result || result.error) {
            setError(result?.error || "Verification did not finish.");
            return;
          }
          onVerified();
        });
      }}
    >
      <ProfileHero kind="security" title="Verify it's you" detail={passwordAccount ? "Enter your password before changing this account." : "Enter the code sent to your email before changing this account."} />
      {passwordAccount ? (
        <label className="profile-field" data-tone="violet">
          Password
          <Input name="password" type="password" autoComplete="current-password" required />
        </label>
      ) : (
        <label className="profile-field" data-tone="teal">
          Email code
          <Input name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required />
        </label>
      )}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button className="profile-action" type="submit" disabled={pending || (!passwordAccount && !codeSent)}>{pending ? "Checking..." : "Verify"}</Button>
      {passwordAccount ? null : (
        <button type="button" className="profile-link" onClick={() => void sendCode()} disabled={pending}>{codeSent ? "Resend code" : "Send code"}</button>
      )}
      <button type="button" className="profile-link" onClick={onCancel}>Cancel</button>
    </form>
  );
}
