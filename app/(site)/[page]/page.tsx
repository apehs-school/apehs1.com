import { notFound } from "next/navigation";
import { PageBody } from "@/components/page-body";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContactSection } from "@/components/contact-section";
import { pageDefault, pagesInGroup } from "@/lib/site-content";
import { formatLongDate } from "@/lib/format";
import { formatStaffAssignment, parseStaffAssignments } from "@/lib/staff";
import { publicObjectUrl } from "@/lib/storage";
import { getSitePage, listActivities, listPublishedPageEntries, listPublishedStaff } from "@/lib/queries";

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
  const staff = page === "staff" ? await listPublishedStaff() : [];
  if (!content && entries.length === 0 && staff.length === 0) notFound();
  const title = content?.title ?? pageDefault(page)?.title ?? "Page";

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <h1 className="text-3xl font-semibold text-primary">{title}</h1>
      {staff.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {staff.map((member) => {
            const assignments = parseStaffAssignments(member.assignments).map(formatStaffAssignment).filter(Boolean);
            const imageUrl = member.imageKey ? publicObjectUrl("images", member.imageKey) : null;
            return (
              <article key={member.id} className="flex gap-4 rounded-xl border bg-card p-4">
                {imageUrl ? <img src={imageUrl} alt="" className="h-24 w-24 shrink-0 rounded-full object-cover" /> : null}
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold text-primary">{member.name}</h2>
                  <p className="font-medium">{member.title}</p>
                  {assignments.length > 0 ? <p>{assignments.join(", ")}</p> : null}
                  {member.note ? <p className="leading-7 text-muted-foreground">{member.note}</p> : null}
                </div>
              </article>
            );
          })}
        </div>
      ) : content && page !== "contact" ? (
        <div className="space-y-4 leading-7">
          <PageBody body={content.body} />
        </div>
      ) : null}
      {entries.map((entry) => {
        const imageUrl = entry.imageKey ? publicObjectUrl("images", entry.imageKey) : null;
        return (
          <section key={entry.id} className="space-y-4 leading-7">
            {imageUrl ? <img src={imageUrl} alt="" className="h-56 w-full max-w-xl rounded-xl object-cover" /> : null}
            <h2 className="text-2xl font-semibold text-primary">{entry.title}</h2>
            <PageBody body={entry.body} />
          </section>
        );
      })}
      {page === "about" ? <AboutLinks /> : null}
      {page === "admissions" ? <AdmissionForms /> : null}
      {page === "extra" ? <ActivityCards /> : null}
      {page === "contact" ? <ContactSection chatId={chat} sent={sent === "1"} /> : null}
    </main>
  );
}

function AboutLinks() {
  return (
    <div className="flex flex-wrap gap-2">
      {pagesInGroup("about")
        .filter((item) => item.slug !== "about")
        .map((item) => (
          <Button key={item.slug} nativeButton={false} variant="outline" render={<a href={`/${item.slug}`} />}>
            {item.title}
          </Button>
        ))}
    </div>
  );
}

function AdmissionForms() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button nativeButton={false} render={<a href="/Documents/APEHS - STUDENT ADMISSION FORM.pdf" />}>Student admission form</Button>
      <Button nativeButton={false} variant="outline" render={<a href="/Documents/APEHS - NEW STUDENT BEHAVIOUR ASSESSMENT FORM.pdf" />}>
        Behaviour assessment form
      </Button>
    </div>
  );
}

async function ActivityCards() {
  const items = await listActivities();
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((item) => (
        <Card key={item.id}>
          <CardHeader>
            <CardTitle>{item.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {"startsOn" in item && item.startsOn && "endsOn" in item && item.endsOn ? (
              <p>
                <strong>Dates: </strong>
                {formatLongDate(String(item.startsOn))} – {formatLongDate(String(item.endsOn))}
              </p>
            ) : null}
            <p className="whitespace-pre-line">
              <strong>Schedule: </strong>
              {item.schedule}
            </p>
            {item.venue ? <p><strong>Venue: </strong>{item.venue}</p> : null}
            {item.lead ? <p><strong>Staff: </strong>{item.lead}</p> : null}
            {item.cost ? <p><strong>Cost: </strong>{item.cost}</p> : null}
            {item.attire ? <p><strong>Attire: </strong>{item.attire}</p> : null}
            {item.note ? <p className="text-sm text-muted-foreground">{item.note}</p> : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

