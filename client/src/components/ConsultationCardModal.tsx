import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Download,
  FileText,
  User,
  Calendar,
  Phone,
  IdCard,
  CheckCircle,
  X,
} from "lucide-react";
import jsPDF from "jspdf";

interface PatientInfo {
  mruNumber: string;
  visitId: string;
  fullName: string;
  age: number;
  gender: string;
  contactPhone: string;
  bloodGroup?: string;
  registrationDate: string;
  referringDoctor?: string;
}

interface ConsultationCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientInfo: PatientInfo;
}

export function ConsultationCardModal({
  isOpen,
  onClose,
  patientInfo,
}: ConsultationCardModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const generateConsultationCard = async () => {
    setIsDownloading(true);

    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;

      let yPos = 15;

      // 1. COMPACT HEADER - Dark blue background
      pdf.setFillColor(25, 55, 109); // Dark blue
      pdf.rect(0, 0, pageWidth, 28, "F");

      // Hospital name - centered, bold, white
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text("NAKSHATRA HOSPITAL", pageWidth / 2, 15, { align: "center" });

      // Subtitle - centered
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.text("Patient Consultation Card", pageWidth / 2, 23, {
        align: "center",
      });

      // Date field - right corner
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      const currentDate = new Date().toLocaleDateString("en-IN");
      pdf.text(`Date: ${currentDate}`, pageWidth - margin, 35, {
        align: "right",
      });

      yPos = 42;

      // 2. COMPACT PATIENT INFORMATION - 2 row grid
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(0, 0, 0);
      pdf.text("PATIENT INFORMATION", margin, yPos);

      yPos += 10;

      // Compact column positioning
      const col1X = margin;
      const col2X = margin + 65;
      const col3X = margin + 130;

      // Row 1: Name, MRU, Visit ID
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(60, 60, 60);
      pdf.text("NAME:", col1X, yPos);
      pdf.text("MRU:", col2X, yPos);
      pdf.text("VISIT ID:", col3X, yPos);

      yPos += 5;
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(0, 0, 0);
      pdf.text(patientInfo.fullName, col1X, yPos);
      pdf.text(patientInfo.mruNumber, col2X, yPos);
      pdf.text(patientInfo.visitId, col3X, yPos);

      yPos += 10;

      // Row 2: Age/Gender, Blood Group, Phone
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(60, 60, 60);
      pdf.text("AGE/GENDER:", col1X, yPos);
      pdf.text("BLOOD GROUP:", col2X, yPos);
      pdf.text("PHONE:", col3X, yPos);

      yPos += 5;
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(0, 0, 0);
      pdf.text(`${patientInfo.age} / ${patientInfo.gender}`, col1X, yPos);
      pdf.text(patientInfo.bloodGroup || "N/A", col2X, yPos);
      pdf.text(patientInfo.contactPhone, col3X, yPos);

      yPos += 10;

      // Row 3: Referring Doctor (if provided)
      if (patientInfo.referringDoctor) {
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(60, 60, 60);
        pdf.text("REFERRING DOCTOR:", col1X, yPos);

        yPos += 5;
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(0, 0, 0);
        pdf.text(patientInfo.referringDoctor, col1X, yPos);

        yPos += 10;
      } else {
        yPos += 5;
      }

      // 3. LARGE DOCTOR NOTES SECTION (65-70% of page height)
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(0, 0, 0);
      pdf.text("Doctor Notes / Prescription", margin, yPos);

      yPos += 8;

      // Calculate large notes box - 65% of page height
      const notesBoxHeight = pageHeight * 0.65;
      const footerSpace = 45; // Space for footer boxes
      const availableHeight = pageHeight - yPos - footerSpace;
      const finalNotesHeight = Math.min(notesBoxHeight, availableHeight);

      pdf.setDrawColor(100, 100, 100);
      pdf.setLineWidth(0.5);
      pdf.rect(margin, yPos, pageWidth - 2 * margin, finalNotesHeight, "S");

      yPos += finalNotesHeight + 10;

      // 4. COMPACT FOOTER - Small boxes to maximize notes space
      const footerY = pageHeight - 35;
      const boxWidth = (pageWidth - 3 * margin) / 2;
      const boxHeight = 20; // Reduced height for max notes space

      // Left section - Doctor Signature & Stamp (no box)
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(0, 0, 0);
      pdf.text("Doctor Signature & Stamp", margin + 2, footerY + 6);

      pdf.setFontSize(7);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(80, 80, 80);
      pdf.text("Date: ______________", margin + 2, footerY + 15);

      // Right section - Next Appointment (no box)
      const rightBoxX = margin + boxWidth + margin + 30; // Moved further right

      pdf.setFontSize(8);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(0, 0, 0);
      pdf.text("Next Appointment", rightBoxX + 4, footerY + 6);

      pdf.setFontSize(7);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(80, 80, 80);
      pdf.text("Date: __________  Time: _______", rightBoxX + 4, footerY + 15);

      // 5. BOTTOM FOOTER TEXT
      pdf.setFontSize(6);
      pdf.setFont("helvetica", "italic");
      pdf.setTextColor(120, 120, 120);
      const generatedText = `Generated on ${new Date().toLocaleDateString("en-IN")} | Nakshatra Hospital Management System`;
      pdf.text(generatedText, pageWidth / 2, pageHeight - 5, {
        align: "center",
      });

      // Save the PDF
      pdf.save(
        `Nakshatra_Hospital_Consultation_Card_${patientInfo.mruNumber}_${new Date().toISOString().split("T")[0]}.pdf`,
      );
    } catch (error) {
      console.error("Error generating consultation card:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-6 w-6" />
            Registration Successful!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Success Message */}
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <User className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Patient Successfully Registered
            </h3>
            <p className="text-gray-600 text-sm">
              {patientInfo.fullName} has been registered with MRU:{" "}
              {patientInfo.mruNumber}
            </p>
          </div>

          {/* Patient Summary Card */}
          <Card className="border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700">
                Patient Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <IdCard className="h-4 w-4 text-blue-500" />
                  MRU Number:
                </span>
                <span className="font-semibold">{patientInfo.mruNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <User className="h-4 w-4 text-green-500" />
                  Patient Name:
                </span>
                <span className="font-semibold">{patientInfo.fullName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-purple-500" />
                  Age/Gender:
                </span>
                <span className="font-semibold">
                  {patientInfo.age} years, {patientInfo.gender}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-orange-500" />
                  Phone:
                </span>
                <span className="font-semibold">
                  {patientInfo.contactPhone}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Download Options */}
          <div className="space-y-3">
            <div className="text-center">
              <FileText className="h-12 w-12 text-blue-500 mx-auto mb-2" />
              <h4 className="font-semibold text-gray-900">
                Download Professional Consultation Card
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                Get a professional medical-standard consultation card with
                Nakshatra Hospital branding
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={generateConsultationCard}
                disabled={isDownloading}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                data-testid="download-consultation-card"
              >
                <Download className="h-4 w-4 mr-2" />
                {isDownloading ? "Generating..." : "Download Card"}
              </Button>

              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
                data-testid="close-modal"
              >
                <X className="h-4 w-4 mr-2" />
                Close
              </Button>
            </div>
          </div>

          <div className="text-xs text-gray-500 text-center">
            💡 Professional medical card with hospital branding, patient
            information boxes, and structured consultation form
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
