import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { clerkEnabled, databaseEnabled, stripeEnabled } from "@/lib/env";

export function SetupNotice() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Finish connecting this site</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ul className="list-disc space-y-1 pl-5">
            <li>Neon database: {databaseEnabled() ? "connected" : "add DATABASE_URL"}</li>
            <li>Clerk sign-in: {clerkEnabled() ? "connected" : "add the Clerk keys from the Clerk dashboard"}</li>
            <li>Stripe payments: {stripeEnabled() ? "connected" : "add the Stripe secret key and webhook secret"}</li>
          </ul>
          <p>
            Copy <code>.env.example</code> to <code>.env.local</code>, fill in the keys, then restart the site.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
