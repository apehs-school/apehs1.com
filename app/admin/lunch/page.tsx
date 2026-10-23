import { deleteMenuItem, setMenuCategoryPublished, setMenuItemPublished } from "@/actions/admin";
import { DeleteButton } from "@/components/delete-button";
import { MealDialog } from "@/components/meal-dialog";
import { Button } from "@/components/ui/button";
import { PagedTable } from "@/components/paged-table";
import { TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getDb } from "@/db";
import { menuCategories, menuItems } from "@/db/schema";
import { formatJmd, formatLongDate } from "@/lib/format";
import { isMealCategory, mealCategories } from "@/lib/menu";
import { publicObjectUrl } from "@/lib/storage";
import { desc } from "drizzle-orm";

export default async function LunchAdminPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const db = getDb();
  const rows = db ? await db.select().from(menuItems).orderBy(desc(menuItems.startsOn)) : [];
  const savedCategories = db ? await db.select().from(menuCategories) : [];
  const active = tab && isMealCategory(tab) ? tab : "Lunch period";
  const visible = rows.filter((item) => item.category === active);
  const categoryPublished = savedCategories.find((item) => item.name === active)?.published ?? false;

  return (
    <div className="space-y-6">
      <h1>Lunch menu</h1>
      <MealDialog category={active} />
      <div className="flex flex-wrap gap-2 border-b border-[#d9e0ea]">
        {mealCategories.map((name) => {
          const selected = name === active;
          const count = rows.filter((item) => item.category === name).length;
          return (
            <a
              key={name}
              href={`/admin/lunch?tab=${encodeURIComponent(name)}`}
              aria-current={selected ? "page" : undefined}
              className={`border-b-2 px-3 py-2 text-sm font-medium ${
                selected ? "border-[#0d47a1] text-[#0d47a1]" : "border-transparent text-[#24344d]"
              }`}
            >
              {name}
              {count > 0 ? ` (${count})` : ""}
            </a>
          );
        })}
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">{active}</p>
        <form action={setMenuCategoryPublished}>
          <input type="hidden" name="name" value={active} />
          <input type="hidden" name="published" value={categoryPublished ? "false" : "true"} />
          <Button variant={categoryPublished ? "default" : "outline"} type="submit">
            {categoryPublished ? "Unpublish" : "Publish"}
          </Button>
        </form>
      </div>
      <PagedTable
        pageKey="meals"
        header={
          <TableHeader>
            <TableRow>
              <TableHead>Period</TableHead>
              <TableHead>Meal</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
        }
        rows={visible.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5}>No meals in {active} yet.</TableCell>
          </TableRow>
        ) : (
          visible.map((item) => (
            <TableRow key={item.id}>
                <TableCell>
                  {formatLongDate(item.startsOn)} – {formatLongDate(item.endsOn)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {item.imageKey ? (
                      <img
                        src={publicObjectUrl("images", item.imageKey) ?? ""}
                        alt=""
                        className="h-12 w-12 rounded-md object-cover"
                      />
                    ) : null}
                    <strong>{item.name || item.description}</strong>
                  </div>
                </TableCell>
                <TableCell>{item.priceCents == null ? "—" : formatJmd(item.priceCents)}</TableCell>
                <TableCell>{item.published ? "Published" : "Draft"}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap justify-end gap-2">
                    <MealDialog
                      category={active}
                      meal={{
                        id: item.id,
                        startsOn: item.startsOn,
                        endsOn: item.endsOn,
                        category: item.category,
                        name: item.name,
                        description: item.description,
                        price: item.priceCents == null ? "" : (item.priceCents / 100).toFixed(2),
                        imageUrl: item.imageKey ? publicObjectUrl("images", item.imageKey) : null,
                      }}
                    />
                    <form action={setMenuItemPublished}>
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="category" value={active} />
                      <input type="hidden" name="published" value={item.published ? "false" : "true"} />
                      <Button variant="outline" type="submit">{item.published ? "Unpublish" : "Publish"}</Button>
                    </form>
                    <DeleteButton action={deleteMenuItem} id={item.id} fields={{ category: active }} />
                  </div>
                </TableCell>
              </TableRow>
            ))
        )}
      />
    </div>
  );
}
