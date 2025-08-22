import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Link, useLocation } from 'wouter';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  UserPlus, 
  Save, 
  Search,
  Users,
  Calendar,
  Phone,
  MapPin,
  IdCard
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

export default function PatientRegistration() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    salutation: '',
    name: '',
    age: '',
    ageUnit: 'years',
    gender: '',
    contact: '',
    email: '',
    address: '',
    bloodGroup: '',
    emergencyContact: '',
    emergencyContactName: '',
    referringDoctor: ''
  });

  const [searchTerm, setSearchTerm] = useState('');

  // Get existing patients for search
  const { data: patients = [] } = useQuery({
    queryKey: ['/api/patients'],
  }) as { data: any[] };

  // Create patient mutation
  const createPatientMutation = useMutation({
    mutationFn: async (patientData: any) => {
      return await apiRequest('POST', '/api/patients', patientData);
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Patient registered successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/patients'] });
      // Reset form
      setFormData({
        salutation: '',
        name: '',
        age: '',
        ageUnit: 'years',
        gender: '',
        contact: '',
        email: '',
        address: '',
        bloodGroup: '',
        emergencyContact: '',
        emergencyContactName: '',
        referringDoctor: ''
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.age || !formData.gender) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    createPatientMutation.mutate(formData);
  };

  const handleSalutationChange = (value: string) => {
    setFormData(prev => ({ 
      ...prev, 
      salutation: value,
      // Auto-suggest gender based on salutation
      gender: value === 'Mr.' ? 'male' : value === 'Mrs.' || value === 'Ms.' ? 'female' : prev.gender
    }));
  };

  const filteredPatients = patients.filter((patient: any) =>
    patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.patientId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.contact?.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-medical-background">
      {/* Header */}
      <div className="bg-medical-primary text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <UserPlus className="h-6 w-6 mr-3" />
              <h1 className="text-xl font-semibold">Patient Registration</h1>
            </div>
            <div className="text-sm">
              Welcome, {user?.name || user?.username}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Patient Registration Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserPlus className="h-5 w-5 mr-2 text-green-600" />
                  Register New Patient
                </CardTitle>
                <p className="text-sm text-medical-text-muted">
                  Create a unique patient profile that works across all hospital modules
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Personal Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="salutation">Salutation</Label>
                      <Select value={formData.salutation} onValueChange={handleSalutationChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Salutation" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Mr.">Mr.</SelectItem>
                          <SelectItem value="Mrs.">Mrs.</SelectItem>
                          <SelectItem value="Ms.">Ms.</SelectItem>
                          <SelectItem value="Dr.">Dr.</SelectItem>
                          <SelectItem value="Master">Master</SelectItem>
                          <SelectItem value="Baby">Baby</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter full name"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="age">Age *</Label>
                      <div className="flex gap-2">
                        <Input
                          id="age"
                          type="number"
                          value={formData.age}
                          onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                          placeholder="Age"
                          required
                          className="flex-1"
                        />
                        <Select value={formData.ageUnit} onValueChange={(value) => setFormData(prev => ({ ...prev, ageUnit: value }))}>
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="years">Years</SelectItem>
                            <SelectItem value="months">Months</SelectItem>
                            <SelectItem value="days">Days</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="gender">Gender *</Label>
                      <Select value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
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

                    <div>
                      <Label htmlFor="contact">Contact Number</Label>
                      <Input
                        id="contact"
                        value={formData.contact}
                        onChange={(e) => setFormData(prev => ({ ...prev, contact: e.target.value }))}
                        placeholder="Enter 10-digit phone number"
                        maxLength={10}
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Enter email address"
                      />
                    </div>

                    <div>
                      <Label htmlFor="bloodGroup">Blood Group</Label>
                      <Select value={formData.bloodGroup} onValueChange={(value) => setFormData(prev => ({ ...prev, bloodGroup: value }))}>
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
                      <Label htmlFor="referringDoctor">Referring Doctor</Label>
                      <Input
                        id="referringDoctor"
                        value={formData.referringDoctor}
                        onChange={(e) => setFormData(prev => ({ ...prev, referringDoctor: e.target.value }))}
                        placeholder="Enter referring doctor name"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Enter complete address"
                      rows={3}
                    />
                  </div>

                  {/* Emergency Contact */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="emergencyContactName">Emergency Contact Name</Label>
                      <Input
                        id="emergencyContactName"
                        value={formData.emergencyContactName}
                        onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactName: e.target.value }))}
                        placeholder="Enter emergency contact name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="emergencyContact">Emergency Contact Number</Label>
                      <Input
                        id="emergencyContact"
                        value={formData.emergencyContact}
                        onChange={(e) => setFormData(prev => ({ ...prev, emergencyContact: e.target.value }))}
                        placeholder="Enter emergency contact number"
                        maxLength={10}
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={createPatientMutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {createPatientMutation.isPending ? 'Registering...' : 'Register Patient'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Existing Patients Search */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Search className="h-5 w-5 mr-2 text-medical-primary" />
                  Existing Patients
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Input
                    placeholder="Search by name, ID, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />

                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {filteredPatients.length > 0 ? (
                      filteredPatients.map((patient: any) => (
                        <div 
                          key={patient.id} 
                          className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{patient.name}</p>
                              <p className="text-xs text-gray-500">ID: {patient.patientId}</p>
                              {patient.contact && (
                                <p className="text-xs text-gray-500">📞 {patient.contact}</p>
                              )}
                            </div>
                            <div className="text-xs text-gray-400">
                              {patient.age} {patient.gender}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 py-4">
                        {searchTerm ? 'No patients found' : 'No registered patients'}
                      </p>
                    )}
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-2" />
                      Total Patients: {patients.length}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}