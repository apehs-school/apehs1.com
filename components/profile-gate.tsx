import { RequiredProfileForm } from "@/components/account-profile-forms";
import { ensureCurrentUser } from "@/lib/auth";
import { profileIsComplete, securityQuestions } from "@/lib/profile";

export async function ProfileGate() {
  const user = await ensureCurrentUser();
  if (!user || profileIsComplete(user)) return null;
  const status = user.accountStatus || "parent";
  return (
    <RequiredProfileForm
      street={"street" in user ? user.street : ""}
      apt={"apt" in user ? user.apt : ""}
      town={"town" in user ? user.town : ""}
      parish={"parish" in user ? user.parish : ""}
      phone={"phone" in user ? user.phone : ""}
      status={status}
      question={"securityQuestion" in user && user.securityQuestion ? user.securityQuestion : securityQuestions[0]}
      questionTwo={"securityQuestionTwo" in user && user.securityQuestionTwo ? user.securityQuestionTwo : securityQuestions[1]}
    />
  );
}
