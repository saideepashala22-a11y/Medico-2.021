import jsPDF from 'jspdf';
import { Patient, LabTest, Prescription, DischargeSummary } from '@shared/schema';

export function generateLabReportPDF(patient: Patient, labTest: LabTest & { results?: any }) {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.text('Hospital Management System', 105, 20, { align: 'center' });
  doc.setFontSize(16);
  doc.text('Laboratory Report', 105, 30, { align: 'center' });
  
  // Patient Info
  doc.setFontSize(12);
  doc.text(`Patient Name: ${patient.name}`, 20, 50);
  doc.text(`Patient ID: ${patient.patientId}`, 20, 60);
  doc.text(`Age: ${patient.age}`, 20, 70);
  doc.text(`Gender: ${patient.gender}`, 20, 80);
  doc.text(`Contact: ${patient.contact || 'N/A'}`, 20, 90);
  doc.text(`Test Date: ${new Date(labTest.createdAt).toLocaleDateString()}`, 120, 50);
  
  // Test Results
  doc.text('Test Results:', 20, 110);
  let yPos = 120;
  
  if (labTest.results) {
    const results = labTest.results as any;
    Object.keys(results).forEach(key => {
      if (results[key] && key !== 'doctorNotes') {
        doc.text(`${key}: ${results[key]}`, 20, yPos);
        yPos += 10;
      }
    });
  }
  
  // Doctor's Notes
  if (labTest.doctorNotes) {
    doc.text('Doctor\'s Notes:', 20, yPos + 10);
    doc.text(labTest.doctorNotes, 20, yPos + 20, { maxWidth: 170 });
  }
  
  // Footer
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 280);
  
  doc.save(`${patient.name}_lab_report.pdf`);
}

export function generatePrescriptionPDF(patient: Patient, prescription: Prescription) {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.text('Hospital Management System', 105, 20, { align: 'center' });
  doc.setFontSize(16);
  doc.text('Pharmacy Bill', 105, 30, { align: 'center' });
  
  // Bill Info
  doc.setFontSize(12);
  doc.text(`Bill No: ${prescription.billNumber}`, 20, 50);
  doc.text(`Date: ${new Date(prescription.createdAt).toLocaleDateString()}`, 120, 50);
  
  // Patient Info
  doc.text(`Patient: ${(patient as any).fullName || patient.name}`, 20, 70);
  doc.text(`Patient ID: ${(patient as any).mruNumber || patient.patientId}`, 20, 80);
  doc.text(`Mobile: ${(patient as any).contactPhone || patient.contact || 'N/A'}`, 20, 90);
  if ((patient as any).referringDoctor) {
    doc.text(`Doctor: ${(patient as any).referringDoctor}`, 20, 100);
  }
  
  // Medicine List
  let startY = (patient as any).referringDoctor ? 120 : 110;
  doc.text('Medicines:', 20, startY);
  let yPos = startY + 10;
  
  const medicines = prescription.medicines as any[];
  medicines.forEach(medicine => {
    doc.text(`${medicine.name} - ${medicine.dosage} x ${medicine.quantity}`, 20, yPos);
    doc.text(`₹${medicine.price}`, 150, yPos);
    yPos += 10;
  });
  
  // Total
  doc.text(`Subtotal: ₹${prescription.subtotal}`, 120, yPos + 10);
  doc.text(`Tax: ₹${prescription.tax}`, 120, yPos + 20);
  doc.setFontSize(14);
  doc.text(`Total: ₹${prescription.total}`, 120, yPos + 30);
  
  doc.save(`${patient.name}_prescription.pdf`);
}

export function generateDischargeSummaryPDF(patient: Patient, summary: DischargeSummary) {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.text('Hospital Management System', 105, 20, { align: 'center' });
  doc.setFontSize(16);
  doc.text('DISCHARGE SUMMARY', 105, 30, { align: 'center' });
  
  // Patient Info
  doc.setFontSize(12);
  doc.text(`Patient Name: ${patient.name}`, 20, 50);
  doc.text(`Patient ID: ${patient.patientId}`, 20, 60);
  doc.text(`Age/Gender: ${patient.age}/${patient.gender}`, 20, 70);
  
  doc.text(`Admission Date: ${summary.admissionDate ? new Date(summary.admissionDate).toLocaleDateString() : 'N/A'}`, 120, 50);
  doc.text(`Discharge Date: ${new Date(summary.dischargeDate).toLocaleDateString()}`, 120, 60);
  
  // Diagnosis
  doc.text('Primary Diagnosis:', 20, 90);
  doc.text(summary.primaryDiagnosis, 20, 100, { maxWidth: 170 });
  
  let yPos = 110;
  if (summary.secondaryDiagnosis) {
    doc.text('Secondary Diagnosis:', 20, yPos);
    doc.text(summary.secondaryDiagnosis, 20, yPos + 10, { maxWidth: 170 });
    yPos += 30;
  }
  
  // Treatment Summary
  doc.text('Treatment Summary:', 20, yPos);
  doc.text(summary.treatmentSummary, 20, yPos + 10, { maxWidth: 170 });
  yPos += 40;
  
  // Medications
  if (summary.medications) {
    doc.text('Medications at Discharge:', 20, yPos);
    doc.text(summary.medications, 20, yPos + 10, { maxWidth: 170 });
    yPos += 30;
  }
  
  // Follow-up
  if (summary.followupInstructions) {
    doc.text('Follow-up Instructions:', 20, yPos);
    doc.text(summary.followupInstructions, 20, yPos + 10, { maxWidth: 170 });
    yPos += 30;
  }
  
  // Signature
  doc.text('Attending Physician:', 20, 250);
  doc.text(summary.attendingPhysician, 20, 260);
  doc.text('Digital Signature', 20, 270);
  
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 120, 270);
  
  doc.save(`${patient.name}_discharge_summary.pdf`);
}
