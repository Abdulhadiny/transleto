"use client";

import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: number | string;
  description?: string;
}

export function StatCard({ title, value, description }: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-4">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="mt-1 text-3xl font-semibold text-gray-900">{value}</p>
        {description && (
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
