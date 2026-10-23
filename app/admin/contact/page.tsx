import { deleteContactMessage, markMessageOpened, purgeContactMessage, resolveContactMessage } from "@/actions/contact";
import { ContactDetailsForm } from "@/components/contact-details-form";
import { DeleteButton } from "@/components/delete-button";
import { MessageChat } from "@/components/message-chat";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBackdrop, DialogPopup, DialogPortal, DialogTitle } from "@/components/ui/dialog";
import { PagedTable } from "@/components/paged-table";
import { TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { contactAddressParts, parseSocials } from "@/lib/contact";
import { formatChatTime } from "@/lib/format";
import { publicObjectUrl } from "@/lib/storage";
import { getContactDetails, listContactMessages, listContactReplies } from "@/lib/queries";

export default async function ContactAdminPage({ searchParams }: { searchParams: Promise<{ reply?: string; view?: string; tab?: string; page?: string }> }) {
  const { reply, view, tab, page } = await searchParams;
  const history = tab === "history";
  const focusId = view || reply;
  if (focusId) await markMessageOpened(focusId);
  const details = contactAddressParts(await getContactDetails());
  const messages = await listContactMessages();
  const replies = await listContactReplies(messages.map((message) => message.id));
  const fresh = (messageId: string, openedAt: Date | null) => {
    const fromSender = replies.filter((item) => item.messageId === messageId && item.authorRole === "user");
    return !openedAt || fromSender.some((item) => !item.readAt);
  };
  const visible = messages.filter((message) => (history ? Boolean(message.deletedAt || message.resolvedAt) : !message.deletedAt && !message.resolvedAt));
  const href = (extra: Record<string, string> = {}) => {
    const params = new URLSearchParams();
    if (history) params.set("tab", "history");
    if (page && page !== "1") params.set("page", page);
    for (const [key, value] of Object.entries(extra)) params.set(key, value);
    const text = params.toString();
    return text ? `/admin/contact?${text}` : "/admin/contact";
  };
  const backHref = href();
  const openMessage = messages.find((message) => message.id === reply);
  const viewedMessage = messages.find((message) => message.id === view);

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1>Contact us</h1>
        <p className="text-sm text-muted-foreground">These details appear on the public contact page.</p>
        <ContactDetailsForm
          street={details.street}
          apt={details.apt}
          town={details.town}
          parish={details.parish}
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
        <PagedTable
          pageKey="page"
          header={
            <TableHeader>
              <TableRow>
                <TableHead>From</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Received</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
          }
          rows={visible.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6}>{history ? "No message history yet." : "No messages yet."}</TableCell>
            </TableRow>
          ) : visible.map((message) => (
              <TableRow key={message.id} className={!history && fresh(message.id, message.openedAt) ? "message-fresh" : undefined}>
                <TableCell className="whitespace-normal">
                  <strong>{message.name}</strong>
                  <div className="text-sm text-muted-foreground">{message.email}</div>
                </TableCell>
                <TableCell className="whitespace-normal">{message.subject}</TableCell>
                <TableCell className="max-w-xs whitespace-normal">
                  <p className="line-clamp-2">{message.body}</p>
                </TableCell>
                <TableCell className="whitespace-normal">
                  {formatChatTime(message.createdAt)}
                </TableCell>
                <TableCell className="whitespace-normal">
                  {history ? (
                    message.deletedAt ? (
                      <span>Deleted by {message.deletedBy || "Admin"} · {formatChatTime(message.deletedAt)}</span>
                    ) : (
                      <span>Resolved by {message.resolvedBy || "Admin"} · {formatChatTime(message.resolvedAt ?? message.createdAt)}</span>
                    )
                  ) : fresh(message.id, message.openedAt) ? (
                    <span className="message-new">New</span>
                  ) : (
                    <span>
                      <span className="message-open">Open</span>
                      {message.openedBy ? <span className="message-actor">{message.openedBy}</span> : null}
                    </span>
                  )}
                </TableCell>
                <TableCell className="whitespace-normal">
                  <div className="flex flex-wrap justify-end gap-2">
                    {history ? null : (
                      <DeleteButton
                        action={resolveContactMessage}
                        id={message.id}
                        label="Resolved"
                        title="Mark this message resolved?"
                        description="This moves the completed message to Message history."
                        confirmVariant="default"
                      />
                    )}
                    <Button variant="outline" nativeButton={false} render={<a href={href({ view: message.id })} />}>View</Button>
                    <Button variant="outline" nativeButton={false} render={<a href={href({ reply: message.id })} />}>Response</Button>
                    <DeleteButton
                      action={history ? purgeContactMessage : deleteContactMessage}
                      id={message.id}
                      description={history ? "This permanently deletes the message." : "This moves the message to Message history."}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
        />
      </div>
      {viewedMessage ? (
        <Dialog defaultOpen>
          <DialogPortal>
            <DialogBackdrop />
            <DialogPopup>
              <DialogTitle className="mb-4">{viewedMessage.subject}</DialogTitle>
              <p className="text-sm text-muted-foreground">{viewedMessage.name} · {viewedMessage.email}</p>
              <p className="mt-4 whitespace-pre-line leading-7">{viewedMessage.body}</p>
              <a href={backHref} className="mt-6 inline-flex h-9 items-center rounded-lg border px-3">Close</a>
            </DialogPopup>
          </DialogPortal>
        </Dialog>
      ) : null}
      {openMessage ? (
        <MessageChat
          messageId={openMessage.id}
          title={`Reply to ${openMessage.name}`}
          opener={{ name: openMessage.name, body: openMessage.body, createdAt: openMessage.createdAt.toISOString() }}
          viewer="admin"
          closeHref={backHref}
          turns={replies
            .filter((item) => item.messageId === openMessage.id)
            .map((item) => ({ id: item.id, authorRole: item.authorRole, body: item.body, imageUrl: item.imageKey ? publicObjectUrl("images", item.imageKey) : null, createdAt: item.createdAt.toISOString() }))}
        />
      ) : null}
    </div>
  );
}
