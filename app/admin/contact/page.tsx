import { deleteContactMessage, markMessageOpened, purgeContactMessage } from "@/actions/contact";
import { ContactDetailsForm } from "@/components/contact-details-form";
import { DeleteButton } from "@/components/delete-button";
import { MessageChat } from "@/components/message-chat";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBackdrop, DialogPopup, DialogPortal, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { parseSocials } from "@/lib/contact";
import { getContactDetails, listContactMessages, listContactReplies } from "@/lib/queries";

export default async function ContactAdminPage({ searchParams }: { searchParams: Promise<{ reply?: string; view?: string; tab?: string }> }) {
  const { reply, view, tab } = await searchParams;
  const history = tab === "history";
  const focusId = view || reply;
  if (focusId) await markMessageOpened(focusId);
  const details = await getContactDetails();
  const messages = await listContactMessages();
  const replies = await listContactReplies(messages.map((message) => message.id));
  const visible = messages.filter((message) => (history ? Boolean(message.deletedAt || message.openedAt) : !message.deletedAt && !message.openedAt));
  const openMessage = messages.find((message) => message.id === reply);
  const viewedMessage = messages.find((message) => message.id === view);

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1>Contact us</h1>
        <p className="text-sm text-muted-foreground">These details appear on the public contact page.</p>
        <ContactDetailsForm
          address={details.address}
          telephone={details.telephone}
          whatsapp={details.whatsapp}
          email={details.email}
          socials={parseSocials(details.socials)}
        />
      </div>
      <div className="space-y-4">
        <div className="flex gap-2 border-b border-[#d9e0ea]">
          <a href="/admin/contact" aria-current={history ? undefined : "page"} className={`border-b-2 px-3 py-2 text-sm font-medium ${history ? "border-transparent text-[#24344d]" : "border-[#0d47a1] text-[#0d47a1]"}`}>Messages</a>
          <a href="/admin/contact?tab=history" aria-current={history ? "page" : undefined} className={`border-b-2 px-3 py-2 text-sm font-medium ${history ? "border-[#0d47a1] text-[#0d47a1]" : "border-transparent text-[#24344d]"}`}>Message history</a>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>From</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Received</TableHead>
              {history ? <TableHead>Status</TableHead> : null}
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={history ? 6 : 5}>{history ? "No message history yet." : "No messages yet."}</TableCell>
              </TableRow>
            ) : visible.map((message) => (
              <TableRow key={message.id}>
                <TableCell className="whitespace-normal">
                  <strong>{message.name}</strong>
                  <div className="text-sm text-muted-foreground">{message.email}</div>
                </TableCell>
                <TableCell className="whitespace-normal">{message.subject}</TableCell>
                <TableCell className="max-w-xs whitespace-normal">
                  <p className="line-clamp-2">{message.body}</p>
                </TableCell>
                <TableCell className="whitespace-normal">
                  {new Date(message.createdAt).toLocaleString("en-JM", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Jamaica" })}
                </TableCell>
                {history ? <TableCell>{message.deletedAt ? "Deleted" : "Open"}</TableCell> : null}
                <TableCell className="whitespace-normal">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button variant="outline" nativeButton={false} render={<a href={`/admin/contact?tab=${history ? "history" : "messages"}&view=${message.id}`} />}>View</Button>
                    <Button variant="outline" nativeButton={false} render={<a href={`/admin/contact?tab=${history ? "history" : "messages"}&reply=${message.id}`} />}>Response</Button>
                    <DeleteButton
                      action={history ? purgeContactMessage : deleteContactMessage}
                      id={message.id}
                      description={history ? "This permanently deletes the message." : "This moves the message to Message history."}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {viewedMessage ? (
        <Dialog defaultOpen>
          <DialogPortal>
            <DialogBackdrop />
            <DialogPopup>
              <DialogTitle className="mb-4">{viewedMessage.subject}</DialogTitle>
              <p className="text-sm text-muted-foreground">{viewedMessage.name} · {viewedMessage.email}</p>
              <p className="mt-4 whitespace-pre-line leading-7">{viewedMessage.body}</p>
              <a href="/admin/contact?tab=history" className="mt-6 inline-flex h-9 items-center rounded-lg border px-3">Close</a>
            </DialogPopup>
          </DialogPortal>
        </Dialog>
      ) : null}
      {openMessage ? (
        <MessageChat
          messageId={openMessage.id}
          title={`Reply to ${openMessage.name}`}
          opener={{ name: openMessage.name, body: openMessage.body }}
          viewer="admin"
          closeHref="/admin/contact?tab=history"
          turns={replies
            .filter((item) => item.messageId === openMessage.id)
            .map((item) => ({ id: item.id, authorRole: item.authorRole, body: item.body, createdAt: item.createdAt.toISOString() }))}
        />
      ) : null}
    </div>
  );
}
