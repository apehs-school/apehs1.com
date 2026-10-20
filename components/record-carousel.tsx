"use client";

import useEmblaCarousel from "embla-carousel-react";
import { Children, useCallback, useEffect, useState, type ReactNode } from "react";

export function RecordCarousel({ children }: { children: ReactNode }) {
  const slides = Children.toArray(children);
  const [viewportRef, embla] = useEmblaCarousel({ align: "start", containScroll: "trimSnaps" });
  const [index, setIndex] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const refresh = useCallback(() => {
    if (!embla) return;
    setIndex(embla.selectedScrollSnap());
    setCanPrev(embla.canScrollPrev());
    setCanNext(embla.canScrollNext());
  }, [embla]);

  useEffect(() => {
    if (!embla) return;
    refresh();
    embla.on("select", refresh);
    embla.on("reInit", refresh);
    return () => {
      embla.off("select", refresh);
      embla.off("reInit", refresh);
    };
  }, [embla, refresh]);

  if (slides.length === 0) return null;

  return (
    <div className="about-carousel">
      <div className="about-carousel-viewport" ref={viewportRef}>
        <div className="about-carousel-track">
          {slides.map((slide, slideIndex) => (
            <div className="about-carousel-slide" key={slideIndex}>
              {slide}
            </div>
          ))}
        </div>
      </div>
      {slides.length > 1 ? (
        <div className="about-carousel-bar">
          <button type="button" onClick={() => embla?.scrollPrev()} disabled={!canPrev}>
            Newer
          </button>
          <span>
            {index + 1} of {slides.length}
          </span>
          <button type="button" onClick={() => embla?.scrollNext()} disabled={!canNext}>
            Older
          </button>
        </div>
      ) : null}
    </div>
  );
}
