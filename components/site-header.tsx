import { SiteNav } from "@/components/site-nav";
import { ensureCurrentUser } from "@/lib/auth";
import { listUserMessageAlerts } from "@/lib/queries";

export async function SiteHeader() {
  const user = await ensureCurrentUser();
  const alerts = user ? await listUserMessageAlerts(user.id) : [];

  return (
    <header className="border-b border-[#d9e0ea] bg-white text-[#0b1f3a] shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <img
          src="/images/logo2.1.png"
          alt="Ardenne Preparatory and Extension High School"
          className="h-24 w-auto drop-shadow-[0_8px_18px_rgba(13,71,161,0.28)] sm:h-32"
        />
        <div className="min-w-0 text-center">
          <p className="text-[11px] font-medium tracking-[0.32em] text-[#9a7420] uppercase">Kingston, Jamaica</p>
          <p className="mt-1 font-serif text-xl leading-tight text-[#0b1f3a] sm:text-3xl">Ardenne Preparatory</p>
          <p className="text-xs font-medium tracking-[0.16em] text-[#0d47a1] uppercase sm:text-sm">
            and Extension High School
          </p>
        </div>
        <img
          src="/images/cog.png"
          alt="Church of God in Jamaica"
          className="h-24 w-auto drop-shadow-[0_8px_18px_rgba(13,71,161,0.28)] sm:h-32"
        />
      </div>
      <SiteNav alerts={alerts} />
    </header>
  );
}
