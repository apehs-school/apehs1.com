import { DevotionalTap } from "@/components/devotional-tap";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { fallbackPopup } from "@/lib/fallback";
import { getDevotional } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const devotional = await getDevotional("popup");

  return (
    <>
      <SiteHeader />
      <DevotionalTap
        verse={devotional?.verse ?? fallbackPopup.verse}
        reference={devotional?.reference ?? fallbackPopup.reference}
      />
      {children}
      <SiteFooter />
    </>
  );
}
