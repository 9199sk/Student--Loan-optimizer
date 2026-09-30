import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatINR, formatTenure, formatDate, formatMonthYear } from './formatters.js';

/**
 * generateDebtFreeRoadmapPDF
 *
 * Generates a printable PDF report for the student loan debt-free roadmap.
 *
 * @param {object} params
 * @param {object} params.parsed        - Parsed loan parameters (principal, annualRate, tenureMonths, etc.)
 * @param {object} params.prepayment    - Prepayment settings (extraMonthly, lumpSum, lumpSumMonth)
 * @param {object} params.results       - Engine results (original, prepaid, savings, emi)
 * @param {boolean} params.hasPrepayment - Whether prepayment is configured
 */
export function generateDebtFreeRoadmapPDF({ parsed, prepayment, results, hasPrepayment }) {
  if (!parsed || !results) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let currentY = 14;

  // Colors
  const primaryColor = [79, 70, 229];    // Indigo #4f46e5
  const secondaryColor = [30, 41, 59];   // Slate #1e293b
  const successColor = [16, 185, 129];   // Emerald #10b981
  const textColor = [51, 65, 85];        // Slate-700 #334155
  const lightBg = [248, 250, 252];        // Slate-50 #f8fafc

  // ── 1. HEADER BANNER ──────────────────────────────────────────────────
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Student Loan Debt-Free Roadmap', margin, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Personalised Repayment & Prepayment Savings Plan', margin, 22);

  const generatedDate = formatDate(new Date());
  doc.text(`Generated: ${generatedDate}`, pageWidth - margin, 22, { align: 'right' });

  currentY = 36;

  // ── 2. SUMMARY CARDS (LOAN SUMMARY + PREPAYMENT STRATEGY) ─────────────
  const cardWidth = (contentWidth - 6) / 2;
  const cardHeight = 44;

  // Card 1: Loan Summary
  doc.setFillColor(...lightBg);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, cardWidth, cardHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...secondaryColor);
  doc.text('LOAN SUMMARY', margin + 4, currentY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...textColor);

  let itemY = currentY + 14;
  const drawLabelValue = (label, val, x, y) => {
    doc.setFont('helvetica', 'normal');
    doc.text(label, x, y);
    doc.setFont('helvetica', 'bold');
    doc.text(val, x + 34, y);
  };

  drawLabelValue('Principal:', formatINR(parsed.principal), margin + 4, itemY);
  drawLabelValue('Interest Rate:', `${parsed.annualRate}%`, margin + 4, itemY + 6);
  drawLabelValue('Tenure:', `${formatTenure(parsed.tenureMonths)} (${parsed.tenureMonths} mo)`, margin + 4, itemY + 12);
  drawLabelValue('Monthly EMI:', formatINR(results.emi), margin + 4, itemY + 18);
  drawLabelValue('Start Date:', formatDate(parsed.startDate), margin + 4, itemY + 24);

  // Card 2: Prepayment Strategy
  const col2X = margin + cardWidth + 6;
  doc.setFillColor(...lightBg);
  doc.roundedRect(col2X, currentY, cardWidth, cardHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...secondaryColor);
  doc.text('PREPAYMENT STRATEGY', col2X + 4, currentY + 7);

  itemY = currentY + 14;
  const extraMonthlyStr = prepayment.extraMonthly > 0 ? formatINR(prepayment.extraMonthly) : 'None';
  const lumpSumStr = prepayment.lumpSum > 0 ? formatINR(prepayment.lumpSum) : 'None';
  const lumpSumMonthStr = prepayment.lumpSum > 0 ? `Month ${prepayment.lumpSumMonth}` : 'N/A';

  drawLabelValue('Extra / Month:', extraMonthlyStr, col2X + 4, itemY);
  drawLabelValue('One-Time Lump:', lumpSumStr, col2X + 4, itemY + 6);
  drawLabelValue('Payment Month:', lumpSumMonthStr, col2X + 4, itemY + 12);

  currentY += cardHeight + 8;

  // ── 3. RESULTS & SAVINGS SUMMARY ───────────────────────────────────────
  doc.setFillColor(236, 253, 245); // Emerald-50
  doc.setDrawColor(167, 243, 208); // Emerald-200
  doc.roundedRect(margin, currentY, contentWidth, 32, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(5, 150, 105); // Emerald-600
  doc.text('SAVINGS & IMPACT SUMMARY', margin + 4, currentY + 7);

  doc.setFontSize(9);
  doc.setTextColor(...textColor);

  const resY = currentY + 15;
  const colW = contentWidth / 3;

  // Col 1: Interest
  doc.setFont('helvetica', 'normal');
  doc.text('Original Total Interest:', margin + 4, resY);
  doc.setFont('helvetica', 'bold');
  doc.text(formatINR(results.original.totalInterest), margin + 38, resY);

  doc.setFont('helvetica', 'normal');
  doc.text('New Total Interest:', margin + 4, resY + 6);
  doc.setFont('helvetica', 'bold');
  doc.text(formatINR(results.prepaid.totalInterest), margin + 38, resY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(5, 150, 105);
  doc.text('Interest Saved:', margin + 4, resY + 12);
  doc.text(formatINR(results.savings.interestSaved), margin + 38, resY + 12);

  // Col 2: Tenure
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'normal');
  doc.text('Original Tenure:', margin + colW + 4, resY);
  doc.setFont('helvetica', 'bold');
  doc.text(formatTenure(results.savings.originalTenureMonths), margin + colW + 36, resY);

  doc.setFont('helvetica', 'normal');
  doc.text('New Tenure:', margin + colW + 4, resY + 6);
  doc.setFont('helvetica', 'bold');
  doc.text(formatTenure(results.savings.newTenureMonths), margin + colW + 36, resY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(5, 150, 105);
  doc.text('Time Saved:', margin + colW + 4, resY + 12);
  doc.text(`${results.savings.monthsSaved} months`, margin + colW + 36, resY + 12);

  // Col 3: Debt Free Date
  const debtFreeDate = results.savings.newDebtFreeDate || results.savings.originalDebtFreeDate;
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'normal');
  doc.text('Debt-Free Date:', margin + colW * 2 + 4, resY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(5, 150, 105);
  doc.setFontSize(10);
  doc.text(formatDate(debtFreeDate), margin + colW * 2 + 4, resY + 7);

  currentY += 40;

  // ── 4. AMORTIZATION TABLE ─────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...secondaryColor);
  doc.text('AMORTIZATION SCHEDULE', margin, currentY);

  const activeSchedule = hasPrepayment ? results.prepaid.schedule : results.original.schedule;

  const tableBody = activeSchedule.map((row) => [
    row.isMoratorium ? `${row.month} (Moratorium)` : String(row.month),
    formatMonthYear(row.date),
    formatINR(row.payment),
    formatINR(row.principalPaid),
    formatINR(row.interestPaid),
    formatINR(row.balance),
  ]);

  autoTable(doc, {
    startY: currentY + 4,
    head: [['Month', 'Date', 'Payment', 'Principal', 'Interest', 'Remaining Balance']],
    body: tableBody,
    theme: 'striped',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'right',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: textColor,
      halign: 'right',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 28 },
      1: { halign: 'center', cellWidth: 24 },
      2: { cellWidth: 32 },
      3: { cellWidth: 32 },
      4: { cellWidth: 32 },
      5: { cellWidth: 34 },
    },
    margin: { left: margin, right: margin, bottom: 16 },
    didDrawPage: (data) => {
      // Header on subsequent pages
      if (data.pageNumber > 1) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...primaryColor);
        doc.text('Student Loan Debt-Free Roadmap (Continued)', margin, 10);
        doc.setDrawColor(226, 232, 240);
        doc.line(margin, 12, pageWidth - margin, 12);
      }
    },
  });

  // ── 5. PAGE NUMBERS & FOOTER ──────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // Slate-400

    const footerY = doc.internal.pageSize.getHeight() - 8;
    doc.text('Student Loan Optimizer — Personalised Financial Plan', margin, footerY);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, footerY, { align: 'right' });
  }

  // Save the PDF
  doc.save('Student_Loan_Debt_Free_Roadmap.pdf');
}
