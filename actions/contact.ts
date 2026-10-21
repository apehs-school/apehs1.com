"use server";

import { and, asc, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { contactDetails, contactMessages, contactReplies } from "@/db/schema";
import { ensureCurrentUser, hasAdminAccess } from "@/lib/auth";
import { setNotice } from "@/lib/notice";
import { listOfficeMessageAlerts } from "@/lib/queries";
import { formatAddress, jamaicaParishes } from "@/lib/profile";
import { publicObjectUrl, putStoredObject } from "@/lib/storage";

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

const imageTypes = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);
const maxImageBytes = 8 * 1024 * 1024;

function safeImageName(name: string) {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return cleaned.slice(0, 80) || "image";
}

async function chatImage(formData: FormData) {
  const upload = formData.get("image");
  if (!(upload instanceof File) || upload.size === 0) return { key: "" };
  if (!imageTypes.has(upload.type)) return { key: "", error: "Choose a JPG, PNG, GIF, or WebP image." };
  if (upload.size > maxImageBytes) return { key: "", error: "Images must be 8 MB or smaller." };
  const objectKey = `chat/${crypto.randomUUID()}-${safeImageName(upload.name)}`;
  try {
    await putStoredObject("images", objectKey, Buffer.from(await upload.arrayBuffer()), upload.type);
  } catch {
    return { key: "", error: "The image could not be saved." };
  }
  return { key: objectKey };
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
  const street = clean(formData.get("street"));
  const apt = clean(formData.get("apt"));
  const town = clean(formData.get("town"));
  const parish = clean(formData.get("parish"));
  if (parish && !jamaicaParishes.includes(parish as (typeof jamaicaParishes)[number])) return;
  const details = {
    street,
    apt,
    town,
    parish,
    address: formatAddress({ street, apt, town, parish }),
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

async function readChatThread(messageId: string) {
  const user = await ensureCurrentUser();
  const db = getDb();
  if (!user || !db || !messageId) return null;
  const [message] = await db.select().from(contactMessages).where(eq(contactMessages.id, messageId)).limit(1);
  if (!message || message.deletedAt) return null;
  const fromAdmin = hasAdminAccess(user);
  if (!fromAdmin && message.userId !== user.id) return null;
  const replies = await db.select().from(contactReplies).where(eq(contactReplies.messageId, messageId)).orderBy(asc(contactReplies.createdAt));
  return {
    opener: {
      name: message.name,
      body: message.body,
      createdAt: message.createdAt.toISOString(),
    },
    turns: replies.map((item) => ({
      id: item.id,
      authorRole: item.authorRole,
      body: item.body,
      imageUrl: item.imageKey ? publicObjectUrl("images", item.imageKey) : null,
      createdAt: item.createdAt.toISOString(),
    })),
  };
}

export async function getChatThread(messageId: string) {
  return readChatThread(messageId);
}

export async function officeAlertCount() {
  const user = await ensureCurrentUser();
  if (!user || !hasAdminAccess(user)) return 0;
  const alerts = await listOfficeMessageAlerts();
  return alerts.filter((item) => item.unread).length;
}

export async function replyToContact(formData: FormData) {
  const user = await ensureCurrentUser();
  if (!user) redirect("/sign-in");
  const db = getDb();
  if (!db) return;
  const messageId = clean(formData.get("messageId"));
  const body = String(formData.get("body") ?? "").trim();
  if (!messageId) return;
  const [message] = await db.select().from(contactMessages).where(eq(contactMessages.id, messageId)).limit(1);
  if (!message) return;
  const fromAdmin = hasAdminAccess(user);
  if (!fromAdmin && message.userId !== user.id) return;
  const image = await chatImage(formData);
  if (image.error) return { error: image.error, thread: null };
  if (!body && !image.key) return { error: "Write a reply or choose an image.", thread: null };
  await db.insert(contactReplies).values({
    id: crypto.randomUUID(),
    messageId,
    authorRole: fromAdmin ? "admin" : "user",
    body,
    imageKey: image.key,
  });
  if (fromAdmin) {
    await db.update(contactMessages).set({ openedAt: new Date() }).where(eq(contactMessages.id, messageId));
  }
  revalidatePath("/contact");
  revalidatePath("/admin/contact");
  revalidatePath("/");
  return { error: null, thread: await readChatThread(messageId) };
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

function adminName(user: { name: string; email: string }) {
  return user.name.trim() || user.email || "Admin";
}

export async function resolveContactMessage(formData: FormData) {
  const user = await ensureCurrentUser();
  if (!user || !hasAdminAccess(user)) redirect("/account?error=admin");
  const db = getDb();
  if (!db) redirect("/admin");
  const id = clean(formData.get("id"));
  if (!id) return;
  const name = adminName(user);
  const [message] = await db.select().from(contactMessages).where(eq(contactMessages.id, id)).limit(1);
  if (!message) return;
  await db
    .update(contactMessages)
    .set({
      resolvedAt: new Date(),
      resolvedBy: name,
      openedAt: message.openedAt ?? new Date(),
      openedBy: message.openedBy || name,
    })
    .where(eq(contactMessages.id, id));
  revalidatePath("/contact");
  revalidatePath("/admin/contact");
  revalidatePath("/");
  await setNotice("Message resolved");
  redirect("/admin/contact?tab=history");
}

export async function deleteContactMessage(formData: FormData) {
  const user = await ensureCurrentUser();
  if (!user || !hasAdminAccess(user)) redirect("/account?error=admin");
  const db = getDb();
  if (!db) redirect("/admin");
  const id = clean(formData.get("id"));
  if (!id) return;
  await db.update(contactMessages).set({ deletedAt: new Date(), deletedBy: adminName(user) }).where(eq(contactMessages.id, id));
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
  const user = await ensureCurrentUser();
  if (!user || !hasAdminAccess(user)) redirect("/account?error=admin");
  const db = getDb();
  if (!db || !id) return;
  const name = adminName(user);
  await db
    .update(contactMessages)
    .set({ openedAt: new Date(), openedBy: name })
    .where(and(eq(contactMessages.id, id), isNull(contactMessages.openedAt)));
  await db.update(contactMessages).set({ openedBy: name }).where(and(eq(contactMessages.id, id), eq(contactMessages.openedBy, "")));
}
