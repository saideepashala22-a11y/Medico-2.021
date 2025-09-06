import { useAuth } from "@/hooks/use-auth-simple";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import {
  ArrowLeft,
  Download,
  FileText,
  User,
  TestTube,
  Calendar,
  Stethoscope,
} from "lucide-react";
import jsPDF from "jspdf";
import { ThemeToggle } from "@/components/ThemeToggle";

const testNames = {
  cbc: "Complete Blood Count (CBC)",
  blood_sugar: "Blood Sugar Test",
  lipid_profile: "Lipid Profile",
  liver_function: "Liver Function Test",
  xray_chest: "X-Ray Chest",
  urine_test: "Urine Analysis",
};

export default function LabReport() {
  const { user } = useAuth();
  const { toast } = useToast();
  const params = useParams();
  const labTestId = params.labTestId;

  // Fetch current doctor for dynamic referral
  const { data: currentDoctor } = useQuery<{
    id: string;
    name: string;
    email?: string;
    specialization?: string;
  }>({
    queryKey: ["/api/current-doctor"],
    staleTime: 30 * 1000, // Cache for 30 seconds
  });

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
    queryKey: ["/api/lab-tests", labTestId],
    enabled: !!labTestId,
  });

  // Fetch hospital settings for PDF generation
  const { data: hospitalSettings } = useQuery<{
    hospitalName: string;
    hospitalSubtitle?: string;
    address?: string;
    phone?: string;
    email?: string;
    accreditation?: string;
  }>({
    queryKey: ["/api/hospital-settings"],
    staleTime: 0, // Always fetch fresh data for PDFs
  });

  const generatePDF = () => {
    if (!labTest) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    try {
      // Professional Medical Header with Hospital Branding
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      const hospitalName =
        hospitalSettings?.hospitalName || "NAKSHATRA HOSPITAL";
      // Convert hospital name to diagnostics name for lab reports
      const diagnosticsName = hospitalName.replace(
        /\bHOSPITAL\b/i,
        "DIAGNOSTICS",
      );
      doc.text(diagnosticsName, pageWidth / 2, 15, { align: "center" });

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const subtitle =
        hospitalSettings?.hospitalSubtitle ||
        "Multi Specialty Hospital & Research Centre";
      doc.text(subtitle, pageWidth / 2, 22, { align: "center" });

      const address =
        hospitalSettings?.address ||
        "123 Medical District, Healthcare City, State - 123456";
      doc.text(address, pageWidth / 2, 28, { align: "center" });

      const phone = hospitalSettings?.phone || "+91-1234567890";
      const email = hospitalSettings?.email || "info@nakshatrahospital.com";
      doc.text(`Phone: ${phone} | Email: ${email}`, pageWidth / 2, 34, {
        align: "center",
      });

      const accreditation =
        hospitalSettings?.accreditation ||
        "NABL Accredited Laboratory | ISO 15189:2012 Certified";
      doc.text(accreditation, pageWidth / 2, 40, { align: "center" });

      // Horizontal line under header
      doc.setLineWidth(0.5);
      doc.line(15, 45, pageWidth - 15, 45);

      // Document Title
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("LABORATORY INVESTIGATION REPORT", pageWidth / 2, 51, {
        align: "center",
      });

      // Patient Information Box
      doc.setLineWidth(0.3);
      doc.rect(15, 55, pageWidth - 30, 40);

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("PATIENT DETAILS", 20, 62);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Patient ID: ${labTest.patient.mruNumber || "N/A"}`, 20, 70);
      doc.text(`Patient Name: ${labTest.patient.fullName || "N/A"}`, 20, 77);
      doc.text(
        `Age/Gender: ${labTest.patient.age || "N/A"} Years / ${labTest.patient.gender || "N/A"}`,
        20,
        84,
      );
      if (labTest.patient.contactPhone) {
        doc.text(`Contact: ${labTest.patient.contactPhone}`, 20, 91);
      }

      // Test Information (Right side of patient box)
      doc.setFont("helvetica", "bold");
      doc.text("TEST DETAILS", 120, 62);

      doc.setFont("helvetica", "normal");
      const testDate = new Date(labTest.createdAt);
      doc.text(
        `Collection Date: ${testDate.toLocaleDateString("en-IN")}`,
        120,
        70,
      );
      doc.text(
        `Report Date: ${new Date().toLocaleDateString("en-IN")}`,
        120,
        77,
      );
      doc.text(
        `Lab No: LAB-${labTest.id.substring(0, 8).toUpperCase()}`,
        120,
        84,
      );
      // Use patient's referring doctor, or fall back to current selected doctor, or default
      const getReferringDoctor = () => {
        if (labTest.patient.referringDoctor) {
          return labTest.patient.referringDoctor;
        }
        if (currentDoctor?.name) {
          // Check if name already starts with "Dr." to avoid duplication
          return currentDoctor.name.startsWith("Dr.")
            ? currentDoctor.name
            : `Dr. ${currentDoctor.name}`;
        }
        return "Dr. Consulting Physician";
      };
      const referringDoctor = getReferringDoctor();
      doc.text(`Referring Doctor: ${referringDoctor}`, 120, 91);

      // Test Results Table Header
      let yPos = 105;
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("COMPLETE BLOOD PICTURE", 20, yPos);

      yPos += 6;

      // Table Headers (simplified without borders)

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("INVESTIGATION", 20, yPos + 6);
      doc.text("VALUE", 90, yPos + 8);
      doc.text("UNIT", 120, yPos + 8);
      doc.text("REFERENCE RANGE", 140, yPos + 8);

      yPos += 18; // More space after headers

      // Test Results Data
      doc.setFont("helvetica", "normal");

      try {
        // labTest.results is already an array of objects, no need to parse
        if (
          labTest.results &&
          Array.isArray(labTest.results) &&
          labTest.results.length > 0
        ) {
          const results = labTest.results;

          if (results.length > 0) {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);

            results.forEach((testResult, index) => {
              if (testResult.value && testResult.value.trim() !== "") {
                // Test name
                doc.setFont("helvetica", "normal");
                doc.text(testResult.testName || "Unknown Test", 20, yPos + 2);

                // Result value (bold for emphasis)
                doc.setFont("helvetica", "bold");
                doc.text(String(testResult.value), 90, yPos + 2);
                doc.setFont("helvetica", "normal");

                // Unit - convert old formats to new formats, skip units for descriptive assessments
                const isDescriptiveTest =
                  testResult.testName === "a. RBC's" ||
                  testResult.testName === "b. WBC's" ||
                  testResult.testName === "c. PLATELETS";

                if (!isDescriptiveTest) {
                  let displayUnit = testResult.unit || "units";

                  // Convert old unit formats to new ones
                  if (testResult.testName === "Total R.B.C COUNT") {
                    if (
                      displayUnit.includes("million") ||
                      displayUnit.includes("μL")
                    ) {
                      displayUnit = "Mill/Cumm";
                    }
                  } else if (testResult.testName === "HAEMOGLOBIN") {
                    if (displayUnit === "g/dL") {
                      displayUnit = "gms%";
                    }
                  } else if (testResult.testName === "W.B.C (TOTAL)") {
                    if (displayUnit.includes("μL")) {
                      displayUnit = "/Cumm";
                    }
                  } else if (testResult.testName === "PLATELETS COUNT") {
                    if (
                      displayUnit.includes("μL") ||
                      displayUnit.includes("/μL")
                    ) {
                      displayUnit = "Lakhs/Cumm";
                    }
                  } else if (testResult.testName === "P.C.V") {
                    if (displayUnit === "%") {
                      displayUnit = "Vol%";
                    }
                  }

                  doc.text(displayUnit, 120, yPos + 2);
                }

                // Reference range - handle gender-specific ranges
                let normalRange = testResult.normalRange || "Consult reference";

                // Convert old format "(F), (M)" to new format "(M)|(F)"
                if (
                  normalRange.includes("(F)") &&
                  normalRange.includes("(M)")
                ) {
                  // Extract male and female ranges from old format
                  const femaleMatch = normalRange.match(/([^,]+\(F\)[^,]*)/);
                  const maleMatch = normalRange.match(/([^,]+\(M\)[^,]*)/);

                  if (femaleMatch && maleMatch) {
                    const femaleRange = femaleMatch[1].trim();
                    const maleRange = maleMatch[1].trim();
                    normalRange = `${maleRange}|${femaleRange}`;
                  }
                }

                if (normalRange.includes("|")) {
                  // Split gender-specific ranges (male first, female second)
                  const [maleRange, femaleRange] = normalRange.split("|");
                  doc.text(maleRange.trim(), 140, yPos + 2);
                  doc.text(femaleRange.trim(), 140, yPos + 6);
                  yPos += 6; // Extra space for two-line reference
                } else {
                  doc.text(normalRange, 140, yPos + 2);
                }

                yPos += 12; // Increased spacing between rows
              }
            });
          }
        }
      } catch (error) {
        console.error("Error parsing results:", error);
      }

      // Clinical Notes Section
      if (labTest.doctorNotes) {
        yPos += 15;
        doc.setLineWidth(0.3);
        doc.rect(15, yPos - 5, pageWidth - 30, 30);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("CLINICAL INTERPRETATION & REMARKS:", 20, yPos + 2);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        const splitNotes = doc.splitTextToSize(labTest.doctorNotes, 170);
        doc.text(splitNotes, 20, yPos + 10);
        yPos += 30;
      }

      // Quality Assurance Section (after all test results)
      yPos += 20;
      doc.setFontSize(9);
      doc.setFont("helvetica", "italic");
      doc.text(
        "NOTE: All tests performed using calibrated instruments and quality controlled reagents.",
        20,
        yPos,
      );
      doc.text(
        "Reference ranges are age and gender specific. Please correlate with clinical findings.",
        20,
        yPos + 7,
      );

      // Add separation line before signature
      yPos += 25;
      console.log(
        "🔍 Position before signature:",
        yPos,
        "Page height:",
        pageHeight,
      );

      // Check if we need a new page for signature
      if (yPos > pageHeight - 100) {
        doc.addPage();
        yPos = 30; // Start from top of new page
      }

      doc.setLineWidth(0.3);
      doc.line(15, yPos, pageWidth - 15, yPos);

      // Lab Technician Signature Section (at the very end after all tests)
      yPos += 25;

      // Enhanced signature block - positioned on the right side but visible
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("AUTHORIZED SIGNATORY", 130, yPos);

      yPos += 12;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("Lab Technician", 140, yPos);

      // Professional signature line (properly positioned)
      yPos += 15;
      doc.setLineWidth(0.5);
      doc.line(120, yPos, 180, yPos);

      // Credentials and title
      yPos += 8;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text("Medical Laboratory Technologist", 125, yPos);
      yPos += 6;
      const signatureHospitalName =
        hospitalSettings?.hospitalName || "NAKSHATRA HOSPITAL";
      doc.text(signatureHospitalName, 135, yPos);

      // Report Footer (at the very end)
      yPos += 35;
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.text(
        `Report generated by: ${user?.name} | Date: ${new Date().toLocaleString("en-IN")}`,
        20,
        yPos,
      );
      doc.text(
        "*** This report is computer generated and does not require signature ***",
        pageWidth / 2,
        yPos + 5,
        { align: "center" },
      );
      doc.text("*** End of Report ***", pageWidth / 2, yPos + 10, {
        align: "center",
      });

      // Save
      doc.save(
        `Lab-Report-${labTest.patient.mruNumber || "Unknown"}-${new Date().toISOString().split("T")[0]}.pdf`,
      );

      toast({
        title: "Success",
        description: "Professional lab report downloaded successfully",
        duration: 500, // 0.5 seconds
      });
    } catch (error) {
      console.error("PDF generation error:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF report",
        variant: "destructive",
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
    console.error("Failed to parse results:", e);
    parsedResults = {};
  }

  const testTypes = Array.isArray(labTest.testTypes) ? labTest.testTypes : [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      {/* Header Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <FileText className="text-medical-blue text-xl mr-3" />
              <span className="text-xl font-bold text-gray-900">
                Lab Test Report
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={generatePDF}
                className="bg-medical-blue hover:bg-blue-700"
              >
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
              <span className="text-sm text-gray-600">
                {currentDoctor?.name
                  ? currentDoctor.name.startsWith("Dr.")
                    ? currentDoctor.name
                    : `Dr. ${currentDoctor.name}`
                  : user?.name || "Loading..."}
              </span>
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
                <span className="ml-2 text-sm font-medium">
                  Patient Registration
                </span>
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
                <p className="text-lg font-semibold">
                  {labTest.patient.mruNumber}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Name</p>
                <p className="text-lg font-semibold">
                  {labTest.patient.fullName}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Age & Gender
                </p>
                <p className="text-lg font-semibold">
                  {labTest.patient.age} years, {labTest.patient.gender}
                </p>
              </div>
              {labTest.patient.contactPhone && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Contact</p>
                  <p className="text-lg font-semibold">
                    {labTest.patient.contactPhone}
                  </p>
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
                <p className="text-lg font-semibold">
                  {new Date(labTest.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Tests Performed
                </p>
                <p className="text-lg font-semibold">
                  {labTest.testTypes?.map((t) => t.testName).join(", ") ||
                    "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Cost</p>
                <p className="text-lg font-semibold text-medical-blue">
                  ₹{labTest.totalCost}
                </p>
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
                            <p className="text-sm font-medium text-gray-500 capitalize">
                              {key.replace(/([A-Z])/g, " $1")}
                            </p>
                            <p className="text-lg font-semibold">
                              {String(value)}
                            </p>
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
              <p className="text-gray-700 whitespace-pre-wrap">
                {labTest.doctorNotes}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="mt-8 flex justify-center space-x-4">
          <Button
            onClick={generatePDF}
            size="lg"
            className="bg-medical-blue hover:bg-blue-700"
          >
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
