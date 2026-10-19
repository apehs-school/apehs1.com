import { updateUserRole } from "@/actions/admin";
import { AdminField, adminSelectClass } from "@/components/admin-field";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listUsers } from "@/lib/queries";

export default async function UsersPage() {
  const accounts = await listUsers();

  return (
    <div className="space-y-6">
      <h1>Users</h1>
      <p>Parents appear here after they sign in with Clerk.</p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.map((account) => (
            <TableRow key={account.id}>
              <TableCell>{account.email || account.clerkUserId}</TableCell>
              <TableCell>
                <form className="flex items-end gap-2" action={updateUserRole}>
                  <input type="hidden" name="id" value={account.id} />
                  <AdminField label="Role">
                    <select className={adminSelectClass} name="role" defaultValue={account.role}>
                      <option value="parent">parent</option>
                      <option value="staff">staff</option>
                      <option value="admin">admin</option>
                    </select>
                  </AdminField>
                  <Button type="submit">Save</Button>
                </form>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
