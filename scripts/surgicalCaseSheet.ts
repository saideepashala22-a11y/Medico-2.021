import PDFDocument from "pdfkit";
import fs from "fs";

interface Patient {
  id: string;
  name: string;
  fatherName: string;
  religionNationality: string;
  address: string;
  age: number;
  sex: string;
}

let caseCounter = 1;

function generateCaseSheetNumber(patientId: string): string {
  return `SCS${patientId}-${String(caseCounter).padStart(2, "0")}`;
}

// Helper: draw label + value (no lines)
function drawField(doc: PDFKit.PDFDocument, label: string, value: string, y: number, startX: number = 50) {
  doc.font("Helvetica-Bold").fontSize(12).text(label, startX, y, { continued: true });
  doc.font("Helvetica").fontSize(12).text(value || ""); // just show value, no lines
}

interface HospitalSettings {
  hospitalName: string;
  hospitalSubtitle?: string;
  address?: string;
  phone?: string;
  email?: string;
  accreditation?: string;
}

export function createSurgicalCaseSheet(patient: Patient, hospitalSettings?: HospitalSettings) {
  const doc = new PDFDocument({ margin: 50 });
  const filePath = `surgical_case_sheet_${patient.id}.pdf`;
  doc.pipe(fs.createWriteStream(filePath));

  const caseSheetNo = generateCaseSheetNumber(patient.id);

  // ---------- HEADER ----------
  const hospitalName = hospitalSettings?.hospitalName || "NAKSHATRA HOSPITAL";
  const address = hospitalSettings?.address || "Opp. to SBI Bank, Thurkappally (V&M), Yadadri Bhongiri District, T.S.";
  const phone = hospitalSettings?.phone || "7093939205";
  
  doc.fontSize(18).text(hospitalName, { align: "center" });
  doc.fontSize(10).text(address, { align: "center" });
  doc.text(`Cell: ${phone}`, { align: "center" });

  doc.moveDown();
  doc.fontSize(14).text("SURGICAL CASE SHEET", { align: "center", underline: true });

  // Case No (left), Date (right)
  doc.moveDown();
  doc.fontSize(11);
  doc.text(`No.: ${caseSheetNo}`, 50, doc.y, { continued: true });
  doc.text(`Date: ${new Date().toLocaleDateString()}`, { align: "right" });

  let y = doc.y + 10;

  // ---------- PATIENT DETAILS ----------
  doc.fontSize(11);
  drawField(doc, "Name of the Patient :", patient.name, y, 50); y += 15;
  drawField(doc, "Husband's/Father's Name :", patient.fatherName, y, 50); y += 15;

  // Religion & Nationality + Address same line
  drawField(doc, "Religion & Nationality :", patient.religionNationality, y, 50);
  drawField(doc, "Address :", patient.address, y, 300);
  y += 15;

  // Age + Sex same line
  drawField(doc, "Age :", patient.age.toString(), y, 50);
  drawField(doc, "Sex :", patient.sex, y, 150);
  y += 20;

  // ---------- BLANK SECTIONS ----------
  const sections = [
    "Diagnosis", "Nature of Operation", "Date of Admission",
    "Date of Operation", "Date of Discharge",
    "Complaints & Duration", "History of Present Illness"
  ];
  sections.forEach((sec) => {
    drawField(doc, sec + " :", "", y, 50);
    y += 15;
  });

  // ---------- INVESTIGATIONS & EXAM SIDE BY SIDE ----------
  y += 10;
  const invStartX = 50;
  const examStartX = 320;

  doc.fontSize(12).font("Helvetica-Bold").text("INVESTIGATION:", invStartX, y);
  doc.text("ON EXAMINATION:", examStartX, y);

  const investigations = [
    "1) Hb%", "2) E.S.R.", "3) C.T.", "4) B.T.", "5) Bl. Grouping",
    "6) RPL", "7) R.B.S", "8) Urine Sugar", "9) R.M.", "10) X-ray",
    "11) E.C.G", "12) Blood Urea", "13) Serum Creatinine",
    "14) Serum Bilirubin", "15) HBS A.G"
  ];

  const exam = [
    "G.C.", "Temp. ......... °F", "P.R. ......... /Min",
    "B.P. ......... mmHG", "R.R. ......... /Min",
    "Heart", "Lungs", "Abd.", "C.N.S."
  ];

  doc.fontSize(10).font("Helvetica");
  let invY = y + 20;
  investigations.forEach((item) => {
    drawField(doc, item, "", invY, invStartX);
    invY += 20;
  });

  let examY = y + 20;
  exam.forEach((item) => {
    drawField(doc, item, "", examY, examStartX);
    examY += 20;
  });

  // ---------- NEW PAGE: CONSENT FOR SURGERY ----------
  doc.addPage();
  
  // Header on extreme left
  doc.fontSize(16).font("Helvetica-Bold").text("CONSENT FOR SURGERY", 50, 80);
  
  // Consent text
  doc.moveDown(2);
  doc.fontSize(12).font("Helvetica");
  const consentText = "I/We unreservedly and in my sense, give my complete consent for admission, Diagnostic procedures, Transfusions, Anaesthesia, Modification in anaesthesia during Surgery, Operation and Modification in Surgical procedures during the surgical procedures during depending the survey, depending of patient condition. No responsibility will be attached to the Surgeon, Anaesthesiologist or Hospital Management.";
  
  doc.text(consentText, 50, doc.y, { 
    width: 500, 
    align: 'left',
    lineGap: 5
  });
  
  doc.moveDown(3);
  
  // Representatives section (left alignment)
  doc.fontSize(12).font("Helvetica-Bold");
  doc.text("Name of the Representatives & Signature", 50, doc.y);
  
  doc.moveDown(1);
  doc.fontSize(12).font("Helvetica");
  
  // Representative 1
  doc.text("1)", 50, doc.y);
  doc.moveDown(2);
  
  // Representative 2  
  doc.text("2)", 50, doc.y);
  doc.moveDown(3);
  
  // Patient signature section (right alignment)
  doc.fontSize(12).font("Helvetica-Bold");
  doc.text("Name of the Patient & Signature", 350, doc.y, { align: 'right' });

  // ---------- END ----------
  doc.end();
  console.log(`✅ PDF generated: ${filePath} (Case Sheet No: ${caseSheetNo})`);
  caseCounter++;
  return filePath;
}

// For testing - can be removed in production
if (require.main === module) {
  createSurgicalCaseSheet({
    id: "12345",
    name: "Mrs. M. Upendra",
    fatherName: "",
    religionNationality: "Hindu / Indian",
    address: "Hyderabad",
    age: 50,
    sex: "F"
  });
}