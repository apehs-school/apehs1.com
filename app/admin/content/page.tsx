import { loadSampleContent } from "@/actions/admin";
import { Button } from "@/components/ui/button";

const sections = [
  ["/admin/news", "News and the word for today"],
  ["/admin/calendar", "School calendar events"],
  ["/admin/lunch", "Lunch meals"],
  ["/admin/academics", "Academics, awards, admissions, and scholarships"],
  ["/admin/activities", "Extracurricular activities"],
  ["/admin/about", "About us and its sub-tabs"],
  ["/admin/contact", "Contact details"],
];

export default function ContentHubPage() {
  return (
    <div className="space-y-6">
      <h1>Publish school information</h1>
      <p>Each menu tab and its sub-tabs has its own editor. Saving a page replaces the text visitors see.</p>
      <ul className="list-disc space-y-1 pl-5">
        {sections.map(([href, label]) => (
          <li key={href}>
            <a className="text-primary underline" href={href}>{label}</a>
          </li>
        ))}
      </ul>
      <form action={loadSampleContent}>
        <Button type="submit">Load the current school content</Button>
      </form>
    </div>
  );
}
