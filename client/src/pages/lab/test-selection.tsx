import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Link, useLocation, useRoute } from 'wouter';
import { ArrowLeft, Search, TestTube, FileText, ArrowRight, User, Phone, Calendar } from 'lucide-react';
import { useState, useMemo } from 'react';
import { format } from 'date-fns';

export default function TestSelection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, params] = useRoute('/lab/test-selection/:patientId');
  const patientId = params?.patientId;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  // Fetch patient details
  const { data: patient, isLoading: patientLoading } = useQuery<any>({
    queryKey: ['/api/patients', patientId],
  });

  // Fetch available test definitions
  const { data: testDefinitions, isLoading: testsLoading } = useQuery<any[]>({
    queryKey: ['/api/lab-test-definitions', 'active'],
  });

  // Filter tests based on search and department
  const filteredTests = useMemo(() => {
    if (!testDefinitions) return [];
    
    return testDefinitions.filter(test => {
      const matchesSearch = test.testName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           test.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDepartment = selectedDepartment === 'all' || test.department === selectedDepartment;
      return test.isActive && matchesSearch && matchesDepartment;
    });
  }, [testDefinitions, searchTerm, selectedDepartment]);

  // Get unique departments
  const departments = useMemo(() => {
    if (!testDefinitions) return [];
    const deptSet = new Set(testDefinitions.map(test => test.department));
    return Array.from(deptSet).sort();
  }, [testDefinitions]);

  // Calculate total cost
  const totalCost = useMemo(() => {
    if (!testDefinitions) return 0;
    return selectedTests.reduce((total, testId) => {
      const test = testDefinitions.find(t => t.id === testId);
      return total + (test ? parseFloat(test.cost) : 0);
    }, 0);
  }, [selectedTests, testDefinitions]);

  // Create lab test order mutation
  const createLabTestMutation = useMutation({
    mutationFn: (testData: any) => apiRequest('/api/lab-tests', 'POST', testData),
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/lab-tests'] });
      toast({ title: "Success", description: "Lab tests ordered successfully" });
      // Navigate to results entry
      window.location.href = `/lab/enter-results/${result.id}`;
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create lab test order", variant: "destructive" });
    }
  });

  const handleTestToggle = (testId: string) => {
    setSelectedTests(prev => 
      prev.includes(testId) 
        ? prev.filter(id => id !== testId)
        : [...prev, testId]
    );
  };

  const handleProceedToResults = () => {
    if (selectedTests.length === 0) {
      toast({ title: "Error", description: "Please select at least one test", variant: "destructive" });
      return;
    }

    const selectedTestData = testDefinitions?.filter(test => selectedTests.includes(test.id)) || [];
    
    createLabTestMutation.mutate({
      patientId,
      testType: selectedTestData.map(test => test.testName).join(', '),
      status: 'pending',
      orderedBy: user?.id,
      requestedDate: new Date().toISOString(),
      notes: `Selected tests: ${selectedTestData.length} tests`,
      totalCost
    });
  };

  if (patientLoading || testsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading patient and test information...</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Patient not found</p>
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
              <h1 className="text-xl font-semibold">Test Selection</h1>
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
            <div className="flex items-center text-medical-primary">
              <div className="w-8 h-8 bg-medical-primary text-white rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <span className="ml-2 text-sm font-medium">Test Selection</span>
            </div>
            <div className="w-8 h-px bg-gray-300"></div>
            <div className="flex items-center text-gray-400">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <span className="ml-2 text-sm">Enter Results</span>
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
                <p className="text-sm text-gray-600">Patient ID</p>
                <p className="font-semibold">{patient.patientId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-semibold">{patient.salutation} {patient.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Age & Gender</p>
                <p className="font-semibold">{patient.age} {patient.ageUnit}, {patient.gender}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Contact</p>
                <p className="font-semibold flex items-center">
                  <Phone className="h-4 w-4 mr-1" />
                  {patient.phone}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Test Selection */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Select Laboratory Tests</CardTitle>
                <p className="text-gray-600">Choose the tests you want to perform for this patient</p>
              </CardHeader>
              <CardContent>
                {/* Search and Filter */}
                <div className="flex gap-4 mb-6">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search tests..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-medical-primary"
                  >
                    <option value="all">All Departments</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                {/* Test List */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredTests.length > 0 ? (
                    filteredTests.map((test) => (
                      <div
                        key={test.id}
                        className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleTestToggle(test.id)}
                      >
                        <Checkbox
                          checked={selectedTests.includes(test.id)}
                          onChange={() => handleTestToggle(test.id)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900">{test.testName}</h3>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                {test.department}
                              </Badge>
                              <span className="font-bold text-medical-primary">₹{parseFloat(test.cost).toFixed(2)}</span>
                            </div>
                          </div>
                          {test.description && (
                            <p className="text-sm text-gray-600 mt-1">{test.description}</p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <TestTube className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No tests found</h3>
                      <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
                    </div>
                  )}
                </div>
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
                {selectedTests.length > 0 ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      {selectedTests.map(testId => {
                        const test = testDefinitions?.find(t => t.id === testId);
                        return test ? (
                          <div key={testId} className="flex justify-between items-center text-sm">
                            <span className="flex-1 truncate">{test.testName}</span>
                            <span className="font-medium">₹{parseFloat(test.cost).toFixed(2)}</span>
                          </div>
                        ) : null;
                      })}
                    </div>
                    <hr />
                    <div className="flex justify-between items-center font-bold">
                      <span>Total Cost:</span>
                      <span className="text-medical-primary">₹{totalCost.toFixed(2)}</span>
                    </div>
                    <Button 
                      onClick={handleProceedToResults}
                      disabled={createLabTestMutation.isPending}
                      className="w-full bg-medical-primary hover:bg-medical-primary-dark"
                    >
                      {createLabTestMutation.isPending ? (
                        'Processing...'
                      ) : (
                        <>
                          Proceed to Enter Results
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-600">No tests selected</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}