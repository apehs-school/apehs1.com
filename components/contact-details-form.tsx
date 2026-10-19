"use client";

import { saveContactDetails } from "@/actions/contact";
import { AdminField } from "@/components/admin-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { SocialLink } from "@/lib/contact";
import { Plus, X } from "lucide-react";
import { useState } from "react";

const fieldClass = "h-11 text-base";

export function ContactDetailsForm({
  address,
  telephone,
  whatsapp,
  email,
  socials,
}: {
  address: string;
  telephone: string;
  whatsapp: string;
  email: string;
  socials: SocialLink[];
}) {
  const [links, setLinks] = useState<SocialLink[]>(socials.length > 0 ? socials : [{ name: "", url: "" }]);

  return (
    <form className="grid max-w-3xl gap-4" action={saveContactDetails}>
      <AdminField label="School address">
        <Textarea name="address" className="text-base" rows={3} defaultValue={address} />
      </AdminField>
      <AdminField label="Telephone number">
        <Input name="telephone" className={fieldClass} defaultValue={telephone} />
      </AdminField>
      <AdminField label="WhatsApp number">
        <Input name="whatsapp" className={fieldClass} defaultValue={whatsapp} />
      </AdminField>
      <AdminField label="Email">
        <Input name="email" type="email" className={fieldClass} defaultValue={email} />
      </AdminField>
      <div className="grid gap-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-[#0b1f3a]">Social media accounts</span>
          <Button type="button" size="icon" variant="outline" aria-label="Add social media account" onClick={() => setLinks((current) => [...current, { name: "", url: "" }])}>
            <Plus />
          </Button>
        </div>
        {links.map((link, index) => (
          <div key={index} className="grid items-end gap-3 sm:grid-cols-[1fr_1.4fr_auto]">
            <AdminField label={index === 0 ? "Account" : `Account ${index + 1}`}>
              <Input name="socialName" className={fieldClass} value={link.name} placeholder="Facebook" onChange={(event) => setLinks((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item))} />
            </AdminField>
            <AdminField label={index === 0 ? "Link" : `Link ${index + 1}`}>
              <Input name="socialUrl" className={fieldClass} value={link.url} placeholder="https://" onChange={(event) => setLinks((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, url: event.target.value } : item))} />
            </AdminField>
            {links.length > 1 ? (
              <Button type="button" size="icon" variant="outline" aria-label="Remove social media account" onClick={() => setLinks((current) => current.filter((_, itemIndex) => itemIndex !== index))}>
                <X />
              </Button>
            ) : <span className="hidden sm:block" />}
          </div>
        ))}
      </div>
      <Button type="submit" className="w-fit">Save contact information</Button>
    </form>
  );
}
