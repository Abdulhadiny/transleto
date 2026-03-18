import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") || "csv";
  const statusFilter = searchParams.get("status") || "APPROVED";

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      tasks: {
        where: statusFilter === "ALL" ? {} : { status: statusFilter as never },
        include: {
          assignedTo: { select: { name: true } },
          reviewedBy: { select: { name: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (format === "json") {
    const data = project.tasks.map((task) => ({
      id: task.id,
      originalContent: task.originalContent,
      translatedContent: task.translatedContent,
      status: task.status,
      translator: task.assignedTo?.name || null,
      reviewer: task.reviewedBy?.name || null,
    }));

    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${project.title.replace(/[^a-zA-Z0-9]/g, "_")}_translations.json"`,
      },
    });
  }

  // CSV format
  const header = "Original Content,Translated Content,Status,Translator,Reviewer";
  const rows = project.tasks.map((task) => {
    const escape = (s: string | null) => {
      if (!s) return "";
      return `"${s.replace(/"/g, '""')}"`;
    };
    return [
      escape(task.originalContent),
      escape(task.translatedContent),
      task.status,
      escape(task.assignedTo?.name || null),
      escape(task.reviewedBy?.name || null),
    ].join(",");
  });

  const csv = [header, ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${project.title.replace(/[^a-zA-Z0-9]/g, "_")}_translations.csv"`,
    },
  });
}
