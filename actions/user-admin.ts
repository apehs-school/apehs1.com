"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clerkClient } from "@clerk/nextjs/server";
import { getDb } from "@/db";
import { adminGrants, users } from "@/db/schema";
import {
  accountStatuses,
  canAssignPrivilege,
  canRemovePrivilege,
  ensureCurrentUser,
  hasAdminAccess,
} from "@/lib/auth";
import { setNotice } from "@/lib/notice";
import { accountLabel, recordUserEvent } from "@/lib/user-admin";

async function actor() {
  const user = await ensureCurrentUser();
  if (!user || !hasAdminAccess(user)) redirect("/account?error=admin");
  const db = getDb();
  if (!db) redirect("/admin/users");
  return { user, db };
}

function roleFor(status: string, privilege: string | null) {
  if (privilege) return "admin" as const;
  if (status === "teacher" || status === "staff") return "staff" as const;
  return "parent" as const;
}

function refresh() {
  revalidatePath("/admin/users");
  revalidatePath("/", "layout");
}

function returnPath(formData: FormData, tab: string) {
  const params = new URLSearchParams({ tab });
  const q = String(formData.get("returnQ") ?? "").trim();
  const filter = String(formData.get("returnFilter") ?? "");
  const sort = String(formData.get("returnSort") ?? "");
  const dir = String(formData.get("returnDir") ?? "");
  const page = String(formData.get("returnPage") ?? "");
  if (q) params.set("q", q);
  if (filter && filter !== "all") params.set("filter", filter);
  if (sort) params.set("sort", sort);
  if (dir === "desc") params.set("dir", dir);
  if (page && page !== "1") params.set("page", page);
  return `/admin/users?${params.toString()}`;
}

export async function setAccountStatus(formData: FormData) {
  const { user, db } = await actor();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!accountStatuses.includes(status as (typeof accountStatuses)[number])) return;
  const [target] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!target || target.accountStatus === status) return;
  await db.update(users).set({ accountStatus: status, role: roleFor(status, target.privilege) }).where(eq(users.id, id));
  await recordUserEvent({
    actorId: user.id,
    actorName: accountLabel(user),
    targetId: target.id,
    targetName: accountLabel(target),
    action: "status_changed",
    detail: `${target.accountStatus} to ${status}`,
  });
  await setNotice("Status updated");
  refresh();
  redirect(returnPath(formData, "accounts"));
}

export async function setUserBan(formData: FormData) {
  const { user, db } = await actor();
  const id = String(formData.get("id") ?? "");
  const banned = String(formData.get("banned") ?? "") === "true";
  const [target] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!target || target.id === user.id) return;
  if (target.privilege === "superadmin" && user.privilege !== "superadmin") return;
  const client = await clerkClient();
  if (banned) await client.users.banUser(target.clerkUserId);
  else await client.users.unbanUser(target.clerkUserId);
  await db.update(users).set({ banned }).where(eq(users.id, id));
  await recordUserEvent({
    actorId: user.id,
    actorName: accountLabel(user),
    targetId: target.id,
    targetName: accountLabel(target),
    action: banned ? "banned" : "unbanned",
  });
  await setNotice(banned ? "User banned" : "User unbanned");
  refresh();
  redirect(returnPath(formData, "accounts"));
}

export async function grantAdminPrivilege(formData: FormData) {
  const { user, db } = await actor();
  const id = String(formData.get("id") ?? "");
  const privilege = String(formData.get("privilege") ?? "");
  if (!canAssignPrivilege(user, privilege)) return;
  const [target] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!target || target.banned) return;
  const [grant] = await db.select().from(adminGrants).where(eq(adminGrants.userId, id)).limit(1);
  if (grant) {
    await db.update(adminGrants).set({ privilege, assignedBy: user.id, assignedAt: new Date() }).where(eq(adminGrants.id, grant.id));
  } else {
    await db.insert(adminGrants).values({
      id: crypto.randomUUID(),
      userId: id,
      privilege,
      assignedBy: user.id,
    });
  }
  await db.update(users).set({ privilege, role: "admin" }).where(eq(users.id, id));
  await recordUserEvent({
    actorId: user.id,
    actorName: accountLabel(user),
    targetId: target.id,
    targetName: accountLabel(target),
    action: "privilege_granted",
    detail: privilege,
  });
  await setNotice("Privilege assigned");
  refresh();
  redirect(returnPath(formData, "privileges"));
}

export async function removeAdminPrivilege(formData: FormData) {
  const { user, db } = await actor();
  const id = String(formData.get("id") ?? "");
  const [target] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!target || target.id === user.id || !canRemovePrivilege(user, target.privilege)) return;
  await db.delete(adminGrants).where(eq(adminGrants.userId, id));
  await db.update(users).set({ privilege: null, role: roleFor(target.accountStatus, null) }).where(eq(users.id, id));
  await recordUserEvent({
    actorId: user.id,
    actorName: accountLabel(user),
    targetId: target.id,
    targetName: accountLabel(target),
    action: "privilege_removed",
    detail: target.privilege ?? "",
  });
  await setNotice("Privilege removed");
  refresh();
  redirect(returnPath(formData, "privileges"));
}
