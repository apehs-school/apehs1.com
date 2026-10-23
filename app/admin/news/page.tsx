import { NewsAdmin } from "@/components/news-admin";
import { getDb } from "@/db";
import { news } from "@/db/schema";
import { bulletinImageKeys } from "@/lib/queries";
import { publicObjectUrl } from "@/lib/storage";
import { desc } from "drizzle-orm";

export default async function NewsAdminPage() {
  const db = getDb();
  const rows = db ? await db.select().from(news).orderBy(desc(news.pinned), desc(news.eventDate)) : [];

  return (
    <NewsAdmin
      rows={rows.map((item) => ({
        id: item.id,
        title: item.title,
        body: item.body,
        details: item.details,
        category: item.category,
        audience: item.audience,
        eventDate: item.eventDate,
        showFrom: item.showFrom ?? item.eventDate,
        endsOn: item.endsOn,
        pinned: item.pinned,
        published: item.published,
        onCalendar: item.onCalendar,
        images: bulletinImageKeys(item.images).flatMap((key) => {
          const url = publicObjectUrl("images", key);
          return url ? [{ key, url }] : [];
        }),
      }))}
    />
  );
}
