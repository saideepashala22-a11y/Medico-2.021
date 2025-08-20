import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Link } from 'wouter';
import { ArrowLeft, FlaskConical, Plus, FileText, Download, Loader2 } from 'lucide-react';
import { generateLabReportPDF } from '@/components/pdf-generator';

const availableTests = [
  { id: 'blood_test', name: 'Complete Blood Count (CBC)', price: 800 },
  { id: 'sugar_test', name: 'Blood Sugar (Fasting)', price: 300 },
  { id: 'xray', name: 'Chest X-Ray', price: 1200 },
  { id: 'urine', name: 'Urine Analysis', price: 400 },
  { id: 'mri', name: 'MRI Scan', price: 8000 },
];

export default function Lab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [patientData, setPatientData] = useState({
    name: '',
    age: '',
    gender: '',
    contact: '',
  });
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [currentPatient, setCurrentPatient] = useState<any>(null);
  const [testResults, setTestResults] = useState<any>({});
  const [doctorNotes, setDoctorNotes] = useState('');

  const { data: recentTests, isLoading: testsLoading } = useQuery({
    queryKey: ['/api/lab-tests/recent'],
  });

  const createPatientMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/patients', data);
      return response.json();
    },
    onSuccess: (patient) => {
      setCurrentPatient(patient);
      setCurrentStep(2);
      toast({
        title: 'Success',
        description: 'Patient registered successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to register patient',
        variant: 'destructive',
      });
    },
  });

  const createLabTestMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/lab-tests', data);
      return response.json();
    },
    onSuccess: () => {
      setCurrentStep(3);
      toast({
        title: 'Success',
        description: 'Lab test created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create lab test',
        variant: 'destructive',
      });
    },
  });

  const updateLabTestMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest('PUT', `/api/lab-tests/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lab-tests/recent'] });
      toast({
        title: 'Success',
        description: 'Test results saved successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save results',
        variant: 'destructive',
      });
    },
  });

  const handlePatientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientData.name || !patientData.age || !patientData.gender) {
      toast({
        title: 'Error',
        description: 'Please fill in required fields',
        variant: 'destructive',
      });
      return;
    }
    createPatientMutation.mutate({
      ...patientData,
      age: parseInt(patientData.age),
    });
  };

  const handleTestSelection = () => {
    if (selectedTests.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one test',
        variant: 'destructive',
      });
      return;
    }

    const testData = selectedTests.map(testId => 
      availableTests.find(test => test.id === testId)
    );
    const totalCost = testData.reduce((sum, test) => sum + (test?.price || 0), 0);

    createLabTestMutation.mutate({
      patientId: currentPatient.id,
      testTypes: testData,
      totalCost: totalCost.toString(),
      status: 'pending',
    });
  };

  const handleSaveResults = () => {
    if (!currentPatient?.labTestId) return;
    
    updateLabTestMutation.mutate({
      id: currentPatient.labTestId,
      data: {
        results: testResults,
        doctorNotes,
        status: 'completed',
      },
    });
  };

  const handleGenerateReport = () => {
    if (currentPatient) {
      generateLabReportPDF(currentPatient, {
        ...currentPatient,
        results: testResults,
        doctorNotes,
        createdAt: new Date().toISOString(),
      });
    }
  };

  const getTotalCost = () => {
    return selectedTests.reduce((sum, testId) => {
      const test = availableTests.find(t => t.id === testId);
      return sum + (test?.price || 0);
    }, 0);
  };

  const resetForm = () => {
    setCurrentStep(1);
    setPatientData({ name: '', age: '', gender: '', contact: '' });
    setSelectedTests([]);
    setCurrentPatient(null);
    setTestResults({});
    setDoctorNotes('');
  };

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
              <FlaskConical className="text-medical-blue text-xl mr-3" />
              <span className="text-xl font-bold text-gray-900">Laboratory Module</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user?.name}</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Lab Test Management</h1>
            <Button onClick={resetForm} className="bg-medical-blue hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              New Lab Test
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Step 1: Patient Registration */}
          <Card className={currentStep === 1 ? 'ring-2 ring-medical-blue' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <div className={`rounded-full w-8 h-8 flex items-center justify-center mr-3 ${
                  currentStep >= 1 ? 'bg-medical-blue text-white' : 'bg-gray-200'
                }`}>
                  <span className="text-sm font-bold">1</span>
                </div>
                Patient Registration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePatientSubmit} className="space-y-4">
                <div>
                  <Label>Patient ID</Label>
                  <Input 
                    value={currentPatient?.patientId || 'Auto-generated'} 
                    readOnly 
                    className="bg-gray-50"
                  />
                </div>
                
                <div>
                  <Label>Full Name *</Label>
                  <Input
                    value={patientData.name}
                    onChange={(e) => setPatientData({ ...patientData, name: e.target.value })}
                    placeholder="Enter patient name"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Age *</Label>
                    <Input
                      type="number"
                      min="1"
                      max="120"
                      value={patientData.age}
                      onChange={(e) => setPatientData({ ...patientData, age: e.target.value })}
                      placeholder="Age"
                      required
                    />
                  </div>
                  <div>
                    <Label>Gender *</Label>
                    <Select 
                      value={patientData.gender}
                      onValueChange={(value) => setPatientData({ ...patientData, gender: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label>Contact Number</Label>
                  <Input
                    type="tel"
                    value={patientData.contact}
                    onChange={(e) => setPatientData({ ...patientData, contact: e.target.value })}
                    placeholder="Phone number"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-medical-blue hover:bg-blue-700"
                  disabled={createPatientMutation.isPending || currentStep > 1}
                >
                  {createPatientMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    'Register Patient'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Step 2: Test Selection */}
          <Card className={currentStep === 2 ? 'ring-2 ring-medical-green' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <div className={`rounded-full w-8 h-8 flex items-center justify-center mr-3 ${
                  currentStep >= 2 ? 'bg-medical-green text-white' : 'bg-gray-200'
                }`}>
                  <span className="text-sm font-bold">2</span>
                </div>
                Select Tests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Available Lab Tests</h3>
                  <div className="space-y-3">
                    {availableTests.map((test) => (
                      <div key={test.id} className="flex items-center space-x-3">
                        <Checkbox
                          id={test.id}
                          checked={selectedTests.includes(test.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedTests([...selectedTests, test.id]);
                            } else {
                              setSelectedTests(selectedTests.filter(id => id !== test.id));
                            }
                          }}
                          disabled={currentStep < 2}
                        />
                        <Label htmlFor={test.id} className="flex-1 cursor-pointer">
                          <div className="flex justify-between">
                            <span className="text-sm">{test.name}</span>
                            <span className="text-xs text-gray-500">₹{test.price}</span>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between text-sm font-medium">
                    <span>Total Cost:</span>
                    <span>₹{getTotalCost().toLocaleString()}</span>
                  </div>
                </div>

                <Button
                  onClick={handleTestSelection}
                  className="w-full bg-medical-green hover:bg-green-700"
                  disabled={createLabTestMutation.isPending || currentStep < 2 || currentStep > 2}
                >
                  {createLabTestMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Proceed to Results'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Step 3: Test Results */}
          <Card className={currentStep === 3 ? 'ring-2 ring-medical-indigo' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <div className={`rounded-full w-8 h-8 flex items-center justify-center mr-3 ${
                  currentStep >= 3 ? 'bg-medical-indigo text-white' : 'bg-gray-200'
                }`}>
                  <span className="text-sm font-bold">3</span>
                </div>
                Enter Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {selectedTests.includes('blood_test') && (
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-4">Complete Blood Count (CBC)</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-xs">Hemoglobin (g/dL)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="12.0"
                          value={testResults.hemoglobin || ''}
                          onChange={(e) => setTestResults({
                            ...testResults,
                            hemoglobin: e.target.value
                          })}
                          disabled={currentStep < 3}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">WBC Count (/μL)</Label>
                        <Input
                          type="number"
                          placeholder="7500"
                          value={testResults.wbc || ''}
                          onChange={(e) => setTestResults({
                            ...testResults,
                            wbc: e.target.value
                          })}
                          disabled={currentStep < 3}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Platelets (/μL)</Label>
                        <Input
                          type="number"
                          placeholder="250000"
                          value={testResults.platelets || ''}
                          onChange={(e) => setTestResults({
                            ...testResults,
                            platelets: e.target.value
                          })}
                          disabled={currentStep < 3}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">RBC Count (M/μL)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="4.5"
                          value={testResults.rbc || ''}
                          onChange={(e) => setTestResults({
                            ...testResults,
                            rbc: e.target.value
                          })}
                          disabled={currentStep < 3}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {selectedTests.includes('sugar_test') && (
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-4">Blood Sugar (Fasting)</h3>
                    <div>
                      <Label>Glucose Level (mg/dL)</Label>
                      <Input
                        type="number"
                        placeholder="95"
                        value={testResults.glucose || ''}
                        onChange={(e) => setTestResults({
                          ...testResults,
                          glucose: e.target.value
                        })}
                        disabled={currentStep < 3}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <Label>Doctor's Notes</Label>
                  <Textarea
                    rows={3}
                    placeholder="Enter any additional observations..."
                    value={doctorNotes}
                    onChange={(e) => setDoctorNotes(e.target.value)}
                    disabled={currentStep < 3}
                  />
                </div>

                <div className="flex space-x-4">
                  <Button
                    onClick={handleSaveResults}
                    className="flex-1 bg-medical-blue hover:bg-blue-700"
                    disabled={updateLabTestMutation.isPending || currentStep < 3}
                  >
                    {updateLabTestMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Results'
                    )}
                  </Button>
                  <Button
                    onClick={handleGenerateReport}
                    className="flex-1 bg-medical-indigo hover:bg-indigo-700"
                    disabled={currentStep < 3}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Tests Table */}
        <div className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle>Recent Lab Tests</CardTitle>
            </CardHeader>
            <CardContent>
              {testsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Tests</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(recentTests as any[])?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                          No lab tests found
                        </TableCell>
                      </TableRow>
                    ) : (
                      (recentTests as any[])?.map((test: any) => (
                        <TableRow key={test.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{test.patient.name}</div>
                              <div className="text-sm text-gray-500">{test.patient.patientId}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {test.testTypes?.map((t: any) => t.name).join(', ') || 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {new Date(test.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={test.status === 'completed' ? 'default' : 'secondary'}
                              className={test.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                            >
                              {test.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="sm">
                                View Report
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
