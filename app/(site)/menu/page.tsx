import { MenuBoard, type MenuSlide } from "@/components/menu-board";
import { formatJmd, formatLongDate } from "@/lib/format";
import { mealCategories } from "@/lib/menu";
import { getMenu } from "@/lib/queries";
import { publicObjectUrl } from "@/lib/storage";

export default async function MenuPage() {
  const menu = await getMenu();
  const slides = new Map<string, MenuSlide[]>();
  for (const item of menu.items) {
    const name = item.name.trim() || item.description.split("\n")[0] || item.category;
    const slide: MenuSlide = {
      id: item.id,
      name,
      description: item.description,
      priceLabel: item.priceCents == null ? null : formatJmd(item.priceCents),
      imageUrl: item.imageKey ? publicObjectUrl("images", item.imageKey) : null,
    };
    const list = slides.get(item.category) ?? [];
    list.push(slide);
    slides.set(item.category, list);
  }

  const ordered = [
    ...mealCategories.filter((category) => menu.categories.includes(category)),
    ...menu.categories.filter((category) => !mealCategories.includes(category as (typeof mealCategories)[number])),
  ];
  const groups = ordered.map((category) => ({ category, items: slides.get(category) ?? [] }));

  return (
    <main className="menu-page mx-auto max-w-6xl px-4 py-10">
      <header className="menu-page-head">
        <div>
          <p className="menu-kicker">School cafeteria</p>
          <h1>Today&apos;s lunch menu</h1>
        </div>
        <span className="menu-date">{formatLongDate(menu.date)}</span>
      </header>
      {groups.length > 0 ? (
        <MenuBoard groups={groups} todayLabel={formatLongDate(menu.date)} />
      ) : (
        <p className="text-sm text-muted-foreground">No lunch categories are published today.</p>
      )}
    </main>
  );
}
