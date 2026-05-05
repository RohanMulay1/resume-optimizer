import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { ResumeContent } from "./types";

function wrapText(
  text: string,
  widthOfText: (t: string) => number,
  maxWidth: number
): string[] {
  if (!text?.trim()) return [];
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (widthOfText(testLine) > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

export async function generateResumePDF(
  content: ResumeContent
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]); // A4

  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const regular = await doc.embedFont(StandardFonts.Helvetica);

  const ML = 50; // margin left
  const MR = 50; // margin right
  const CW = 595 - ML - MR; // content width = 495
  const BOTTOM = 40;
  const black = rgb(0, 0, 0);
  const gray = rgb(0.45, 0.45, 0.45);
  const accent = rgb(0.13, 0.27, 0.6);

  let y = 792; // start near top (842 - 50)

  const lh = (size: number) => size * 1.45;

  const drawLine = (yPos: number) => {
    page.drawLine({
      start: { x: ML, y: yPos },
      end: { x: 595 - MR, y: yPos },
      thickness: 0.6,
      color: accent,
    });
  };

  const drawSectionHeader = (title: string) => {
    y -= 10;
    if (y < BOTTOM) return;
    page.drawText(title.toUpperCase(), {
      x: ML,
      y,
      size: 9.5,
      font: bold,
      color: accent,
    });
    y -= 4;
    drawLine(y);
    y -= lh(9.5);
  };

  const drawWrapped = (
    text: string,
    size: number,
    font: typeof regular,
    color: typeof black,
    indentX = ML
  ) => {
    const width = (t: string) => font.widthOfTextAtSize(t, size);
    const lines = wrapText(text, width, CW - (indentX - ML));
    for (const line of lines) {
      if (y < BOTTOM) return;
      page.drawText(line, { x: indentX, y, size, font, color });
      y -= lh(size);
    }
  };

  // ── Name
  const name = content.name || "Candidate";
  page.drawText(name, { x: ML, y, size: 22, font: bold, color: black });
  y -= lh(22) * 0.85;

  // ── Contact line
  const parts = [
    content.contact?.email,
    content.contact?.phone,
    content.contact?.location,
  ].filter(Boolean);
  if (parts.length) {
    page.drawText(parts.join("   |   "), {
      x: ML,
      y,
      size: 9,
      font: regular,
      color: gray,
    });
  }
  y -= 6;
  drawLine(y);
  y -= lh(10);

  // ── Summary
  if (content.summary?.trim()) {
    drawSectionHeader("Professional Summary");
    drawWrapped(content.summary, 9.5, regular, black);
  }

  // ── Skills
  if (content.skills?.length) {
    drawSectionHeader("Skills");
    drawWrapped(content.skills.join("   •   "), 9.5, regular, black);
  }

  // ── Experience
  if (content.experience?.length) {
    drawSectionHeader("Experience");
    for (const exp of content.experience) {
      if (y < BOTTOM) break;
      const header = `${exp.title} @ ${exp.company}`;
      page.drawText(header, { x: ML, y, size: 10, font: bold, color: black });
      // Duration right-aligned
      const dur = exp.duration || "";
      const durW = regular.widthOfTextAtSize(dur, 9);
      page.drawText(dur, {
        x: 595 - MR - durW,
        y,
        size: 9,
        font: regular,
        color: gray,
      });
      y -= lh(9.5);

      for (const bullet of exp.bullets || []) {
        if (y < BOTTOM) break;
        const bulletWidth = (t: string) => regular.widthOfTextAtSize(t, 9);
        const bLines = wrapText(bullet, bulletWidth, CW - 18);
        for (let i = 0; i < bLines.length; i++) {
          if (y < BOTTOM) break;
          const prefix = i === 0 ? "•  " : "   ";
          page.drawText(prefix + bLines[i], {
            x: ML + 10,
            y,
            size: 9,
            font: regular,
            color: black,
          });
          y -= lh(9);
        }
      }
      y -= 5;
    }
  }

  // ── Education
  if (content.education?.length) {
    drawSectionHeader("Education");
    for (const edu of content.education) {
      if (y < BOTTOM) break;
      const eduLine = `${edu.degree}  —  ${edu.institution}`;
      page.drawText(eduLine, { x: ML, y, size: 9.5, font: bold, color: black });
      const yr = edu.year || "";
      const yrW = regular.widthOfTextAtSize(yr, 9);
      page.drawText(yr, {
        x: 595 - MR - yrW,
        y,
        size: 9,
        font: regular,
        color: gray,
      });
      y -= lh(9.5);
    }
  }

  return doc.save();
}
