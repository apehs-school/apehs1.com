import { createFee, deleteFee } from "@/actions/admin";
import { DeleteButton } from "@/components/delete-button";
import { AdminField, adminSelectClass } from "@/components/admin-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PagedTable } from "@/components/paged-table";
import { TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { formatJmd, formatLongDate } from "@/lib/format";
import { listFees, listStudents } from "@/lib/queries";

export default async function FeesPage() {
  const [fees, students] = await Promise.all([listFees(), listStudents()]);

  return (
    <div className="space-y-6">
      <h1>Fees</h1>
      <Card>
        <CardHeader>
          <CardTitle>Add a fee</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3" action={createFee}>
            <AdminField label="Fee name">
              <Input name="name" required />
            </AdminField>
            <AdminField label="Description">
              <Textarea name="description" rows={3} />
            </AdminField>
            <AdminField label="Amount (JMD)">
              <Input name="amount" type="number" min="1" step="0.01" required />
            </AdminField>
            <AdminField label="Due date">
              <Input name="dueDate" type="date" />
            </AdminField>
            <AdminField label="Student">
              <select className={adminSelectClass} name="studentId" defaultValue="">
                <option value="">All students</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>{student.firstName} {student.lastName}</option>
                ))}
              </select>
            </AdminField>
            <Button type="submit">Save fee</Button>
          </form>
        </CardContent>
      </Card>
      <PagedTable
        pageKey="fees"
        header={
          <TableHeader>
            <TableRow>
              <TableHead>Fee</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Due</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
        }
        rows={fees.map((fee) => (
          <TableRow key={fee.id}>
            <TableCell>
              <strong>{fee.name}</strong>
              {fee.description ? <div>{fee.description}</div> : null}
            </TableCell>
            <TableCell>{formatJmd(fee.amountCents)}</TableCell>
            <TableCell>{fee.firstName ? `${fee.firstName} ${fee.lastName}` : "All students"}</TableCell>
            <TableCell>{fee.dueDate ? formatLongDate(fee.dueDate) : "—"}</TableCell>
            <TableCell>
              <DeleteButton action={deleteFee} id={fee.id} label="Remove" title="Remove this fee?" />
            </TableCell>
          </TableRow>
        ))}
      />
    </div>
  );
}
