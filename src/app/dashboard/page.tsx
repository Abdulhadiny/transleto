"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { StatCard } from "@/components/dashboard/stats-cards";
import { RecentTasks } from "@/components/dashboard/recent-tasks";
import { Skeleton } from "@/components/ui/skeleton";

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
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!stats) return null;

  const role = session?.user?.role;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {role === "ADMIN" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Projects" value={stats.totalProjects as number} />
          <StatCard title="Total Tasks" value={stats.totalTasks as number} />
          <StatCard title="Total Users" value={stats.totalUsers as number} />
          <StatCard
            title="Submitted"
            value={(stats.tasksByStatus as Record<string, number>)?.SUBMITTED || 0}
            description="Awaiting review"
          />
        </div>
      )}

      {role === "TRANSLATOR" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Assigned Tasks" value={stats.assignedTasks as number} />
          <StatCard
            title="In Progress"
            value={(stats.tasksByStatus as Record<string, number>)?.IN_PROGRESS || 0}
          />
          <StatCard
            title="Submitted"
            value={(stats.tasksByStatus as Record<string, number>)?.SUBMITTED || 0}
          />
          <StatCard
            title="Approved"
            value={(stats.tasksByStatus as Record<string, number>)?.APPROVED || 0}
          />
        </div>
      )}

      {role === "REVIEWER" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Pending Review"
            value={stats.submittedForReview as number}
          />
          <StatCard
            title="Reviewed by Me"
            value={stats.reviewedByMe as number}
          />
        </div>
      )}

      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <RecentTasks tasks={(stats.recentTasks as any[]) || []} />
    </div>
  );
}
