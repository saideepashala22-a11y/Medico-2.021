import { useAuth } from '@/hooks/use-auth';
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

  // Initialize results based on selected tests
  useEffect(() => {
    if (labTest && results.length === 0 && labTest.testTypes) {
      const testTypes = Array.isArray(labTest.testTypes) ? labTest.testTypes : [];
      const initialResults = testTypes.map((test: any) => ({
        testName: test.testName,
        value: '',
        unit: getDefaultUnit(test.testName),
        normalRange: getNormalRange(test.testName),
        status: 'normal' as const
      }));
      setResults(initialResults);
    }
  }, [labTest, results.length]);

  // Get default units for common tests
  const getDefaultUnit = (testName: string): string => {
    const units: Record<string, string> = {
      'HAEMOGLOBIN': 'g/dL',
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
      'HAEMOGLOBIN': '12.0-15.5 g/dL (F), 13.5-17.5 g/dL (M)',
      'FBS (Fasting Blood Sugar)': '70-100 mg/dL',
      'RBS (Random Blood Sugar)': '<140 mg/dL',
      'SERUM CREATININE': '0.6-1.2 mg/dL',
      'BLOOD UREA': '6-20 mg/dL',
      'TOTAL CHOLESTEROL': '<200 mg/dL',
      'SERUM TRIGLYCERIDES': '<150 mg/dL',
      'PLATELET COUNT': '150,000-450,000 /μL',
      'ESR (Erythrocyte Sedimentation Rate)': '<20 mm/hr (F), <15 mm/hr (M)',
      'SERUM URIC ACID': '3.4-7.0 mg/dL',
      'SERUM CALCIUM': '8.5-10.5 mg/dL',
      'SERUM SODIUM': '136-145 mEq/L',
      'SERUM POTASSIUM': '3.5-5.0 mEq/L'
    };
    return ranges[testName] || 'Consult reference values';
  };

  // Determine result status based on value and normal range
  const determineStatus = (value: string, testName: string): 'normal' | 'high' | 'low' | 'critical' => {
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
        if (numValue < 10) return 'low';
        if (numValue < 12) return 'low';
        if (numValue > 18) return 'high';
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
      } else if (isNaN(parseFloat(result.value))) {
        errors.push(`Test result for "${result.testName}" must be a valid number`);
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-medical-primary text-white shadow-lg">
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
              <span className="font-medium">{user?.name}</span>
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
              
              {/* Individual test cards with clear separation */}
              <div className="space-y-8">
                {results.map((result, index) => (
                  <Card key={index} className="shadow-md border-2 border-gray-200 bg-white">
                    <CardHeader className="bg-gray-50 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-semibold text-gray-900">{result.testName}</CardTitle>
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
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor={`value-${index}`}>Result Value *</Label>
                          <Input
                            id={`value-${index}`}
                            type="number"
                            step="0.01"
                            value={result.value}
                            onChange={(e) => updateResult(index, 'value', e.target.value)}
                            placeholder="Enter value"
                            className="mt-1"
                          />
                        </div>
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
                        <div>
                          <Label>Normal Range</Label>
                          <p className="text-sm text-gray-600 pt-3">Consult reference values</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
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