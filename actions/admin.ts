"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { activities, devotionals, events, fees, guardians, menuCategories, menuItems, news, pageEntries, sitePages, staffMembers, students, users } from "@/db/schema";
import { ensureCurrentUser, hasAdminAccess } from "@/lib/auth";
import { fallbackEvents, fallbackMenu, fallbackNews, fallbackWord } from "@/lib/fallback";
import { activityDefaults, pageDefault, sitePageDefaults } from "@/lib/site-content";
import { dollarsToCents } from "@/lib/format";
import { isMealCategory } from "@/lib/menu";
import { staffRoles } from "@/lib/staff";
import { setNotice } from "@/lib/notice";
import { putStoredObject } from "@/lib/storage";

async function requireAdmin() {
  const user = await ensureCurrentUser();
  if (!user || !hasAdminAccess(user)) redirect("/account?error=admin");
  const db = getDb();
  if (!db) redirect("/admin");
  return db;
}

function clean(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

export async function createStudent(formData: FormData) {
  const db = await requireAdmin();
  const firstName = clean(formData.get("firstName"));
  const lastName = clean(formData.get("lastName"));
  const grade = clean(formData.get("grade"));
  if (!firstName || !lastName || !grade) return;
  await db.insert(students).values({ id: crypto.randomUUID(), firstName, lastName, grade });
  await setNotice("Student added");
  revalidatePath("/admin/students");
}

export async function deleteStudent(formData: FormData) {
  const db = await requireAdmin();
  const id = clean(formData.get("id"));
  if (!id) return;
  await db.delete(students).where(eq(students.id, id));
  await setNotice("Student removed");
  revalidatePath("/admin/students");
}

export async function linkGuardian(formData: FormData) {
  const db = await requireAdmin();
  const userId = clean(formData.get("userId"));
  const studentId = clean(formData.get("studentId"));
  if (!userId || !studentId) return;
  const existing = await db
    .select()
    .from(guardians)
    .where(eq(guardians.userId, userId));
  if (existing.some((link) => link.studentId === studentId)) return;
  await db.insert(guardians).values({ id: crypto.randomUUID(), userId, studentId });
  await setNotice("Parent linked");
  revalidatePath("/admin/students");
}

export async function createFee(formData: FormData) {
  const db = await requireAdmin();
  const name = clean(formData.get("name"));
  const description = clean(formData.get("description"));
  const amountCents = dollarsToCents(clean(formData.get("amount")));
  const dueDate = clean(formData.get("dueDate"));
  const studentId = clean(formData.get("studentId"));
  if (!name || amountCents === null) return;
  await db.insert(fees).values({
    id: crypto.randomUUID(),
    name,
    description: description || null,
    amountCents,
    dueDate: dueDate || null,
    studentId: studentId || null,
  });
  await setNotice("Fee added");
  revalidatePath("/admin/fees");
  revalidatePath("/pay");
}

export async function deleteFee(formData: FormData) {
  const db = await requireAdmin();
  const id = clean(formData.get("id"));
  if (!id) return;
  await db.delete(fees).where(eq(fees.id, id));
  await setNotice("Fee removed");
  revalidatePath("/admin/fees");
}

export async function updateUserRole(formData: FormData) {
  const db = await requireAdmin();
  const id = clean(formData.get("id"));
  const role = clean(formData.get("role"));
  if (!id || !["parent", "staff", "admin"].includes(role)) return;
  await db.update(users).set({ role: role as "parent" | "staff" | "admin" }).where(eq(users.id, id));
  await setNotice("Role updated");
  revalidatePath("/admin/users");
}

export async function createNews(formData: FormData) {
  const db = await requireAdmin();
  const title = clean(formData.get("title"));
  const body = clean(formData.get("body"));
  const period = mealPeriod(formData);
  if (!title || !body || !period) return;
  await db.insert(news).values({ id: crypto.randomUUID(), title, body, eventDate: period.startsOn, endsOn: period.endsOn, published: false });
  await setNotice("News added");
  revalidatePath("/");
  revalidatePath("/admin/news");
  revalidatePath("/admin/content");
  redirect("/admin/news");
}

export async function updateNews(formData: FormData) {
  const db = await requireAdmin();
  const id = clean(formData.get("id"));
  const title = clean(formData.get("title"));
  const body = clean(formData.get("body"));
  const period = mealPeriod(formData);
  if (!id || !title || !body || !period) return;
  await db.update(news).set({ title, body, eventDate: period.startsOn, endsOn: period.endsOn }).where(eq(news.id, id));
  await setNotice("News saved");
  revalidatePath("/");
  revalidatePath("/admin/news");
  redirect("/admin/news");
}

export async function setNewsPublished(formData: FormData) {
  const db = await requireAdmin();
  const id = clean(formData.get("id"));
  if (!id) return;
  const published = clean(formData.get("published")) === "true";
  await db.update(news).set({ published }).where(eq(news.id, id));
  await setNotice(published ? "Published" : "Unpublished");
  revalidatePath("/");
  revalidatePath("/admin/news");
}

export async function deleteNews(formData: FormData) {
  const db = await requireAdmin();
  const id = clean(formData.get("id"));
  if (!id) return;
  await db.delete(news).where(eq(news.id, id));
  await setNotice("News deleted");
  revalidatePath("/");
  revalidatePath("/admin/news");
  revalidatePath("/admin/content");
}

export async function createEvent(formData: FormData) {
  const db = await requireAdmin();
  const title = clean(formData.get("title"));
  const period = mealPeriod(formData);
  const details = clean(formData.get("details"));
  if (!title || !period) return;
  await db.insert(events).values({
    id: crypto.randomUUID(),
    title,
    eventDate: period.startsOn,
    endsOn: period.endsOn,
    details: details || null,
    published: false,
  });
  await setNotice("Event added");
  revalidatePath("/");
  revalidatePath("/calendar");
  revalidatePath("/admin/calendar");
  revalidatePath("/admin/content");
  redirect("/admin/calendar");
}

export async function updateEvent(formData: FormData) {
  const db = await requireAdmin();
  const id = clean(formData.get("id"));
  const title = clean(formData.get("title"));
  const period = mealPeriod(formData);
  const details = clean(formData.get("details"));
  if (!id || !title || !period) return;
  await db.update(events).set({ title, eventDate: period.startsOn, endsOn: period.endsOn, details: details || null }).where(eq(events.id, id));
  await setNotice("Event saved");
  revalidatePath("/");
  revalidatePath("/calendar");
  revalidatePath("/admin/calendar");
  redirect("/admin/calendar");
}

export async function setEventPublished(formData: FormData) {
  const db = await requireAdmin();
  const id = clean(formData.get("id"));
  if (!id) return;
  const published = clean(formData.get("published")) === "true";
  await db.update(events).set({ published }).where(eq(events.id, id));
  await setNotice(published ? "Published" : "Unpublished");
  revalidatePath("/");
  revalidatePath("/calendar");
  revalidatePath("/admin/calendar");
}

export async function deleteEvent(formData: FormData) {
  const db = await requireAdmin();
  const id = clean(formData.get("id"));
  if (!id) return;
  await db.delete(events).where(eq(events.id, id));
  await setNotice("Event deleted");
  revalidatePath("/");
  revalidatePath("/calendar");
  revalidatePath("/admin/calendar");
  revalidatePath("/admin/content");
}

function mealPriceCents(value: string) {
  if (!value) return null;
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) return null;
  return Math.round(amount * 100);
}

async function uploadedMealImage(formData: FormData) {
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0 || !file.type.startsWith("image/") || file.size > 8 * 1024 * 1024) return null;
  const objectKey = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 80)}`;
  await putStoredObject("images", objectKey, Buffer.from(await file.arrayBuffer()), file.type);
  return objectKey;
}

function mealPeriod(formData: FormData) {
  const startsOn = clean(formData.get("startsOn"));
  const endsOn = clean(formData.get("endsOn"));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startsOn) || !/^\d{4}-\d{2}-\d{2}$/.test(endsOn) || endsOn < startsOn) return null;
  return { startsOn, endsOn };
}

export async function createMenuItem(formData: FormData) {
  const db = await requireAdmin();
  const category = clean(formData.get("category"));
  const name = clean(formData.get("name"));
  const description = clean(formData.get("description"));
  const period = mealPeriod(formData);
  const priceCents = mealPriceCents(clean(formData.get("price")));
  if (!isMealCategory(category) || !name || !period || priceCents === null) return;
  const imageKey = await uploadedMealImage(formData);
  await db.insert(menuItems).values({
    id: crypto.randomUUID(),
    category,
    name,
    description,
    ...period,
    priceCents,
    imageKey,
    published: false,
  });
  await setNotice("Meal added");
  revalidatePath("/menu");
  revalidatePath("/admin/lunch");
  revalidatePath("/admin/content");
  redirect(`/admin/lunch?tab=${encodeURIComponent(category)}`);
}

export async function updateMenuItem(formData: FormData) {
  const db = await requireAdmin();
  const id = clean(formData.get("id"));
  const category = clean(formData.get("category"));
  const name = clean(formData.get("name"));
  const description = clean(formData.get("description"));
  const period = mealPeriod(formData);
  const priceCents = mealPriceCents(clean(formData.get("price")));
  if (!id || !isMealCategory(category) || !name || !period || priceCents === null) return;
  const imageKey = await uploadedMealImage(formData);
  const [current] = await db.select().from(menuItems).where(eq(menuItems.id, id)).limit(1);
  await db
    .update(menuItems)
    .set({ category, name, description, ...period, priceCents, imageKey: imageKey ?? current?.imageKey ?? null })
    .where(eq(menuItems.id, id));
  await setNotice("Meal saved");
  revalidatePath("/menu");
  revalidatePath("/admin/lunch");
  redirect(`/admin/lunch?tab=${encodeURIComponent(category)}`);
}

export async function setMenuCategoryPublished(formData: FormData) {
  const db = await requireAdmin();
  const name = clean(formData.get("name"));
  if (!isMealCategory(name)) return;
  const published = clean(formData.get("published")) === "true";
  const updated = await db.update(menuCategories).set({ published }).where(eq(menuCategories.name, name)).returning();
  if (updated.length === 0) await db.insert(menuCategories).values({ name, published });
  await setNotice(published ? "Published" : "Unpublished");
  revalidatePath("/menu");
  revalidatePath("/admin/lunch");
  redirect(`/admin/lunch?tab=${encodeURIComponent(name)}`);
}

export async function setMenuItemPublished(formData: FormData) {
  const db = await requireAdmin();
  const id = clean(formData.get("id"));
  if (!id) return;
  const published = clean(formData.get("published")) === "true";
  await db.update(menuItems).set({ published }).where(eq(menuItems.id, id));
  await setNotice(published ? "Published" : "Unpublished");
  revalidatePath("/menu");
  revalidatePath("/admin/lunch");
  const category = clean(formData.get("category"));
  if (isMealCategory(category)) redirect(`/admin/lunch?tab=${encodeURIComponent(category)}`);
}

export async function deleteMenuItem(formData: FormData) {
  const db = await requireAdmin();
  const id = clean(formData.get("id"));
  if (!id) return;
  await db.delete(menuItems).where(eq(menuItems.id, id));
  await setNotice("Meal deleted");
  revalidatePath("/menu");
  revalidatePath("/admin/lunch");
  revalidatePath("/admin/content");
  const category = clean(formData.get("category"));
  if (isMealCategory(category)) redirect(`/admin/lunch?tab=${encodeURIComponent(category)}`);
}

export async function createDevotional(formData: FormData) {
  const db = await requireAdmin();
  const verse = clean(formData.get("verse"));
  const reference = clean(formData.get("reference"));
  const prayer = clean(formData.get("prayer"));
  const period = mealPeriod(formData);
  if (!verse || !reference || !prayer || !period) return;
  await db.insert(devotionals).values({
    id: crypto.randomUUID(),
    verse,
    reference,
    prayer,
    activeDate: period.startsOn,
    endsOn: period.endsOn,
    published: false,
  });
  await setNotice("Word for today added");
  revalidatePath("/");
  revalidatePath("/word");
  revalidatePath("/admin/news/word");
  revalidatePath("/admin/content");
  redirect("/admin/news/word");
}

export async function updateDevotional(formData: FormData) {
  const db = await requireAdmin();
  const id = clean(formData.get("id"));
  const verse = clean(formData.get("verse"));
  const reference = clean(formData.get("reference"));
  const prayer = clean(formData.get("prayer"));
  const period = mealPeriod(formData);
  if (!id || !verse || !reference || !prayer || !period) return;
  await db.update(devotionals).set({ verse, reference, prayer, activeDate: period.startsOn, endsOn: period.endsOn }).where(eq(devotionals.id, id));
  await setNotice("Word for today saved");
  revalidatePath("/");
  revalidatePath("/word");
  revalidatePath("/admin/news/word");
  redirect("/admin/news/word");
}

export async function setDevotionalPublished(formData: FormData) {
  const db = await requireAdmin();
  const id = clean(formData.get("id"));
  if (!id) return;
  const published = clean(formData.get("published")) === "true";
  await db.update(devotionals).set({ published }).where(eq(devotionals.id, id));
  await setNotice(published ? "Published" : "Unpublished");
  revalidatePath("/");
  revalidatePath("/word");
  revalidatePath("/admin/news/word");
}

export async function deleteDevotional(formData: FormData) {
  const db = await requireAdmin();
  const id = clean(formData.get("id"));
  if (!id) return;
  await db.delete(devotionals).where(eq(devotionals.id, id));
  await setNotice("Word for today deleted");
  revalidatePath("/");
  revalidatePath("/word");
  revalidatePath("/admin/news/word");
  revalidatePath("/admin/content");
}

function pageSlug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "page";
}

export async function savePage(formData: FormData) {
  const db = await requireAdmin();
  const slug = clean(formData.get("slug"));
  const title = clean(formData.get("title"));
  const body = String(formData.get("body") ?? "").trim();
  const known = pageDefault(slug);
  const [current] = slug ? await db.select().from(sitePages).where(eq(sitePages.slug, slug)).limit(1) : [];
  const group = known?.group ?? current?.group;
  if (!group || !title || !body) return;
  await db
    .insert(sitePages)
    .values({ slug, title, body, group, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: sitePages.slug,
      set: { title, body, group, updatedAt: new Date() },
    });
  await setNotice("Page saved");
  revalidatePath(`/${slug}`);
  revalidatePath("/extra");
  revalidatePath("/admin/about");
  revalidatePath("/admin/academics");
  revalidatePath("/admin/activities");
  revalidatePath("/admin/contact");
  if (group === "activities") redirect("/admin/activities");
  if (group === "about") redirect(`/admin/about?tab=${slug}`);
}

export async function createPageEntry(formData: FormData) {
  const db = await requireAdmin();
  const section = clean(formData.get("section"));
  const title = clean(formData.get("title"));
  const body = String(formData.get("body") ?? "").trim();
  const known = pageDefault(section);
  if (!known || known.group !== "about" || !title || !body) return;
  const imageKey = await uploadedMealImage(formData);
  await db.insert(pageEntries).values({
    id: crypto.randomUUID(),
    section,
    title,
    body,
    imageKey,
    published: false,
  });
  await setNotice("Record added");
  revalidatePath(`/${section}`);
  revalidatePath("/about");
  revalidatePath("/admin/about");
  redirect(`/admin/about?tab=${section}`);
}

export async function updatePageEntry(formData: FormData) {
  const db = await requireAdmin();
  const id = clean(formData.get("id"));
  const section = clean(formData.get("section"));
  const title = clean(formData.get("title"));
  const body = String(formData.get("body") ?? "").trim();
  if (!id || !section || !title || !body) return;
  const imageKey = await uploadedMealImage(formData);
  const [current] = await db.select().from(pageEntries).where(eq(pageEntries.id, id)).limit(1);
  await db.update(pageEntries).set({ title, body, imageKey: imageKey ?? current?.imageKey ?? null }).where(eq(pageEntries.id, id));
  await setNotice("Record saved");
  revalidatePath(`/${section}`);
  revalidatePath("/about");
  revalidatePath("/admin/about");
  redirect(`/admin/about?tab=${section}`);
}

export async function setPageEntryPublished(formData: FormData) {
  const db = await requireAdmin();
  const id = clean(formData.get("id"));
  const section = clean(formData.get("section"));
  if (!id || !section) return;
  const published = clean(formData.get("published")) === "true";
  await db.update(pageEntries).set({ published }).where(eq(pageEntries.id, id));
  await setNotice(published ? "Published" : "Unpublished");
  revalidatePath(`/${section}`);
  revalidatePath("/about");
  revalidatePath("/admin/about");
}

export async function deletePageEntry(formData: FormData) {
  const db = await requireAdmin();
  const id = clean(formData.get("id"));
  const section = clean(formData.get("section"));
  if (!id || !section) return;
  await db.delete(pageEntries).where(eq(pageEntries.id, id));
  await setNotice("Record deleted");
  revalidatePath(`/${section}`);
  revalidatePath("/about");
  revalidatePath("/admin/about");
  redirect(`/admin/about?tab=${section}`);
}

export async function setAboutPagePublished(formData: FormData) {
  const db = await requireAdmin();
  const slug = clean(formData.get("slug"));
  const published = clean(formData.get("published")) === "true";
  const known = pageDefault(slug);
  if (!known || known.group !== "about") return;
  const [current] = await db.select().from(sitePages).where(eq(sitePages.slug, slug)).limit(1);
  const title = current?.title ?? known.title;
  const body = current?.body ?? known.body;
  await db
    .insert(sitePages)
    .values({ slug, title, body, group: "about", published, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: sitePages.slug,
      set: { published, group: "about", updatedAt: new Date() },
    });
  await setNotice(published ? "Published" : "Unpublished");
  revalidatePath(`/${slug}`);
  revalidatePath("/about");
  revalidatePath("/admin/about");
}

export async function deleteAboutPage(formData: FormData) {
  const db = await requireAdmin();
  const slug = clean(formData.get("slug"));
  const known = pageDefault(slug);
  if (!known || known.group !== "about") return;
  const [current] = await db.select().from(sitePages).where(eq(sitePages.slug, slug)).limit(1);
  const title = current?.title ?? known.title;
  const body = current?.body ?? known.body;
  await db
    .insert(sitePages)
    .values({ slug, title, body, group: "hidden", published: false, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: sitePages.slug,
      set: { group: "hidden", published: false, updatedAt: new Date() },
    });
  await setNotice("Page deleted");
  revalidatePath(`/${slug}`);
  revalidatePath("/about");
  revalidatePath("/admin/about");
  redirect(`/admin/about?tab=${slug}`);
}

function staffDetails(formData: FormData) {
  const name = clean(formData.get("name"));
  const role = clean(formData.get("role"));
  const knownRole = staffRoles.includes(role as (typeof staffRoles)[number]);
  if (!name || (!knownRole && role !== "custom")) return null;
  const title = role === "custom" ? clean(formData.get("customTitle")) : role;
  if (!title) return null;
  const grades = formData.getAll("grade").map((value) => clean(value));
  const subjects = formData.getAll("subject").map((value) => clean(value));
  const assignments = role === "Teacher"
    ? grades.map((grade, index) => ({ grade, subject: subjects[index] ?? "" })).filter((item) => item.grade || item.subject)
    : [];
  return { name, role, title, assignments: JSON.stringify(assignments), note: clean(formData.get("note")) };
}

export async function createStaffMember(formData: FormData) {
  const db = await requireAdmin();
  const details = staffDetails(formData);
  if (!details) return;
  const imageKey = await uploadedMealImage(formData);
  await db.insert(staffMembers).values({ id: crypto.randomUUID(), ...details, imageKey, published: false });
  await setNotice("Staff added");
  revalidatePath("/staff");
  revalidatePath("/principal");
  revalidatePath("/admin/about");
  redirect("/admin/about?tab=staff");
}

export async function updateStaffMember(formData: FormData) {
  const db = await requireAdmin();
  const id = clean(formData.get("id"));
  const details = staffDetails(formData);
  if (!id || !details) return;
  const imageKey = await uploadedMealImage(formData);
  const [current] = await db.select().from(staffMembers).where(eq(staffMembers.id, id)).limit(1);
  await db.update(staffMembers).set({ ...details, imageKey: imageKey ?? current?.imageKey ?? null }).where(eq(staffMembers.id, id));
  await setNotice("Staff saved");
  revalidatePath("/staff");
  revalidatePath("/principal");
  revalidatePath("/admin/about");
  redirect("/admin/about?tab=staff");
}

export async function setStaffPublished(formData: FormData) {
  const db = await requireAdmin();
  const id = clean(formData.get("id"));
  if (!id) return;
  const published = clean(formData.get("published")) === "true";
  await db.update(staffMembers).set({ published }).where(eq(staffMembers.id, id));
  await setNotice(published ? "Published" : "Unpublished");
  revalidatePath("/staff");
  revalidatePath("/principal");
  revalidatePath("/admin/about");
}

export async function deleteStaffMember(formData: FormData) {
  const db = await requireAdmin();
  const id = clean(formData.get("id"));
  if (!id) return;
  await db.delete(staffMembers).where(eq(staffMembers.id, id));
  await setNotice("Staff deleted");
  revalidatePath("/staff");
  revalidatePath("/principal");
  revalidatePath("/admin/about");
  redirect("/admin/about?tab=staff");
}

export async function createActivityPage(formData: FormData) {
  const db = await requireAdmin();
  const title = clean(formData.get("title"));
  const body = String(formData.get("body") ?? "").trim();
  if (!title || !body) return;
  let slug = pageSlug(title);
  const [taken] = await db.select().from(sitePages).where(eq(sitePages.slug, slug)).limit(1);
  if (taken || pageDefault(slug)) slug = `${slug}-${crypto.randomUUID().slice(0, 6)}`;
  await db.insert(sitePages).values({ slug, title, body, group: "activities", published: false, updatedAt: new Date() });
  await setNotice("Page added");
  revalidatePath(`/${slug}`);
  revalidatePath("/extra");
  revalidatePath("/admin/activities");
  redirect("/admin/activities");
}

export async function setActivityPagePublished(formData: FormData) {
  const db = await requireAdmin();
  const slug = clean(formData.get("slug"));
  const published = clean(formData.get("published")) === "true";
  if (!slug) return;
  const known = pageDefault(slug);
  const [current] = await db.select().from(sitePages).where(eq(sitePages.slug, slug)).limit(1);
  if (current && current.group !== "activities") return;
  const title = current?.title ?? known?.title ?? "";
  const body = current?.body ?? known?.body ?? "";
  if (!title || !body || (known && known.group !== "activities" && !current)) return;
  await db
    .insert(sitePages)
    .values({ slug, title, body, group: "activities", published, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: sitePages.slug,
      set: { published, group: "activities", updatedAt: new Date() },
    });
  await setNotice(published ? "Published" : "Unpublished");
  revalidatePath(`/${slug}`);
  revalidatePath("/extra");
  revalidatePath("/admin/activities");
}

export async function deleteActivityPage(formData: FormData) {
  const db = await requireAdmin();
  const slug = clean(formData.get("slug"));
  if (!slug) return;
  const known = pageDefault(slug);
  const [current] = await db.select().from(sitePages).where(eq(sitePages.slug, slug)).limit(1);
  if (known?.group === "activities") {
    const title = current?.title ?? known.title;
    const body = current?.body ?? known.body;
    await db
      .insert(sitePages)
      .values({ slug, title, body, group: "hidden", published: false, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: sitePages.slug,
        set: { group: "hidden", published: false, updatedAt: new Date() },
      });
  } else if (current?.group === "activities") {
    await db.delete(sitePages).where(eq(sitePages.slug, slug));
  } else {
    return;
  }
  await setNotice("Page deleted");
  revalidatePath(`/${slug}`);
  revalidatePath("/extra");
  revalidatePath("/admin/activities");
  redirect("/admin/activities");
}

export async function createActivity(formData: FormData) {
  const db = await requireAdmin();
  const name = clean(formData.get("name"));
  const schedule = String(formData.get("schedule") ?? "").trim();
  const period = mealPeriod(formData);
  if (!name || !schedule || !period) return;
  await db.insert(activities).values({
    id: crypto.randomUUID(),
    name,
    schedule,
    venue: clean(formData.get("venue")),
    lead: clean(formData.get("lead")),
    cost: clean(formData.get("cost")),
    attire: clean(formData.get("attire")),
    note: clean(formData.get("note")) || null,
    startsOn: period.startsOn,
    endsOn: period.endsOn,
    published: false,
  });
  await setNotice("Activity added");
  revalidatePath("/extra");
  revalidatePath("/admin/activities/clubs");
  redirect("/admin/activities/clubs");
}

export async function updateActivity(formData: FormData) {
  const db = await requireAdmin();
  const id = clean(formData.get("id"));
  const name = clean(formData.get("name"));
  const schedule = String(formData.get("schedule") ?? "").trim();
  const period = mealPeriod(formData);
  if (!id || !name || !schedule || !period) return;
  await db
    .update(activities)
    .set({
      name,
      schedule,
      venue: clean(formData.get("venue")),
      lead: clean(formData.get("lead")),
      cost: clean(formData.get("cost")),
      attire: clean(formData.get("attire")),
      note: clean(formData.get("note")) || null,
      startsOn: period.startsOn,
      endsOn: period.endsOn,
    })
    .where(eq(activities.id, id));
  await setNotice("Activity saved");
  revalidatePath("/extra");
  revalidatePath("/admin/activities/clubs");
  redirect("/admin/activities/clubs");
}

export async function setActivityPublished(formData: FormData) {
  const db = await requireAdmin();
  const id = clean(formData.get("id"));
  if (!id) return;
  const published = clean(formData.get("published")) === "true";
  await db.update(activities).set({ published }).where(eq(activities.id, id));
  await setNotice(published ? "Published" : "Unpublished");
  revalidatePath("/extra");
  revalidatePath("/admin/activities/clubs");
}

export async function deleteActivity(formData: FormData) {
  const db = await requireAdmin();
  const id = clean(formData.get("id"));
  if (!id || id.startsWith("default-")) return;
  await db.delete(activities).where(eq(activities.id, id));
  await setNotice("Activity deleted");
  revalidatePath("/extra");
  revalidatePath("/admin/activities/clubs");
}

export async function loadSampleContent() {
  const db = await requireAdmin();
  const [newsRows, eventRows, menuRows, devotionalRows] = await Promise.all([
    db.select().from(news).limit(1),
    db.select().from(events).limit(1),
    db.select().from(menuItems).limit(1),
    db.select().from(devotionals).limit(1),
  ]);

  if (newsRows.length === 0) {
    await db.insert(news).values(fallbackNews.map((item) => ({ id: crypto.randomUUID(), ...item, endsOn: item.eventDate })));
  }
  if (eventRows.length === 0) {
    await db.insert(events).values(
      fallbackEvents.map((item) => ({ id: crypto.randomUUID(), eventDate: item.date, endsOn: item.date, title: item.title })),
    );
  }
  if (menuRows.length === 0) {
    await db.insert(menuItems).values(
      fallbackMenu.map((item) => ({ id: crypto.randomUUID(), startsOn: "2026-02-23", endsOn: "2026-02-23", ...item })),
    );
  }
  if (devotionalRows.length === 0) {
    await db.insert(devotionals).values({
      id: crypto.randomUUID(),
      ...fallbackWord,
      activeDate: new Date().toISOString().slice(0, 10),
      endsOn: new Date().toISOString().slice(0, 10),
    });
  }

  const savedPages = await db.select().from(sitePages);
  const savedSlugs = new Set(savedPages.map((page) => page.slug));
  const missingPages = sitePageDefaults.filter((page) => !savedSlugs.has(page.slug));
  if (missingPages.length > 0) await db.insert(sitePages).values(missingPages);

  const activityRows = await db.select().from(activities).limit(1);
  if (activityRows.length === 0) {
    await db.insert(activities).values(
      activityDefaults.map((item) => ({
        id: crypto.randomUUID(),
        ...item,
        note: item.note || null,
        startsOn: "2026-01-05",
        endsOn: "2026-06-30",
      })),
    );
  }

  await setNotice("Sample content loaded");
  revalidatePath("/");
  revalidatePath("/calendar");
  revalidatePath("/menu");
  revalidatePath("/word");
  revalidatePath("/extra");
  revalidatePath("/about");
  revalidatePath("/admin/content");
}
