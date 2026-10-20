"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { ensureCurrentUser } from "@/lib/auth";
import { formatAddress, jamaicaParishes, securityQuestions } from "@/lib/profile";

export type AccountProfile = {
  street: string;
  apt: string;
  town: string;
  parish: string;
  phone: string;
  status: string;
  question: string;
  answer: string;
  questionTwo: string;
  answerTwo: string;
};

const statusValues = ["student", "parent", "staff", "teacher"] as const;

function hashAnswer(email: string, answer: string) {
  return createHash("sha256").update(`${email.toLowerCase()}:${answer.trim().toLowerCase()}`).digest("hex");
}

async function current() {
  const user = (await ensureCurrentUser()) ?? (await new Promise((resolve) => setTimeout(resolve, 600)).then(() => ensureCurrentUser()));
  const db = getDb();
  if (!user || !db) return null;
  return { user, db };
}

function roleFor(user: { role: string; privilege?: string | null }, status: string) {
  if (user.role === "admin" || user.privilege) return user.role as "parent" | "staff" | "admin";
  if (status === "staff" || status === "teacher") return "staff" as const;
  return "parent" as const;
}

type DetailsResult =
  | { error: string }
  | { error: null; street: string; apt: string; town: string; parish: string; phone: string; status: string; address: string };

type QuestionsResult =
  | { error: string }
  | { error: null; question: string; questionTwo: string; answer: string; answerTwo: string };

function cleanDetails(profile: Pick<AccountProfile, "street" | "apt" | "town" | "parish" | "phone" | "status">): DetailsResult {
  const street = profile.street.trim();
  const apt = profile.apt.trim();
  const town = profile.town.trim();
  const parish = profile.parish.trim();
  const phone = profile.phone.trim();
  const status = profile.status;
  if (street.length < 3 || street.length > 120) return { error: "Enter your street address." };
  if (apt.length > 40) return { error: "Apt is too long." };
  if (town.length < 2 || town.length > 80) return { error: "Enter your town." };
  if (!jamaicaParishes.includes(parish as (typeof jamaicaParishes)[number])) return { error: "Choose your parish." };
  if (!/^[0-9+() -]{7,20}$/.test(phone)) return { error: "Enter a valid phone number." };
  if (!statusValues.includes(status as (typeof statusValues)[number])) return { error: "Choose student, parent/guardian, staff, or teacher." };
  return { error: null, street, apt, town, parish, phone, status, address: formatAddress({ street, apt, town, parish }) };
}

function cleanQuestions(profile: Pick<AccountProfile, "question" | "answer" | "questionTwo" | "answerTwo">): QuestionsResult {
  const question = profile.question.trim();
  const questionTwo = profile.questionTwo.trim();
  const answer = profile.answer.trim();
  const answerTwo = profile.answerTwo.trim();
  const known = new Set<string>(securityQuestions);
  if (!known.has(question) || !known.has(questionTwo) || question === questionTwo) return { error: "Choose two different security questions." };
  if (answer.length < 2 || answerTwo.length < 2) return { error: "Answer both security questions." };
  return { error: null, question, questionTwo, answer, answerTwo };
}

export async function getMyProfile() {
  const loaded = await current();
  if (!loaded) return null;
  const { user } = loaded;
  return {
    street: user.street || "",
    apt: user.apt || "",
    town: user.town || "",
    parish: user.parish || "",
    phone: user.phone ?? "",
    status: user.accountStatus || "parent",
    question: user.securityQuestion || "",
    answer: user.securityAnswer || "",
    questionTwo: user.securityQuestionTwo || "",
    answerTwo: user.securityAnswerTwo || "",
    questionsSaved: Boolean(user.securityAnswerHash && user.securityAnswerTwoHash),
  };
}

export async function verifyAccountPassword(password: string) {
  const loaded = await current();
  if (!loaded) return { error: "Sign in did not finish. Try again." };
  if (password.trim().length < 8) return { error: "Enter your password." };
  try {
    const client = await clerkClient();
    await client.users.verifyPassword({ userId: loaded.user.clerkUserId, password });
    return { error: null };
  } catch {
    return { error: "That password does not match this account." };
  }
}

export async function saveAccountDetails(profile: Pick<AccountProfile, "street" | "apt" | "town" | "parish" | "phone" | "status">) {
  const loaded = await current();
  if (!loaded) return { error: "Sign in did not finish. Try again." };
  const details = cleanDetails(profile);
  if (details.error !== null) return { error: details.error };
  await loaded.db
    .update(users)
    .set({
      street: details.street,
      apt: details.apt,
      town: details.town,
      parish: details.parish,
      address: details.address,
      phone: details.phone,
      accountStatus: details.status,
      role: roleFor(loaded.user, details.status),
    })
    .where(eq(users.id, loaded.user.id));
  return { error: null };
}

export async function saveSecurityQuestions(profile: Pick<AccountProfile, "question" | "answer" | "questionTwo" | "answerTwo">) {
  const loaded = await current();
  if (!loaded) return { error: "Sign in did not finish. Try again." };
  const questions = cleanQuestions(profile);
  if (questions.error !== null) return { error: questions.error };
  await loaded.db
    .update(users)
    .set({
      securityQuestion: questions.question,
      securityAnswerHash: hashAnswer(loaded.user.email, questions.answer),
      securityAnswer: questions.answer,
      securityQuestionTwo: questions.questionTwo,
      securityAnswerTwoHash: hashAnswer(loaded.user.email, questions.answerTwo),
      securityAnswerTwo: questions.answerTwo,
    })
    .where(eq(users.id, loaded.user.id));
  return { error: null };
}

export async function saveAccountProfile(profile: AccountProfile) {
  const details = await saveAccountDetails(profile);
  if (details.error) return details;
  return saveSecurityQuestions(profile);
}
