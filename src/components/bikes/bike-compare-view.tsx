"use client";

import Link from "next/link";
import { bikes } from "@/data";
import { useBikeCompareStore } from "@/stores/bike-compare-store";
import { formatINR } from "@/lib/utils";
import { bikePath } from "@/lib/seo/bike-paths";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const rows: { label: string; value: (id: string) => string }[] = [
  { label: "Price", value: (id) => formatINR(bikes.find((b) => b.id === id)?.price ?? 0) },
  { label: "Engine", value: (id) => `${bikes.find((b) => b.id === id)?.engineCc || 0}cc` },
  { label: "Fuel", value: (id) => bikes.find((b) => b.id === id)?.fuel ?? "-" },
  { label: "Mileage", value: (id) => `${bikes.find((b) => b.id === id)?.mileageKmpl ?? 0} kmpl` },
  { label: "Body type", value: (id) => bikes.find((b) => b.id === id)?.bodyType ?? "-" },
  { label: "City", value: (id) => bikes.find((b) => b.id === id)?.city ?? "-" },
];

export function BikeCompareView() {
  const ids = useBikeCompareStore((s) => s.ids);
  const remove = useBikeCompareStore((s) => s.remove);
  const clear = useBikeCompareStore((s) => s.clear);
  const selected = ids.map((id) => bikes.find((b) => b.id === id)).filter(Boolean);

  if (selected.length === 0) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <Card className="border-dashed border-border">
          <CardContent className="py-14 text-center">
            <p className="text-lg font-semibold text-foreground">No bikes selected for compare</p>
            <p className="mt-2 text-sm text-muted-foreground">Add bikes from the bikes listing page and compare specs side by side.</p>
            <Button className="mt-5" asChild>
              <Link href="/bikes">Browse bikes</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl tracking-tight text-foreground">Bike compare</h1>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/bikes">Add more bikes</Link>
          </Button>
          <Button variant="ghost" onClick={clear}>Clear all</Button>
        </div>
      </div>
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        {selected.map((bike) =>
          bike ? (
            <Card key={bike.id} className="border-border">
              <CardContent className="space-y-2 p-4">
                <p className="font-semibold text-foreground">{bike.brand} {bike.model}</p>
                <p className="text-xs text-muted-foreground">{bike.variant}</p>
                <div className="flex gap-2">
                  <Button size="sm" asChild><Link href={bikePath(bike)}>View details</Link></Button>
                  <Button size="sm" variant="outline" onClick={() => remove(bike.id)}>Remove</Button>
                </div>
              </CardContent>
            </Card>
          ) : null,
        )}
      </div>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-secondary/40">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-foreground">Spec</th>
              {ids.map((id) => {
                const bike = bikes.find((b) => b.id === id);
                return <th key={id} className="px-4 py-3 text-left font-medium text-foreground">{bike ? `${bike.brand} ${bike.model}` : "-"}</th>;
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.label}>
                <td className="px-4 py-3 text-muted-foreground">{row.label}</td>
                {ids.map((id) => <td key={`${row.label}-${id}`} className="px-4 py-3 text-foreground">{row.value(id)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

