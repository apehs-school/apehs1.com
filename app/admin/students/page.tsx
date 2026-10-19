import { createStudent, deleteStudent, linkGuardian } from "@/actions/admin";
import { DeleteButton } from "@/components/delete-button";
import { AdminField, adminSelectClass } from "@/components/admin-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listGuardians, listStudents, listUsers } from "@/lib/queries";

export default async function StudentsPage() {
  const [students, accounts, links] = await Promise.all([listStudents(), listUsers(), listGuardians()]);

  return (
    <div className="space-y-6">
      <h1>Students</h1>
      <Card>
        <CardHeader>
          <CardTitle>Add a student</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3" action={createStudent}>
            <AdminField label="First name">
              <Input name="firstName" required />
            </AdminField>
            <AdminField label="Last name">
              <Input name="lastName" required />
            </AdminField>
            <AdminField label="Grade">
              <Input name="grade" required />
            </AdminField>
            <Button type="submit">Save student</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Link a parent</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3" action={linkGuardian}>
            <AdminField label="Parent">
              <select className={adminSelectClass} name="userId" required defaultValue="">
                <option value="" disabled>Choose a signed-in parent</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>{account.email || account.clerkUserId}</option>
                ))}
              </select>
            </AdminField>
            <AdminField label="Student">
              <select className={adminSelectClass} name="studentId" required defaultValue="">
                <option value="" disabled>Choose a student</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>{student.firstName} {student.lastName}</option>
                ))}
              </select>
            </AdminField>
            <Button type="submit">Link parent</Button>
          </form>
        </CardContent>
      </Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Grade</TableHead>
            <TableHead>Parents</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => (
            <TableRow key={student.id}>
              <TableCell>{student.firstName} {student.lastName}</TableCell>
              <TableCell>{student.grade}</TableCell>
              <TableCell>{links.filter((link) => link.studentId === student.id).map((link) => link.email).join(", ") || "—"}</TableCell>
              <TableCell>
                <DeleteButton action={deleteStudent} id={student.id} label="Remove" title="Remove this student?" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
