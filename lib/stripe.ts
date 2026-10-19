import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { payments } from "@/db/schema";

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

export async function saveCheckoutSession(session: Stripe.Checkout.Session, status: "pending" | "paid" | "failed") {
  const db = getDb();
  if (!db) return;

  const paymentIntentId =
    typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;
  const values = {
    feeId: session.metadata?.feeId || null,
    studentId: session.metadata?.studentId || null,
    userId: session.metadata?.userId || null,
    paymentIntentId,
    amountCents: session.amount_total ?? 0,
    currency: session.currency ?? "jmd",
    status,
  };

  const existing = await db.select().from(payments).where(eq(payments.stripeSessionId, session.id)).limit(1);
  if (existing[0]) {
    if (existing[0].status === "paid" && status !== "paid") return;
    await db.update(payments).set(values).where(eq(payments.id, existing[0].id));
    return;
  }

  await db.insert(payments).values({
    id: crypto.randomUUID(),
    stripeSessionId: session.id,
    ...values,
  });
}

export async function markRefunded(paymentIntentId: string) {
  const db = getDb();
  if (!db) return;
  await db.update(payments).set({ status: "refunded" }).where(eq(payments.paymentIntentId, paymentIntentId));
}
