import { jsPDF } from "jspdf";
import { maskPassport, type VerifyPayload } from "./qr";

function wrap(doc: jsPDF, text: string, width: number): string[] {
  return doc.splitTextToSize(text, width) as string[];
}

export function downloadCertificatePdf(payload: VerifyPayload, qrDataUrl: string) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = 210;
  const pageH = 297;
  const left = 20;
  const width = 170;
  let y = 22;

  doc.setTextColor(28, 27, 25);
  doc.setFont("times", "bold");
  doc.setFontSize(14);
  doc.text("MEDICAL CERTIFICATE FOR TRAVEL", pageW / 2, y, { align: "center" });
  y += 7;

  doc.setFont("times", "italic");
  doc.setFontSize(9);
  doc.setTextColor(168, 108, 22);
  doc.text("Draft / template — not an authentic medical certificate", pageW / 2, y, {
    align: "center",
  });
  y += 12;

  doc.setTextColor(28, 27, 25);
  doc.setFont("times", "normal");
  doc.setFontSize(11);
  doc.text("To whom it may concern", pageW / 2, y, { align: "center" });
  y += 10;

  doc.setFontSize(10);
  doc.setTextColor(90, 86, 80);
  doc.text(`Date ${payload.issuedDate || "—"}`, left, y);
  y += 10;

  doc.setTextColor(28, 27, 25);
  const name = payload.name || "[traveller name]";
  const dob = payload.dob || "[date of birth]";
  const passport = payload.passportLast4 ? maskPassport(payload.passportLast4) : "[passport]";
  const intro = `This template concerns ${name}, date of birth ${dob}, passport ${passport}.`;
  for (const line of wrap(doc, intro, width)) {
    doc.text(line, left, y);
    y += 6;
  }
  y += 3;

  const med = `Medication: ${payload.medicine || "[medicine]"}. Quantity: ${payload.quantity || "[quantity]"}.`;
  for (const line of wrap(doc, med, width)) {
    doc.text(line, left, y);
    y += 6;
  }
  y += 3;

  const cond = payload.conditions
    ? `The medication listed above is stated to be for the traveller’s personal medical use in connection with ${payload.conditions}.`
    : "The medication listed above is stated to be for the traveller’s personal medical use.";
  for (const line of wrap(doc, cond, width)) {
    doc.text(line, left, y);
    y += 6;
  }
  y += 3;

  for (const line of wrap(doc, `Destination: ${payload.destination || "[destination]"}.`, width)) {
    doc.text(line, left, y);
    y += 6;
  }

  if (payload.instructions) {
    y += 3;
    for (const line of wrap(doc, payload.instructions, width)) {
      if (y > 230) break;
      doc.text(line, left, y);
      y += 6;
    }
  }

  y += 4;
  const legal =
    "This document does not override destination, transit, or border laws. It requires completion and verification by the treating physician before it can be presented as a medical certificate.";
  for (const line of wrap(doc, legal, width)) {
    if (y > 236) break;
    doc.text(line, left, y);
    y += 6;
  }

  y = Math.max(y + 8, 200);
  doc.text(`Doctor: ${payload.doctorName || "[name]"}`, left, y);
  y += 6;
  doc.text(`License: ${payload.licenseNumber || "[license number]"}`, left, y);
  y += 10;
  doc.setFont("courier", "normal");
  doc.setFontSize(9);
  doc.setTextColor(90, 86, 80);
  doc.text(`Document ID ${payload.id}`, left, y);

  const qrSize = 30;
  const qrX = pageW - 16 - qrSize;
  const qrY = pageH - 16 - qrSize - 10;
  if (qrDataUrl) {
    doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(90, 86, 80);
  const caption = "Anyone who scans this code can see the details above.";
  const captionLines = wrap(doc, caption, qrSize);
  doc.text(captionLines, qrX + qrSize / 2, qrY + qrSize + 4, { align: "center" });

  const filename = `${payload.id || "CBM"}-travel-certificate.pdf`;
  doc.save(filename);
}
