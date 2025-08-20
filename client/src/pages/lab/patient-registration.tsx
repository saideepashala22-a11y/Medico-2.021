import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Link, useLocation } from 'wouter';
import { ArrowLeft, User, ArrowRight, Loader2 } from 'lucide-react';

export default function PatientRegistration() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const [patientData, setPatientData] = useState({
    name: '',
    age: '',
    gender: '',
    contact: '',
  });

  const createPatientMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/patients', data);
      return response.json();
    },
    onSuccess: (patient) => {
      toast({
        title: 'Success',
        description: 'Patient registered successfully',
      });
      // Navigate to test selection with patient ID
      setLocation(`/lab/test-selection/${patient.id}`);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to register patient',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
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
              <User className="text-medical-blue text-xl mr-3" />
              <span className="text-xl font-bold text-gray-900">Patient Registration</span>
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
              <div className="flex items-center text-medical-blue">
                <div className="flex items-center justify-center w-8 h-8 bg-medical-blue text-white rounded-full text-sm font-bold">
                  1
                </div>
                <span className="ml-2 text-sm font-medium">Patient Registration</span>
              </div>
              <div className="flex items-center ml-4 text-gray-400">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm">
                  2
                </div>
                <span className="ml-2 text-sm">Test Selection</span>
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

        {/* Registration Form */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Register New Patient</CardTitle>
            <p className="text-center text-gray-600">Enter patient information to begin lab testing</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label>Patient ID</Label>
                <Input 
                  value="Auto-generated after registration" 
                  readOnly 
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">Format: HMS-YYYY-001</p>
              </div>
              
              <div>
                <Label>Full Name *</Label>
                <Input
                  value={patientData.name}
                  onChange={(e) => setPatientData({ ...patientData, name: e.target.value })}
                  placeholder="Enter patient's full name"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-6">
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
                      <SelectValue placeholder="Select Gender" />
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
                  placeholder="Phone number (optional)"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-medical-blue hover:bg-blue-700"
                disabled={createPatientMutation.isPending}
                size="lg"
              >
                {createPatientMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registering Patient...
                  </>
                ) : (
                  <>
                    Register & Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}