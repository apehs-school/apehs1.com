import { PageBody } from "@/components/page-body";
import { RecordCarousel } from "@/components/record-carousel";
import { StaffCards } from "@/components/staff-cards";
import { formatPublished } from "@/lib/format";
import { pagesInGroup } from "@/lib/site-content";
import { formatStaffAssignment, parseStaffAssignments } from "@/lib/staff";
import { publicObjectUrl } from "@/lib/storage";

type Entry = { id: string; title: string; body: string; imageKey: string | null; createdAt: Date };
type Member = { id: string; name: string; title: string; assignments: string; note: string; imageKey: string | null };
type Slide = { id: string; title: string | null; body: string; imageUrl: string | null; publishedAt: string | null };

export function AboutView({
  slug,
  title,
  body,
  pagePublishedAt,
  entries,
  staff,
}: {
  slug: string;
  title: string;
  body: string | null;
  pagePublishedAt: Date | null;
  entries: Entry[];
  staff: Member[];
}) {
  const sections = pagesInGroup("about").filter((item) => item.slug !== "about");
  const slides = recordSlides(body, pagePublishedAt, entries);

  return (
    <main className="about-page">
      <header className="about-hero">
        <div className="about-wrap about-rise">
          <p className="about-kicker">About the school</p>
          <h1>{title}</h1>
          <div className="about-rule" />
        </div>
      </header>
      <div className="about-wrap about-body about-rise about-rise-late">
        {staff.length > 0 ? (
          <StaffCards
            members={staff.map((member) => {
              const assignments = parseStaffAssignments(member.assignments).map(formatStaffAssignment).filter(Boolean);
              return {
                id: member.id,
                name: member.name,
                title: member.title,
                note: member.note,
                detail: member.note || assignments.join(" · "),
                imageUrl: member.imageKey ? publicObjectUrl("images", member.imageKey) : null,
              };
            })}
          />
        ) : slides.length > 0 ? (
          <RecordCarousel>
            {slides.map((slide) => (
              <article key={slide.id} className="about-panel about-entry">
                {slide.publishedAt ? (
                  <p className="about-published">
                    <time dateTime={slide.publishedAt}>{formatPublished(slide.publishedAt)}</time>
                  </p>
                ) : null}
                {slide.imageUrl ? <img src={slide.imageUrl} alt="" /> : null}
                {slide.title ? <h2>{slide.title}</h2> : null}
                <div className="about-prose">
                  <PageBody body={slide.body} formal />
                </div>
              </article>
            ))}
          </RecordCarousel>
        ) : null}
        {slug === "about" ? (
          <nav className="about-index" aria-label="About the school">
            {sections.map((item) => (
              <a key={item.slug} href={`/${item.slug}`}>
                <span>{item.title}</span>
                <span aria-hidden="true">→</span>
              </a>
            ))}
          </nav>
        ) : (
          <p className="about-back">
            <a href="/about">All about the school</a>
          </p>
        )}
      </div>
    </main>
  );
}

function recordSlides(body: string | null, pagePublishedAt: Date | null, entries: Entry[]): Slide[] {
  const slides: Slide[] = entries.map((entry) => ({
    id: entry.id,
    title: entry.title,
    body: entry.body,
    imageUrl: entry.imageKey ? publicObjectUrl("images", entry.imageKey) : null,
    publishedAt: entry.createdAt.toISOString(),
  }));
  if (body) {
    slides.push({
      id: "page",
      title: null,
      body,
      imageUrl: null,
      publishedAt: pagePublishedAt ? pagePublishedAt.toISOString() : null,
    });
  }
  return slides.sort((left, right) => {
    if (!left.publishedAt) return 1;
    if (!right.publishedAt) return -1;
    return right.publishedAt.localeCompare(left.publishedAt);
  });
}

