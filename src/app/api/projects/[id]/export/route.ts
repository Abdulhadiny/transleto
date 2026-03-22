import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, HeadingLevel, WidthType } from "docx";

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

  const sanitizedTitle = project.title.replace(/[^a-zA-Z0-9]/g, "_");

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
        "Content-Disposition": `attachment; filename="${sanitizedTitle}_translations.json"`,
      },
    });
  }

  if (format === "docx") {
    const headerCells = ["Original Content", "Translation", "Status", "Translator", "Reviewer"];

    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: project.title })],
          }),
          new Paragraph({ text: "" }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                tableHeader: true,
                children: headerCells.map((text) =>
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 20 })] })],
                  })
                ),
              }),
              ...project.tasks.map((task) =>
                new TableRow({
                  children: [
                    task.originalContent,
                    task.translatedContent || "",
                    task.status,
                    task.assignedTo?.name || "",
                    task.reviewedBy?.name || "",
                  ].map((text) =>
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text, size: 20 })] })],
                    })
                  ),
                })
              ),
            ],
          }),
        ],
      }],
    });

    const buffer = await Packer.toBuffer(doc);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${sanitizedTitle}_translations.docx"`,
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
      "Content-Disposition": `attachment; filename="${sanitizedTitle}_translations.csv"`,
    },
  });
}
