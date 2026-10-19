import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/index.html", destination: "/", permanent: false },
      { source: "/payment.html", destination: "/pay", permanent: false },
      { source: "/calendar.html", destination: "/calendar", permanent: false },
      { source: "/menu.html", destination: "/menu", permanent: false },
      { source: "/word.html", destination: "/word", permanent: false },
      { source: "/aboutus.html", destination: "/about", permanent: false },
      { source: "/principal.html", destination: "/principal", permanent: false },
      { source: "/staff.html", destination: "/staff", permanent: false },
      { source: "/history.html", destination: "/history", permanent: false },
      { source: "/mission.html", destination: "/mission", permanent: false },
      { source: "/vision.html", destination: "/vision", permanent: false },
      { source: "/core.html", destination: "/core", permanent: false },
      { source: "/goals.html", destination: "/goals", permanent: false },
      { source: "/motto.html", destination: "/motto", permanent: false },
      { source: "/song.html", destination: "/song", permanent: false },
      { source: "/academics.html", destination: "/academics", permanent: false },
      { source: "/awards.html", destination: "/awards", permanent: false },
      { source: "/admissions.html", destination: "/admissions", permanent: false },
      { source: "/scholarship.html", destination: "/scholarship", permanent: false },
      { source: "/extra.html", destination: "/extra", permanent: false },
      { source: "/contact.html", destination: "/contact", permanent: false },
    ];
  },
};

export default nextConfig;
