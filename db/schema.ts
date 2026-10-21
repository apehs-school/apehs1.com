import { boolean, date, integer, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["parent", "staff", "admin"]);
export const paymentStatus = pgEnum("payment_status", ["pending", "paid", "failed", "refunded"]);

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  email: text("email").notNull().default(""),
  name: text("name").notNull().default(""),
  role: userRole("role").notNull().default("parent"),
  accountStatus: text("account_status").notNull().default("parent"),
  phone: text("phone").notNull().default(""),
  street: text("street").notNull().default(""),
  apt: text("apt").notNull().default(""),
  town: text("town").notNull().default(""),
  parish: text("parish").notNull().default(""),
  address: text("address").notNull().default(""),
  securityQuestion: text("security_question").notNull().default(""),
  securityAnswerHash: text("security_answer_hash").notNull().default(""),
  securityAnswer: text("security_answer").notNull().default(""),
  securityQuestionTwo: text("security_question_two").notNull().default(""),
  securityAnswerTwoHash: text("security_answer_two_hash").notNull().default(""),
  securityAnswerTwo: text("security_answer_two").notNull().default(""),
  privilege: text("privilege"),
  banned: boolean("banned").notNull().default(false),
  clerkCreatedAt: timestamp("clerk_created_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const adminGrants = pgTable("admin_grants", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  privilege: text("privilege").notNull(),
  assignedBy: text("assigned_by").references(() => users.id, { onDelete: "set null" }),
  assignedAt: timestamp("assigned_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userEvents = pgTable("user_events", {
  id: text("id").primaryKey(),
  actorId: text("actor_id").references(() => users.id, { onDelete: "set null" }),
  actorName: text("actor_name").notNull().default(""),
  targetId: text("target_id").references(() => users.id, { onDelete: "set null" }),
  targetName: text("target_name").notNull().default(""),
  action: text("action").notNull(),
  detail: text("detail").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const students = pgTable("students", {
  id: text("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  grade: text("grade").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const guardians = pgTable("guardians", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  studentId: text("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
});

export const fees = pgTable("fees", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  amountCents: integer("amount_cents").notNull(),
  dueDate: date("due_date"),
  studentId: text("student_id").references(() => students.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const payments = pgTable("payments", {
  id: text("id").primaryKey(),
  feeId: text("fee_id").references(() => fees.id, { onDelete: "set null" }),
  studentId: text("student_id").references(() => students.id, { onDelete: "set null" }),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  stripeSessionId: text("stripe_session_id").notNull().unique(),
  paymentIntentId: text("payment_intent_id"),
  amountCents: integer("amount_cents").notNull(),
  currency: text("currency").notNull().default("jmd"),
  status: paymentStatus("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const news = pgTable("news", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  details: text("details").notNull().default(""),
  category: text("category").notNull().default("Announcement"),
  audience: text("audience").notNull().default("Everyone"),
  eventDate: date("event_date").notNull(),
  showFrom: date("show_from"),
  endsOn: date("ends_on"),
  pinned: boolean("pinned").notNull().default(false),
  images: text("images").notNull().default("[]"),
  published: boolean("published").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const events = pgTable("events", {
  id: text("id").primaryKey(),
  eventDate: date("event_date").notNull(),
  endsOn: date("ends_on").notNull(),
  title: text("title").notNull(),
  details: text("details"),
  published: boolean("published").notNull().default(true),
});

export const admissionRecords = pgTable("admission_records", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  department: text("department").notNull(),
  introduction: text("introduction").notNull(),
  minAge: integer("min_age"),
  maxAge: integer("max_age"),
  gradeRange: text("grade_range").notNull().default(""),
  eligibilityNote: text("eligibility_note").notNull().default(""),
  documents: text("documents").notNull().default("[]"),
  steps: text("steps").notNull().default("[]"),
  additional: text("additional").notNull().default(""),
  published: boolean("published").notNull().default(false),
  publishedSnapshot: text("published_snapshot"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const admissionMeta = pgTable("admission_meta", {
  id: text("id").primaryKey(),
  migratedAt: timestamp("migrated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const admissionApplications = pgTable("admission_applications", {
  id: text("id").primaryKey(),
  photoFileId: text("photo_file_id"),
  academicYear: text("academic_year").notNull(),
  lastName: text("last_name").notNull(),
  firstName: text("first_name").notNull(),
  middleName: text("middle_name").notNull().default(""),
  sex: text("sex").notNull(),
  birthDate: text("birth_date").notNull().default(""),
  birthMonth: text("birth_month").notNull().default(""),
  birthYear: text("birth_year").notNull().default(""),
  age: text("age").notNull().default(""),
  birthPlace: text("birth_place").notNull().default(""),
  nationality: text("nationality").notNull().default(""),
  address: text("address").notNull().default(""),
  nsrn: text("nsrn").notNull().default(""),
  gradeSeeking: text("grade_seeking").notNull().default(""),
  church: text("church").notNull().default(""),
  pastor: text("pastor").notNull().default(""),
  entryType: text("entry_type").notNull(),
  lastSchool: text("last_school").notNull().default(""),
  lastGrade: text("last_grade").notNull().default(""),
  mother: text("mother").notNull().default("{}"),
  father: text("father").notNull().default("{}"),
  guardian: text("guardian").notNull().default("{}"),
  emergency: text("emergency").notNull().default("{}"),
  declaration: text("declaration").notNull().default("{}"),
  documents: text("documents").notNull().default("[]"),
  office: text("office").notNull().default("{}"),
  behaviour: text("behaviour").notNull().default("{}"),
  submissionNumber: integer("submission_number").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const behaviourAssessments = pgTable("behaviour_assessments", {
  id: text("id").primaryKey(),
  lastName: text("last_name").notNull(),
  firstName: text("first_name").notNull(),
  middleName: text("middle_name").notNull().default(""),
  lastSchool: text("last_school").notNull(),
  answers: text("answers").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const scholarshipRecords = pgTable("scholarship_records", {
  id: text("id").primaryKey(),
  studentName: text("student_name").notNull(),
  awardName: text("award_name").notNull(),
  year: integer("year").notNull(),
  grade: text("grade").notNull().default(""),
  department: text("department").notNull(),
  organization: text("organization").notNull().default(""),
  details: text("details").notNull().default(""),
  published: boolean("published").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const awardPages = pgTable("award_pages", {
  slug: text("slug").primaryKey(),
  title: text("title").notNull(),
  introduction: text("introduction").notNull().default(""),
  pepResults: text("pep_results").notNull().default("[]"),
  assessments: text("assessments").notNull().default("[]"),
  awards: text("awards").notNull().default("[]"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sitePages = pgTable("site_pages", {
  slug: text("slug").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  group: text("group").notNull(),
  published: boolean("published").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const pageEntries = pgTable("page_entries", {
  id: text("id").primaryKey(),
  section: text("section").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  imageKey: text("image_key"),
  published: boolean("published").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const staffMembers = pgTable("staff_members", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  title: text("title").notNull(),
  assignments: text("assignments").notNull().default("[]"),
  note: text("note").notNull().default(""),
  imageKey: text("image_key"),
  published: boolean("published").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const activities = pgTable("activities", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  schedule: text("schedule").notNull(),
  venue: text("venue").notNull().default(""),
  lead: text("lead").notNull().default(""),
  cost: text("cost").notNull().default(""),
  attire: text("attire").notNull().default(""),
  note: text("note"),
  startsOn: date("starts_on").notNull(),
  endsOn: date("ends_on").notNull(),
  published: boolean("published").notNull().default(true),
});

export const menuItems = pgTable("menu_items", {
  id: text("id").primaryKey(),
  startsOn: date("starts_on").notNull(),
  endsOn: date("ends_on").notNull(),
  category: text("category").notNull(),
  name: text("name").notNull().default(""),
  description: text("description").notNull(),
  priceCents: integer("price_cents"),
  imageKey: text("image_key"),
  published: boolean("published").notNull().default(true),
});

export const menuCategories = pgTable("menu_categories", {
  name: text("name").primaryKey(),
  published: boolean("published").notNull().default(false),
});

export const storedFiles = pgTable("stored_files", {
  id: text("id").primaryKey(),
  bucket: text("bucket").notNull(),
  objectKey: text("object_key").notNull(),
  filename: text("filename").notNull(),
  contentType: text("content_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const contactDetails = pgTable("contact_details", {
  id: text("id").primaryKey(),
  address: text("address").notNull().default(""),
  street: text("street").notNull().default(""),
  apt: text("apt").notNull().default(""),
  town: text("town").notNull().default(""),
  parish: text("parish").notNull().default(""),
  telephone: text("telephone").notNull().default(""),
  whatsapp: text("whatsapp").notNull().default(""),
  email: text("email").notNull().default(""),
  socials: text("socials").notNull().default("[]"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const contactMessages = pgTable("contact_messages", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  email: text("email").notNull().default(""),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  openedAt: timestamp("opened_at", { withTimezone: true }),
  openedBy: text("opened_by").notNull().default(""),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  resolvedBy: text("resolved_by").notNull().default(""),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  deletedBy: text("deleted_by").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const contactReplies = pgTable("contact_replies", {
  id: text("id").primaryKey(),
  messageId: text("message_id")
    .notNull()
    .references(() => contactMessages.id, { onDelete: "cascade" }),
  authorRole: text("author_role").notNull(),
  body: text("body").notNull(),
  imageKey: text("image_key").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  readAt: timestamp("read_at", { withTimezone: true }),
});

export const devotionals = pgTable("devotionals", {
  id: text("id").primaryKey(),
  verse: text("verse").notNull(),
  reference: text("reference").notNull(),
  prayer: text("prayer").notNull(),
  activeDate: date("active_date").notNull(),
  endsOn: date("ends_on").notNull(),
  published: boolean("published").notNull().default(true),
});
