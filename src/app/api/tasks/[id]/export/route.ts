import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/auth-helpers";
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, HeadingLevel, WidthType, ShadingType } from "docx";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await getSessionOrUnauthorized();
  if (error) return error;

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") || "csv";

  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      project: { select: { title: true } },
      assignedTo: { select: { name: true } },
      reviewedBy: { select: { name: true } },
    },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const filename = `task_translation`;

  if (format === "json") {
    const data = {
      project: task.project.title,
      originalContent: task.originalContent,
      translatedContent: task.translatedContent,
      status: task.status,
      translator: task.assignedTo?.name || null,
      reviewer: task.reviewedBy?.name || null,
    };

    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}.json"`,
      },
    });
  }

  if (format === "docx") {
    const headerShading = {
      type: ShadingType.SOLID,
      color: "F5F5F4",
      fill: "F5F5F4",
    };

    function labelCell(text: string) {
      return new TableCell({
        width: { size: 25, type: WidthType.PERCENTAGE },
        shading: headerShading,
        children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 20 })] })],
      });
    }

    function valueCell(text: string, widthPct = 75) {
      return new TableCell({
        width: { size: widthPct, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ children: [new TextRun({ text, size: 20 })] })],
      });
    }

    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: "Translation Export" })],
          }),
          new Paragraph({ text: "" }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [labelCell("Project"), valueCell(task.project.title)] }),
              new TableRow({ children: [labelCell("Status"), valueCell(task.status)] }),
              new TableRow({ children: [labelCell("Translator"), valueCell(task.assignedTo?.name || "Unassigned")] }),
              new TableRow({ children: [labelCell("Reviewer"), valueCell(task.reviewedBy?.name || "Unassigned")] }),
              new TableRow({
                children: [
                  labelCell("Original Content"),
                  valueCell(task.originalContent),
                ],
              }),
              new TableRow({
                children: [
                  labelCell("Translation"),
                  valueCell(task.translatedContent || "No translation yet."),
                ],
              }),
            ],
          }),
        ],
      }],
    });

    const buffer = await Packer.toBuffer(doc);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}.docx"`,
      },
    });
  }

  // CSV format
  const escape = (s: string | null) => {
    if (!s) return "";
    return `"${s.replace(/"/g, '""')}"`;
  };

  const header = "Original Content,Translated Content,Status,Translator,Reviewer";
  const row = [
    escape(task.originalContent),
    escape(task.translatedContent),
    task.status,
    escape(task.assignedTo?.name || null),
    escape(task.reviewedBy?.name || null),
  ].join(",");

  return new NextResponse([header, row].join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}.csv"`,
    },
  });
}
