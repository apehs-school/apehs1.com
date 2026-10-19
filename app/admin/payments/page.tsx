import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatJmd, formatLongDate } from "@/lib/format";
import { listPayments } from "@/lib/queries";

export default async function PaymentsPage() {
  const payments = await listPayments();

  return (
    <div className="space-y-6">
      <h1>Payments</h1>
      <p>A payment is marked paid only after Stripe confirms it.</p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fee</TableHead>
            <TableHead>Student</TableHead>
            <TableHead>Parent</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell>{payment.feeName ?? "—"}</TableCell>
              <TableCell>{payment.firstName ? `${payment.firstName} ${payment.lastName}` : "—"}</TableCell>
              <TableCell>{payment.email ?? "—"}</TableCell>
              <TableCell>{formatJmd(payment.amountCents)}</TableCell>
              <TableCell>{payment.status}</TableCell>
              <TableCell>{formatLongDate(payment.createdAt.toISOString().slice(0, 10))}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
