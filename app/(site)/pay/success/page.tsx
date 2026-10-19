import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Payment submitted</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>Stripe has accepted the payment. It will appear in your account and the admin dashboard after confirmation.</p>
          {params.session_id ? <p>Reference: {params.session_id}</p> : null}
          <Button nativeButton={false} render={<a href="/account" />}>View my account</Button>
        </CardContent>
      </Card>
    </main>
  );
}
