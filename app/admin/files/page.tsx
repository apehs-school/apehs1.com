import { deleteStoredFile, uploadStoredFile } from "@/actions/files";
import { DeleteButton } from "@/components/delete-button";
import { AdminField, adminSelectClass } from "@/components/admin-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PagedTable } from "@/components/paged-table";
import { TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { storageEnabled } from "@/lib/env";
import { fileHref } from "@/lib/storage";
import { listStoredFiles } from "@/lib/queries";

export default async function FilesAdminPage() {
  const files = await listStoredFiles();

  return (
    <div className="space-y-6">
      <h1>Files</h1>
      <p>Images and documents are stored in Neon and can be opened from the site. Other files stay private to administrators.</p>
      {storageEnabled() ? null : <p>Object storage is not configured yet.</p>}
      <Card>
        <CardHeader>
          <CardTitle>Upload a file</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3" action={uploadStoredFile}>
            <AdminField label="Kind">
              <select className={adminSelectClass} name="kind" defaultValue="images">
                <option value="images">Image</option>
                <option value="documents">Document</option>
                <option value="files">Other file</option>
              </select>
            </AdminField>
            <AdminField label="File">
              <input className="text-sm font-normal" name="file" type="file" required />
            </AdminField>
            <Button type="submit">Save file</Button>
          </form>
        </CardContent>
      </Card>
      <PagedTable
        pageKey="files"
        header={
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Kind</TableHead>
              <TableHead>Size</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
        }
        rows={files.map((file) => (
          <TableRow key={file.id}>
            <TableCell>
              <a className="text-primary underline" href={fileHref(file)}>
                {file.filename}
              </a>
            </TableCell>
            <TableCell>{file.bucket}</TableCell>
            <TableCell>{Math.ceil(file.sizeBytes / 1024)} KB</TableCell>
            <TableCell>
              <DeleteButton action={deleteStoredFile} id={file.id} label="Remove" title="Delete this file?" description="This removes the file from storage." />
            </TableCell>
          </TableRow>
        ))}
      />
    </div>
  );
}
