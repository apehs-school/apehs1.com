import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { adminEmails, clerkEnabled } from "@/lib/env";

export async function ensureCurrentUser() {
  if (!clerkEnabled()) return null;
  const db = getDb();
  if (!db) return null;

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email =
    clerkUser.emailAddresses.find((item) => item.id === clerkUser.primaryEmailAddressId)?.emailAddress ??
    clerkUser.emailAddresses[0]?.emailAddress ??
    "";
  const makeAdmin = adminEmails().includes(email.toLowerCase());

  const existing = await db.select().from(users).where(eq(users.clerkUserId, clerkUser.id)).limit(1);
  if (existing[0]) {
    if (makeAdmin && existing[0].role !== "admin") {
      await db.update(users).set({ role: "admin", email }).where(eq(users.id, existing[0].id));
      return { ...existing[0], role: "admin" as const, email };
    }
    if (email && existing[0].email !== email) {
      await db.update(users).set({ email }).where(eq(users.id, existing[0].id));
      return { ...existing[0], email };
    }
    return existing[0];
  }

  const created = {
    id: crypto.randomUUID(),
    clerkUserId: clerkUser.id,
    email,
    role: makeAdmin ? ("admin" as const) : ("parent" as const),
  };
  await db.insert(users).values(created);
  return { ...created, createdAt: new Date() };
}
