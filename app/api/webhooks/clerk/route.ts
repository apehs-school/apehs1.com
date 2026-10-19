import { Webhook } from "svix";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { adminEmails } from "@/lib/env";

type ClerkEmail = { id: string; email_address: string };
type ClerkUserEvent = {
  type: string;
  data: {
    id: string;
    email_addresses?: ClerkEmail[];
    primary_email_address_id?: string | null;
  };
};

function emailFromEvent(data: ClerkUserEvent["data"]) {
  return (
    data.email_addresses?.find((item) => item.id === data.primary_email_address_id)?.email_address ??
    data.email_addresses?.[0]?.email_address ??
    ""
  );
}

export async function POST(request: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  const db = getDb();
  if (!secret || !db) return new Response("Clerk webhook is not configured", { status: 500 });

  const payload = await request.text();
  const headers = {
    "svix-id": request.headers.get("svix-id") ?? "",
    "svix-timestamp": request.headers.get("svix-timestamp") ?? "",
    "svix-signature": request.headers.get("svix-signature") ?? "",
  };

  let event: ClerkUserEvent;
  try {
    event = new Webhook(secret).verify(payload, headers) as unknown as ClerkUserEvent;
  } catch {
    return new Response("Invalid webhook signature", { status: 400 });
  }

  if (event.type === "user.created" || event.type === "user.updated") {
    const email = emailFromEvent(event.data);
    const existing = await db.select().from(users).where(eq(users.clerkUserId, event.data.id)).limit(1);
    if (!existing[0]) {
      const role = adminEmails().includes(email.toLowerCase()) ? "admin" : "parent";
      await db.insert(users).values({
        id: crypto.randomUUID(),
        clerkUserId: event.data.id,
        email,
        role,
      });
    } else if (email) {
      await db.update(users).set({ email }).where(eq(users.id, existing[0].id));
    }
  }

  if (event.type === "user.deleted") {
    await db.delete(users).where(eq(users.clerkUserId, event.data.id));
  }

  return new Response("ok");
}
