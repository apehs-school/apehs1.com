export const securityQuestions = [
  "What was the name of your first school?",
  "What city were you born in?",
  "What was the name of your first teacher?",
  "What is your favorite school subject?",
  "What is your mother's maiden name?",
] as const;

export const jamaicaParishes = [
  "Kingston",
  "St. Andrew",
  "St. Thomas",
  "Portland",
  "St. Mary",
  "St. Ann",
  "Trelawny",
  "St. James",
  "Hanover",
  "Westmoreland",
  "St. Elizabeth",
  "Manchester",
  "Clarendon",
  "St. Catherine",
] as const;

export function formatAddress(parts: { street: string; apt: string; town: string; parish: string }) {
  return [parts.street, parts.apt, parts.town, parts.parish].map((part) => part.trim()).filter(Boolean).join(", ");
}

export const profileStatuses = [
  ["student", "Student"],
  ["parent", "Parent/Guardian"],
  ["staff", "Staff"],
] as const;

export function statusChoices(current: string) {
  if (current === "teacher") return [...profileStatuses, ["teacher", "Teacher"] as const] as const;
  return profileStatuses;
}

export function profileIsComplete(user: {
  street?: string | null;
  town?: string | null;
  parish?: string | null;
  phone?: string | null;
  securityQuestion?: string | null;
  securityAnswerHash?: string | null;
  securityQuestionTwo?: string | null;
  securityAnswerTwoHash?: string | null;
}) {
  return [user.street, user.town, user.parish, user.phone, user.securityQuestion, user.securityAnswerHash, user.securityQuestionTwo, user.securityAnswerTwoHash].every(
    (value) => Boolean(value?.trim()),
  );
}
