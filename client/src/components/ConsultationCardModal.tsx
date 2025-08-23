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
      
      // Calculate sections: 20% for patient details, 80% for consultation
      const patientSectionHeight = pageHeight * 0.2; // 20% of page
      const consultationStartY = patientSectionHeight + 10;
      
      // Professional Header Design - Compact
      pdf.setFillColor(16, 97, 143);
      pdf.rect(0, 0, pageWidth, 30, 'F');
      
      // Hospital Name
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('NAKSHATRA HOSPITAL', pageWidth / 2, 15, { align: 'center' });
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Patient Consultation Card', pageWidth / 2, 25, { align: 'center' });
      
      // Current date in top right white area
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const currentDate = new Date().toLocaleDateString('en-IN');
      pdf.text(`Date: ${currentDate}`, pageWidth - margin, 35, { align: 'right' });
      
      // Patient Information Section (20% of page)
      let yPos = 40;
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('PATIENT INFORMATION', margin, yPos);
      
      yPos += 8;
      
      // Compact patient details in 3 columns
      const details = [
        { label: 'NAME', value: patientInfo.fullName.toUpperCase() },
        { label: 'MRU', value: patientInfo.mruNumber },
        { label: 'VISIT ID', value: patientInfo.visitId },
        { label: 'AGE/GENDER', value: `${patientInfo.age}Y / ${patientInfo.gender.toUpperCase()}` },
        { label: 'BLOOD GROUP', value: (patientInfo.bloodGroup || 'N/A').toUpperCase() },
        { label: 'PHONE', value: patientInfo.contactPhone }
      ];
      
      // Clean professional layout without boxes
      const colWidth = (pageWidth - 2 * margin) / 3;
      const rowHeight = 18;
      
      details.forEach((detail, index) => {
        const col = index % 3;
        const row = Math.floor(index / 3);
        const xPos = margin + (col * colWidth);
        const yPosText = yPos + (row * rowHeight);
        
        // Label
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(100, 100, 100);
        pdf.text(detail.label + ':', xPos, yPosText);
        
        // Value
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        pdf.text(detail.value, xPos, yPosText + 8);
      });
      
      // Add separator line for medicine writing area
      yPos += 15;
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(1);
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