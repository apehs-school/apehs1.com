"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { fees } from "@/db/schema";
import { ensureCurrentUser } from "@/lib/auth";
import { appUrl, stripeEnabled } from "@/lib/env";
import { userCanPayFee } from "@/lib/queries";
import { getStripe, saveCheckoutSession } from "@/lib/stripe";

export async function startCheckout(formData: FormData) {
  if (!stripeEnabled()) redirect("/pay?error=stripe");

  const user = await ensureCurrentUser();
  if (!user) redirect("/sign-in");

  const db = getDb();
  const stripe = getStripe();
  if (!db || !stripe) redirect("/pay?error=stripe");

  const feeId = String(formData.get("feeId") ?? "");
  const feeRows = await db.select().from(fees).where(eq(fees.id, feeId)).limit(1);
  const fee = feeRows[0];
  if (!fee) redirect("/pay?error=fee");

  const allowed = await userCanPayFee(user.id, user.role, fee.studentId);
  if (!allowed) redirect("/pay?error=forbidden");

  const origin = appUrl();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: user.email || undefined,
    client_reference_id: user.id,
    metadata: {
      feeId: fee.id,
      studentId: fee.studentId ?? "",
      userId: user.id,
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "jmd",
          unit_amount: fee.amountCents,
          product_data: {
            name: fee.name,
            description: fee.description || undefined,
          },
        },
      },
    ],
    success_url: `${origin}/pay/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pay/cancel`,
  });

  if (!session.url) redirect("/pay?error=stripe");
  await saveCheckoutSession(session, "pending");
  redirect(session.url);
}
