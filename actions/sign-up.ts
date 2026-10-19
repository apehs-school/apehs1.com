"use server";

import { clerkClient } from "@clerk/nextjs/server";

export type SignUpState = {
  error: string | null;
  ticket: string | null;
};

function field(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function clerkMessage(error: unknown) {
  const details =
    error && typeof error === "object" && "errors" in error
      ? (error as { errors?: { code?: string; longMessage?: string; message?: string }[] }).errors?.[0]
      : undefined;

  if (details?.code === "form_identifier_exists") return "An account with that email already exists.";
  if (details?.code === "form_password_pwned") return "Choose a password that is not commonly used.";
  if (details?.code === "form_password_length_too_short") return "Password must be at least 8 characters.";
  return details?.longMessage || details?.message || "Could not create the account.";
}

export async function signUpAccount(_previous: SignUpState, formData: FormData): Promise<SignUpState> {
  const firstName = field(formData, "firstName");
  const lastName = field(formData, "lastName");
  const email = field(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!firstName || !lastName) return { error: "Enter your first and last name.", ticket: null };
  if (firstName.length > 80 || lastName.length > 80) return { error: "Name is too long.", ticket: null };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email address.", ticket: null };
  if (password.length < 8) return { error: "Password must be at least 8 characters.", ticket: null };
  if (password.length > 128) return { error: "Password is too long.", ticket: null };
  if (password !== confirmPassword) return { error: "Password confirmation does not match.", ticket: null };

  try {
    const client = await clerkClient();
    const user = await client.users.createUser({
      firstName,
      lastName,
      emailAddress: [email],
      password,
      legalAcceptedAt: new Date(),
    });
    const signInToken = await client.signInTokens.createSignInToken({
      userId: user.id,
      expiresInSeconds: 120,
    });
    return { error: null, ticket: signInToken.token };
  } catch (error) {
    return { error: clerkMessage(error), ticket: null };
  }
}
