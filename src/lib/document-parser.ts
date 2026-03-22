export interface DocumentSegment {
  content: string;
  segmentType: string; // "paragraph" | "heading1" | ... | "heading6"
  orderIndex: number;
}

const HEADING_TAG_MAP: Record<string, string> = {
  H1: "heading1",
  H2: "heading2",
  H3: "heading3",
  H4: "heading4",
  H5: "heading5",
  H6: "heading6",
};

function parseHtmlToSegments(html: string): DocumentSegment[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const segments: DocumentSegment[] = [];

  const elements = doc.body.querySelectorAll("p, h1, h2, h3, h4, h5, h6");
  let orderIndex = 0;

  elements.forEach((el) => {
    const text = (el.textContent || "").trim();
    if (!text) return;

    const tag = el.tagName.toUpperCase();
    const segmentType = HEADING_TAG_MAP[tag] || "paragraph";

    segments.push({ content: text, segmentType, orderIndex });
    orderIndex++;
  });

  return segments;
}

export async function parseDocx(arrayBuffer: ArrayBuffer): Promise<DocumentSegment[]> {
  const mammoth = await import("mammoth");
  const result = await mammoth.convertToHtml({ arrayBuffer });
  return parseHtmlToSegments(result.value);
}

export function parseHtml(html: string): DocumentSegment[] {
  return parseHtmlToSegments(html);
}
