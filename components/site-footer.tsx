import { BackToTop } from "@/components/back-to-top";
import { parseSocials, whatsappHref } from "@/lib/contact";
import { formatAddress } from "@/lib/profile";
import { getContactDetails } from "@/lib/queries";
import { Clock, Mail, MapPin, MessageCircle, Phone, Share2 } from "lucide-react";

const officeHours = "7:30 AM – 5:05 PM";

export async function SiteFooter() {
  const details = await getContactDetails();
  const localAddress = formatAddress(details);
  const address = localAddress
    ? (localAddress.toLowerCase().endsWith("jamaica") ? localAddress : `${localAddress}, Jamaica`)
    : details.address;
  const phones = details.telephone.split("|").map((item) => item.trim()).filter(Boolean);
  const whatsapp = whatsappHref(details.whatsapp);
  const socials = parseSocials(details.socials);

  return (
    <footer className="site-footer">
      <div className="site-footer-panel">
        <div className="site-footer-directory">
          <div>
            <p><MapPin size={14} aria-hidden="true" />Address</p>
            <strong>{address || "37 Hope Road, Kingston, Jamaica"}</strong>
          </div>
          <div>
            <p><Phone size={14} aria-hidden="true" />Telephone</p>
            {phones.length > 0 ? phones.map((phone) => (
              <a key={phone} href={`tel:${phone.replace(/[^\d+]/g, "")}`}>{phone}</a>
            )) : <strong>876-927-8874</strong>}
          </div>
          {details.whatsapp ? (
            <div>
              <p><MessageCircle size={14} aria-hidden="true" />WhatsApp</p>
              {whatsapp ? <a href={whatsapp}>{details.whatsapp}</a> : <strong>{details.whatsapp}</strong>}
            </div>
          ) : null}
          <div>
            <p><Mail size={14} aria-hidden="true" />Email</p>
            {details.email ? <a href={`mailto:${details.email}`}>{details.email}</a> : <strong>ardenne.prep.saw@moeschools.edu.jm</strong>}
          </div>
          <div>
            <p><Clock size={14} aria-hidden="true" />Hours</p>
            <strong>{officeHours}</strong>
          </div>
        </div>
        {socials.length > 0 ? (
          <div className="site-footer-socials">
            <p><Share2 size={14} aria-hidden="true" />Social media</p>
            {socials.map((link) => (
              <a key={`${link.name}-${link.url}`} href={link.url} target="_blank" rel="noreferrer">
                <span className="site-social-icon" aria-hidden="true"><SocialIcon name={link.name} /></span>
                {link.name}
              </a>
            ))}
          </div>
        ) : null}
      </div>
      <div className="site-footer-bar">
        <p>© {new Date().getFullYear()} Ardenne Preparatory and Extension High School</p>
        <BackToTop />
      </div>
    </footer>
  );
}

function SocialIcon({ name }: { name: string }) {
  const key = name.toLowerCase();
  if (key.includes("insta")) {
    return (
      <svg viewBox="0 0 24 24" width="15" height="15">
        <rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="3.6" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="17.2" cy="6.8" r="1" fill="currentColor" />
      </svg>
    );
  }
  if (key.includes("tik")) {
    return (
      <svg viewBox="0 0 24 24" width="15" height="15">
        <path fill="currentColor" d="M14 3h2.1a5.1 5.1 0 0 0 3.5 3.3v2.2a7.3 7.3 0 0 1-3.5-.9v6.7a5.2 5.2 0 1 1-5.2-5.2c.3 0 .6 0 .9.1v2.3A3 3 0 1 0 14 14.2V3z" />
      </svg>
    );
  }
  if (key.includes("you")) {
    return (
      <svg viewBox="0 0 24 24" width="15" height="15">
        <rect x="2.5" y="6" width="19" height="12" rx="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path fill="currentColor" d="M11 9.5v5l4.5-2.5z" />
      </svg>
    );
  }
  if (key.includes("face")) {
    return (
      <svg viewBox="0 0 24 24" width="15" height="15">
        <path fill="currentColor" d="M14 9h2V6h-2c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h2.2l.8-3H13v-2c0-.6.4-1 1-1z" />
      </svg>
    );
  }
  return <Share2 size={15} />;
}
