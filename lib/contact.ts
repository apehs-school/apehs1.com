import { jamaicaParishes } from "@/lib/profile";

export type SocialLink = { name: string; url: string };

export function contactAddressParts(details: { address: string; street: string; apt: string; town: string; parish: string }) {
  if (details.street || details.apt || details.town || details.parish) return details;
  const match = details.address.match(/^(.*?),\s*([^,]+),\s*Jamaica$/i);
  if (!match) return { ...details, street: details.address };
  const place = match[2].trim();
  const parish = jamaicaParishes.find((name) => name.toLowerCase() === place.toLowerCase()) ?? "";
  return { ...details, street: match[1].trim(), town: place, parish };
}

export function parseSocials(value: string): SocialLink[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const record = item as { name?: unknown; url?: unknown };
      const name = typeof record.name === "string" ? record.name.trim() : "";
      const url = typeof record.url === "string" ? record.url.trim() : "";
      if (!name || !url) return [];
      return [{ name, url: /^https?:\/\//i.test(url) ? url : `https://${url}` }];
    });
  } catch {
    return [];
  }
}

export function whatsappHref(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return null;
  const normalized = digits.length === 10 && digits.startsWith("876") ? `1${digits}` : digits;
  return `https://wa.me/${normalized}`;
}
