import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fallbackWord } from "@/lib/fallback";
import { getDevotional } from "@/lib/queries";

export default async function WordPage() {
  const devotional = await getDevotional("word");
  const verse = devotional?.verse ?? fallbackWord.verse;
  const reference = devotional?.reference ?? fallbackWord.reference;
  const prayer = devotional?.prayer ?? fallbackWord.prayer;

  return (
    <main className="mx-auto max-w-3xl space-y-4 px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Word for today</CardTitle>
        </CardHeader>
        <CardContent>
          “{verse}” — {reference}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Prayer</CardTitle>
        </CardHeader>
        <CardContent>{prayer}</CardContent>
      </Card>
    </main>
  );
}
