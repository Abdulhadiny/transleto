"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { StatCard } from "@/components/dashboard/stats-cards";
import { RecentTasks } from "@/components/dashboard/recent-tasks";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { TranslatorPerformance } from "@/components/dashboard/translator-performance";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const role = session?.user?.role;

  return (
    <div className="space-y-8">
      <div className="animate-fade-up">
        <h1 className="text-2xl font-bold text-stone-900">Dashboard</h1>
        {session?.user?.name && (
          <p className="text-sm text-stone-400 mt-1">
            Welcome back, <span className="text-stone-600">{session.user.name}</span>
          </p>
        )}
      </div>

      {role === "ADMIN" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="animate-fade-up stagger-1">
            <StatCard title="Total Projects" value={stats.totalProjects as number} accent="amber" />
          </div>
          <div className="animate-fade-up stagger-2">
            <StatCard title="Total Tasks" value={stats.totalTasks as number} accent="sky" />
          </div>
          <div className="animate-fade-up stagger-3">
            <StatCard title="Unassigned Tasks" value={stats.unassignedTasks as number} accent="teal" />
          </div>
          <div className="animate-fade-up stagger-4">
            <StatCard
              title="Submitted"
              value={(stats.tasksByStatus as Record<string, number>)?.SUBMITTED || 0}
              description="Awaiting review"
              accent="rose"
            />
          </div>
        </div>
      )}

      {role === "TRANSLATOR" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="animate-fade-up stagger-1">
            <StatCard title="Assigned Tasks" value={stats.assignedTasks as number} accent="amber" />
          </div>
          <div className="animate-fade-up stagger-2">
            <StatCard
              title="In Progress"
              value={(stats.tasksByStatus as Record<string, number>)?.IN_PROGRESS || 0}
              accent="sky"
            />
          </div>
          <div className="animate-fade-up stagger-3">
            <StatCard
              title="Submitted"
              value={(stats.tasksByStatus as Record<string, number>)?.SUBMITTED || 0}
              accent="amber"
            />
          </div>
          <div className="animate-fade-up stagger-4">
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 to-sky-600" />
              <CardContent className="pt-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                  Status
                </p>
                <div className="mt-2 flex md:flex-col gap-2">
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-teal-500" />
                    <span className="text-xs font-medium text-stone-700">Approved</span>
                    <span className="text-sm font-bold text-stone-900 tabular-nums">{(stats.tasksByStatus as Record<string, number>)?.APPROVED || 0}</span>
                  </div>
                  {/* <span className="text-stone-300">|</span> */}
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    <span className="text-xs font-medium text-stone-700">Rejected</span>
                    <span className="text-sm font-bold text-stone-900 tabular-nums">{(stats.tasksByStatus as Record<string, number>)?.REJECTED || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {role === "REVIEWER" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="animate-fade-up stagger-1">
            <StatCard
              title="Pending Review"
              value={stats.submittedForReview as number}
              accent="amber"
            />
          </div>
          <div className="animate-fade-up stagger-2">
            <StatCard
              title="Reviewed by Me"
              value={stats.reviewedByMe as number}
              accent="teal"
            />
          </div>
          <div className="animate-fade-up stagger-3">
            <StatCard
              title="Approved"
              value={stats.approvedByMe as number}
              accent="sky"
            />
          </div>
          <div className="animate-fade-up stagger-4">
            <StatCard
              title="Rejected"
              value={stats.rejectedByMe as number}
              accent="rose"
            />
          </div>
        </div>
      )}

      {(role === "ADMIN" || role === "TRANSLATOR") && (
        <div className="animate-fade-up" style={{ animationDelay: "0.2s" }}>
          <TranslatorPerformance />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-up" style={{ animationDelay: "0.25s" }}>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <RecentTasks tasks={(stats.recentTasks as any[]) || []} />
        <ActivityFeed />
      </div>
    </div>
  );
}
