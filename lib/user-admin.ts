import { clerkClient } from "@clerk/nextjs/server";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { adminGrants, userEvents, users } from "@/db/schema";

type ClerkListUser = {
  id: string;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  banned?: boolean;
  createdAt?: Date | number;
  emailAddresses?: { id: string; emailAddress: string }[];
  primaryEmailAddressId?: string | null;
};

function clerkName(user: ClerkListUser) {
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || "";
}

function clerkEmail(user: ClerkListUser) {
  return (
    user.emailAddresses?.find((item) => item.id === user.primaryEmailAddressId)?.emailAddress ??
    user.emailAddresses?.[0]?.emailAddress ??
    ""
  );
}

export async function syncClerkAccounts() {
  const db = getDb();
  if (!db) return;
  try {
    const client = await clerkClient();
    for (let offset = 0; offset < 500; offset += 100) {
      const page = await client.users.getUserList({ limit: 100, offset });
      const list = (Array.isArray(page) ? page : page.data) as ClerkListUser[];
      if (list.length === 0) break;
      for (const clerkUser of list) {
        const email = clerkEmail(clerkUser);
        const name = clerkName(clerkUser);
        const created = clerkUser.createdAt ? new Date(clerkUser.createdAt) : new Date();
        const [existing] = await db.select().from(users).where(eq(users.clerkUserId, clerkUser.id)).limit(1);
        if (!existing) {
          await db.insert(users).values({
            id: crypto.randomUUID(),
            clerkUserId: clerkUser.id,
            email,
            name,
            banned: Boolean(clerkUser.banned),
            clerkCreatedAt: created,
          });
          continue;
        }
        await db
          .update(users)
          .set({
            email: email || existing.email,
            name: name || existing.name,
            banned: Boolean(clerkUser.banned),
            clerkCreatedAt: existing.clerkCreatedAt ?? created,
          })
          .where(eq(users.id, existing.id));
      }
      if (list.length < 100) break;
    }
  } catch {
    return;
  }
}

export function accountLabel(user: { name: string; email: string }) {
  return user.name || user.email || "Account";
}

export async function recordUserEvent(input: {
  actorId: string;
  actorName: string;
  targetId: string;
  targetName: string;
  action: string;
  detail?: string;
}) {
  const db = getDb();
  if (!db) return;
  await db.insert(userEvents).values({
    id: crypto.randomUUID(),
    actorId: input.actorId,
    actorName: input.actorName,
    targetId: input.targetId,
    targetName: input.targetName,
    action: input.action,
    detail: input.detail ?? "",
  });
}

export async function listDirectory() {
  const db = getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(users.email);
}

export async function listPrivilegeRows() {
  const db = getDb();
  if (!db) return [];
  const grants = await db.select().from(adminGrants).orderBy(desc(adminGrants.assignedAt));
  const accounts = await db.select().from(users);
  const byId = new Map(accounts.map((account) => [account.id, account]));
  return grants.flatMap((grant) => {
    const account = byId.get(grant.userId);
    if (!account) return [];
    const assigner = grant.assignedBy ? byId.get(grant.assignedBy) : null;
    return [{
      id: grant.id,
      userId: account.id,
      name: accountLabel(account),
      email: account.email,
      privilege: grant.privilege,
      assignedBy: assigner ? accountLabel(assigner) : "System",
      assignedAt: grant.assignedAt,
    }];
  });
}

export async function listUserHistory() {
  const db = getDb();
  if (!db) return [];
  return db.select().from(userEvents).orderBy(desc(userEvents.createdAt));
}
