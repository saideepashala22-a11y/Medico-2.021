import jsPDF from 'jspdf';
import JsBarcode from 'jsbarcode';

interface HospitalSettings {
  hospitalName: string;
  hospitalSubtitle?: string;
  address?: string;
  phone?: string;
  email?: string;
  accreditation?: string;
}

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
  hospitalSettings?: HospitalSettings;
}

// Helper function to generate barcode as base64 image
function generateBarcodeImage(text: string): string {
  const canvas = document.createElement('canvas');
  JsBarcode(canvas, text, {
    format: "CODE128",
    width: 1.5, // Reduced width for market standard
    height: 30, // Reduced height for market standard
    displayValue: false, // Remove text display
    margin: 0,
    background: "#ffffff",
    lineColor: "#000000"
  });
  return canvas.toDataURL('image/png');
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
  const hospitalName = data.hospitalSettings?.hospitalName || 'NAKSHATRA HOSPITAL';
  pdf.text(`${hospitalName} PHARMACY`, margin + 3, yPos + 8);
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  const address = data.hospitalSettings?.address || '123 Medical Street, Healthcare City';
  const phone = data.hospitalSettings?.phone || '+91 98765 43210';
  const email = data.hospitalSettings?.email || 'pharmacy@nakshatra.com';
  
  pdf.text(address, margin + 3, yPos + 15);
  pdf.text(`Phone: ${phone}`, margin + 3, yPos + 21);
  pdf.text(`Email: ${email}`, margin + 3, yPos + 27);
  pdf.text(`Bill No: ${data.invoiceNumber}`, margin + 3, yPos + 33);
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
  const rowHeight = 10;
  const colWidths = [10, 40, 14, 14, 14, 14, 10, 18, 14, 14, 18]; // Adjusted to fit page width
  const colPositions: number[] = [];
  let currentX = margin;
  
  // Calculate column positions
  for (let i = 0; i < colWidths.length; i++) {
    colPositions.push(currentX);
    currentX += colWidths[i];
  }
  
  // Table headers
  const headers = ['SN', 'Product Name', 'Pack', 'Batch', 'HSN', 'EXP', 'QTY', 'MRP', 'SGST', 'CGST', 'TOTAL'];
  
  // Draw header row
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.5);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  
  // Header background
  pdf.setFillColor(240, 240, 240);
  pdf.rect(margin, yPos, pageWidth - 2 * margin, rowHeight, 'FD');
  
  headers.forEach((header, index) => {
    // Vertical lines for header
    if (index > 0) {
      pdf.line(colPositions[index], yPos, colPositions[index], yPos + rowHeight);
    }
    
    // Header text (centered)
    const colCenterX = colPositions[index] + colWidths[index] / 2;
    pdf.text(header, colCenterX, yPos + 6.5, { align: 'center' });
  });
  
  yPos += rowHeight;
  
  // ========== MEDICINE ROWS ==========
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  
  // Generate rows for each medicine
  data.medicines.forEach((medicine, index) => {
    const sampleRow = [
      (index + 1).toString(),
      medicine.name,
      medicine.pack,
      medicine.batch,
      medicine.hsn || '3004',
      medicine.exp || '12/25',
      medicine.quantity.toString(),
      medicine.mrp.toFixed(2),
      medicine.sgst.toFixed(0),
      medicine.cgst.toFixed(0),
      medicine.total.toFixed(2)
    ];
    
    // Draw row border
    pdf.rect(margin, yPos, pageWidth - 2 * margin, rowHeight, 'S');
    
    sampleRow.forEach((cellData, colIndex) => {
      // Vertical lines
      if (colIndex > 0) {
        pdf.line(colPositions[colIndex], yPos, colPositions[colIndex], yPos + rowHeight);
      }
      
      // Cell data
      const colCenterX = colPositions[colIndex] + colWidths[colIndex] / 2;
      pdf.text(cellData, colCenterX, yPos + 6.5, { align: 'center' });
    });
    
    yPos += rowHeight;
  });
  
  // ========== FOOTER NOTES SECTION ==========
  yPos += 15;
  
  // ========== TOTALS SECTION (SEPARATE SMALL TABLE) ==========
  yPos += 20;
  
  const totalsX = pageWidth - 85; // Right aligned totals section
  const totalsWidth = 75;
  const totalsRowHeight = 10;
  
  // Draw totals table border
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.5);
  
  // Subtotal row
  pdf.setFillColor(255, 255, 255);
  pdf.rect(totalsX, yPos, totalsWidth, totalsRowHeight, 'S');
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('SUBTOTAL:', totalsX + 3, yPos + 6.5);
  pdf.text(`${data.subtotal.toFixed(2)}`, totalsX + totalsWidth - 3, yPos + 6.5, { align: 'right' });
  yPos += totalsRowHeight;
  
  // Discount row
  pdf.rect(totalsX, yPos, totalsWidth, totalsRowHeight, 'S');
  pdf.text('DISCOUNT:', totalsX + 3, yPos + 6.5);
  pdf.text(`${data.discount.toFixed(2)}`, totalsX + totalsWidth - 3, yPos + 6.5, { align: 'right' });
  yPos += totalsRowHeight;
  
  // Grand Total row (highlighted with light grey background)
  pdf.setFillColor(220, 220, 220);
  pdf.rect(totalsX, yPos, totalsWidth, totalsRowHeight, 'DF');
  pdf.setFont('helvetica', 'bold');
  pdf.text('GRAND TOTAL:', totalsX + 3, yPos + 6.5);
  pdf.text(`${data.grandTotal.toFixed(2)}`, totalsX + totalsWidth - 3, yPos + 6.5, { align: 'right' });
  
  // ========== PROFESSIONAL BARCODE SECTION ==========
  yPos += 40; // Add space for barcode
  
  // Generate barcode for invoice number
  const barcodeData = data.invoiceNumber;
  const barcodeImage = generateBarcodeImage(barcodeData);
  
  // Add barcode without background (market standard size)
  const barcodeAreaHeight = 25; // Smaller height
  const barcodeAreaWidth = 80; // Smaller width
  const barcodeX = margin + 10; // Left aligned with some margin
  
  // Add barcode image (no background, no border)
  try {
    pdf.addImage(barcodeImage, 'PNG', barcodeX, yPos, barcodeAreaWidth, barcodeAreaHeight);
  } catch (error) {
    console.warn('Failed to add barcode image:', error);
    // Fallback: Add simple text
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Barcode: ${barcodeData}`, barcodeX, yPos + 15);
  }
  
  // ========== FOOTER INFORMATION ==========
  yPos += barcodeAreaHeight + 10;
  
  // Add footer notes
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text('** GET WELL SOON **', margin, yPos);
  
  // Add professional footer with timestamp
  yPos += 20;
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'italic');
  const timestamp = new Date().toLocaleString('en-IN');
  const systemName = data.hospitalSettings?.hospitalName || 'NAKSHATRA HOSPITAL';
  pdf.text(`Generated on: ${timestamp} | ${systemName} Management System`, margin, yPos);
  
  // Save the PDF
  const fileName = `pharmacy_bill_${data.invoiceNumber}.pdf`;
  pdf.save(fileName);
}