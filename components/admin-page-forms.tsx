import { savePage } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { SitePageDefault } from "@/lib/site-content";

export function PageEditors({
  pages,
  active,
  basePath,
}: {
  pages: SitePageDefault[];
  active?: string;
  basePath?: string;
}) {
  const selected = basePath ? (pages.find((page) => page.slug === active) ?? pages[0]) : undefined;
  const visible = selected ? [selected] : pages;

  return (
    <>
      {selected ? (
        <div className="flex flex-wrap gap-2 border-b border-[#d9e0ea]">
          {pages.map((page) => {
            const current = page.slug === selected.slug;
            return (
              <a
                key={page.slug}
                href={`${basePath}?tab=${page.slug}`}
                aria-current={current ? "page" : undefined}
                className={`border-b-2 px-3 py-2 text-sm font-medium ${
                  current ? "border-[#0d47a1] text-[#0d47a1]" : "border-transparent text-[#24344d]"
                }`}
              >
                {page.title}
              </a>
            );
          })}
        </div>
      ) : null}
      <p className="text-sm text-muted-foreground">
        Leave a blank line between paragraphs. Start a line with <code>- </code> for a bullet, or <code>## </code> for a heading.
      </p>
      {visible.map((page) => (
        <Card key={page.slug}>
          <CardHeader>
            <CardTitle>{page.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-3" action={savePage}>
              <input type="hidden" name="slug" value={page.slug} />
              <Label className="grid gap-2">
                Page title
                <Input name="title" defaultValue={page.title} required />
              </Label>
              <Label className="grid gap-2">
                Page text
                <Textarea name="body" defaultValue={page.body} rows={12} required />
              </Label>
              <Button type="submit">Save {page.title}</Button>
            </form>
          </CardContent>
        </Card>
      ))}
    </>
  );
}
