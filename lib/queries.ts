import { and, asc, desc, eq, gte, inArray, isNull, lt, lte } from "drizzle-orm";
import { getDb } from "@/db";
import { activities, admissionApplications, admissionMeta, admissionRecords, awardPages, behaviourAssessments, contactDetails, contactMessages, contactReplies, devotionals, events, fees, guardians, menuCategories, menuItems, news, pageEntries, payments, scholarshipRecords, sitePages, staffMembers, storedFiles, students, users } from "@/db/schema";
import { eventsByDate, fallbackEvents } from "@/lib/fallback";
import { jamaicaDate } from "@/lib/format";
import { isMealCategory, mealCategories } from "@/lib/menu";
import { legacyAdmission, legacyAdmissionId, snapshotOf, toAdmissionRecord, type AdmissionRecord } from "@/lib/admissions";
import { awardDefaults, parseAwardDocument } from "@/lib/awards";
import { cleanBehaviour, type BehaviourAnswers } from "@/lib/behaviour";
import { toScholarshipRecord, type ScholarshipRecord } from "@/lib/scholarships";
import { activityDefaults, pageDefault, sitePageDefaults } from "@/lib/site-content";

async function read<T>(query: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await query();
  } catch (error) {
    const code = (error as { cause?: { code?: string } }).cause?.code;
    console.error(code ? `Database read failed (${code})` : "Database read failed");
    return fallback;
  }
}

export function bulletinImageKeys(value: string | null | undefined) {
  try {
    const parsed = JSON.parse(value || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string" && item.length > 0 && !item.includes(".."));
  } catch {
    return [];
  }
}

export async function getNewsItems() {
  const db = getDb();
  if (!db) return [];
  const today = jamaicaDate();
  const rows = await read(() => db.select().from(news).where(eq(news.published, true)), []);
  return rows
    .filter((row) => (!row.showFrom || row.showFrom <= today) && (!row.endsOn || row.endsOn >= today))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.eventDate.localeCompare(a.eventDate));
}

function eachDate(start: string, end: string) {
  const dates: string[] = [];
  const cursor = new Date(`${start}T00:00:00Z`);
  const last = new Date(`${(end || start)}T00:00:00Z`);
  while (cursor <= last && dates.length < 400) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

export async function getCalendarEvents() {
  const db = getDb();
  if (!db) return eventsByDate(fallbackEvents);
  const rows = await read(() => db.select().from(events).orderBy(events.eventDate), []);
  if (rows.length === 0) return eventsByDate(fallbackEvents);
  return eventsByDate(
    rows
      .filter((row) => row.published)
      .flatMap((row) => eachDate(row.eventDate, row.endsOn).map((date) => ({ date, title: row.title }))),
  );
}

export async function getUpcomingEvents(limit = 8) {
  const today = jamaicaDate();
  const db = getDb();
  if (!db) {
    return fallbackEvents
      .filter((item) => item.date >= today)
      .slice(0, limit)
      .map((item) => ({ date: item.date, title: item.title, details: "" }));
  }
  const rows = await read(() => db.select().from(events).orderBy(events.eventDate), []);
  const source =
    rows.length > 0
      ? rows
          .filter((row) => row.published && row.endsOn >= today)
          .map((row) => ({ date: row.eventDate, title: row.title, details: row.details ?? "" }))
      : fallbackEvents.map((item) => ({ date: item.date, title: item.title, details: "" }));
  return source.filter((item) => rows.length > 0 || item.date >= today).slice(0, limit);
}

export async function getMenu() {
  const db = getDb();
  const today = jamaicaDate();
  if (!db) return { date: today, items: [], categories: [] as string[] };
  const current = await read(
    () =>
      db
        .select()
        .from(menuItems)
        .where(and(eq(menuItems.published, true), lte(menuItems.startsOn, today), gte(menuItems.endsOn, today)))
        .orderBy(desc(menuItems.startsOn)),
    [],
  );
  const publishedCategories = await read(
    () => db.select().from(menuCategories).where(eq(menuCategories.published, true)),
    [],
  );
  const categories = [
    ...mealCategories.filter((name) => publishedCategories.some((row) => row.name === name)),
    ...publishedCategories.map((row) => row.name).filter((name) => !isMealCategory(name)),
  ];
  return { date: today, items: current.filter((item) => categories.includes(item.category)), categories };
}

export async function getDevotional(kind: "popup" | "word") {
  const db = getDb();
  if (!db) return null;
  const today = jamaicaDate();
  const todays = await read(
    () =>
      db
        .select()
        .from(devotionals)
        .where(and(eq(devotionals.published, true), lte(devotionals.activeDate, today), gte(devotionals.endsOn, today)))
        .limit(1),
    [],
  );
  if (todays[0]) return todays[0];
  if (kind === "popup") return null;
  const latest = await read(
    () => db.select().from(devotionals).where(eq(devotionals.published, true)).orderBy(desc(devotionals.activeDate)).limit(1),
    [],
  );
  return latest[0] ?? null;
}

export async function getDashboardCounts() {
  const db = getDb();
  if (!db) return { students: 0, fees: 0, payments: 0, news: 0, events: 0, meals: 0, activities: 0, pages: 0 };
  const [studentRows, feeRows, paymentRows, newsRows] = await Promise.all([
    read(() => db.select().from(students), []),
    read(() => db.select().from(fees), []),
    read(() => db.select().from(payments), []),
    read(() => db.select().from(news), []),
  ]);
  const [eventRows, menuRows, activityRows, pageRows] = await Promise.all([
    read(() => db.select().from(events), []),
    read(() => db.select().from(menuItems), []),
    read(() => db.select().from(activities), []),
    read(() => db.select().from(sitePages), []),
  ]);
  return {
    students: studentRows.length,
    fees: feeRows.length,
    payments: paymentRows.filter((row) => row.status === "paid").length,
    news: newsRows.length,
    events: eventRows.length,
    meals: menuRows.length,
    activities: activityRows.length,
    pages: pageRows.length,
  };
}

export async function listStudents() {
  const db = getDb();
  if (!db) return [];
  return read(() => db.select().from(students).orderBy(students.lastName, students.firstName), []);
}

export async function listUsers() {
  const db = getDb();
  if (!db) return [];
  return read(() => db.select().from(users).orderBy(users.email), []);
}

export async function listGuardians() {
  const db = getDb();
  if (!db) return [];
  return read(
    () =>
      db
        .select({
          id: guardians.id,
          userId: guardians.userId,
          studentId: guardians.studentId,
          email: users.email,
        })
        .from(guardians)
        .innerJoin(users, eq(guardians.userId, users.id)),
    [],
  );
}

export async function listFees() {
  const db = getDb();
  if (!db) return [];
  return read(
    () =>
      db
        .select({
          id: fees.id,
          name: fees.name,
          description: fees.description,
          amountCents: fees.amountCents,
          dueDate: fees.dueDate,
          studentId: fees.studentId,
          firstName: students.firstName,
          lastName: students.lastName,
        })
        .from(fees)
        .leftJoin(students, eq(fees.studentId, students.id))
        .orderBy(desc(fees.createdAt)),
    [],
  );
}

export async function listPayments() {
  const db = getDb();
  if (!db) return [];
  return read(
    () =>
      db
        .select({
          id: payments.id,
          amountCents: payments.amountCents,
          currency: payments.currency,
          status: payments.status,
          createdAt: payments.createdAt,
          feeName: fees.name,
          firstName: students.firstName,
          lastName: students.lastName,
          email: users.email,
        })
        .from(payments)
        .leftJoin(fees, eq(payments.feeId, fees.id))
        .leftJoin(students, eq(payments.studentId, students.id))
        .leftJoin(users, eq(payments.userId, users.id))
        .orderBy(desc(payments.createdAt)),
    [],
  );
}

export async function listPayableFees(userId: string, role: string) {
  const db = getDb();
  if (!db) return [];
  const feeRows = await listFees();
  if (role === "admin") return feeRows;
  const links = await read(() => db.select().from(guardians).where(eq(guardians.userId, userId)), []);
  const studentIds = new Set(links.map((link) => link.studentId));
  return feeRows.filter((fee) => !fee.studentId || studentIds.has(fee.studentId));
}

export async function paidFeeIds() {
  const db = getDb();
  if (!db) return new Set<string>();
  const rows = await read(() => db.select().from(payments).where(eq(payments.status, "paid")), []);
  return new Set(rows.map((row) => row.feeId).filter((id): id is string => Boolean(id)));
}

export async function getAccountPayments(userId: string) {
  const db = getDb();
  if (!db) return [];
  return read(
    () =>
      db
        .select({
          id: payments.id,
          amountCents: payments.amountCents,
          status: payments.status,
          createdAt: payments.createdAt,
          feeName: fees.name,
        })
        .from(payments)
        .leftJoin(fees, eq(payments.feeId, fees.id))
        .where(eq(payments.userId, userId))
        .orderBy(desc(payments.createdAt)),
    [],
  );
}

export async function getLinkedStudents(userId: string) {
  const db = getDb();
  if (!db) return [];
  return read(
    () =>
      db
        .select({
          id: students.id,
          firstName: students.firstName,
          lastName: students.lastName,
          grade: students.grade,
        })
        .from(guardians)
        .innerJoin(students, eq(guardians.studentId, students.id))
        .where(eq(guardians.userId, userId)),
    [],
  );
}

export async function listAdmissionRecords(): Promise<{ migrated: boolean; records: AdmissionRecord[] }> {
  const db = getDb();
  if (!db) return { migrated: false, records: [] };
  try {
    const [marker] = await db.select().from(admissionMeta).where(eq(admissionMeta.id, "admissions")).limit(1);
    if (!marker) {
      const [page] = await db.select().from(sitePages).where(eq(sitePages.slug, "admissions")).limit(1);
      const visible = !page || (page.published && page.group !== "hidden");
      const seed = legacyAdmission(visible);
      const [existing] = await db.select({ id: admissionRecords.id }).from(admissionRecords).where(eq(admissionRecords.id, legacyAdmissionId)).limit(1);
      if (!existing) {
        await db.insert(admissionRecords).values({
          id: seed.id,
          title: seed.title,
          department: seed.department,
          introduction: seed.introduction,
          minAge: seed.minAge,
          maxAge: seed.maxAge,
          gradeRange: seed.gradeRange,
          eligibilityNote: seed.eligibilityNote,
          documents: JSON.stringify(seed.documents),
          steps: JSON.stringify(seed.steps),
          additional: seed.additional,
          published: seed.published,
          publishedSnapshot: seed.publishedSnapshot ? JSON.stringify(snapshotOf(seed)) : null,
          createdAt: new Date(seed.createdAt),
          updatedAt: new Date(seed.updatedAt),
        });
      }
      await db.insert(admissionMeta).values({ id: "admissions" }).onConflictDoNothing();
    }
    const rows = await db.select().from(admissionRecords).orderBy(desc(admissionRecords.updatedAt));
    return { migrated: true, records: rows.flatMap((row) => {
      const record = toAdmissionRecord(row);
      return record ? [record] : [];
    }) };
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Could not read admissions");
    return { migrated: false, records: [] };
  }
}

export async function listAdmissionApplications() {
  const db = getDb();
  if (!db) return [];
  return read(() => db.select().from(admissionApplications).orderBy(desc(admissionApplications.createdAt)), []);
}

export async function listBehaviourAssessments(): Promise<{ id: string; lastName: string; firstName: string; middleName: string; lastSchool: string; createdAt: string; answers: BehaviourAnswers }[]> {
  const db = getDb();
  if (!db) return [];
  return read(async () => {
    const rows = await db.select().from(behaviourAssessments).orderBy(desc(behaviourAssessments.createdAt));
    return rows.map((row) => {
      let parsed: Partial<BehaviourAnswers> = {};
      try {
        parsed = JSON.parse(row.answers) as Partial<BehaviourAnswers>;
      } catch {
        parsed = {};
      }
      return {
        id: row.id,
        lastName: row.lastName,
        firstName: row.firstName,
        middleName: row.middleName,
        lastSchool: row.lastSchool,
        createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
        answers: cleanBehaviour(parsed),
      };
    });
  }, []);
}

export async function listScholarshipRecords(): Promise<ScholarshipRecord[]> {
  const db = getDb();
  if (!db) return [];
  return read(async () => {
    const rows = await db.select().from(scholarshipRecords).orderBy(desc(scholarshipRecords.updatedAt));
    return rows.flatMap((row) => {
      const record = toScholarshipRecord(row);
      return record ? [record] : [];
    });
  }, []);
}

export async function getAwardPage() {
  const db = getDb();
  if (!db) return awardDefaults;
  const rows = await read(() => db.select().from(awardPages).where(eq(awardPages.slug, "awards")).limit(1), []);
  const row = rows[0];
  if (!row) return awardDefaults;
  return parseAwardDocument(row) ?? awardDefaults;
}

export async function getSitePage(slug: string) {
  const fallback = pageDefault(slug);
  const db = getDb();
  if (!db) return fallback;
  const rows = await read(() => db.select().from(sitePages).where(eq(sitePages.slug, slug)).limit(1), []);
  if (rows[0]) {
    if (!rows[0].published || rows[0].group === "hidden") return null;
    return { slug, title: rows[0].title, body: rows[0].body, group: rows[0].group, updatedAt: rows[0].updatedAt };
  }
  return fallback;
}

export async function listPublishedStaff() {
  const db = getDb();
  if (!db) return [];
  return read(
    () => db.select().from(staffMembers).where(eq(staffMembers.published, true)).orderBy(asc(staffMembers.createdAt)),
    [],
  );
}

export async function listPublishedActivityPages() {
  const db = getDb();
  if (!db) return [];
  return read(
    () => db.select().from(sitePages).where(and(eq(sitePages.group, "activities"), eq(sitePages.published, true))).orderBy(asc(sitePages.title)),
    [],
  );
}

export async function listPublishedPageEntries(section: string) {
  const db = getDb();
  if (!db) return [];
  return read(
    () => db.select().from(pageEntries).where(and(eq(pageEntries.section, section), eq(pageEntries.published, true))).orderBy(desc(pageEntries.createdAt)),
    [],
  );
}

export async function listSitePages(group?: string) {
  const defaults = group ? sitePageDefaults.filter((page) => page.group === group) : sitePageDefaults;
  const db = getDb();
  if (!db) return defaults;
  const rows = await read(() => db.select().from(sitePages), []);
  const saved = new Map(rows.map((row) => [row.slug, row]));
  return defaults.map((page) => {
    const row = saved.get(page.slug);
    return row ? { ...page, title: row.title, body: row.body } : page;
  });
}

export async function retireEndedActivities() {
  const db = getDb();
  if (!db) return;
  const today = jamaicaDate();
  try {
    await db.update(activities).set({ published: false }).where(and(eq(activities.published, true), lt(activities.endsOn, today)));
  } catch (error) {
    const code = (error as { cause?: { code?: string } }).cause?.code;
    console.error(code ? `Could not unpublish ended activities (${code})` : "Could not unpublish ended activities");
  }
}

export async function listActivities() {
  const db = getDb();
  if (!db) return activityDefaults.map((item, index) => ({ id: `default-${index}`, ...item, note: item.note || null }));
  await retireEndedActivities();
  const rows = await read(() => db.select().from(activities), []);
  if (rows.length === 0) return activityDefaults.map((item, index) => ({ id: `default-${index}`, ...item, note: item.note || null }));
  return rows.filter((item) => item.published);
}

export async function listContent() {
  const db = getDb();
  if (!db) return { news: [], events: [], menu: [], devotionals: [] };
  const [newsRows, eventRows, menuRows, devotionalRows] = await Promise.all([
    read(() => db.select().from(news).orderBy(desc(news.eventDate)), []),
    read(() => db.select().from(events).orderBy(desc(events.eventDate)), []),
    read(() => db.select().from(menuItems).orderBy(desc(menuItems.startsOn)), []),
    read(() => db.select().from(devotionals).orderBy(desc(devotionals.activeDate)), []),
  ]);
  return { news: newsRows, events: eventRows, menu: menuRows, devotionals: devotionalRows };
}

export async function listStoredFiles() {
  const db = getDb();
  if (!db) return [];
  return read(() => db.select().from(storedFiles).orderBy(desc(storedFiles.createdAt)), []);
}

export async function getStoredFile(id: string) {
  const db = getDb();
  if (!db) return null;
  const rows = await read(() => db.select().from(storedFiles).where(eq(storedFiles.id, id)).limit(1), []);
  return rows[0] ?? null;
}

const contactFallback = {
  id: "school",
  address: "37 Hope Road, Kingston, Jamaica",
  street: "37 Hope Road",
  apt: "",
  town: "Kingston",
  parish: "Kingston",
  telephone: "876-927-8874 | 876-486-9611",
  whatsapp: "",
  email: "ardenne.prep.saw@moeschools.edu.jm",
  socials: "[]",
  updatedAt: new Date(),
};

export async function getContactDetails() {
  const db = getDb();
  if (!db) return contactFallback;
  const rows = await read(() => db.select().from(contactDetails).where(eq(contactDetails.id, "school")).limit(1), []);
  return rows[0] ?? contactFallback;
}

export async function listUserContactMessages(userId: string) {
  const db = getDb();
  if (!db) return [];
  return read(
    () => db.select().from(contactMessages).where(and(eq(contactMessages.userId, userId), isNull(contactMessages.deletedAt))).orderBy(desc(contactMessages.createdAt)),
    [],
  );
}

export async function listContactMessages() {
  const db = getDb();
  if (!db) return [];
  return read(() => db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt)), []);
}

export async function listContactReplies(messageIds: string[]) {
  const db = getDb();
  if (!db || messageIds.length === 0) return [];
  return read(() => db.select().from(contactReplies).where(inArray(contactReplies.messageId, messageIds)).orderBy(asc(contactReplies.createdAt)), []);
}

export async function listUserMessageAlerts(userId: string) {
  const db = getDb();
  if (!db) return [];
  const messages = await read(
    () => db.select().from(contactMessages).where(and(eq(contactMessages.userId, userId), isNull(contactMessages.deletedAt))).orderBy(desc(contactMessages.createdAt)),
    [],
  );
  const replies = await listContactReplies(messages.map((message) => message.id));
  return messages.map((message) => {
    const adminReplies = replies.filter((reply) => reply.messageId === message.id && reply.authorRole === "admin");
    const latest = adminReplies[adminReplies.length - 1];
    return {
      id: message.id,
      subject: message.subject,
      preview: latest?.body || "Waiting for a reply.",
      unread: adminReplies.some((reply) => !reply.readAt),
      href: `/contact?chat=${message.id}`,
    };
  });
}

export async function listOfficeMessageAlerts() {
  const db = getDb();
  if (!db) return [];
  const messages = await read(
    () => db.select().from(contactMessages).where(and(isNull(contactMessages.deletedAt), isNull(contactMessages.resolvedAt))).orderBy(desc(contactMessages.createdAt)),
    [],
  );
  const replies = await listContactReplies(messages.map((message) => message.id));
  return messages.map((message) => {
    const userReplies = replies.filter((reply) => reply.messageId === message.id && reply.authorRole === "user");
    const latest = userReplies[userReplies.length - 1];
    return {
      id: message.id,
      subject: message.subject,
      preview: latest?.body || message.body,
      unread: !message.openedAt || userReplies.some((reply) => !reply.readAt),
      href: `/admin/contact?reply=${message.id}`,
    };
  });
}

export async function userCanPayFee(userId: string, role: string, studentId: string | null) {
  if (role === "admin" || !studentId) return true;
  const db = getDb();
  if (!db) return false;
  const links = await db
    .select()
    .from(guardians)
    .where(and(eq(guardians.userId, userId), eq(guardians.studentId, studentId)))
    .limit(1);
  return Boolean(links[0]);
}
