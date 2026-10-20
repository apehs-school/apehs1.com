import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { adminGrants, users } from "@/db/schema";
import { adminEmails, clerkEnabled } from "@/lib/env";

export const accountStatuses = ["student", "teacher", "parent", "staff"] as const;
export const adminPrivileges = ["superadmin", "admin", "co-admin"] as const;

export type AccountStatus = (typeof accountStatuses)[number];
export type AdminPrivilege = (typeof adminPrivileges)[number];

type AccessUser = { role: string; privilege?: string | null; banned?: boolean };

export function hasAdminAccess(user: AccessUser) {
  if (user.banned) return false;
  if (user.privilege && adminPrivileges.includes(user.privilege as AdminPrivilege)) return true;
  return user.role === "admin";
}

export function actorPrivilege(user: AccessUser) {
  if (user.privilege && adminPrivileges.includes(user.privilege as AdminPrivilege)) return user.privilege as AdminPrivilege;
  return user.role === "admin" ? "admin" : null;
}

export function canAssignPrivilege(actor: AccessUser, privilege: string) {
  const level = actorPrivilege(actor);
  if (level === "superadmin") return adminPrivileges.includes(privilege as AdminPrivilege);
  if (level === "admin") return privilege === "admin" || privilege === "co-admin";
  return false;
}

export function canRemovePrivilege(actor: AccessUser, targetPrivilege: string | null) {
  const level = actorPrivilege(actor);
  if (!targetPrivilege || !level) return false;
  if (level === "superadmin") return true;
  if (level === "admin") return targetPrivilege === "admin" || targetPrivilege === "co-admin";
  return false;
}

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
  const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ");
  const makeAdmin = adminEmails().includes(email.toLowerCase());
  const banned = "banned" in clerkUser ? Boolean(clerkUser.banned) : false;

  const existing = await db.select().from(users).where(eq(users.clerkUserId, clerkUser.id)).limit(1);
  if (existing[0]) {
    const nextPrivilege = makeAdmin ? "superadmin" : existing[0].privilege;
    const nextRole = nextPrivilege ? "admin" : existing[0].role;
    const changed =
      (email && existing[0].email !== email) ||
      (name && existing[0].name !== name) ||
      existing[0].banned !== banned ||
      existing[0].privilege !== nextPrivilege ||
      existing[0].role !== nextRole;
    if (changed) {
      await db
        .update(users)
        .set({
          email: email || existing[0].email,
          name: name || existing[0].name,
          banned,
          privilege: nextPrivilege,
          role: nextRole,
        })
        .where(eq(users.id, existing[0].id));
    }
    if (makeAdmin) await rememberSuperadmin(existing[0].id);
    return { ...existing[0], email: email || existing[0].email, name: name || existing[0].name, banned, privilege: nextPrivilege, role: nextRole };
  }

  const created = {
    id: crypto.randomUUID(),
    clerkUserId: clerkUser.id,
    email,
    name,
    role: makeAdmin ? ("admin" as const) : ("parent" as const),
    accountStatus: "parent",
    address: "",
    street: "",
    apt: "",
    town: "",
    parish: "",
    phone: "",
    securityQuestion: "",
    securityAnswerHash: "",
    securityAnswer: "",
    securityQuestionTwo: "",
    securityAnswerTwoHash: "",
    securityAnswerTwo: "",
    privilege: makeAdmin ? "superadmin" : null,
    banned,
    clerkCreatedAt: new Date(clerkUser.createdAt),
  };
  await db.insert(users).values(created);
  if (makeAdmin) await rememberSuperadmin(created.id);
  return { ...created, createdAt: new Date() };
}

async function rememberSuperadmin(userId: string) {
  const db = getDb();
  if (!db) return;
  const [grant] = await db.select().from(adminGrants).where(eq(adminGrants.userId, userId)).limit(1);
  if (!grant) {
    await db.insert(adminGrants).values({ id: crypto.randomUUID(), userId, privilege: "superadmin" });
    return;
  }
  if (grant.privilege !== "superadmin") {
    await db.update(adminGrants).set({ privilege: "superadmin", assignedAt: new Date() }).where(eq(adminGrants.id, grant.id));
  }
}
