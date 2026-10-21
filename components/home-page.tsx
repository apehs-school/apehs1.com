import { SchoolCalendar } from "@/components/school-calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fallbackNews } from "@/lib/fallback";
import { formatLongDate } from "@/lib/format";
import { getCalendarEvents, getNewsItems } from "@/lib/queries";

const stats = [
  ["96.2%", "Grade 6 average PEP results over a 5-year period"],
  ["74%", "Overall pass rate for CSEC 2024"],
  ["100%", "Grade 3 diagnostic test, 2024–2025"],
  ["100%", "Grade 4 PEP literacy and numeracy"],
];

export async function HomePageContent() {
  const [news, events] = await Promise.all([getNewsItems(), getCalendarEvents()]);
  const stories = news.length > 0 ? news : fallbackNews;

  return (
    <main className="bg-[#f4f6f8]">
      <section className="border-b border-[#d9e0ea] bg-[#0b1f3a] text-white">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <p className="text-xs font-medium tracking-[0.32em] text-[#e6c15a] uppercase">School motto</p>
          <h1 className="mt-3 max-w-3xl font-serif text-4xl leading-tight md:text-5xl">
            Nothing but the Best is to be done Here
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/80">Inspiring Young Minds for a Bright Future</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button nativeButton={false} className="bg-[#c9a227] text-[#0b1f3a] hover:bg-[#d4b44a]" render={<a href="/admissions" />}>
              Admissions
            </Button>
            <Button nativeButton={false} variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10" render={<a href="/contact" />}>
              Contact the school
            </Button>
          </div>
        </div>
      </section>

      <section className="border-b border-[#d9e0ea] bg-white">
        <div className="mx-auto grid max-w-6xl md:grid-cols-4">
          {stats.map(([value, label]) => (
            <div key={label} className="border-[#e6ebf2] px-6 py-8 md:border-l md:first:border-l-0">
              <p className="font-serif text-3xl text-[#0d47a1]">{value}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-6 py-12 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <p className="text-xs font-medium tracking-[0.28em] text-[#9a7420] uppercase">About the school</p>
          <h2 className="mt-2 font-serif text-3xl text-[#0b1f3a]">Welcome</h2>
          <p className="mt-4 leading-7 text-[#24344d]">
            The merged Ardenne Preparatory and Extension High School came into existence on September 1, 2000. The two
            schools had shared one campus and the same Board of Governors. The merger gave students the contact hours,
            administration, and co-curricular programme the Ministry of Education required.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button nativeButton={false} variant="outline" render={<a href="/history" />}>
              School history
            </Button>
            <Button nativeButton={false} variant="outline" render={<a href="/awards" />}>
              Awards and results
            </Button>
          </div>
        </div>
        <Card className="border-[#d9e0ea] shadow-none">
          <CardHeader>
            <CardTitle className="font-serif text-2xl">Latest news</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {stories.map((item) => (
              <article key={`${item.title}-${item.eventDate}`} className="border-b border-[#e6ebf2] pb-5 last:border-0 last:pb-0">
                <Badge variant="secondary">
                  {"endsOn" in item && item.endsOn && item.endsOn !== item.eventDate
                    ? `${formatLongDate(item.eventDate)} – ${formatLongDate(String(item.endsOn))}`
                    : formatLongDate(item.eventDate)}
                </Badge>
                <h3 className="mt-2 font-medium text-[#0b1f3a]">{item.title}</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.body}</p>
              </article>
            ))}
          </CardContent>
        </Card>
      </section>

      <SchoolCalendar events={events} />
    </main>
  );
}
