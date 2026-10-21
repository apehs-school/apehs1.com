import { sendContactMessage } from "@/actions/contact";
import { MessageChat } from "@/components/message-chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ensureCurrentUser } from "@/lib/auth";
import { parseSocials, whatsappHref } from "@/lib/contact";
import { formatAddress } from "@/lib/profile";
import { publicObjectUrl } from "@/lib/storage";
import { getContactDetails, listContactReplies, listUserContactMessages } from "@/lib/queries";
import { Aperture, Mail, MapPin, MessageCircle, Music2, Phone, Play, Send, Share2 } from "lucide-react";

export async function ContactSection({ chatId, sent }: { chatId?: string; sent?: boolean }) {
  const details = await getContactDetails();
  const socials = parseSocials(details.socials);
  const user = await ensureCurrentUser();
  const whatsapp = whatsappHref(details.whatsapp);
  const owned = user ? await listUserContactMessages(user.id) : [];
  const openMessage = owned.find((message) => message.id === chatId);
  const replies = openMessage ? await listContactReplies([openMessage.id]) : [];
  const localAddress = formatAddress(details);
  const address = localAddress
    ? (localAddress.toLowerCase().endsWith("jamaica") ? localAddress : `${localAddress}, Jamaica`)
    : details.address;
  const phones = details.telephone.split("|").map((item) => item.trim()).filter(Boolean);

  return (
    <div className="contact-board">
      <section className="contact-tiles" aria-label="School contact details">
        {address ? (
          <article className="contact-tile" data-tone="navy">
            <span><MapPin size={20} aria-hidden="true" /></span>
            <p>Address</p>
            <strong>{address}</strong>
          </article>
        ) : null}
        {phones.length > 0 ? (
          <article className="contact-tile" data-tone="blue">
            <span><Phone size={20} aria-hidden="true" /></span>
            <p>Telephone</p>
            <strong>
              {phones.map((phone, index) => (
                <a key={phone} href={`tel:${phone.replace(/[^\d+]/g, "")}`}>{index > 0 ? ` · ${phone}` : phone}</a>
              ))}
            </strong>
          </article>
        ) : null}
        {details.whatsapp ? (
          <article className="contact-tile" data-tone="green">
            <span><MessageCircle size={20} aria-hidden="true" /></span>
            <p>WhatsApp</p>
            <strong>{whatsapp ? <a href={whatsapp}>{details.whatsapp}</a> : details.whatsapp}</strong>
          </article>
        ) : null}
        {details.email ? (
          <article className="contact-tile" data-tone="gold">
            <span><Mail size={20} aria-hidden="true" /></span>
            <p>Email</p>
            <strong><a href={`mailto:${details.email}`}>{details.email}</a></strong>
          </article>
        ) : null}
      </section>
      {socials.length > 0 ? (
        <div className="contact-socials">
          {socials.map((link) => (
            <a key={`${link.name}-${link.url}`} href={link.url} target="_blank" rel="noreferrer">
              <SocialMark name={link.name} />
              {link.name}
            </a>
          ))}
        </div>
      ) : null}
      {sent ? <p className="contact-sent">Your message was sent. A reply will show on the notification bell.</p> : null}
      <section className="contact-form">
        <header>
          <span><Send size={18} aria-hidden="true" /></span>
          <div>
            <h2>Send us a message</h2>
            <p>The school office will reply on your notification bell.</p>
          </div>
        </header>
        {user ? (
          <form action={sendContactMessage}>
            <Label className="grid gap-2">Full name<Input name="name" defaultValue={user.name} required /></Label>
            <Label className="grid gap-2">Email<Input name="email" type="email" defaultValue={user.email} required /></Label>
            <Label className="grid gap-2">Subject<Input name="subject" required /></Label>
            <Label className="grid gap-2">Message<Textarea name="body" rows={5} required /></Label>
            <Button className="contact-send" type="submit">Send message</Button>
          </form>
        ) : (
          <p>
            <a href="/sign-in">Sign in</a> to send a message and see the school’s reply.
          </p>
        )}
      </section>
      {openMessage ? (
        <MessageChat
          messageId={openMessage.id}
          title={openMessage.subject}
          opener={{ name: openMessage.name, body: openMessage.body, createdAt: openMessage.createdAt.toISOString() }}
          viewer="user"
          closeHref="/contact"
          turns={replies.map((item) => ({ id: item.id, authorRole: item.authorRole, body: item.body, imageUrl: item.imageKey ? publicObjectUrl("images", item.imageKey) : null, createdAt: item.createdAt.toISOString() }))}
        />
      ) : null}
    </div>
  );
}

function SocialMark({ name }: { name: string }) {
  const key = name.toLowerCase();
  if (key.includes("tik")) return <Music2 size={16} aria-hidden="true" />;
  if (key.includes("insta")) return <Aperture size={16} aria-hidden="true" />;
  if (key.includes("you")) return <Play size={16} aria-hidden="true" />;
  if (key.includes("face") || key.includes("web")) return <Share2 size={16} aria-hidden="true" />;
  return <Share2 size={16} aria-hidden="true" />;
}
