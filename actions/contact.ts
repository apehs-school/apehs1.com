"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { contactDetails, contactMessages, contactReplies } from "@/db/schema";
import { ensureCurrentUser, hasAdminAccess } from "@/lib/auth";
import { setNotice } from "@/lib/notice";

function clean(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

async function requireAdmin() {
  const user = await ensureCurrentUser();
  if (!user || !hasAdminAccess(user)) redirect("/account?error=admin");
  const db = getDb();
  if (!db) redirect("/admin");
  return db;
}

function socialsFromForm(formData: FormData) {
  const names = formData.getAll("socialName").map((value) => clean(value));
  const urls = formData.getAll("socialUrl").map((value) => clean(value));
  return JSON.stringify(
    names
      .map((name, index) => ({ name, url: urls[index] ?? "" }))
      .filter((item) => item.name && item.url),
  );
}

export async function saveContactDetails(formData: FormData) {
  const db = await requireAdmin();
  const details = {
    address: clean(formData.get("address")),
    telephone: clean(formData.get("telephone")),
    whatsapp: clean(formData.get("whatsapp")),
    email: clean(formData.get("email")),
    socials: socialsFromForm(formData),
    updatedAt: new Date(),
  };
  await db
    .insert(contactDetails)
    .values({ id: "school", ...details })
    .onConflictDoUpdate({ target: contactDetails.id, set: details });
  revalidatePath("/contact");
  revalidatePath("/admin/contact");
  await setNotice("Contact information saved");
  redirect("/admin/contact");
}

export async function sendContactMessage(formData: FormData) {
  const user = await ensureCurrentUser();
  if (!user) redirect("/sign-in");
  const db = getDb();
  if (!db) return;
  const subject = clean(formData.get("subject"));
  const body = String(formData.get("body") ?? "").trim();
  const name = clean(formData.get("name")) || user.email;
  const email = clean(formData.get("email")) || user.email;
  if (!name || !subject || !body) return;
  await db.insert(contactMessages).values({
    id: crypto.randomUUID(),
    userId: user.id,
    name,
    email,
    subject,
    body,
  });
  revalidatePath("/contact");
  revalidatePath("/admin/contact");
  await setNotice("Message sent");
  redirect("/contact?sent=1");
}

export async function replyToContact(formData: FormData) {
  const user = await ensureCurrentUser();
  if (!user) redirect("/sign-in");
  const db = getDb();
  if (!db) return;
  const messageId = clean(formData.get("messageId"));
  const body = String(formData.get("body") ?? "").trim();
  if (!messageId || !body) return;
  const [message] = await db.select().from(contactMessages).where(eq(contactMessages.id, messageId)).limit(1);
  if (!message) return;
  const fromAdmin = hasAdminAccess(user);
  if (!fromAdmin && message.userId !== user.id) return;
  await db.insert(contactReplies).values({
    id: crypto.randomUUID(),
    messageId,
    authorRole: fromAdmin ? "admin" : "user",
    body,
  });
  if (fromAdmin) {
    await db.update(contactMessages).set({ openedAt: new Date() }).where(eq(contactMessages.id, messageId));
  }
  revalidatePath("/contact");
  revalidatePath("/admin/contact");
  revalidatePath("/");
  await setNotice("Reply sent");
  redirect(fromAdmin ? `/admin/contact?tab=history&reply=${messageId}` : `/contact?chat=${messageId}`);
}

export async function markContactRead(messageId: string) {
  const user = await ensureCurrentUser();
  const db = getDb();
  if (!user || !db || !messageId) return;
  const [message] = await db.select().from(contactMessages).where(eq(contactMessages.id, messageId)).limit(1);
  if (!message) return;
  if (hasAdminAccess(user)) {
    await db
      .update(contactReplies)
      .set({ readAt: new Date() })
      .where(and(eq(contactReplies.messageId, messageId), eq(contactReplies.authorRole, "user"), isNull(contactReplies.readAt)));
  } else if (message.userId === user.id) {
    await db
      .update(contactReplies)
      .set({ readAt: new Date() })
      .where(and(eq(contactReplies.messageId, messageId), eq(contactReplies.authorRole, "admin"), isNull(contactReplies.readAt)));
  } else {
    return;
  }
  revalidatePath("/contact");
  revalidatePath("/");
  revalidatePath("/admin/contact");
}

export async function deleteContactMessage(formData: FormData) {
  const db = await requireAdmin();
  const id = clean(formData.get("id"));
  if (!id) return;
  await db.update(contactMessages).set({ deletedAt: new Date() }).where(eq(contactMessages.id, id));
  revalidatePath("/contact");
  revalidatePath("/admin/contact");
  revalidatePath("/");
  await setNotice("Message moved to history");
  redirect("/admin/contact?tab=history");
}

export async function purgeContactMessage(formData: FormData) {
  const db = await requireAdmin();
  const id = clean(formData.get("id"));
  if (!id) return;
  await db.delete(contactMessages).where(eq(contactMessages.id, id));
  revalidatePath("/contact");
  revalidatePath("/admin/contact");
  revalidatePath("/");
  await setNotice("Message deleted");
  redirect("/admin/contact?tab=history");
}

export async function markMessageOpened(id: string) {
  const db = await requireAdmin();
  if (!id) return;
  await db.update(contactMessages).set({ openedAt: new Date() }).where(and(eq(contactMessages.id, id), isNull(contactMessages.openedAt)));
  revalidatePath("/admin/contact");
}
