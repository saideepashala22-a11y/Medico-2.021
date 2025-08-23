import jsPDF from 'jspdf';

interface PharmacyBillingData {
  invoiceNumber: string;
  patient: {
    name: string;
    address: string;
    mobile: string;
    doctorName?: string;
  };
  medicines: Array<{
    name: string;
    pack: string;
    batch: string;
    hsn?: string;
    exp?: string;
    quantity: number;
    mrp: number;
    sgst: number;
    cgst: number;
    total: number;
  }>;
  subtotal: number;
  discount: number;
  grandTotal: number;
}

export function generatePharmacyBillingPDF(data: PharmacyBillingData) {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  
  let yPos = 15;
  
  // ========== HEADER BOX WITH PHARMACY AND PATIENT DETAILS ==========
  const headerHeight = 45;
  
  // Draw border around entire header
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.5);
  pdf.rect(margin, yPos, pageWidth - 2 * margin, headerHeight, 'S');
  
  // Left side - Pharmacy details
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('NAKSHATRA PHARMACY', margin + 3, yPos + 8);
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text('123 Medical Street, Healthcare City', margin + 3, yPos + 15);
  pdf.text('Phone: +91 98765 43210', margin + 3, yPos + 21);
  pdf.text('Email: pharmacy@nakshatra.com', margin + 3, yPos + 27);
  pdf.text('GSTIN: 29ABCDE1234F1Z5', margin + 3, yPos + 33);
  pdf.text('D.L. No.: DL-29-12345', margin + 3, yPos + 39);
  
  // Right side - Patient details
  const rightX = pageWidth / 2 + 10;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('PATIENT DETAILS:', rightX, yPos + 8);
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Name: ${data.patient.name}`, rightX, yPos + 15);
  pdf.text(`Address: ${data.patient.address}`, rightX, yPos + 21);
  pdf.text(`Mobile: ${data.patient.mobile}`, rightX, yPos + 27);
  if (data.patient.doctorName) {
    pdf.text(`Doctor: ${data.patient.doctorName}`, rightX, yPos + 33);
  }
  
  yPos += headerHeight + 8;
  
  // ========== GST INVOICE ROW WITH SHADED BACKGROUND ==========
  const invoiceRowHeight = 18;
  
  // Shaded background for invoice row
  pdf.setFillColor(230, 230, 230);
  pdf.rect(margin, yPos, pageWidth - 2 * margin, invoiceRowHeight, 'F');
  
  // "GST INVOICE" title in center
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('GST INVOICE', pageWidth / 2, yPos + 12, { align: 'center' });
  
  // Invoice details on right
  const currentDate = new Date();
  const invoiceRightX = pageWidth - margin - 5;
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Invoice No: ${data.invoiceNumber}`, invoiceRightX, yPos + 5, { align: 'right' });
  pdf.text(`Date: ${currentDate.toLocaleDateString('en-IN')}`, invoiceRightX, yPos + 10, { align: 'right' });
  pdf.text(`Time: ${currentDate.toLocaleTimeString('en-IN')}`, invoiceRightX, yPos + 15, { align: 'right' });
  
  yPos += invoiceRowHeight + 8;
  
  // ========== PRODUCT TABLE ==========
  const tableStartY = yPos;
  const rowHeight = 8;
  const colWidths = [15, 45, 20, 20, 20, 20, 20, 25, 20, 20, 25]; // Column widths
  const colPositions: number[] = [];
  let currentX = margin;
  
  // Calculate column positions
  for (let i = 0; i < colWidths.length; i++) {
    colPositions.push(currentX);
    currentX += colWidths[i];
  }
  
  // Table headers
  const headers = ['SN', 'Product Name', 'Pack', 'Batch', 'HSN', 'EXP', 'QTY', 'MRP', 'SGST', 'CGST', 'TOTAL'];
  
  // Draw header row background
  pdf.setFillColor(220, 220, 220);
  pdf.rect(margin, yPos, pageWidth - 2 * margin, rowHeight, 'F');
  
  // Draw header borders and text
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.3);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  
  headers.forEach((header, index) => {
    // Vertical lines
    pdf.line(colPositions[index], yPos, colPositions[index], yPos + rowHeight);
    // Header text (centered)
    const colCenter = colPositions[index] + colWidths[index] / 2;
    pdf.text(header, colCenter, yPos + 5.5, { align: 'center' });
  });
  
  // Right border of table
  pdf.line(pageWidth - margin, yPos, pageWidth - margin, yPos + rowHeight);
  
  // Top and bottom borders of header
  pdf.line(margin, yPos, pageWidth - margin, yPos);
  pdf.line(margin, yPos + rowHeight, pageWidth - margin, yPos + rowHeight);
  
  yPos += rowHeight;
  
  // Sample data row (as requested)
  const sampleMedicine = {
    name: 'D-Cold-20 TAB',
    pack: '1S',
    batch: 'B110',
    hsn: '3004',
    exp: '12/25',
    quantity: 1,
    mrp: 110.00,
    sgst: 0.00,
    cgst: 0.00,
    total: 110.00
  };
  
  // Add sample row to medicines if empty
  const medicineData = data.medicines.length > 0 ? data.medicines : [sampleMedicine];
  
  // Draw medicine rows
  medicineData.forEach((medicine, index) => {
    const rowData = [
      (index + 1).toString(),
      medicine.name,
      medicine.pack || '1S',
      medicine.batch || 'B110',
      medicine.hsn || '3004',
      medicine.exp || '12/25',
      medicine.quantity.toString(),
      medicine.mrp.toFixed(2),
      medicine.sgst.toFixed(2),
      medicine.cgst.toFixed(2),
      medicine.total.toFixed(2)
    ];
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    
    // Draw row borders
    rowData.forEach((data, colIndex) => {
      pdf.line(colPositions[colIndex], yPos, colPositions[colIndex], yPos + rowHeight);
      
      // Center align for SN, QTY, amounts
      const alignCenter = [0, 6, 7, 8, 9, 10].includes(colIndex);
      if (alignCenter) {
        const colCenter = colPositions[colIndex] + colWidths[colIndex] / 2;
        pdf.text(data, colCenter, yPos + 5.5, { align: 'center' });
      } else {
        // Left align for text fields
        pdf.text(data, colPositions[colIndex] + 2, yPos + 5.5);
      }
    });
    
    // Right border
    pdf.line(pageWidth - margin, yPos, pageWidth - margin, yPos + rowHeight);
    // Bottom border
    pdf.line(margin, yPos + rowHeight, pageWidth - margin, yPos + rowHeight);
    
    yPos += rowHeight;
  });
  
  yPos += 10;
  
  // ========== FOOTER NOTES ==========
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text('GST 110*0% = 0 SGST, ** GET WELL SOON **', margin, yPos);
  
  yPos += 10;
  
  // ========== REMARK LINE ==========
  pdf.setFont('helvetica', 'italic');
  pdf.text('Please share screenshot after payment & same day payment', margin, yPos);
  
  // ========== TOTAL SECTION (Right Side) ==========
  const totalSectionX = pageWidth - 80;
  const totalSectionY = yPos - 30;
  const totalBoxWidth = 70;
  const totalRowHeight = 6;
  
  // Draw total section border
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.3);
  pdf.rect(totalSectionX, totalSectionY, totalBoxWidth, totalRowHeight * 3, 'S');
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  
  // SUB TOTAL
  pdf.text('SUB TOTAL:', totalSectionX + 2, totalSectionY + 4);
  pdf.text(data.subtotal.toFixed(2), totalSectionX + totalBoxWidth - 2, totalSectionY + 4, { align: 'right' });
  pdf.line(totalSectionX, totalSectionY + totalRowHeight, totalSectionX + totalBoxWidth, totalSectionY + totalRowHeight);
  
  // DISCOUNT
  pdf.text('DISCOUNT:', totalSectionX + 2, totalSectionY + totalRowHeight + 4);
  pdf.text(data.discount.toFixed(2), totalSectionX + totalBoxWidth - 2, totalSectionY + totalRowHeight + 4, { align: 'right' });
  pdf.line(totalSectionX, totalSectionY + totalRowHeight * 2, totalSectionX + totalBoxWidth, totalSectionY + totalRowHeight * 2);
  
  // GRAND TOTAL (highlighted)
  pdf.setFillColor(220, 220, 220);
  pdf.rect(totalSectionX, totalSectionY + totalRowHeight * 2, totalBoxWidth, totalRowHeight, 'F');
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('GRAND TOTAL:', totalSectionX + 2, totalSectionY + totalRowHeight * 2 + 4);
  pdf.text(data.grandTotal.toFixed(2), totalSectionX + totalBoxWidth - 2, totalSectionY + totalRowHeight * 2 + 4, { align: 'right' });
  
  // Save the PDF
  const fileName = `pharmacy_bill_${data.invoiceNumber}.pdf`;
  pdf.save(fileName);
}