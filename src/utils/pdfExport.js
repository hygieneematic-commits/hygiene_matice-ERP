import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function exportTableToPDF({ title, subtitle, columns, rows, filename }) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.setTextColor(67, 56, 202);
  doc.text(title, 14, 18);
  if (subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(subtitle, 14, 25);
  }
  autoTable(doc, {
    startY: subtitle ? 32 : 26,
    head: [columns],
    body: rows,
    theme: "striped",
    headStyles: { fillColor: [67, 56, 202], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8.5, textColor: [15, 23, 42] },
    alternateRowStyles: { fillColor: [247, 249, 252] },
  });
  doc.save(`${filename}.pdf`);
}
