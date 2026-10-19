import { startCheckout } from "@/actions/checkout";
import { SetupNotice } from "@/components/setup-notice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ensureCurrentUser } from "@/lib/auth";
import { clerkEnabled, databaseEnabled } from "@/lib/env";
import { formatJmd, formatLongDate } from "@/lib/format";
import { listPayableFees, paidFeeIds } from "@/lib/queries";

export default async function PayPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  if (!clerkEnabled() || !databaseEnabled()) return <SetupNotice />;

  const user = await ensureCurrentUser();
  if (!user) return <SetupNotice />;

  const [fees, paid] = await Promise.all([listPayableFees(user.id, user.role), paidFeeIds()]);
  const messages: Record<string, string> = {
    stripe: "Stripe is not connected yet. Add the Stripe keys, then try again.",
    fee: "That fee could not be found.",
    forbidden: "This fee is assigned to a different student.",
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-semibold text-primary">Make a payment</h1>
      <p className="mt-2 mb-6 text-muted-foreground">Payments open on Stripe&apos;s secure page. The school site does not collect card numbers.</p>
      {params.error ? <p className="mb-4 text-destructive">{messages[params.error] ?? "The payment could not be started."}</p> : null}
      {fees.length === 0 ? (
        <p>There are no fees waiting for your account.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {fees.map((fee) => {
            const settled = paid.has(fee.id);
            return (
              <Card key={fee.id}>
                <CardHeader>
                  <CardTitle>{fee.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-lg font-semibold">{formatJmd(fee.amountCents)}</p>
                  {fee.description ? <p>{fee.description}</p> : null}
                  {fee.dueDate ? <p>Due {formatLongDate(fee.dueDate)}</p> : null}
                  <p>{fee.firstName ? `Student: ${fee.firstName} ${fee.lastName}` : "All students"}</p>
                  {settled ? (
                    <Badge>Paid</Badge>
                  ) : (
                    <form action={startCheckout}>
                      <input type="hidden" name="feeId" value={fee.id} />
                      <Button type="submit">Pay now</Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}
