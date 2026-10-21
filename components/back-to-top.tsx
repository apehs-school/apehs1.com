"use client";

export function BackToTop() {
  return (
    <button type="button" className="site-footer-top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
      Top
    </button>
  );
}
