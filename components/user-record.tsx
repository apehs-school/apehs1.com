"use client";

import { useUser } from "@clerk/nextjs";
import { Eye, Lock, Mail, MapPin, Phone, Shield, UserRound } from "lucide-react";
import { useState, type ReactNode } from "react";
import { revealSecurityAnswers } from "@/actions/user-admin";
import { Dialog, DialogBackdrop, DialogClose, DialogPopup, DialogPortal, DialogTitle } from "@/components/ui/dialog";

const statusLabel: Record<string, string> = {
  student: "Student",
  teacher: "Teacher",
  parent: "Parent/Guardian",
  staff: "Staff",
};

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  phone: string;
  street: string;
  apt: string;
  town: string;
  parish: string;
  status: string;
  banned: boolean;
  question: string;
  questionTwo: string;
};

export function UserRecordButton({ record }: { record: UserRecord }) {
  const { user } = useUser();
  const passwordAccount = user?.passwordEnabled !== false;
  const [open, setOpen] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState<{ answer: string; answerTwo: string; protectedAnswer: boolean; protectedAnswerTwo: boolean } | null>(null);

  function close(next: boolean) {
    setOpen(next);
    if (!next) {
      setAnswers(null);
      setError("");
      setPending(false);
    }
  }

  async function sendCode() {
    const email = user?.primaryEmailAddress;
    if (!email) return setError("No email is available for this admin account.");
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
    <>
      <button type="button" className="user-view" onClick={() => setOpen(true)}>
        <Eye size={15} aria-hidden="true" />
        View
      </button>
      <Dialog open={open} onOpenChange={close}>
        <DialogPortal>
          <DialogBackdrop />
          <DialogPopup className="record-sheet">
            <header className="record-head">
              <span className="record-mark" aria-hidden="true"><UserRound size={22} /></span>
              <div>
                <p>Account record</p>
                <DialogTitle>{record.name || "Account"}</DialogTitle>
                <span><Mail size={14} aria-hidden="true" />{record.email || "No email saved"}</span>
              </div>
              <em className="user-badge" data-tone={record.banned ? "banned" : record.status}>{record.banned ? "Banned" : statusLabel[record.status] || record.status}</em>
            </header>
            <dl className="record-grid">
              <RecordItem icon={<MapPin size={16} />} label="Street address" value={record.street} tone="navy" />
              <RecordItem icon={<HomeMark />} label="Apt, suite, or unit" value={record.apt || "None"} tone="gold" />
              <RecordItem icon={<MapPin size={16} />} label="Town" value={record.town} tone="teal" />
              <RecordItem icon={<MapPin size={16} />} label="Parish" value={record.parish} tone="violet" />
              <RecordItem icon={<Phone size={16} />} label="Phone number" value={record.phone} tone="blue" />
              <RecordItem icon={<UserRound size={16} />} label="Status" value={statusLabel[record.status] || record.status} tone="rose" />
            </dl>
            <section className="record-security">
              <header>
                <Shield size={18} aria-hidden="true" />
                <div>
                  <strong>Security questions</strong>
                  <small>The answers stay hidden until this admin account is verified.</small>
                </div>
              </header>
              <Question label="Security question" question={record.question} answer={answers?.answer} protectedAnswer={answers?.protectedAnswer} revealed={Boolean(answers)} />
              <Question label="Second security question" question={record.questionTwo} answer={answers?.answerTwo} protectedAnswer={answers?.protectedAnswerTwo} revealed={Boolean(answers)} />
              {answers ? null : (
                <form
                  className="record-verify"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const formData = new FormData(event.currentTarget);
                    setPending(true);
                    setError("");
                    const finish = passwordAccount
                      ? revealSecurityAnswers(record.id, { password: String(formData.get("password") ?? "") })
                      : user?.primaryEmailAddress
                          ?.attemptVerification({ code: String(formData.get("code") ?? "").replace(/\s/g, "") })
                          .then(() => revealSecurityAnswers(record.id, { emailVerified: true }))
                          .catch((caught: unknown) => ({ error: caught instanceof Error ? caught.message : "That code does not match." }));
                    void Promise.resolve(finish).then((result) => {
                      setPending(false);
                      if (!result || result.error !== null || result.answer === undefined || result.answerTwo === undefined) {
                        setError(result?.error || "Verification did not finish.");
                        return;
                      }
                      setAnswers({
                        answer: result.answer,
                        answerTwo: result.answerTwo,
                        protectedAnswer: Boolean(result.protectedAnswer),
                        protectedAnswerTwo: Boolean(result.protectedAnswerTwo),
                      });
                    });
                  }}
                >
                  <Lock size={16} aria-hidden="true" />
                  {passwordAccount ? (
                    <label>
                      Password
                      <input name="password" type="password" autoComplete="current-password" required />
                    </label>
                  ) : (
                    <label>
                      Email code
                      <input name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required />
                    </label>
                  )}
                  <button type="submit" disabled={pending || (!passwordAccount && !codeSent)}>{pending ? "Checking..." : "Verify"}</button>
                  {passwordAccount ? null : (
                    <button type="button" className="record-code" onClick={() => void sendCode()} disabled={pending}>{codeSent ? "Resend code" : "Send code"}</button>
                  )}
                </form>
              )}
              {error ? <p className="record-error">{error}</p> : null}
            </section>
            <DialogClose className="record-close">Close</DialogClose>
          </DialogPopup>
        </DialogPortal>
      </Dialog>
    </>
  );
}

function RecordItem({ icon, label, value, tone }: { icon: ReactNode; label: string; value: string; tone: string }) {
  return (
    <div data-tone={tone}>
      <dt>{icon}{label}</dt>
      <dd>{value || "Not provided"}</dd>
    </div>
  );
}

function Question({
  label,
  question,
  answer,
  protectedAnswer,
  revealed,
}: {
  label: string;
  question: string;
  answer?: string;
  protectedAnswer?: boolean;
  revealed: boolean;
}) {
  return (
    <div className="record-question">
      <p>{label}</p>
      <strong>{question || "No question saved"}</strong>
      {revealed ? (
        <span>{answer || (protectedAnswer ? "Saved earlier in protected form. It cannot be displayed." : "No answer saved.")}</span>
      ) : (
        <span className="is-locked"><Lock size={13} aria-hidden="true" />Verify to view the answer</span>
      )}
    </div>
  );
}

function HomeMark() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path fill="currentColor" d="M12 4 3 11h2v8h6v-5h2v5h6v-8h2z" />
    </svg>
  );
}
