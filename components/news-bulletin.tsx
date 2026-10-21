"use client";

import { useState } from "react";

export const bulletinCategories = ["Announcement", "Academics", "School events", "Achievements"] as const;
export const bulletinAudiences = ["Everyone", "Parents", "Students", "Staff"] as const;

export type BulletinItem = {
  id: string;
  title: string;
  body: string;
  details: string;
  category: string;
  audience: string;
  eventDate: string;
  endsOn: string | null;
  images: string[];
};

export function bulletinDate(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return isoDate;
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-JM", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function bulletinTone(category: string) {
  if (category === "Academics") return "academics";
  if (category === "School events") return "events";
  if (category === "Achievements") return "achievements";
  return "announcement";
}

export function NewsBulletin({ items }: { items: BulletinItem[] }) {
  const [filter, setFilter] = useState("All");
  const [openId, setOpenId] = useState("");
  const visible = filter === "All" ? items : items.filter((item) => item.category === filter);

  return (
    <section className="bulletin-board" aria-labelledby="bulletin-title">
      <header className="bulletin-heading">
        <div>
          <p className="bulletin-kicker">The school bulletin</p>
          <h2 id="bulletin-title">Latest news &amp; notices</h2>
          <p className="bulletin-intro">Updates, achievements, and moments from our school community.</p>
        </div>
        <div className="bulletin-ornament" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </header>
      <div className="bulletin-filters" role="tablist" aria-label="Bulletin categories">
        {["All", ...bulletinCategories].map((category) => (
          <button key={category} type="button" role="tab" aria-selected={filter === category} className={filter === category ? "active" : ""} onClick={() => setFilter(category)}>
            {category}
          </button>
        ))}
      </div>
      {visible.length === 0 ? (
        <p className="bulletin-empty">No bulletins in this category.</p>
      ) : (
        <div className="bulletin-grid" key={filter}>
          {visible.map((item, index) => {
            const open = openId === item.id;
            const cover = item.images[0];
            const gallery = item.images.slice(1);
            const extra = item.details.trim() && item.details.trim() !== item.body.trim() ? item.details : "";
            return (
              <article key={item.id} className="bulletin-card" data-tone={bulletinTone(item.category)} style={{ animationDelay: `${index * 70}ms` }}>
                <div className="bulletin-hero">
                  {cover ? <img src={cover} alt="" /> : <div className="bulletin-crest"><span>APEHS</span></div>}
                  <div className="bulletin-hero-meta">
                    <span className="bulletin-category">{item.category}</span>
                    <time dateTime={item.eventDate}>{bulletinDate(item.eventDate)}</time>
                  </div>
                </div>
                <div className="bulletin-copy">
                  <p className="bulletin-audience">{item.audience}</p>
                  <h3>{item.title}</h3>
                  <p className={open ? "bulletin-summary full" : "bulletin-summary"}>{item.body}</p>
                  <div className={open ? "bulletin-more open" : "bulletin-more"}>
                    <div>
                      {extra ? <p className="bulletin-details">{extra}</p> : null}
                      {gallery.length > 0 ? (
                        <div className="bulletin-gallery">
                          {gallery.map((url) => <img key={url} src={url} alt="" />)}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <button type="button" aria-expanded={open} onClick={() => setOpenId(open ? "" : item.id)}>
                    <span className="bulletin-play" aria-hidden="true" />
                    {open ? "Hide full bulletin" : "Read full bulletin"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
