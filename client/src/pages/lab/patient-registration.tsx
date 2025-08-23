import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Link, useLocation } from 'wouter';
import { ArrowLeft, User, ArrowRight, Loader2 } from 'lucide-react';

export default function PatientRegistration() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  const [patientData, setPatientData] = useState({
    salutation: '',
    name: '',
    ageValue: '',
    ageUnit: 'years',
    gender: '',
    phone: '',
    email: '',
    address: '',
    referringDoctor: '',
    bloodGroup: '',
    emergencyContact: '',
  });

  const createPatientMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/patients', data);
      return response.json();
    },
    onSuccess: (patient) => {
      // Invalidate patient search cache so newly registered patients appear immediately in pharmacy search
      queryClient.invalidateQueries({ queryKey: ['/api/patients/search'] });
      
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

  // Smart autofill for gender based on salutation
  const handleSalutationChange = (value: string) => {
    setPatientData(prev => {
      let autoGender = prev.gender;
      if (['mr', 'master'].includes(value.toLowerCase())) {
        autoGender = 'male';
      } else if (['mrs', 'ms', 'miss'].includes(value.toLowerCase())) {
        autoGender = 'female';
      }
      return { ...prev, salutation: value, gender: autoGender };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!patientData.name || !patientData.ageValue || !patientData.gender) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields (Name, Age, Gender)',
        variant: 'destructive',
      });
      return;
    }

    // Phone number validation (if provided)
    if (patientData.phone && !/^\d{10}$/.test(patientData.phone)) {
      toast({
        title: 'Error',
        description: 'Please enter a valid 10-digit phone number',
        variant: 'destructive',
      });
      return;
    }

    // Email validation (if provided)
    if (patientData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patientData.email)) {
      toast({
        title: 'Error',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return;
    }

    // Convert age to number and prepare full name
    const fullName = patientData.salutation ? `${patientData.salutation} ${patientData.name}` : patientData.name;
    const ageInYears = patientData.ageUnit === 'months' ? Math.floor(parseInt(patientData.ageValue) / 12) 
                      : patientData.ageUnit === 'days' ? Math.floor(parseInt(patientData.ageValue) / 365) 
                      : parseInt(patientData.ageValue);
    
    createPatientMutation.mutate({
      name: fullName,
      age: ageInYears,
      gender: patientData.gender,
      contact: patientData.phone || patientData.emergencyContact,
      // Store additional data in a format that can be extended later
      additionalInfo: {
        salutation: patientData.salutation,
        ageValue: patientData.ageValue,
        ageUnit: patientData.ageUnit,
        email: patientData.email,
        address: patientData.address,
        referringDoctor: patientData.referringDoctor,
        bloodGroup: patientData.bloodGroup,
        emergencyContact: patientData.emergencyContact,
      }
    });
  };

  return (
    <div className="min-h-screen bg-medical-background">
      {/* Header Navigation */}
      <nav className="bg-medical-primary shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="mr-4 text-white hover:bg-medical-primary-dark">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <User className="text-white text-xl mr-3" />
              <span className="text-xl font-bold text-white">Patient Registration</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-medical-primary-light">{user?.name}</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex items-center text-medical-primary">
                <div className="flex items-center justify-center w-8 h-8 bg-medical-primary text-white rounded-full text-sm font-bold">
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
        <Card className="max-w-4xl mx-auto">
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

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label>Salutation</Label>
                  <Select 
                    value={patientData.salutation}
                    onValueChange={handleSalutationChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Salutation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mr">Mr.</SelectItem>
                      <SelectItem value="mrs">Mrs.</SelectItem>
                      <SelectItem value="ms">Ms.</SelectItem>
                      <SelectItem value="miss">Miss</SelectItem>
                      <SelectItem value="master">Master</SelectItem>
                      <SelectItem value="baby">Baby</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="md:col-span-2">
                  <Label>Full Name *</Label>
                  <Input
                    value={patientData.name}
                    onChange={(e) => setPatientData({ ...patientData, name: e.target.value })}
                    placeholder="Enter patient's full name"
                    required
                  />
                </div>
              </div>
              
              {/* Age and Gender */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label>Age Value *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={patientData.ageValue}
                    onChange={(e) => setPatientData({ ...patientData, ageValue: e.target.value })}
                    placeholder="Age"
                    required
                  />
                </div>
                <div>
                  <Label>Age Unit *</Label>
                  <Select 
                    value={patientData.ageUnit}
                    onValueChange={(value) => setPatientData({ ...patientData, ageUnit: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="years">Years</SelectItem>
                      <SelectItem value="months">Months</SelectItem>
                      <SelectItem value="days">Days</SelectItem>
                    </SelectContent>
                  </Select>
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

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Phone Number</Label>
                  <Input
                    type="tel"
                    value={patientData.phone}
                    onChange={(e) => setPatientData({ ...patientData, phone: e.target.value })}
                    placeholder="10-digit phone number"
                    maxLength={10}
                  />
                </div>
                <div>
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    value={patientData.email}
                    onChange={(e) => setPatientData({ ...patientData, email: e.target.value })}
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              {/* Medical Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Blood Group</Label>
                  <Select 
                    value={patientData.bloodGroup}
                    onValueChange={(value) => setPatientData({ ...patientData, bloodGroup: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Blood Group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Referring Doctor</Label>
                  <Input
                    value={patientData.referringDoctor}
                    onChange={(e) => setPatientData({ ...patientData, referringDoctor: e.target.value })}
                    placeholder="Doctor name or 'Self'"
                  />
                </div>
              </div>

              {/* Emergency Contact and Address */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Emergency Contact</Label>
                  <Input
                    value={patientData.emergencyContact}
                    onChange={(e) => setPatientData({ ...patientData, emergencyContact: e.target.value })}
                    placeholder="Emergency contact number"
                  />
                </div>
                <div>
                  <Label>Address</Label>
                  <Input
                    value={patientData.address}
                    onChange={(e) => setPatientData({ ...patientData, address: e.target.value })}
                    placeholder="Patient address"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-medical-primary hover:bg-medical-primary-dark text-white shadow-lg"
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