import { sendContactMessage } from "@/actions/contact";
import { MessageChat } from "@/components/message-chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ensureCurrentUser } from "@/lib/auth";
import { parseSocials, whatsappHref } from "@/lib/contact";
import { getContactDetails, listContactReplies, listUserContactMessages } from "@/lib/queries";

export async function ContactSection({ chatId, sent }: { chatId?: string; sent?: boolean }) {
  const details = await getContactDetails();
  const socials = parseSocials(details.socials);
  const user = await ensureCurrentUser();
  const whatsapp = whatsappHref(details.whatsapp);
  const owned = user ? await listUserContactMessages(user.id) : [];
  const openMessage = owned.find((message) => message.id === chatId);
  const replies = openMessage ? await listContactReplies([openMessage.id]) : [];

  return (
    <div className="grid gap-8">
      <section className="grid gap-3 rounded-xl border bg-card p-5">
        {details.address ? <p className="whitespace-pre-line"><strong>Address: </strong>{details.address}</p> : null}
        {details.telephone ? <p><strong>Telephone: </strong><a className="underline" href={`tel:${details.telephone.split("|")[0]?.replace(/[^\d+]/g, "")}`}>{details.telephone}</a></p> : null}
        {details.whatsapp ? <p><strong>WhatsApp: </strong>{whatsapp ? <a className="underline" href={whatsapp}>{details.whatsapp}</a> : details.whatsapp}</p> : null}
        {details.email ? <p><strong>Email: </strong><a className="underline" href={`mailto:${details.email}`}>{details.email}</a></p> : null}
        {socials.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {socials.map((link) => (
              <Button key={`${link.name}-${link.url}`} nativeButton={false} variant="outline" render={<a href={link.url} target="_blank" rel="noreferrer" />}>
                {link.name}
              </Button>
            ))}
          </div>
        ) : null}
      </section>
      {sent ? <p className="rounded-lg bg-[#e8f5e9] px-4 py-3 text-sm">Your message was sent. A reply will show on the notification bell.</p> : null}
      <section className="rounded-xl border bg-card p-5">
        <h2 className="mb-4 text-xl font-semibold text-primary">Send us a message</h2>
        {user ? (
          <form className="grid gap-3" action={sendContactMessage}>
            <Label className="grid gap-2">Full name<Input name="name" required /></Label>
            <Label className="grid gap-2">Email<Input name="email" type="email" defaultValue={user.email} required /></Label>
            <Label className="grid gap-2">Subject<Input name="subject" required /></Label>
            <Label className="grid gap-2">Message<Textarea name="body" rows={5} required /></Label>
            <Button type="submit">Send message</Button>
          </form>
        ) : (
          <p>
            <a className="underline" href="/sign-in">Sign in</a> to send a message and see the school’s reply.
          </p>
        )}
      </section>
      {openMessage ? (
        <MessageChat
          messageId={openMessage.id}
          title={openMessage.subject}
          opener={{ name: openMessage.name, body: openMessage.body }}
          viewer="user"
          closeHref="/contact"
          turns={replies.map((item) => ({ id: item.id, authorRole: item.authorRole, body: item.body, createdAt: item.createdAt.toISOString() }))}
        />
      ) : null}
    </div>
  );
}
