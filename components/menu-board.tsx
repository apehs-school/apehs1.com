"use client";

import { useEffect, useState } from "react";
import { Carrot, ChefHat, Cookie, CupSoda, Sunrise, UtensilsCrossed, type LucideIcon } from "lucide-react";

export type MenuSlide = {
  id: string;
  name: string;
  description: string;
  priceLabel: string | null;
  imageUrl: string | null;
};

const tones: Record<string, { tone: string; icon: LucideIcon }> = {
  Breakfast: { tone: "breakfast", icon: Sunrise },
  "Lunch period": { tone: "lunch", icon: UtensilsCrossed },
  "Main Dish": { tone: "main", icon: ChefHat },
  Vegetables: { tone: "vegetables", icon: Carrot },
  Snack: { tone: "snack", icon: Cookie },
  Beverage: { tone: "beverage", icon: CupSoda },
};

function look(category: string) {
  return tones[category] ?? { tone: "lunch", icon: UtensilsCrossed };
}

export function MenuBoard({
  groups,
  todayLabel,
}: {
  groups: { category: string; items: MenuSlide[] }[];
  todayLabel: string;
}) {
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [showDescription, setShowDescription] = useState(false);
  const group = groups.find((item) => item.category === openCategory);
  const slide = group?.items[index];
  const openLook = group ? look(group.category) : null;

  useEffect(() => {
    if (!group) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenCategory(null);
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [group]);

  function open(category: string) {
    const next = groups.find((item) => item.category === category);
    if (!next || next.items.length === 0) return;
    setOpenCategory(category);
    setIndex(0);
    setDirection("next");
    setShowDescription(false);
  }

  function step(amount: 1 | -1) {
    if (!group || group.items.length < 2) return;
    setDirection(amount > 0 ? "next" : "prev");
    setIndex((current) => (current + amount + group.items.length) % group.items.length);
    setShowDescription(false);
  }

  return (
    <>
      <div className="menu-grid">
        {groups.map((item, cardIndex) => {
          const style = look(item.category);
          const Icon = style.icon;
          return (
            <article
              key={item.category}
              className="menu-card"
              data-tone={style.tone}
              style={{ animationDelay: `${cardIndex * 70}ms` }}
              onDoubleClick={() => open(item.category)}
            >
              <div className="menu-card-art" aria-hidden="true">
                <span className="menu-orb menu-orb-a" />
                <span className="menu-orb menu-orb-b" />
                <span className="menu-card-badge">
                  <Icon size={30} />
                </span>
              </div>
              <div className="menu-card-body">
                <h2>{item.category}</h2>
                <p className="menu-card-count">
                  {item.items.length === 0 ? "Waiting for today's menu" : `${item.items.length} published today`}
                </p>
                {item.items.length === 0 ? (
                  <p className="menu-card-empty">Nothing published today.</p>
                ) : (
                  item.items.map((food) => (
                    <div key={food.id} className="menu-food">
                      {food.imageUrl ? (
                        <img src={food.imageUrl} alt="" />
                      ) : (
                        <span className="menu-food-mark">{food.name.slice(0, 1)}</span>
                      )}
                      <div>
                        <strong>{food.name}</strong>
                        {food.priceLabel ? <span>{food.priceLabel}</span> : null}
                      </div>
                    </div>
                  ))
                )}
                {item.items.length > 0 ? <p className="menu-card-hint">Double-click to open the slideshow.</p> : null}
              </div>
            </article>
          );
        })}
      </div>
      {slide && group && openLook ? (
        <div className="menu-stage" data-tone={openLook.tone} onClick={() => setOpenCategory(null)}>
          <div
            className="menu-show"
            data-tone={openLook.tone}
            role="dialog"
            aria-modal="true"
            aria-label={group.category}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="menu-hero">
              {slide.imageUrl ? (
                <img src={slide.imageUrl} alt="" />
              ) : (
                <span className="menu-hero-icon">
                  <openLook.icon size={54} />
                </span>
              )}
              <button type="button" className="menu-close" onClick={() => setOpenCategory(null)} aria-label="Close">
                ×
              </button>
            </div>
            <div key={slide.id} className="menu-slide-body" data-dir={direction}>
              <div className="menu-chip-row">
                <span className="menu-chip">{group.category}</span>
                <span className="menu-chip">{todayLabel}</span>
                {slide.priceLabel ? <span className="menu-chip menu-price">{slide.priceLabel}</span> : null}
              </div>
              <h2>{slide.name}</h2>
              <button type="button" className="menu-describe" onClick={() => setShowDescription((current) => !current)}>
                {showDescription ? "Hide description" : "Description"}
              </button>
              {showDescription ? (
                <p className="menu-description">{slide.description || "No description for this meal."}</p>
              ) : null}
              <div className="menu-nav">
                <button type="button" disabled={group.items.length < 2} onClick={() => step(-1)}>
                  Previous
                </button>
                <span>
                  {index + 1} / {group.items.length}
                </span>
                <button type="button" disabled={group.items.length < 2} onClick={() => step(1)}>
                  Next
                </button>
              </div>
              <div className="menu-dots">
                {group.items.map((item, dot) => (
                  <button
                    key={item.id}
                    type="button"
                    className={dot === index ? "is-active" : ""}
                    aria-label={`Show ${item.name}`}
                    onClick={() => {
                      setDirection(dot > index ? "next" : "prev");
                      setIndex(dot);
                      setShowDescription(false);
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
