import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation, useParams } from 'wouter';
import { ArrowLeft, TestTube, ArrowRight, User, Phone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const availableTests = [
  {
    id: 'cbc',
    name: 'Complete Blood Count (CBC)',
    cost: 500,
    description: 'Hemoglobin, WBC, RBC, Platelets',
    category: 'Blood Test'
  },
  {
    id: 'blood_sugar',
    name: 'Blood Sugar Test',
    cost: 200,
    description: 'Fasting & Post-meal glucose levels',
    category: 'Blood Test'
  },
  {
    id: 'lipid_profile',
    name: 'Lipid Profile',
    cost: 600,
    description: 'Cholesterol, HDL, LDL, Triglycerides',
    category: 'Blood Test'
  },
  {
    id: 'liver_function',
    name: 'Liver Function Test',
    cost: 700,
    description: 'ALT, AST, Bilirubin, Albumin',
    category: 'Blood Test'
  },
  {
    id: 'xray_chest',
    name: 'X-Ray Chest',
    cost: 800,
    description: 'Chest X-ray imaging',
    category: 'Imaging'
  },
  {
    id: 'urine_test',
    name: 'Urine Analysis',
    cost: 300,
    description: 'Complete urine examination',
    category: 'Urine Test'
  }
];

export default function TestSelection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const params = useParams();
  const patientId = params.patientId;

  const [selectedTests, setSelectedTests] = useState<string[]>([]);

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

  const totalCost = selectedTests.reduce((total, testId) => {
    const test = availableTests.find(t => t.id === testId);
    return total + (test?.cost || 0);
  }, 0);

  const handleTestToggle = (testId: string) => {
    setSelectedTests(prev => 
      prev.includes(testId) 
        ? prev.filter(id => id !== testId)
        : [...prev, testId]
    );
  };

  const handleProceed = () => {
    if (selectedTests.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one test',
        variant: 'destructive',
      });
      return;
    }
    
    // Pass selected tests as URL parameters
    const testParams = selectedTests.join(',');
    setLocation(`/lab/enter-results/${patientId}?tests=${testParams}`);
  };

  if (!patientId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Patient ID is required</p>
          <Link href="/lab/patient-registration">
            <Button>Go to Registration</Button>
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
    <div className="min-h-screen bg-medical-background">
      {/* Header Navigation */}
      <nav className="bg-medical-primary shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/lab/patient-registration">
                <Button variant="ghost" size="sm" className="mr-4 text-white hover:bg-medical-primary-dark">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <TestTube className="text-white text-xl mr-3" />
              <span className="text-xl font-bold text-white">Test Selection</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-medical-primary-light">{user?.name}</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex items-center text-medical-success">
                <div className="flex items-center justify-center w-8 h-8 bg-medical-success text-white rounded-full text-sm font-bold">
                  ✓
                </div>
                <span className="ml-2 text-sm font-medium">Patient Registration</span>
              </div>
              <div className="flex items-center ml-4 text-medical-primary">
                <div className="flex items-center justify-center w-8 h-8 bg-medical-primary text-white rounded-full text-sm font-bold">
                  2
                </div>
                <span className="ml-2 text-sm font-medium">Test Selection</span>
              </div>
              <div className="flex items-center ml-4 text-gray-400">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm">
                  3
                </div>
                <span className="ml-2 text-sm">Enter Results</span>
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

        {/* Patient Info Card */}
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
                <p className="text-lg font-semibold">{patient.patientId}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Name</p>
                <p className="text-lg font-semibold">{patient.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Age & Gender</p>
                <p className="text-lg font-semibold">{patient.age} years, {patient.gender}</p>
              </div>
              {patient.contact && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Contact</p>
                  <p className="text-lg font-semibold flex items-center">
                    <Phone className="mr-1 h-4 w-4" />
                    {patient.contact}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Test Selection */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Select Laboratory Tests</CardTitle>
                <p className="text-gray-600">Choose the tests you want to perform for this patient</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {availableTests.map((test) => (
                  <div
                    key={test.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedTests.includes(test.id)
                        ? 'border-medical-blue bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleTestToggle(test.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        checked={selectedTests.includes(test.id)}
                        onChange={() => handleTestToggle(test.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{test.name}</h3>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{test.category}</Badge>
                            <span className="font-bold text-medical-blue">₹{test.cost}</span>
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm">{test.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedTests.length > 0 ? (
                    <>
                      {selectedTests.map((testId) => {
                        const test = availableTests.find(t => t.id === testId);
                        return test ? (
                          <div key={test.id} className="flex justify-between items-center py-2 border-b">
                            <span className="text-sm">{test.name}</span>
                            <span className="font-medium">₹{test.cost}</span>
                          </div>
                        ) : null;
                      })}
                      <div className="flex justify-between items-center pt-3 text-lg font-bold">
                        <span>Total Cost</span>
                        <span className="text-medical-primary">₹{totalCost}</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No tests selected</p>
                  )}
                </div>
                
                <Button 
                  onClick={handleProceed}
                  className="w-full mt-6 bg-medical-primary hover:bg-medical-primary-dark text-white shadow-lg"
                  size="lg"
                  disabled={selectedTests.length === 0}
                >
                  Proceed to Enter Results
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}