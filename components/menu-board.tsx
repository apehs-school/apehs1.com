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

function MenuGraphic({ tone }: { tone: string }) {
  if (tone === "snack") {
    return (
      <svg className="menu-graphic" viewBox="0 0 140 90" aria-hidden="true">
        <ellipse cx="46" cy="78" rx="28" ry="6" fill="rgb(255 255 255 / 28%)" />
        <circle cx="48" cy="46" r="28" fill="#f6d28a" />
        <circle cx="48" cy="46" r="22" fill="#e8a84a" />
        <circle cx="38" cy="40" r="3.2" fill="#6b3a16" />
        <circle cx="52" cy="36" r="2.6" fill="#6b3a16" />
        <circle cx="58" cy="50" r="3" fill="#6b3a16" />
        <circle cx="42" cy="54" r="2.4" fill="#6b3a16" />
        <path d="M92 24c8 10 8 22 0 32" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
      </svg>
    );
  }
  if (tone === "beverage") {
    return (
      <svg className="menu-graphic" viewBox="0 0 140 90" aria-hidden="true">
        <ellipse cx="48" cy="78" rx="26" ry="6" fill="rgb(255 255 255 / 28%)" />
        <path d="M28 28h40l-6 40a12 12 0 0 1-12 10H46a12 12 0 0 1-12-10L28 28z" fill="#fff" />
        <path d="M32 36h32l-4 28a8 8 0 0 1-8 7H44a8 8 0 0 1-8-7L32 36z" fill="#7fd4ff" />
        <rect x="36" y="16" width="6" height="22" rx="3" fill="#fff" transform="rotate(18 39 27)" />
        <circle className="menu-bubble" cx="44" cy="58" r="3" fill="#fff" />
        <circle className="menu-bubble menu-bubble-late" cx="56" cy="50" r="2.2" fill="#fff" />
        <circle className="menu-bubble menu-bubble-slow" cx="50" cy="42" r="1.6" fill="#fff" />
      </svg>
    );
  }
  if (tone === "vegetables") {
    return (
      <svg className="menu-graphic" viewBox="0 0 140 90" aria-hidden="true">
        <ellipse cx="50" cy="78" rx="26" ry="6" fill="rgb(255 255 255 / 28%)" />
        <path d="M58 70c-2-22 8-38 24-48" fill="none" stroke="#d8ffb0" strokeWidth="5" strokeLinecap="round" />
        <path d="M46 68c8-18 2-36-12-46" fill="none" stroke="#d8ffb0" strokeWidth="5" strokeLinecap="round" />
        <path d="M34 62c18-4 32-4 48 6 4 16-8 28-24 28S30 76 34 62z" fill="#ff8a3d" />
        <path d="M40 60c12 2 22 6 30 14" fill="none" stroke="#ffd0a8" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }
  if (tone === "breakfast") {
    return (
      <svg className="menu-graphic" viewBox="0 0 140 90" aria-hidden="true">
        <circle cx="108" cy="24" r="12" fill="#ffe08a" />
        <ellipse cx="52" cy="78" rx="30" ry="6" fill="rgb(255 255 255 / 28%)" />
        <path d="M24 58h56a16 16 0 0 1-16 18H40A16 16 0 0 1 24 58z" fill="#fff" />
        <ellipse cx="52" cy="56" rx="24" ry="8" fill="#f4a261" />
      </svg>
    );
  }
  if (tone === "main") {
    return (
      <svg className="menu-graphic" viewBox="0 0 140 90" aria-hidden="true">
        <ellipse cx="52" cy="78" rx="30" ry="6" fill="rgb(255 255 255 / 28%)" />
        <ellipse cx="52" cy="62" rx="30" ry="10" fill="#fff" />
        <ellipse cx="52" cy="58" rx="22" ry="8" fill="#ffd0c2" />
        <path d="M44 40c0 8 4 10 8 10s8-2 8-10" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
        <path d="M60 36c2 8 6 10 8 6" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg className="menu-graphic" viewBox="0 0 140 90" aria-hidden="true">
      <ellipse cx="54" cy="78" rx="32" ry="6" fill="rgb(255 255 255 / 28%)" />
      <ellipse cx="54" cy="64" rx="30" ry="10" fill="#fff" />
      <path d="M30 58h48c0 12-10 20-24 20S30 70 30 58z" fill="#8fd0ff" />
      <rect x="86" y="28" width="5" height="36" rx="2" fill="#fff" />
      <path d="M96 30c8 4 8 18 0 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
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
                <span className="menu-orb menu-orb-c" />
                <span className="menu-spark menu-spark-a" />
                <span className="menu-spark menu-spark-b" />
                <span className="menu-spark menu-spark-c" />
                <MenuGraphic tone={style.tone} />
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
