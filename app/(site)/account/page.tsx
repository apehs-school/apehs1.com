import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SetupNotice } from "@/components/setup-notice";
import { ensureCurrentUser } from "@/lib/auth";
import { clerkEnabled, databaseEnabled } from "@/lib/env";
import { formatJmd, formatLongDate } from "@/lib/format";
import { getAccountPayments, getLinkedStudents } from "@/lib/queries";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  if (!clerkEnabled() || !databaseEnabled()) return <SetupNotice />;

  const user = await ensureCurrentUser();
  if (!user) return <SetupNotice />;
  if (user.role === "admin") redirect("/admin");

  const [students, payments] = await Promise.all([getLinkedStudents(user.id), getAccountPayments(user.id)]);

  return (
    <main className="mx-auto max-w-3xl space-y-4 px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>My account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>{user.email}</p>
          {params.error === "admin" ? <p>That page is only available to administrators.</p> : null}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Students</CardTitle>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <p>No student is linked to this account yet.</p>
          ) : (
            <ul className="space-y-1">
              {students.map((student) => (
                <li key={student.id}>
                  {student.firstName} {student.lastName} — {student.grade}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Payments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {payments.length === 0 ? (
            <p>No payments yet.</p>
          ) : (
            <ul className="space-y-1">
              {payments.map((payment) => (
                <li key={payment.id}>
                  {payment.feeName ?? "School fee"} — {formatJmd(payment.amountCents)} — {payment.status} —{" "}
                  {formatLongDate(payment.createdAt.toISOString().slice(0, 10))}
                </li>
              ))}
            </ul>
          )}
          <Button nativeButton={false} render={<a href="/pay" />}>Make a payment</Button>
        </CardContent>
      </Card>
    </main>
  );
}
