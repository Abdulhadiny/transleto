"use client";

import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: number | string;
  description?: string;
  accent?: "amber" | "teal" | "sky" | "rose";
}

const accentStyles: Record<string, string> = {
  amber: "from-amber-500 to-amber-600",
  teal: "from-teal-500 to-teal-600",
  sky: "from-sky-500 to-sky-600",
  rose: "from-rose-500 to-rose-600",
};

export function StatCard({ title, value, description, accent = "amber" }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${accentStyles[accent]}`} />
      <CardContent className="pt-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
          {title}
        </p>
        <p className="mt-2 text-3xl font-bold text-stone-900 tabular-nums">
          {value}
        </p>
        {description && (
          <p className="mt-1 text-xs text-stone-400">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
