import { notFound } from "next/navigation";
import { AboutView } from "@/components/about-view";
import { AdmissionApply } from "@/components/admission-apply";
import { AdmissionsView } from "@/components/admissions-view";
import { AwardsView } from "@/components/awards-view";
import { ScholarshipView } from "@/components/scholarship-view";
import { ProgrammeBoard } from "@/components/programme-board";
import { ActivityBoard } from "@/components/activity-card";
import { PageBody } from "@/components/page-body";
import { ContactSection } from "@/components/contact-section";
import { pageDefault, pagesInGroup } from "@/lib/site-content";
import { formatLongDate } from "@/lib/format";
import { publicObjectUrl } from "@/lib/storage";
import { getAwardPage, getSitePage, listActivities, listAdmissionRecords, listPublishedActivityPages, listPublishedPageEntries, listPublishedStaff, listScholarshipRecords } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function ManagedPage({
  params,
  searchParams,
}: {
  params: Promise<{ page: string }>;
  searchParams: Promise<{ chat?: string; sent?: string }>;
}) {
  const { page } = await params;
  const { chat, sent } = await searchParams;
  const content = await getSitePage(page);
  const entries = await listPublishedPageEntries(page);
  const activityPages = page === "extra" ? await listPublishedActivityPages() : [];
  const staff = page === "staff" || page === "principal" ? await listPublishedStaff() : [];
  const awards = page === "awards" ? await getAwardPage() : null;
  const admissions = page === "admissions" ? await listAdmissionRecords() : null;
  const scholarships = page === "scholarship" ? await listScholarshipRecords() : null;
  if (!content && entries.length === 0 && activityPages.length === 0 && staff.length === 0 && page !== "extra" && page !== "admissions" && page !== "scholarship") notFound();
  const title = content?.title ?? (page === "extra" ? "" : pageDefault(page)?.title ?? "Page");
  const publishedStories = activityPages.filter((item) => item.slug !== page);
  const aboutPage = pagesInGroup("about").some((item) => item.slug === page);
  const principal = staff.find((member) => member.role === "Principal" || member.title === "Principal");

  if (aboutPage) {
    return (
      <AboutView
        slug={page}
        title={title}
        body={content && page !== "contact" ? content.body : null}
        pagePublishedAt={content && "updatedAt" in content ? content.updatedAt : null}
        entries={entries}
        staff={page === "staff" ? staff : []}
        principalImage={page === "principal" && principal?.imageKey ? publicObjectUrl("images", principal.imageKey) : null}
        principalName={principal?.name ?? "Principal"}
      />
    );
  }

  return (
    <main className={`mx-auto max-w-5xl space-y-6 px-4 py-10${page === "contact" ? " contact-page" : ""}`}>
      {title && page !== "awards" && page !== "admissions" && page !== "scholarship" ? <h1 className="text-3xl font-semibold text-primary">{title}</h1> : null}
      {awards ? <AwardsView document={awards} /> : null}
      {admissions?.migrated ? <AdmissionsView records={admissions.records} pageTitle={title} /> : null}
      {scholarships ? <ScholarshipView records={scholarships} /> : null}
      {content && page !== "contact" && page !== "academics" && page !== "awards" && page !== "scholarship" && !(page === "admissions" && admissions?.migrated) ? (
        <div className="space-y-4 leading-7">
          <PageBody body={content.body} />
        </div>
      ) : null}
      {page === "academics" && entries.length > 0 ? <ProgrammeBoard entries={entries} /> : null}
      {page === "academics" || page === "awards" || page === "admissions" || page === "scholarship" ? null : entries.map((entry) => {
        const imageUrl = entry.imageKey ? publicObjectUrl("images", entry.imageKey) : null;
        return (
          <section key={entry.id} className="space-y-4 leading-7">
            {imageUrl ? <img src={imageUrl} alt="" className="h-56 w-full max-w-xl rounded-xl object-cover" /> : null}
            <h2 className="text-2xl font-semibold text-primary">{entry.title}</h2>
            <PageBody body={entry.body} />
          </section>
        );
      })}
      {publishedStories.map((item, index) => (
        <section key={item.slug} className="space-y-4 leading-7">
          {title || index > 0 ? (
            <h2 className="text-2xl font-semibold text-primary">{item.title}</h2>
          ) : (
            <h1 className="text-3xl font-semibold text-primary">{item.title}</h1>
          )}
          <PageBody body={item.body} />
        </section>
      ))}
      {page === "admissions" ? <AdmissionForms /> : null}
      {page === "extra" ? <ActivityCards /> : null}
      {page === "contact" ? <ContactSection chatId={chat} sent={sent === "1"} /> : null}
    </main>
  );
}

function AdmissionForms() {
  return <AdmissionApply />;
}

async function ActivityCards() {
  const items = await listActivities();
  return (
    <ActivityBoard
      items={items.map((item) => ({
        id: item.id,
        name: item.name,
        period: "startsOn" in item && item.startsOn && "endsOn" in item && item.endsOn ? `${formatLongDate(String(item.startsOn))} – ${formatLongDate(String(item.endsOn))}` : "",
        schedule: item.schedule,
        venue: item.venue,
        lead: item.lead,
        cost: item.cost,
        attire: item.attire,
        note: item.note ?? "",
      }))}
    />
  );
}

