"use client";

import { saveContactDetails } from "@/actions/contact";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SocialLink } from "@/lib/contact";
import { jamaicaParishes } from "@/lib/profile";
import { Mail, MapPin, MessageCircle, Phone, Plus, Share2, X } from "lucide-react";
import { useState } from "react";

export function ContactDetailsForm({
  street,
  apt,
  town,
  parish,
  telephone,
  whatsapp,
  email,
  socials,
}: {
  street: string;
  apt: string;
  town: string;
  parish: string;
  telephone: string;
  whatsapp: string;
  email: string;
  socials: SocialLink[];
}) {
  const [tab, setTab] = useState<"campus" | "social">("campus");
  const [links, setLinks] = useState<SocialLink[]>(socials.length > 0 ? socials : [{ name: "", url: "" }]);

  return (
    <form className="contact-desk" action={saveContactDetails}>
      <div className="contact-switch" role="tablist" aria-label="Contact details">
        <button type="button" role="tab" aria-selected={tab === "campus"} onClick={() => setTab("campus")}>
          <MapPin size={16} aria-hidden="true" />
          Address and phone
        </button>
        <button type="button" role="tab" aria-selected={tab === "social"} onClick={() => setTab("social")}>
          <Share2 size={16} aria-hidden="true" />
          Social media
        </button>
      </div>
      <div className={`contact-pane${tab === "campus" ? " is-shown" : ""}`} hidden={tab !== "campus"}>
        <label className="contact-field" data-tone="navy">
          <span><MapPin size={15} aria-hidden="true" />Street address</span>
          <Input name="street" defaultValue={street} autoComplete="street-address" />
        </label>
        <div className="contact-pair">
          <label className="contact-field" data-tone="gold">
            <span><HomeMark />Apt, suite, or unit</span>
            <Input name="apt" defaultValue={apt} autoComplete="address-line2" />
          </label>
          <label className="contact-field" data-tone="teal">
            <span><MapPin size={15} aria-hidden="true" />Town</span>
            <Input name="town" defaultValue={town} autoComplete="address-level2" />
          </label>
        </div>
        <label className="contact-field" data-tone="violet">
          <span><MapPin size={15} aria-hidden="true" />Parish</span>
          <select name="parish" defaultValue={parish}>
            <option value="">Select a parish</option>
            {jamaicaParishes.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </label>
        <div className="contact-pair">
          <label className="contact-field" data-tone="blue">
            <span><Phone size={15} aria-hidden="true" />Telephone number</span>
            <Input name="telephone" defaultValue={telephone} autoComplete="tel" />
          </label>
          <label className="contact-field" data-tone="rose">
            <span><Mail size={15} aria-hidden="true" />Email</span>
            <Input name="email" type="email" defaultValue={email} autoComplete="email" />
          </label>
        </div>
      </div>
      <div className={`contact-pane${tab === "social" ? " is-shown" : ""}`} hidden={tab !== "social"}>
        <label className="contact-field" data-tone="green">
          <span><MessageCircle size={15} aria-hidden="true" />WhatsApp number</span>
          <Input name="whatsapp" defaultValue={whatsapp} autoComplete="tel" />
        </label>
        <div className="contact-social-head">
          <span><Share2 size={15} aria-hidden="true" />Social media accounts</span>
          <Button type="button" size="icon" variant="outline" aria-label="Add social media account" onClick={() => setLinks((current) => [...current, { name: "", url: "" }])}>
            <Plus />
          </Button>
        </div>
        {links.map((link, index) => (
          <div key={index} className="contact-social-row">
            <label className="contact-field" data-tone="gold">
              <span>Account {links.length > 1 ? index + 1 : ""}</span>
              <Input name="socialName" value={link.name} placeholder="Instagram" onChange={(event) => setLinks((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item))} />
            </label>
            <label className="contact-field" data-tone="navy">
              <span>Link {links.length > 1 ? index + 1 : ""}</span>
              <Input name="socialUrl" value={link.url} placeholder="https://" onChange={(event) => setLinks((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, url: event.target.value } : item))} />
            </label>
            {links.length > 1 ? (
              <Button type="button" size="icon" variant="outline" aria-label="Remove social media account" onClick={() => setLinks((current) => current.filter((_, itemIndex) => itemIndex !== index))}>
                <X />
              </Button>
            ) : null}
          </div>
        ))}
      </div>
      <Button type="submit" className="contact-save">Save contact information</Button>
    </form>
  );
}

function HomeMark() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
      <path fill="currentColor" d="M12 4 3 11h2v8h6v-5h2v5h6v-8h2z" />
    </svg>
  );
}
