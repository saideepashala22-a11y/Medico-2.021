import { useAuth } from '@/hooks/use-auth-simple';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Link, useRoute } from 'wouter';
import { ArrowLeft, TestTube, CheckCircle, AlertTriangle, FileText, ArrowRight, User, Phone } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface TestResult {
  testName: string;
  value: string;
  unit: string;
  normalRange: string;
  status: 'normal' | 'high' | 'low' | 'critical';
}

export default function EnterResults() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, params] = useRoute('/lab/enter-results/:testId');
  const testId = params?.testId;

  // Fetch current doctor instead of using logged-in user
  const { data: currentDoctor } = useQuery<{
    id: string;
    name: string;
    email?: string;
    specialization?: string;
  }>({
    queryKey: ['/api/current-doctor'],
    staleTime: 30 * 1000, // Cache for 30 seconds
  });

  const [results, setResults] = useState<TestResult[]>([]);
  const [technician, setTechnician] = useState(user?.name || '');
  const [notes, setNotes] = useState('');
  const [showReview, setShowReview] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Fetch lab test details
  const { data: labTest, isLoading: testLoading } = useQuery<any>({
    queryKey: ['/api/lab-tests', testId],
  });

  // Get patient data from lab test (includes patient info from join)
  const patient = labTest?.patient;
  const patientLoading = false;

  // CBP Parameters
  const CBP_PARAMETERS = [
    'HAEMOGLOBIN',
    'Total R.B.C COUNT',
    'P.C.V',
    'MCV',
    'MCH', 
    'MCHC',
    'W.B.C (TOTAL)',
    'NEUTROPHILS',
    'LYMPHOCYTES',
    'EOSINOPHILS',
    'MONOCYTES',
    'BASOPHILS',
    'PLATELETS COUNT',
    'a. RBC\'s',
    'b. WBC\'s', 
    'c. PLATELETS',
    'SAMPLE TYPE'
  ];

  // Initialize results based on selected tests
  useEffect(() => {
    if (labTest && results.length === 0 && labTest.testTypes) {
      const testTypes = Array.isArray(labTest.testTypes) ? labTest.testTypes : [];
      const initialResults: TestResult[] = [];
      
      testTypes.forEach((test: any) => {
        // Special handling for CBP - expand into multiple parameters
        if (test.testName === 'CBP (Complete Blood Picture)' || test.testName === 'CBP') {
          CBP_PARAMETERS.forEach(parameter => {
            initialResults.push({
              testName: parameter,
              value: getDefaultValue(parameter),
              unit: getDefaultUnit(parameter),
              normalRange: getNormalRange(parameter),
              status: 'normal' as const
            });
          });
        } else {
          // Regular test - single parameter
          initialResults.push({
            testName: test.testName,
            value: '',
            unit: getDefaultUnit(test.testName),
            normalRange: getNormalRange(test.testName),
            status: 'normal' as const
          });
        }
      });
      
      setResults(initialResults);
    }
  }, [labTest, results.length]);

  // Get default units for common tests
  const getDefaultUnit = (testName: string): string => {
    const units: Record<string, string> = {
      'HAEMOGLOBIN': 'gms%',
      'Total R.B.C COUNT': 'Mill/Cumm',
      'P.C.V': 'Vol%',
      'MCV': 'fL',
      'MCH': 'pg',
      'MCHC': 'g/dL',
      'W.B.C (TOTAL)': '/Cumm',
      'NEUTROPHILS': '%',
      'LYMPHOCYTES': '%',
      'EOSINOPHILS': '%',
      'MONOCYTES': '%',
      'BASOPHILS': '%',
      'PLATELETS COUNT': 'Lakhs/Cumm',
      'a. RBC\'s': '',
      'b. WBC\'s': '',
      'c. PLATELETS': '',
      'SAMPLE TYPE': '',
      'FBS (Fasting Blood Sugar)': 'mg/dL',
      'RBS (Random Blood Sugar)': 'mg/dL',
      'SERUM CREATININE': 'mg/dL',
      'BLOOD UREA': 'mg/dL',
      'TOTAL CHOLESTEROL': 'mg/dL',
      'SERUM TRIGLYCERIDES': 'mg/dL',
      'PLATELET COUNT': '/μL',
      'ESR (Erythrocyte Sedimentation Rate)': 'mm/hr',
      'SERUM URIC ACID': 'mg/dL',
      'SERUM CALCIUM': 'mg/dL',
      'SERUM SODIUM': 'mEq/L',
      'SERUM POTASSIUM': 'mEq/L'
    };
    return units[testName] || 'units';
  };

  // Get normal ranges for common tests
  const getNormalRange = (testName: string): string => {
    const ranges: Record<string, string> = {
      'HAEMOGLOBIN': '(M) 13.5 - 18 gms%|(F) 11.5 - 16 gms%',
      'Total R.B.C COUNT': '(M) 4.5 - 6.0 Mill/Cumm|(F) 3.5 - 5.5 Mill/Cumm',
      'P.C.V': '(M) 40-54%|(F) 36-41%',
      'MCV': '80 - 100 fL',
      'MCH': '27 - 33 pg',
      'MCHC': '32 - 36 g/dL',
      'W.B.C (TOTAL)': '4000-11000/Cumm',
      'NEUTROPHILS': '50-70%',
      'LYMPHOCYTES': '20-40%',
      'EOSINOPHILS': '1-4%',
      'MONOCYTES': '2-8%',
      'BASOPHILS': '0.5-1%',
      'PLATELETS COUNT': '1.5-4.5 Lakhs/Cumm',
      'a. RBC\'s': 'Morphological assessment',
      'b. WBC\'s': 'Functional assessment', 
      'c. PLATELETS': 'Adequacy assessment',
      'SAMPLE TYPE': 'Collection method',
      'FBS (Fasting Blood Sugar)': '70-100 mg/dL',
      'RBS (Random Blood Sugar)': '<140 mg/dL',
      'SERUM CREATININE': '0.6-1.2 mg/dL',
      'BLOOD UREA': '6-20 mg/dL',
      'TOTAL CHOLESTEROL': '<200 mg/dL',
      'SERUM TRIGLYCERIDES': '<150 mg/dL',
      'PLATELET COUNT': '150,000-450,000 /μL',
      'ESR (Erythrocyte Sedimentation Rate)': '(M) <15 mm/hr|(F) <20 mm/hr',
      'SERUM URIC ACID': '3.4-7.0 mg/dL',
      'SERUM CALCIUM': '8.5-10.5 mg/dL',
      'SERUM SODIUM': '136-145 mEq/L',
      'SERUM POTASSIUM': '3.5-5.0 mEq/L'
    };
    return ranges[testName] || 'Consult reference values';
  };

  // Get default values for specific tests
  const getDefaultValue = (testName: string): string => {
    const defaults: Record<string, string> = {
      'a. RBC\'s': 'NORMOCYTIC',
      'b. WBC\'s': 'within limits',
      'c. PLATELETS': 'adequate',
      'SAMPLE TYPE': 'whole blood EDTA'
    };
    return defaults[testName] || '';
  };

  // Determine result status based on value and normal range
  const determineStatus = (value: string, testName: string): 'normal' | 'high' | 'low' | 'critical' => {
    // For text-based parameters, always return normal
    if (testName === 'a. RBC\'s' || testName === 'b. WBC\'s' || testName === 'c. PLATELETS' || testName === 'SAMPLE TYPE') {
      return 'normal';
    }
    
    if (!value || isNaN(parseFloat(value))) return 'normal';
    
    const numValue = parseFloat(value);
    
    // Basic logic for common tests (would be more sophisticated in real implementation)
    switch (testName) {
      case 'FBS (Fasting Blood Sugar)':
        if (numValue < 70) return 'low';
        if (numValue > 125) return 'high';
        if (numValue > 100) return 'high';
        return 'normal';
      case 'RBS (Random Blood Sugar)':
        if (numValue < 70) return 'low';
        if (numValue > 200) return 'critical';
        if (numValue > 140) return 'high';
        return 'normal';
      case 'HAEMOGLOBIN':
        if (numValue < 7) return 'critical';
        if (numValue < 12) return 'low';
        if (numValue > 18) return 'high';
        return 'normal';
      case 'Total R.B.C COUNT':
        if (numValue < 3.5) return 'low';
        if (numValue > 6.5) return 'high';
        return 'normal';
      case 'P.C.V':
        if (numValue < 30) return 'low';
        if (numValue > 55) return 'high';
        return 'normal';
      case 'W.B.C (TOTAL)':
        if (numValue < 4000) return 'low';
        if (numValue > 15000) return 'high';
        if (numValue > 20000) return 'critical';
        return 'normal';
      case 'PLATELETS COUNT':
        if (numValue < 100000) return 'low';
        if (numValue < 50000) return 'critical';
        if (numValue > 500000) return 'high';
        return 'normal';
      case 'NEUTROPHILS':
        if (numValue < 50) return 'low';
        if (numValue > 70) return 'high';
        return 'normal';
      case 'LYMPHOCYTES':
        if (numValue < 20) return 'low';
        if (numValue > 40) return 'high';
        return 'normal';
      case 'EOSINOPHILS':
        if (numValue < 1) return 'low';
        if (numValue > 4) return 'high';
        if (numValue > 8) return 'critical';
        return 'normal';
      case 'MONOCYTES':
        if (numValue < 2) return 'low';
        if (numValue > 8) return 'high';
        return 'normal';
      case 'BASOPHILS':
        if (numValue < 0.5) return 'low';
        if (numValue > 1) return 'high';
        return 'normal';
      case 'MCV':
        if (numValue < 80) return 'low';
        if (numValue > 100) return 'high';
        return 'normal';
      case 'MCH':
        if (numValue < 27) return 'low';
        if (numValue > 33) return 'high';
        return 'normal';
      case 'MCHC':
        if (numValue < 32) return 'low';
        if (numValue > 36) return 'high';
        return 'normal';
      default:
        return 'normal';
    }
  };

  // Update result value and automatically determine status
  const updateResult = (index: number, field: keyof TestResult, value: string) => {
    setResults(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      
      // Auto-determine status when value changes
      if (field === 'value') {
        updated[index].status = determineStatus(value, updated[index].testName);
        
        // Auto-calculate PCV and RBC count when Hemoglobin is entered
        if (updated[index].testName === 'HAEMOGLOBIN' && value && !isNaN(parseFloat(value))) {
          const hbValue = parseFloat(value);
          
          // Find PCV and RBC count indices
          const pcvIndex = updated.findIndex(result => result.testName === 'P.C.V');
          const rbcIndex = updated.findIndex(result => result.testName === 'Total R.B.C COUNT');
          
          // Calculate and update PCV (Hb × 3)
          if (pcvIndex !== -1) {
            const calculatedPCV = (hbValue * 3).toFixed(1);
            updated[pcvIndex] = {
              ...updated[pcvIndex],
              value: calculatedPCV,
              status: determineStatus(calculatedPCV, 'P.C.V')
            };
          }
          
          // Calculate and update RBC count (Hb ÷ 3)
          if (rbcIndex !== -1) {
            const calculatedRBC = (hbValue / 3).toFixed(1);
            updated[rbcIndex] = {
              ...updated[rbcIndex],
              value: calculatedRBC,
              status: determineStatus(calculatedRBC, 'Total R.B.C COUNT')
            };
          }
        }
        
        // Calculate MCV, MCH, MCHC when required values are available
        const calculateBloodIndices = () => {
          const hbResult = updated.find(result => result.testName === 'HAEMOGLOBIN');
          const rbcResult = updated.find(result => result.testName === 'Total R.B.C COUNT');
          const pcvResult = updated.find(result => result.testName === 'P.C.V');
          
          const hbValue = hbResult?.value ? parseFloat(hbResult.value) : null;
          const rbcValue = rbcResult?.value ? parseFloat(rbcResult.value) : null;
          const pcvValue = pcvResult?.value ? parseFloat(pcvResult.value) : null;
          
          if (hbValue && rbcValue && pcvValue) {
            // MCV = (PCV × 10) ÷ RBC
            const mcvIndex = updated.findIndex(result => result.testName === 'MCV');
            if (mcvIndex !== -1) {
              const calculatedMCV = ((pcvValue * 10) / rbcValue).toFixed(1);
              updated[mcvIndex] = {
                ...updated[mcvIndex],
                value: calculatedMCV,
                status: determineStatus(calculatedMCV, 'MCV')
              };
            }
            
            // MCH = (Hb × 10) ÷ RBC  
            const mchIndex = updated.findIndex(result => result.testName === 'MCH');
            if (mchIndex !== -1) {
              const calculatedMCH = ((hbValue * 10) / rbcValue).toFixed(1);
              updated[mchIndex] = {
                ...updated[mchIndex],
                value: calculatedMCH,
                status: determineStatus(calculatedMCH, 'MCH')
              };
            }
            
            // MCHC = (Hb × 100) ÷ PCV
            const mchcIndex = updated.findIndex(result => result.testName === 'MCHC');
            if (mchcIndex !== -1) {
              const calculatedMCHC = ((hbValue * 100) / pcvValue).toFixed(1);
              updated[mchcIndex] = {
                ...updated[mchcIndex],
                value: calculatedMCHC,
                status: determineStatus(calculatedMCHC, 'MCHC')
              };
            }
          }
        };
        
        // Always try to calculate blood indices after any value change
        calculateBloodIndices();
      }
      
      return updated;
    });
  };

  // Validate results before review
  const validateResults = (): boolean => {
    const errors: string[] = [];
    
    results.forEach((result, index) => {
      if (!result.value.trim()) {
        errors.push(`Test result for "${result.testName}" is required`);
      } else {
        // Only check for numeric values if it's not a text-based parameter
        const isTextBasedParameter = result.testName === 'a. RBC\'s' || result.testName === 'b. WBC\'s' || 
                                    result.testName === 'c. PLATELETS' || result.testName === 'SAMPLE TYPE';
        
        if (!isTextBasedParameter && isNaN(parseFloat(result.value))) {
          errors.push(`Test result for "${result.testName}" must be a valid number`);
        }
      }
    });
    
    if (!technician.trim()) {
      errors.push('Technician name is required');
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Update lab test mutation
  const updateLabTestMutation = useMutation({
    mutationFn: (testData: any) => apiRequest('PUT', `/api/lab-tests/${testId}`, testData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lab-tests'] });
      toast({ title: "Success", description: "Lab test results saved successfully" });
      // Navigate to report generation
      window.location.href = `/lab/report/${testId}`;
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save lab test results", variant: "destructive" });
    }
  });

  const handleProceedToReview = () => {
    if (validateResults()) {
      setShowReview(true);
    }
  };

  const handleSubmitResults = () => {
    updateLabTestMutation.mutate({
      status: 'completed',
      results: JSON.stringify(results),
      performedBy: technician,
      completedDate: new Date().toISOString(),
      notes
    });
  };

  if (testLoading || patientLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading test information...</p>
        </div>
      </div>
    );
  }

  if (!labTest || !patient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Test or patient information not found</p>
          <Link href="/lab/lab-tests">
            <Button className="mt-4">Back to Lab Tests</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      {/* Header */}
      <div className="bg-medical-primary dark:bg-gray-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/lab/lab-tests">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <TestTube className="h-6 w-6 mr-3" />
              <h1 className="text-xl font-semibold">Enter Test Results</h1>
            </div>
            <div className="text-sm">
              <span className="font-medium">
                {currentDoctor?.name ? `Dr. ${currentDoctor.name}` : user?.name || 'Loading...'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-green-600">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-sm font-medium">
                ✓
              </div>
              <span className="ml-2 text-sm font-medium">Patient Registration</span>
            </div>
            <div className="w-8 h-px bg-gray-300"></div>
            <div className="flex items-center text-green-600">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-sm font-medium">
                ✓
              </div>
              <span className="ml-2 text-sm font-medium">Test Selection</span>
            </div>
            <div className="w-8 h-px bg-gray-300"></div>
            <div className="flex items-center text-medical-primary">
              <div className="w-8 h-8 bg-medical-primary text-white rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <span className="ml-2 text-sm font-medium">Enter Results</span>
            </div>
            <div className="w-8 h-px bg-gray-300"></div>
            <div className="flex items-center text-gray-400">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium">
                4
              </div>
              <span className="ml-2 text-sm">Report</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Patient Information */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Patient Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-600">MRU Number</p>
                <p className="font-semibold">{patient?.mruNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-semibold">{patient?.salutation} {patient?.fullName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Age & Gender</p>
                <p className="font-semibold">{patient?.age} {patient?.ageUnit}, {patient?.gender}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Contact</p>
                <p className="font-semibold flex items-center">
                  <Phone className="h-4 w-4 mr-1" />
                  {patient?.contactPhone}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {!showReview ? (
          /* Results Entry Form */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Enter Test Results</h2>
                <p className="text-gray-600">Enter the values for each selected test</p>
              </div>

              {validationErrors.length > 0 && (
                <div className="mb-8">
                  <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      <ul className="list-disc list-inside space-y-1">
                        {validationErrors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Blood Indices Calculation Display */}
              {(() => {
                const hbResult = results.find(result => result.testName === 'HAEMOGLOBIN');
                const rbcResult = results.find(result => result.testName === 'Total R.B.C COUNT');
                const pcvResult = results.find(result => result.testName === 'P.C.V');
                const mcvResult = results.find(result => result.testName === 'MCV');
                const mchResult = results.find(result => result.testName === 'MCH');
                const mchcResult = results.find(result => result.testName === 'MCHC');
                
                const hbValue = hbResult?.value ? parseFloat(hbResult.value) : null;
                const rbcValue = rbcResult?.value ? parseFloat(rbcResult.value) : null;
                const pcvValue = pcvResult?.value ? parseFloat(pcvResult.value) : null;
                
                const showCalculations = hbValue && rbcValue && pcvValue;
                
                if (!showCalculations) return null;
                
                return (
                  <Card className="mb-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                    <CardHeader className="bg-blue-100 border-b border-blue-200">
                      <CardTitle className="flex items-center text-blue-900">
                        <TestTube className="h-5 w-5 mr-2" />
                        Blood Indices Calculations
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* MCV Calculation */}
                        <div className="bg-white p-4 rounded-lg border border-blue-200">
                          <h4 className="font-semibold text-blue-900 mb-2">MCV (Mean Corpuscular Volume)</h4>
                          <div className="text-sm space-y-1">
                            <p className="text-gray-600">Formula: (PCV × 10) ÷ RBC</p>
                            <p className="text-gray-800">Calculation: ({pcvValue} × 10) ÷ {rbcValue}</p>
                            <p className="text-gray-800">= {(pcvValue * 10).toFixed(1)} ÷ {rbcValue}</p>
                            <p className="font-semibold text-blue-900">= {mcvResult?.value} fL</p>
                            <p className="text-xs text-gray-500">Normal: 80-100 fL</p>
                            <Badge className={
                              mcvResult?.status === 'normal' ? 'bg-green-100 text-green-800' :
                              mcvResult?.status === 'high' ? 'bg-yellow-100 text-yellow-800' :
                              mcvResult?.status === 'low' ? 'bg-blue-100 text-blue-800' :
                              'bg-red-100 text-red-800'
                            }>
                              {mcvResult?.status ? mcvResult.status.charAt(0).toUpperCase() + mcvResult.status.slice(1) : 'Unknown'}
                            </Badge>
                          </div>
                        </div>
                        
                        {/* MCH Calculation */}
                        <div className="bg-white p-4 rounded-lg border border-blue-200">
                          <h4 className="font-semibold text-blue-900 mb-2">MCH (Mean Corpuscular Hemoglobin)</h4>
                          <div className="text-sm space-y-1">
                            <p className="text-gray-600">Formula: (Hb × 10) ÷ RBC</p>
                            <p className="text-gray-800">Calculation: ({hbValue} × 10) ÷ {rbcValue}</p>
                            <p className="text-gray-800">= {(hbValue * 10).toFixed(1)} ÷ {rbcValue}</p>
                            <p className="font-semibold text-blue-900">= {mchResult?.value} pg</p>
                            <p className="text-xs text-gray-500">Normal: 27-33 pg</p>
                            <Badge className={
                              mchResult?.status === 'normal' ? 'bg-green-100 text-green-800' :
                              mchResult?.status === 'high' ? 'bg-yellow-100 text-yellow-800' :
                              mchResult?.status === 'low' ? 'bg-blue-100 text-blue-800' :
                              'bg-red-100 text-red-800'
                            }>
                              {mchResult?.status ? mchResult.status.charAt(0).toUpperCase() + mchResult.status.slice(1) : 'Unknown'}
                            </Badge>
                          </div>
                        </div>
                        
                        {/* MCHC Calculation */}
                        <div className="bg-white p-4 rounded-lg border border-blue-200">
                          <h4 className="font-semibold text-blue-900 mb-2">MCHC (Mean Corpuscular Hemoglobin Concentration)</h4>
                          <div className="text-sm space-y-1">
                            <p className="text-gray-600">Formula: (Hb × 100) ÷ PCV</p>
                            <p className="text-gray-800">Calculation: ({hbValue} × 100) ÷ {pcvValue}</p>
                            <p className="text-gray-800">= {(hbValue * 100).toFixed(1)} ÷ {pcvValue}</p>
                            <p className="font-semibold text-blue-900">= {mchcResult?.value} g/dL</p>
                            <p className="text-xs text-gray-500">Normal: 32-36 g/dL</p>
                            <Badge className={
                              mchcResult?.status === 'normal' ? 'bg-green-100 text-green-800' :
                              mchcResult?.status === 'high' ? 'bg-yellow-100 text-yellow-800' :
                              mchcResult?.status === 'low' ? 'bg-blue-100 text-blue-800' :
                              'bg-red-100 text-red-800'
                            }>
                              {mchcResult?.status ? mchcResult.status.charAt(0).toUpperCase() + mchcResult.status.slice(1) : 'Unknown'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}
              
              {/* Individual test cards with clear separation */}
              <div className="space-y-8">
                {results.map((result, index) => {
                  // Check if this is the first CBP parameter to show header
                  const isCBPParameter = CBP_PARAMETERS.includes(result.testName);
                  const isFirstCBPParameter = isCBPParameter && (index === 0 || !CBP_PARAMETERS.includes(results[index - 1]?.testName));
                  
                  return (
                    <div key={index}>
                      {/* CBP Group Header */}
                      {isFirstCBPParameter && (
                        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <h3 className="text-lg font-semibold text-blue-900 flex items-center">
                            <TestTube className="h-5 w-5 mr-2" />
                            CBP (Complete Blood Picture)
                          </h3>
                          <p className="text-sm text-blue-700 mt-1">Enter values for each parameter below</p>
                        </div>
                      )}
                      
                      <Card className={`shadow-md border-2 ${isCBPParameter ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200 bg-white'}`}>
                        <CardHeader className={`border-b ${isCBPParameter ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                          <div className="flex items-center justify-between">
                            <CardTitle className={`text-lg font-semibold ${isCBPParameter ? 'text-blue-900' : 'text-gray-900'}`}>
                              {isCBPParameter ? `• ${result.testName}` : result.testName}
                            </CardTitle>
                            <Badge 
                              className={
                                result.status === 'normal' ? 'bg-green-100 text-green-800' :
                                result.status === 'high' ? 'bg-yellow-100 text-yellow-800' :
                                result.status === 'low' ? 'bg-blue-100 text-blue-800' :
                                'bg-red-100 text-red-800'
                              }
                            >
                              {result.status.charAt(0).toUpperCase() + result.status.slice(1)}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="p-6">
                          <div className={`grid gap-4 ${
                            (result.testName === 'a. RBC\'s' || result.testName === 'b. WBC\'s' || 
                             result.testName === 'c. PLATELETS') ? 'grid-cols-2' : 'grid-cols-3'
                          }`}>
                            <div>
                              <Label htmlFor={`value-${index}`}>
                                Result Value *
                                {(result.testName === 'P.C.V' || result.testName === 'Total R.B.C COUNT' || 
                                  result.testName === 'MCV' || result.testName === 'MCH' || result.testName === 'MCHC') && (
                                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                    Auto-calculated
                                  </span>
                                )}
                              </Label>
                              <Input
                                id={`value-${index}`}
                                type={
                                  (result.testName === 'a. RBC\'s' || result.testName === 'b. WBC\'s' || 
                                   result.testName === 'c. PLATELETS' || result.testName === 'SAMPLE TYPE') 
                                    ? 'text' : 'number'
                                }
                                step="0.01"
                                value={result.value}
                                onChange={(e) => updateResult(index, 'value', e.target.value)}
                                placeholder={
                                  result.testName === 'P.C.V' ? 'Will auto-calculate from Hb' :
                                  result.testName === 'Total R.B.C COUNT' ? 'Will auto-calculate from Hb' :
                                  result.testName === 'MCV' ? 'Auto-calculates from PCV & RBC' :
                                  result.testName === 'MCH' ? 'Auto-calculates from Hb & RBC' :
                                  result.testName === 'MCHC' ? 'Auto-calculates from Hb & PCV' :
                                  result.testName === 'a. RBC\'s' ? 'RBC morphology' :
                                  result.testName === 'b. WBC\'s' ? 'WBC assessment' :
                                  result.testName === 'c. PLATELETS' ? 'Platelet adequacy' :
                                  result.testName === 'SAMPLE TYPE' ? 'Sample collection type' :
                                  'Enter value'
                                }
                                className={`mt-1 ${
                                  (result.testName === 'P.C.V' || result.testName === 'Total R.B.C COUNT' || 
                                   result.testName === 'MCV' || result.testName === 'MCH' || result.testName === 'MCHC') 
                                    ? 'bg-blue-50 border-blue-200' 
                                    : ''
                                }`}
                                readOnly={
                                  result.testName === 'P.C.V' || result.testName === 'Total R.B.C COUNT' || 
                                  result.testName === 'MCV' || result.testName === 'MCH' || result.testName === 'MCHC'
                                }
                              />
                            </div>
                            {(result.testName !== 'a. RBC\'s' && result.testName !== 'b. WBC\'s' && 
                              result.testName !== 'c. PLATELETS') && (
                              <div>
                                <Label htmlFor={`unit-${index}`}>Unit</Label>
                                <Input
                                  id={`unit-${index}`}
                                  value={result.unit}
                                  onChange={(e) => updateResult(index, 'unit', e.target.value)}
                                  placeholder="units"
                                  className="mt-1"
                                />
                              </div>
                            )}
                            <div>
                              <Label>Normal Range</Label>
                              <p className="text-sm text-gray-600 pt-3">{result.normalRange}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>

              {/* Additional information card */}
              <Card>
                <CardHeader>
                  <CardTitle>Additional Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="technician">Performed By *</Label>
                    <Input
                      id="technician"
                      value={technician}
                      onChange={(e) => setTechnician(e.target.value)}
                      placeholder="Lab technician name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any additional observations or notes"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Test Summary */}
            <div>
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Test Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600">Ordered Date</p>
                      <p className="font-medium">{format(new Date(labTest.createdAt), 'MMM dd, yyyy')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Test Count</p>
                      <p className="font-medium">{results.length} tests</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Cost</p>
                      <p className="font-medium">₹{parseFloat(labTest.totalCost || '0').toFixed(2)}</p>
                    </div>
                    
                    <Button 
                      onClick={handleProceedToReview}
                      className="w-full bg-medical-primary hover:bg-medical-primary-dark"
                    >
                      Review Results
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          /* Review Section */
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                Review Results
              </CardTitle>
              <p className="text-gray-600">Please review all entered values before finalizing</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Results Review */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-4 py-2 text-left">Test Name</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Result</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Unit</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Normal Range</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((result, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-4 py-2 font-medium">{result.testName}</td>
                          <td className="border border-gray-300 px-4 py-2">{result.value}</td>
                          <td className="border border-gray-300 px-4 py-2">{result.unit}</td>
                          <td className="border border-gray-300 px-4 py-2 text-sm">{result.normalRange}</td>
                          <td className="border border-gray-300 px-4 py-2">
                            <Badge 
                              className={
                                result.status === 'normal' ? 'bg-green-100 text-green-800' :
                                result.status === 'high' ? 'bg-yellow-100 text-yellow-800' :
                                result.status === 'low' ? 'bg-blue-100 text-blue-800' :
                                'bg-red-100 text-red-800'
                              }
                            >
                              {result.status.charAt(0).toUpperCase() + result.status.slice(1)}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Additional Info */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-600">Performed By</p>
                    <p className="font-medium">{technician}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Completion Date</p>
                    <p className="font-medium">{format(new Date(), 'MMM dd, yyyy HH:mm')}</p>
                  </div>
                </div>
                
                {notes && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Additional Notes</p>
                    <p className="bg-gray-50 p-3 rounded-md">{notes}</p>
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="flex justify-between pt-6">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowReview(false)}
                  >
                    Edit Results
                  </Button>
                  <Button 
                    onClick={handleSubmitResults}
                    disabled={updateLabTestMutation.isPending}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {updateLabTestMutation.isPending ? 'Saving...' : 'Finalize & Generate Report'}
                    <FileText className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}