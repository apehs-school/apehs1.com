import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Source_Serif_4 } from "next/font/google";
import { cookies } from "next/headers";
import { NoticeToast } from "@/components/notice-toast";
import { ProfileGate } from "@/components/profile-gate";
import { clerkEnabled } from "@/lib/env";
import { cn } from "@/lib/utils";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });
const sourceSerif = Source_Serif_4({ subsets: ["latin"], variable: "--font-serif" });

export const metadata: Metadata = {
  title: "Ardenne Preparatory and Extension High School",
  description: "Inspiring Young Minds for a Bright Future",
  icons: {
    icon: [{ url: "/icon.png", type: "image/png" }],
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const content = children;
  const notice = (await cookies()).get("apehs-notice")?.value ?? null;

  return (
    <html lang="en" className={cn("font-sans", geist.variable, sourceSerif.variable)}>
      <body>
        {clerkEnabled() ? (
          <ClerkProvider>
            {content}
            <ProfileGate />
          </ClerkProvider>
        ) : (
          content
        )}
        <NoticeToast notice={notice} />
      </body>
    </html>
  );
}
