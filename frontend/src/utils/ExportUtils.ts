import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: any) => jsPDF;
    }
}

export const exportToCSV = (data: any[], fileName: string, headers: string[]) => {
    const csvContent = [headers, ...data].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${fileName}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const exportToExcel = (data: any[], fileName: string, headers: string[]) => {
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

export const exportToPDF = (data: any[], fileName: string, headers: string[], title: string) => {
    const doc = new jsPDF();

    // Add Title
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);

    // Add date
    const date = new Date().toLocaleString();
    doc.text(`Generated on: ${date}`, 14, 30);

    // Add table
    doc.autoTable({
        head: [headers],
        body: data,
        startY: 35,
        theme: 'grid',
        headStyles: { fillStyle: '#2563eb', textColor: 255 },
        styles: { fontSize: 8, cellPadding: 2 }
    });

    doc.save(`${fileName}.pdf`);
};
