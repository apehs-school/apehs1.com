import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PaymentCancelPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Payment cancelled</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>No charge was completed. You can return to the fee list when you are ready.</p>
          <Button nativeButton={false} render={<a href="/pay" />}>Back to payments</Button>
        </CardContent>
      </Card>
    </main>
  );
}
