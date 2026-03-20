"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

interface WeekData {
  submissions: number;
  approved: number;
  rejected: number;
  approvalRate: number | null;
}

interface TranslatorData {
  id: string;
  name: string;
  weeks: WeekData[];
}

interface PerformanceData {
  weeks: string[];
  translators: TranslatorData[];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function rateColor(rate: number | null): string {
  if (rate === null) return "text-stone-400";
  if (rate >= 80) return "text-teal-600";
  if (rate >= 50) return "text-amber-600";
  return "text-rose-600";
}

function rateBg(rate: number | null): string {
  if (rate === null) return "";
  if (rate >= 80) return "bg-teal-50";
  if (rate >= 50) return "bg-amber-50";
  return "bg-rose-50";
}

export function TranslatorPerformance() {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/translator-performance")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((d: PerformanceData) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <Card>
      <CardHeader>
        <h3 className="text-sm font-semibold text-stone-900">
          Weekly Translator Performance
        </h3>
        <p className="text-xs text-stone-400 mt-0.5">
          Submissions and approval rate over the last 4 weeks
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full animate-shimmer shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-1/3 rounded animate-shimmer" />
                  <div className="h-3 w-full rounded animate-shimmer" />
                </div>
              </div>
            ))}
          </div>
        ) : !data || data.translators.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 mb-3">
              <svg
                className="w-5 h-5 text-stone-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                />
              </svg>
            </div>
            <p className="text-sm text-stone-500">No performance data yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-stone-100">
                  <th className="text-left text-xs font-medium text-stone-400 pb-2 pl-6 pr-3">
                    Translator
                  </th>
                  {data.weeks.map((week) => (
                    <th
                      key={week}
                      className="text-center text-xs font-medium text-stone-400 pb-2 px-3 last:pr-6"
                    >
                      {week}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.translators.map((translator) => (
                  <tr
                    key={translator.id}
                    className="border-b border-stone-50 last:border-0"
                  >
                    <td className="py-3 pl-6 pr-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stone-100 text-[11px] font-semibold text-stone-600">
                          {getInitials(translator.name)}
                        </div>
                        <span className="text-sm font-medium text-stone-700 truncate max-w-[120px]">
                          {translator.name}
                        </span>
                      </div>
                    </td>
                    {translator.weeks.map((week, idx) => (
                      <td key={idx} className="py-3 px-3 last:pr-6">
                        <div
                          className={`text-center rounded-md px-2 py-1.5 ${rateBg(week.approvalRate)}`}
                        >
                          <div className="text-sm font-semibold text-stone-800">
                            {week.submissions}
                          </div>
                          <div
                            className={`text-[11px] font-medium ${rateColor(week.approvalRate)}`}
                          >
                            {week.approvalRate !== null
                              ? `${week.approvalRate}%`
                              : "—"}
                          </div>
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
