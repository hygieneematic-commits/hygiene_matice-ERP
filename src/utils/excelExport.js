import * as XLSX from "xlsx";

export function exportTableToExcel({ sheetName = "Sheet1", columns, rows, filename }) {
  const data = [columns, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}
