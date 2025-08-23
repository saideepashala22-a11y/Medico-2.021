import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, FileText, User, Calendar, Phone, IdCard, CheckCircle, X } from 'lucide-react';
import jsPDF from 'jspdf';

interface PatientInfo {
  mruNumber: string;
  visitId: string;
  fullName: string;
  age: number;
  gender: string;
  contactPhone: string;
  bloodGroup?: string;
  registrationDate: string;
}

interface ConsultationCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientInfo: PatientInfo;
}

export function ConsultationCardModal({ isOpen, onClose, patientInfo }: ConsultationCardModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const generateConsultationCard = async () => {
    setIsDownloading(true);
    
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      
      let yPos = 20;
      
      // Header - Doctor and Hospital Info (following reference format)
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('NAKSHATRA HOSPITAL', margin, yPos);
      
      yPos += 8;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Consultation Card', margin, yPos);
      
      // Current date on right (like reference)
      pdf.setFontSize(11);
      const currentDate = new Date().toLocaleDateString('en-IN');
      pdf.text(`Date      ${currentDate}`, pageWidth - margin, 20, { align: 'right' });
      
      yPos += 15;
      
      // Patient Information Layout (like reference)
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      
      // Left side - Name, Age, Gender (following reference layout)
      pdf.text(`Name      ${patientInfo.fullName}`, margin, yPos);
      pdf.text(`Pat Id ${patientInfo.mruNumber}`, pageWidth - margin, yPos, { align: 'right' });
      
      yPos += 12;
      pdf.text(`Age       ${patientInfo.age}`, margin, yPos);
      
      yPos += 8;
      pdf.text(`Gender    ${patientInfo.gender}`, margin, yPos);
      pdf.text(`Phone     ${patientInfo.contactPhone}`, pageWidth - margin, yPos, { align: 'right' });
      
      yPos += 8;
      pdf.text(`Blood Group ${patientInfo.bloodGroup || 'N/A'}`, margin, yPos);
      pdf.text(`Visit ID  ${patientInfo.visitId}`, pageWidth - margin, yPos, { align: 'right' });
      
      yPos += 20;
      
      // Medical Sections (following reference format)
      
      // Chief Complaint
      pdf.setFont('helvetica', 'bold');
      pdf.text('Chief Complaint', margin, yPos);
      yPos += 8;
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 20;
      
      // Clinical Examination
      pdf.setFont('helvetica', 'bold');
      pdf.text('Clinical Examination', margin, yPos);
      yPos += 8;
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 20;
      
      // Diagnosis
      pdf.setFont('helvetica', 'bold');
      pdf.text('Diagnosis', margin, yPos);
      yPos += 8;
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 20;
      
      // Treatment Plan
      pdf.setFont('helvetica', 'bold');
      pdf.text('Treatment Plan', margin, yPos);
      yPos += 8;
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 20;
      
      // Prescriptions Table Header (like reference)
      pdf.setFont('helvetica', 'bold');
      pdf.text('Prescriptions', margin, yPos);
      yPos += 12;
      
      // Table headers
      pdf.setFontSize(10);
      pdf.text('S.No.', margin, yPos);
      pdf.text('Medicine Name', margin + 25, yPos);
      pdf.text('Dosage', margin + 90, yPos);
      pdf.text('Instructions', margin + 130, yPos);
      
      yPos += 6;
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 20;
      
      // Follow Up
      pdf.setFont('helvetica', 'bold');
      pdf.text('Follow Up', margin, yPos);
      yPos += 8;
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      
      // Signature section at bottom
      const bottomY = pageHeight - 35;
      const signatureBoxWidth = (pageWidth - 3 * margin) / 2;
      
      // Doctor signature
      pdf.setDrawColor(16, 97, 143);
      pdf.setLineWidth(0.5);
      pdf.rect(margin, bottomY, signatureBoxWidth, 25, 'S');
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(16, 97, 143);
      pdf.text('DOCTOR SIGNATURE & STAMP', margin + 2, bottomY + 6);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.text('Date: ____________', margin + 2, bottomY + 20);
      
      // Next appointment
      const rightBoxX = margin + signatureBoxWidth + 10;
      pdf.rect(rightBoxX, bottomY, signatureBoxWidth, 25, 'S');
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(16, 97, 143);
      pdf.text('NEXT APPOINTMENT', rightBoxX + 2, bottomY + 6);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.text('Date: ____________', rightBoxX + 2, bottomY + 14);
      pdf.text('Time: ____________', rightBoxX + 2, bottomY + 20);
      
      // Footer
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(150, 150, 150);
      pdf.text(`Generated: ${new Date().toLocaleDateString('en-IN')} | Nakshatra Hospital Management System`, pageWidth / 2, pageHeight - 5, { align: 'center' });
      
      // Save the PDF
      pdf.save(`Nakshatra_Hospital_Consultation_Card_${patientInfo.mruNumber}_${new Date().toISOString().split('T')[0]}.pdf`);
      
    } catch (error) {
      console.error('Error generating consultation card:', error);
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
              {patientInfo.fullName} has been registered with MRU: {patientInfo.mruNumber}
            </p>
          </div>

          {/* Patient Summary Card */}
          <Card className="border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700">Patient Summary</CardTitle>
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
                <span className="font-semibold">{patientInfo.age} years, {patientInfo.gender}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-orange-500" />
                  Phone:
                </span>
                <span className="font-semibold">{patientInfo.contactPhone}</span>
              </div>
            </CardContent>
          </Card>

          {/* Download Options */}
          <div className="space-y-3">
            <div className="text-center">
              <FileText className="h-12 w-12 text-blue-500 mx-auto mb-2" />
              <h4 className="font-semibold text-gray-900">Download Professional Consultation Card</h4>
              <p className="text-sm text-gray-600 mt-1">
                Get a professional medical-standard consultation card with Nakshatra Hospital branding
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
                {isDownloading ? 'Generating...' : 'Download Card'}
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
            💡 Professional medical card with hospital branding, patient information boxes, and structured consultation form
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}