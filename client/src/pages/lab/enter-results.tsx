import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation, useParams } from 'wouter';
import { ArrowLeft, FileText, ArrowRight, User, TestTube, Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

const testFields = {
  cbc: [
    { key: 'hemoglobin', label: 'Hemoglobin (g/dL)', type: 'number', step: '0.1' },
    { key: 'wbc', label: 'WBC Count (/µL)', type: 'number' },
    { key: 'rbc', label: 'RBC Count (M/µL)', type: 'number', step: '0.1' },
    { key: 'platelets', label: 'Platelets (/µL)', type: 'number' },
  ],
  blood_sugar: [
    { key: 'fasting', label: 'Fasting Glucose (mg/dL)', type: 'number' },
    { key: 'postmeal', label: 'Post-meal Glucose (mg/dL)', type: 'number' },
  ],
  lipid_profile: [
    { key: 'cholesterol', label: 'Total Cholesterol (mg/dL)', type: 'number' },
    { key: 'hdl', label: 'HDL Cholesterol (mg/dL)', type: 'number' },
    { key: 'ldl', label: 'LDL Cholesterol (mg/dL)', type: 'number' },
    { key: 'triglycerides', label: 'Triglycerides (mg/dL)', type: 'number' },
  ],
  liver_function: [
    { key: 'alt', label: 'ALT (U/L)', type: 'number' },
    { key: 'ast', label: 'AST (U/L)', type: 'number' },
    { key: 'bilirubin', label: 'Total Bilirubin (mg/dL)', type: 'number', step: '0.1' },
    { key: 'albumin', label: 'Albumin (g/dL)', type: 'number', step: '0.1' },
  ],
  xray_chest: [
    { key: 'findings', label: 'X-Ray Findings', type: 'textarea' },
  ],
  urine_test: [
    { key: 'color', label: 'Color', type: 'text' },
    { key: 'protein', label: 'Protein', type: 'text' },
    { key: 'glucose', label: 'Glucose', type: 'text' },
    { key: 'ketones', label: 'Ketones', type: 'text' },
  ],
};

const testNames = {
  cbc: 'Complete Blood Count (CBC)',
  blood_sugar: 'Blood Sugar Test',
  lipid_profile: 'Lipid Profile',
  liver_function: 'Liver Function Test',
  xray_chest: 'X-Ray Chest',
  urine_test: 'Urine Analysis',
};

export default function EnterResults() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const params = useParams();
  const queryClient = useQueryClient();
  const patientId = params.patientId;
  
  // Get tests from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const testsParam = urlParams.get('tests');
  const selectedTests = testsParam ? testsParam.split(',') : [];

  const [results, setResults] = useState<Record<string, any>>({});
  const [doctorNotes, setDoctorNotes] = useState('');

  // Fetch patient details
  const { data: patient, isLoading } = useQuery<{
    id: string;
    patientId: string;
    name: string;
    age: number;
    gender: string;
    contact?: string;
  }>({
    queryKey: ['/api/patients', patientId],
    enabled: !!patientId,
  });

  // Initialize results object
  useEffect(() => {
    const initialResults: Record<string, any> = {};
    selectedTests.forEach(testId => {
      initialResults[testId] = {};
      const fields = testFields[testId as keyof typeof testFields] || [];
      fields.forEach(field => {
        initialResults[testId][field.key] = '';
      });
    });
    setResults(initialResults);
  }, [selectedTests.join(',')]); // Fix infinite loop by converting array to string

  const createLabTestMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/lab-tests', data);
      return response.json();
    },
    onSuccess: (labTest) => {
      queryClient.invalidateQueries({ queryKey: ['/api/lab-tests'] });
      toast({
        title: 'Success',
        description: 'Lab test results saved successfully',
      });
      setLocation(`/lab/report/${labTest.id}`);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save lab test results',
        variant: 'destructive',
      });
    },
  });

  const handleResultChange = (testId: string, field: string, value: string) => {
    setResults(prev => ({
      ...prev,
      [testId]: {
        ...prev[testId],
        [field]: value
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!patient) return;

    // Validate that at least some results are entered
    const hasResults = Object.values(results).some(testResult => 
      Object.values(testResult).some(value => value !== '')
    );

    if (!hasResults) {
      toast({
        title: 'Error',
        description: 'Please enter at least some test results',
        variant: 'destructive',
      });
      return;
    }

    const testData = {
      patientId: patient.id,
      testType: selectedTests.join(', '),
      results: JSON.stringify(results),
      doctorNotes,
    };

    createLabTestMutation.mutate(testData);
  };

  if (!patientId || selectedTests.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Patient ID and selected tests are required</p>
          <Link href="/lab/patient-registration">
            <Button>Start Over</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">Loading patient information...</div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Patient not found</p>
          <Link href="/lab/patient-registration">
            <Button>Register New Patient</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href={`/lab/test-selection/${patientId}`}>
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <FileText className="text-medical-blue text-xl mr-3" />
              <span className="text-xl font-bold text-gray-900">Enter Test Results</span>
            </div>
            <div className="flex items-center space-x-4">
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
              <div className="flex items-center ml-4 text-medical-blue">
                <div className="flex items-center justify-center w-8 h-8 bg-medical-blue text-white rounded-full text-sm font-bold">
                  3
                </div>
                <span className="ml-2 text-sm font-medium">Enter Results</span>
              </div>
              <div className="flex items-center ml-4 text-gray-400">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm">
                  4
                </div>
                <span className="ml-2 text-sm">Report</span>
              </div>
            </div>
          </div>
        </div>

        {/* Patient Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              Patient: {patient.name} ({patient.patientId})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <span>Age: {patient.age} years</span>
              <span>Gender: {patient.gender}</span>
              {patient.contact && <span>Contact: {patient.contact}</span>}
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Test Results */}
          {selectedTests.map((testId) => {
            const fields = testFields[testId as keyof typeof testFields] || [];
            const testName = testNames[testId as keyof typeof testNames] || testId;
            
            return (
              <Card key={testId}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TestTube className="mr-2 h-5 w-5" />
                    {testName}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {fields.map((field) => (
                      <div key={field.key}>
                        <Label>{field.label}</Label>
                        {field.type === 'textarea' ? (
                          <Textarea
                            value={results[testId]?.[field.key] || ''}
                            onChange={(e) => handleResultChange(testId, field.key, e.target.value)}
                            placeholder={`Enter ${field.label.toLowerCase()}`}
                            rows={3}
                          />
                        ) : (
                          <Input
                            type={field.type}
                            step={(field as any).step}
                            value={results[testId]?.[field.key] || ''}
                            onChange={(e) => handleResultChange(testId, field.key, e.target.value)}
                            placeholder={`Enter ${field.label.toLowerCase()}`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Doctor's Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Doctor's Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={doctorNotes}
                onChange={(e) => setDoctorNotes(e.target.value)}
                placeholder="Enter any additional observations, recommendations, or notes..."
                rows={4}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button 
              type="submit"
              className="bg-medical-blue hover:bg-blue-700"
              size="lg"
              disabled={createLabTestMutation.isPending}
            >
              {createLabTestMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Report...
                </>
              ) : (
                <>
                  Generate Report
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}