import { getStripe, markRefunded, saveCheckoutSession } from "@/lib/stripe";

export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return new Response("Stripe webhook is not configured", { status: 500 });

  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  let event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch {
    return new Response("Invalid webhook signature", { status: 400 });
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    await saveCheckoutSession(event.data.object, "paid");
  }

  if (event.type === "checkout.session.async_payment_failed") {
    await saveCheckoutSession(event.data.object, "failed");
  }

  if (event.type === "charge.refunded") {
    const paymentIntent = event.data.object.payment_intent;
    const paymentIntentId = typeof paymentIntent === "string" ? paymentIntent : paymentIntent?.id;
    if (paymentIntentId) await markRefunded(paymentIntentId);
  }

  return new Response("ok");
}
