import PDFDocument from "pdfkit";
import fs from "fs";

export function createSurgicalCaseSheet(caseSheetData?: any) {
  const doc = new PDFDocument({ margin: 50 });
  const filePath = "surgical_case_sheet.pdf";
  doc.pipe(fs.createWriteStream(filePath));

  // Header
  doc.fontSize(18).text("NAKSHATRA HOSPITAL", { align: "center" });
  doc.fontSize(10).text("Opp. to SBI Bank, Thurkappally (V&M), Yadadri Bhongiri District, T.S.", { align: "center" });
  doc.text("Cell: 7093939205", { align: "center" });

  doc.moveDown();
  doc.fontSize(14).text("SURGICAL CASE SHEET", { align: "center", underline: true });

  doc.moveDown();
  doc.fontSize(11).text(`Date: ${new Date().toLocaleDateString()}`, { align: "right" });

  // Patient Info
  doc.moveDown();
  doc.text(`Name of the Patient : ${caseSheetData?.patientName || '____________________________'}`);
  doc.text(`Husband's/Father's Name : ${caseSheetData?.husbandFatherName || '____________________________'}`);
  doc.text(`Religion & Nationality : ${caseSheetData?.religion || '____________________________'}`);
  doc.text(`Address : ${caseSheetData?.address || '____________________________'}`);
  doc.text(`Age : ${caseSheetData?.age || '____'}        Sex : ${caseSheetData?.sex || '____'}`);

  doc.moveDown();
  doc.text(`Diagnosis : ${caseSheetData?.diagnosis || '____________________________'}`);
  doc.text(`Nature of Operation : ${caseSheetData?.natureOfOperation || '____________________________'}`);
  doc.text(`Date of Admission : ${caseSheetData?.dateOfAdmission ? new Date(caseSheetData.dateOfAdmission).toLocaleDateString() : '____________________________'}`);
  doc.text(`Date of Operation : ${caseSheetData?.dateOfOperation ? new Date(caseSheetData.dateOfOperation).toLocaleDateString() : '____________________________'}`);
  doc.text(`Date of Discharge : ${caseSheetData?.dateOfDischarge ? new Date(caseSheetData.dateOfDischarge).toLocaleDateString() : '____________________________'}`);
  doc.text(`Complaints & Duration : ${caseSheetData?.complaintsAndDuration || '____________________________'}`);
  doc.text(`History of Present Illness : ${caseSheetData?.historyOfPresentIllness || '____________________________'}`);

  // Investigations
  doc.moveDown();
  doc.fontSize(12).text("INVESTIGATION:", { underline: true });
  doc.fontSize(10);
  const investigations = [
    `1) Hb% : ${caseSheetData?.hb || '_____________________'}`,
    `2) E.S.R. : ${caseSheetData?.bsa || '_____________________'}`,
    `3) C.T. : ${caseSheetData?.ct || '_____________________'}`,
    `4) B.T. : ${caseSheetData?.bt || '_____________________'}`,
    `5) Bl. Grouping : ${caseSheetData?.bloodGrouping || '_____________________'}`,
    `6) RPL : ${caseSheetData?.prl || '_____________________'}`,
    `7) R.B.S : ${caseSheetData?.rbs || '_____________________'}`,
    `8) Urine Sugar : ${caseSheetData?.urineSugar || '_____________________'}`,
    `9) R.M. : _____________________`,
    `10) X-ray : ${caseSheetData?.xray || '_____________________'}`,
    `11) E.C.G : ${caseSheetData?.ecg || '_____________________'}`,
    `12) Blood Urea : ${caseSheetData?.bloodUrea || '_____________________'}`,
    `13) Serum Creatinine : ${caseSheetData?.serumCreatinine || '_____________________'}`,
    `14) Serum Bilirubin : ${caseSheetData?.serumBilirubin || '_____________________'}`,
    `15) HBS A.G : ${caseSheetData?.hbsag || '_____________________'}`
  ];
  investigations.forEach((item) => doc.text(item));

  // On Examination
  doc.moveDown();
  doc.fontSize(12).text("ON EXAMINATION:", { underline: true });
  doc.fontSize(10);
  const exam = [
    `G.C. : ${caseSheetData?.generalCondition || '_____________________'}`,
    `Temp. : ${caseSheetData?.temperature || '_____'} °F`,
    `P.R. : ${caseSheetData?.pulse || '_____'} /Min`,
    `B.P. : ${caseSheetData?.bloodPressure || '_____'} mmHG`,
    `R.R. : ${caseSheetData?.respiratoryRate || '_____'} /Min`,
    `Heart : ${caseSheetData?.heart || '_____________________'}`,
    `Lungs : ${caseSheetData?.lungs || '_____________________'}`,
    `Abd. : ${caseSheetData?.abdomen || '_____________________'}`,
    `C.N.S. : ${caseSheetData?.cns || '_____________________'}`
  ];
  exam.forEach((item) => doc.text(item));

  // Finalize
  doc.end();
  console.log(`✅ PDF generated: ${filePath}`);
  return filePath;
}

// For testing - can be removed in production
if (require.main === module) {
  createSurgicalCaseSheet();
}