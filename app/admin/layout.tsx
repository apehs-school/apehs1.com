import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin-nav";
import { SetupNotice } from "@/components/setup-notice";
import { Button } from "@/components/ui/button";
import { ensureCurrentUser } from "@/lib/auth";
import { clerkEnabled, databaseEnabled } from "@/lib/env";
import "./admin.css";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!clerkEnabled() || !databaseEnabled()) {
    return (
      <main className="admin-main">
        <SetupNotice />
      </main>
    );
  }

  const user = await ensureCurrentUser();
  if (!user) redirect("/sign-in");
  if (user.role !== "admin") redirect("/account?error=admin");

  return (
    <div className="admin-shell">
      <AdminNav />
      <main className="admin-main">
        <div className="mb-4 flex justify-end">
          <Button nativeButton={false} variant="outline" render={<a href="/" />}>
            Home
          </Button>
        </div>
        {children}
      </main>
    </div>
  );
}
