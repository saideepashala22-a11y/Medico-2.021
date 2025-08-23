import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'wouter';
import { ArrowLeft, Download, FileText, User, TestTube, Calendar, Stethoscope } from 'lucide-react';
import jsPDF from 'jspdf';

const testNames = {
  cbc: 'Complete Blood Count (CBC)',
  blood_sugar: 'Blood Sugar Test',
  lipid_profile: 'Lipid Profile',
  liver_function: 'Liver Function Test',
  xray_chest: 'X-Ray Chest',
  urine_test: 'Urine Analysis',
};

export default function LabReport() {
  const { user } = useAuth();
  const { toast } = useToast();
  const params = useParams();
  const labTestId = params.labTestId;

  // Fetch lab test details
  const { data: labTest, isLoading } = useQuery<{
    id: string;
    testTypes: Array<{
      id: string;
      testName: string;
      department: string;
      cost: number;
    }>;
    results: string;
    doctorNotes?: string;
    totalCost: string;
    createdAt: string;
    patient: {
      id: string;
      mruNumber: string;
      fullName: string;
      age: number;
      gender: string;
      contactPhone?: string;
      referringDoctor?: string;
    };
  }>({
    queryKey: ['/api/lab-tests', labTestId],
    enabled: !!labTestId,
  });

  const generatePDF = () => {
    if (!labTest) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    try {
      // Professional Medical Header with Hospital Branding
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('NAKSHATRA HOSPITAL', pageWidth / 2, 15, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Multi Specialty Hospital & Research Centre', pageWidth / 2, 22, { align: 'center' });
      doc.text('123 Medical District, Healthcare City, State - 123456', pageWidth / 2, 28, { align: 'center' });
      doc.text('Phone: +91-1234567890 | Email: info@nakshatrahospital.com', pageWidth / 2, 34, { align: 'center' });
      doc.text('NABL Accredited Laboratory | ISO 15189:2012 Certified', pageWidth / 2, 40, { align: 'center' });
      
      // Horizontal line under header
      doc.setLineWidth(0.5);
      doc.line(15, 45, pageWidth - 15, 45);
      
      // Document Title
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('LABORATORY INVESTIGATION REPORT', pageWidth / 2, 55, { align: 'center' });
      
      // Patient Information Box
      doc.setLineWidth(0.3);
      doc.rect(15, 65, pageWidth - 30, 40);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('PATIENT DETAILS', 20, 72);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Patient ID: ${labTest.patient.mruNumber || 'N/A'}`, 20, 80);
      doc.text(`Patient Name: ${labTest.patient.fullName || 'N/A'}`, 20, 87);
      doc.text(`Age/Gender: ${labTest.patient.age || 'N/A'} Years / ${labTest.patient.gender || 'N/A'}`, 20, 94);
      if (labTest.patient.contactPhone) {
        doc.text(`Contact: ${labTest.patient.contactPhone}`, 20, 101);
      }
      
      // Test Information (Right side of patient box)
      doc.setFont('helvetica', 'bold');
      doc.text('TEST DETAILS', 120, 72);
      
      doc.setFont('helvetica', 'normal');
      const testDate = new Date(labTest.createdAt);
      doc.text(`Collection Date: ${testDate.toLocaleDateString('en-IN')}`, 120, 80);
      doc.text(`Report Date: ${new Date().toLocaleDateString('en-IN')}`, 120, 87);
      doc.text(`Lab No: LAB-${labTest.id.substring(0, 8).toUpperCase()}`, 120, 94);
      doc.text(`Referring Doctor: ${labTest.patient.referringDoctor || 'Dr. Consulting Physician'}`, 120, 101);
      
      // Test Results Table Header
      let yPos = 125;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('INVESTIGATION RESULTS', 20, yPos);
      
      yPos += 8;
      
      // Table Headers with background
      doc.setFillColor(240, 240, 240);
      doc.rect(15, yPos, pageWidth - 30, 12, 'F');
      doc.setLineWidth(0.3);
      doc.rect(15, yPos, pageWidth - 30, 12);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('TEST NAME', 20, yPos + 8);
      doc.text('RESULT', 80, yPos + 8);
      doc.text('UNIT', 120, yPos + 8);
      doc.text('REFERENCE RANGE', 140, yPos + 8);
      doc.text('FLAG', 180, yPos + 8);
      
      yPos += 12;
      
      // Test Results Data
      doc.setFont('helvetica', 'normal');
      
      try {
        if (labTest.results && labTest.results.trim() !== '') {
          const results = JSON.parse(labTest.results);
          
          // Handle results as array (current format)
          if (Array.isArray(results) && results.length > 0) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            
            results.forEach((testResult, index) => {
              if (testResult.value && testResult.value.trim() !== '') {
                // Draw row with alternating background
                if (index % 2 === 0) {
                  doc.setFillColor(248, 249, 250);
                  doc.rect(15, yPos - 3, pageWidth - 30, 8, 'F');
                }
                
                // Test name
                doc.setFont('helvetica', 'normal');
                doc.text(testResult.testName || 'Unknown Test', 20, yPos + 2);
                
                // Result value (bold for emphasis)
                doc.setFont('helvetica', 'bold');
                doc.text(String(testResult.value), 80, yPos + 2);
                doc.setFont('helvetica', 'normal');
                
                // Unit
                doc.text(testResult.unit || 'units', 120, yPos + 2);
                
                // Reference range
                doc.text(testResult.normalRange || 'Consult reference', 140, yPos + 2);
                
                // Flag (Normal/Abnormal)
                doc.setFont('helvetica', 'bold');
                const status = testResult.status || 'normal';
                if (status === 'normal') {
                  doc.setTextColor(0, 128, 0); // Green
                  doc.text('NORMAL', 180, yPos + 2);
                } else if (status === 'high') {
                  doc.setTextColor(255, 140, 0); // Orange
                  doc.text('HIGH', 180, yPos + 2);
                } else if (status === 'low') {
                  doc.setTextColor(0, 0, 255); // Blue
                  doc.text('LOW', 180, yPos + 2);
                } else if (status === 'critical') {
                  doc.setTextColor(255, 0, 0); // Red
                  doc.text('CRITICAL', 180, yPos + 2);
                }
                doc.setTextColor(0, 0, 0); // Reset to black
                doc.setFont('helvetica', 'normal');
                
                yPos += 8;
              }
            });
          }
        }
      } catch (error) {
        console.error('Error parsing results:', error);
      }
      
      // Clinical Notes Section
      if (labTest.doctorNotes) {
        yPos += 15;
        doc.setLineWidth(0.3);
        doc.rect(15, yPos - 5, pageWidth - 30, 30);
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('CLINICAL INTERPRETATION & REMARKS:', 20, yPos + 2);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const splitNotes = doc.splitTextToSize(labTest.doctorNotes, 170);
        doc.text(splitNotes, 20, yPos + 10);
        yPos += 30;
      }
      
      // Quality Assurance Section
      yPos += 10;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.text('NOTE: All tests performed using calibrated instruments and quality controlled reagents.', 20, yPos);
      doc.text('Reference ranges are age and gender specific. Please correlate with clinical findings.', 20, yPos + 7);
      
      // Professional Footer Section
      yPos = pageHeight - 60;
      
      // Signature section (right side, no border)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Lab Technician', pageWidth - 60, yPos + 8);
      
      // Signature line
      doc.setLineWidth(0.3);
      doc.line(pageWidth - 90, yPos + 20, pageWidth - 20, yPos + 20);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('Medical Laboratory Technologist', pageWidth - 85, yPos + 25);
      
      // Report Footer
      yPos += 40;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text(`Report generated by: ${user?.name} | Date: ${new Date().toLocaleString('en-IN')}`, 20, yPos);
      doc.text('*** This report is computer generated and does not require signature ***', pageWidth / 2, yPos + 5, { align: 'center' });
      doc.text('*** End of Report ***', pageWidth / 2, yPos + 10, { align: 'center' });
      
      // Save
      doc.save(`Lab-Report-${labTest.patient.mruNumber || 'Unknown'}-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({
        title: 'Success',
        description: 'Professional lab report downloaded successfully',
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF report',
        variant: 'destructive',
      });
    }
  };

  if (!labTestId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Lab test ID is required</p>
          <Link href="/lab/patient-registration">
            <Button>Start New Test</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">Loading lab test report...</div>
      </div>
    );
  }

  if (!labTest) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Lab test not found</p>
          <Link href="/lab/patient-registration">
            <Button>Start New Test</Button>
          </Link>
        </div>
      </div>
    );
  }

  let parsedResults: any = {};
  try {
    parsedResults = labTest.results ? JSON.parse(labTest.results) : {};
  } catch (e) {
    console.error('Failed to parse results:', e);
    parsedResults = {};
  }

  const testTypes = Array.isArray(labTest.testTypes) ? labTest.testTypes : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <FileText className="text-medical-blue text-xl mr-3" />
              <span className="text-xl font-bold text-gray-900">Lab Test Report</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={generatePDF} className="bg-medical-blue hover:bg-blue-700">
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
              <span className="text-sm text-gray-600">{user?.name}</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex items-center text-green-600">
                <div className="flex items-center justify-center w-8 h-8 bg-green-600 text-white rounded-full text-sm font-bold">
                  ✓
                </div>
                <span className="ml-2 text-sm font-medium">Patient Registration</span>
              </div>
              <div className="flex items-center ml-4 text-green-600">
                <div className="flex items-center justify-center w-8 h-8 bg-green-600 text-white rounded-full text-sm font-bold">
                  ✓
                </div>
                <span className="ml-2 text-sm font-medium">Test Selection</span>
              </div>
              <div className="flex items-center ml-4 text-green-600">
                <div className="flex items-center justify-center w-8 h-8 bg-green-600 text-white rounded-full text-sm font-bold">
                  ✓
                </div>
                <span className="ml-2 text-sm font-medium">Enter Results</span>
              </div>
              <div className="flex items-center ml-4 text-medical-blue">
                <div className="flex items-center justify-center w-8 h-8 bg-medical-blue text-white rounded-full text-sm font-bold">
                  4
                </div>
                <span className="ml-2 text-sm font-medium">Report</span>
              </div>
            </div>
          </div>
        </div>

        {/* Report Header */}
        <Card className="mb-6">
          <CardHeader className="text-center bg-medical-blue text-white">
            <CardTitle className="text-2xl">LABORATORY TEST REPORT</CardTitle>
            <p className="text-blue-100">Hospital Management System</p>
          </CardHeader>
        </Card>

        {/* Patient Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              Patient Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Patient ID</p>
                <p className="text-lg font-semibold">{labTest.patient.mruNumber}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Name</p>
                <p className="text-lg font-semibold">{labTest.patient.fullName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Age & Gender</p>
                <p className="text-lg font-semibold">{labTest.patient.age} years, {labTest.patient.gender}</p>
              </div>
              {labTest.patient.contactPhone && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Contact</p>
                  <p className="text-lg font-semibold">{labTest.patient.contactPhone}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Test Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Test Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Test Date</p>
                <p className="text-lg font-semibold">{new Date(labTest.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Tests Performed</p>
                <p className="text-lg font-semibold">{labTest.testTypes?.map(t => t.testName).join(', ') || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Cost</p>
                <p className="text-lg font-semibold text-medical-blue">₹{labTest.totalCost}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        {Object.keys(parsedResults).length > 0 && (
          <div className="space-y-4">
            {testTypes.map((testType) => {
              const testName = testType.testName;
              const testResults = parsedResults[testName];
              
              if (!testResults) return null;
              
              return (
                <Card key={testType.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TestTube className="mr-2 h-5 w-5" />
                      {testName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.entries(testResults).map(([key, value]) => {
                        if (!value) return null;
                        return (
                          <div key={key}>
                            <p className="text-sm font-medium text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                            <p className="text-lg font-semibold">{String(value)}</p>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Doctor's Notes */}
        {labTest.doctorNotes && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Stethoscope className="mr-2 h-5 w-5" />
                Doctor's Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{labTest.doctorNotes}</p>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="mt-8 flex justify-center space-x-4">
          <Button onClick={generatePDF} size="lg" className="bg-medical-blue hover:bg-blue-700">
            <Download className="mr-2 h-4 w-4" />
            Download PDF Report
          </Button>
          <Link href="/lab/patient-registration">
            <Button variant="outline" size="lg">
              Start New Test
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}