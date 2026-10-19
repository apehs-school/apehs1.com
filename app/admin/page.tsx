import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardCounts } from "@/lib/queries";

export default async function AdminHomePage() {
  const counts = await getDashboardCounts();
  const stats = [
    [counts.news, "News items"],
    [counts.events, "Calendar events"],
    [counts.meals, "Lunch items"],
    [counts.activities, "Activities saved"],
    [counts.pages, "Pages saved"],
    [counts.students, "Students"],
    [counts.fees, "Fees"],
    [counts.payments, "Paid fees"],
  ] as const;

  return (
    <div className="space-y-6">
      <h1>Dashboard</h1>
      <p>Review what is published, then use the sections on the left to enter or remove school information.</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(([value, label]) => (
          <Card key={label}>
            <CardHeader>
              <CardTitle className="text-3xl">{value}</CardTitle>
            </CardHeader>
            <CardContent>{label}</CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
