import { ensureCurrentUser, hasAdminAccess } from "@/lib/auth";
import { getStoredFile } from "@/lib/queries";
import { isStorageBucket, publicObjectUrl, readStoredObject } from "@/lib/storage";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const file = await getStoredFile(id);
  if (!file || !isStorageBucket(file.bucket)) {
    return new Response("File not found", { status: 404 });
  }

  const publicUrl = publicObjectUrl(file.bucket, file.objectKey);
  if (publicUrl) return Response.redirect(publicUrl, 302);

  const user = await ensureCurrentUser();
  if (!user || !hasAdminAccess(user)) return new Response("Forbidden", { status: 403 });

  const object = await readStoredObject(file.bucket, file.objectKey);
  const body = object.Body;
  if (!body) return new Response("File not found", { status: 404 });

  return new Response(body.transformToWebStream(), {
    headers: {
      "Content-Type": file.contentType || "application/octet-stream",
      "Content-Disposition": `inline; filename="${file.filename.replace(/"/g, "")}"`,
    },
  });
}
