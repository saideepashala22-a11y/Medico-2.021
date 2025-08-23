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
      
      // Professional Header Design
      // Main header background - Medical green gradient effect
      pdf.setFillColor(16, 97, 143); // Professional medical blue
      pdf.rect(0, 0, pageWidth, 50, 'F');
      
      // White accent stripe
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 45, pageWidth, 3, 'F');
      
      // Hospital Name - Large, Professional
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(26);
      pdf.setFont('helvetica', 'bold');
      pdf.text('NAKSHATRA HOSPITAL', pageWidth / 2, 22, { align: 'center' });
      
      // Subtitle
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Advanced Healthcare • Compassionate Care • Excellence in Medicine', pageWidth / 2, 32, { align: 'center' });
      
      // Document Type
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('PATIENT CONSULTATION CARD', pageWidth / 2, 42, { align: 'center' });
      
      // Professional Border Frame
      pdf.setDrawColor(16, 97, 143);
      pdf.setLineWidth(0.8);
      pdf.rect(margin - 5, 55, pageWidth - 2 * (margin - 5), pageHeight - 70, 'S');
      
      // Reset text color for content
      pdf.setTextColor(0, 0, 0);
      
      // Card Header Info Section
      let yPos = 65;
      pdf.setFillColor(248, 249, 250); // Light gray background
      pdf.rect(margin, yPos, pageWidth - 2 * margin, 25, 'F');
      pdf.setDrawColor(200, 200, 200);
      pdf.rect(margin, yPos, pageWidth - 2 * margin, 25, 'S');
      
      // Card Header Text
      yPos += 8;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(16, 97, 143);
      pdf.text(`CARD NO: ${patientInfo.mruNumber}`, margin + 5, yPos);
      pdf.text(`VISIT ID: ${patientInfo.visitId}`, pageWidth - margin - 35, yPos);
      
      yPos += 8;
      pdf.text(`DATE: ${new Date(patientInfo.registrationDate).toLocaleDateString('en-IN')}`, margin + 5, yPos);
      pdf.text(`TIME: ${new Date().toLocaleTimeString('en-IN', { hour12: true })}`, pageWidth - margin - 35, yPos);
      
      // Patient Information Section
      yPos += 25;
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('PATIENT INFORMATION', margin, yPos);
      
      // Decorative line under section header
      pdf.setDrawColor(16, 97, 143);
      pdf.setLineWidth(1);
      pdf.line(margin, yPos + 3, margin + 60, yPos + 3);
      
      yPos += 15;
      
      // Patient details in professional box layout
      const details = [
        { label: 'PATIENT NAME', value: patientInfo.fullName.toUpperCase(), width: 80 },
        { label: 'MRU NUMBER', value: patientInfo.mruNumber, width: 40 },
        { label: 'AGE / GENDER', value: `${patientInfo.age} Years / ${patientInfo.gender.toUpperCase()}`, width: 50 },
        { label: 'BLOOD GROUP', value: (patientInfo.bloodGroup || 'NOT SPECIFIED').toUpperCase(), width: 35 },
        { label: 'PHONE NUMBER', value: patientInfo.contactPhone, width: 80 },
        { label: 'VISIT ID', value: patientInfo.visitId, width: 40 }
      ];
      
      // Create professional information boxes
      let xPos = margin;
      let currentRow = 0;
      const boxHeight = 18;
      const boxSpacing = 5;
      
      details.forEach((detail, index) => {
        if (index % 2 === 0 && index > 0) {
          currentRow++;
          xPos = margin;
          yPos += boxHeight + boxSpacing;
        } else if (index % 2 === 1) {
          xPos = pageWidth / 2 + 5;
        }
        
        // Draw info box
        pdf.setFillColor(252, 252, 252);
        pdf.rect(xPos, yPos, detail.width, boxHeight, 'F');
        pdf.setDrawColor(220, 220, 220);
        pdf.rect(xPos, yPos, detail.width, boxHeight, 'S');
        
        // Label
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(100, 100, 100);
        pdf.text(detail.label, xPos + 2, yPos + 6);
        
        // Value
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        pdf.text(detail.value, xPos + 2, yPos + 14);
      });
      
      // Medical Consultation Form Section
      yPos += 40;
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text('MEDICAL CONSULTATION FORM', margin, yPos);
      
      // Decorative line
      pdf.setDrawColor(16, 97, 143);
      pdf.setLineWidth(1);
      pdf.line(margin, yPos + 3, margin + 80, yPos + 3);
      
      yPos += 15;
      
      // Professional consultation form fields
      const consultationSections = [
        {
          title: 'CHIEF COMPLAINT',
          lines: 2,
          spacing: 8
        },
        {
          title: 'HISTORY OF PRESENT ILLNESS',
          lines: 4,
          spacing: 8
        },
        {
          title: 'PHYSICAL EXAMINATION',
          lines: 4,
          spacing: 8
        },
        {
          title: 'CLINICAL FINDINGS',
          lines: 3,
          spacing: 8
        },
        {
          title: 'PROVISIONAL DIAGNOSIS',
          lines: 2,
          spacing: 8
        },
        {
          title: 'TREATMENT PLAN & PRESCRIPTIONS',
          lines: 4,
          spacing: 8
        }
      ];
      
      consultationSections.forEach((section) => {
        if (yPos > pageHeight - 60) { // Check if we need a new page
          pdf.addPage();
          yPos = 30;
          
          // Add header on new page
          pdf.setFillColor(16, 97, 143);
          pdf.rect(0, 0, pageWidth, 25, 'F');
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          pdf.text('NAKSHATRA HOSPITAL - CONSULTATION CARD (CONTINUED)', pageWidth / 2, 16, { align: 'center' });
          
          yPos = 35;
          pdf.setTextColor(0, 0, 0);
        }
        
        // Section title
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(16, 97, 143);
        pdf.text(section.title + ':', margin, yPos);
        
        yPos += 8;
        
        // Professional dotted lines for writing
        for (let i = 0; i < section.lines; i++) {
          // Create dotted line effect
          pdf.setDrawColor(180, 180, 180);
          pdf.setLineWidth(0.3);
          const lineY = yPos + (i * section.spacing);
          
          // Draw dotted line
          for (let x = margin; x < pageWidth - margin; x += 2) {
            pdf.line(x, lineY, x + 1, lineY);
          }
        }
        
        yPos += (section.lines * section.spacing) + 10;
      });
      
      // Signature Section
      if (yPos > pageHeight - 50) {
        pdf.addPage();
        yPos = 30;
      }
      
      yPos += 10;
      const signatureBoxWidth = (pageWidth - 3 * margin) / 2;
      
      // Doctor Signature Box
      pdf.setDrawColor(16, 97, 143);
      pdf.setLineWidth(0.5);
      pdf.rect(margin, yPos, signatureBoxWidth, 30, 'S');
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(16, 97, 143);
      pdf.text('DOCTOR SIGNATURE & STAMP', margin + 2, yPos + 8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.text('Date: _______________', margin + 2, yPos + 25);
      
      // Follow-up Box
      const rightBoxX = margin + signatureBoxWidth + 10;
      pdf.rect(rightBoxX, yPos, signatureBoxWidth, 30, 'S');
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(16, 97, 143);
      pdf.text('NEXT APPOINTMENT', rightBoxX + 2, yPos + 8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.text('Date: _______________', rightBoxX + 2, yPos + 18);
      pdf.text('Time: _______________', rightBoxX + 2, yPos + 25);
      
      // Professional Footer
      const footerY = pageHeight - 20;
      pdf.setFillColor(248, 249, 250);
      pdf.rect(0, footerY - 8, pageWidth, 15, 'F');
      pdf.setDrawColor(200, 200, 200);
      pdf.line(0, footerY - 8, pageWidth, footerY - 8);
      
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.text('Generated by Nakshatra Hospital Management System', pageWidth / 2, footerY - 2, { align: 'center' });
      pdf.text(`Generated on: ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN')}`, pageWidth / 2, footerY + 4, { align: 'center' });
      
      // Save the PDF with professional naming
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