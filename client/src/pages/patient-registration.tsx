import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Link } from 'wouter';
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
  IdCard,
  Edit,
  Trash2,
  CheckCircle
} from 'lucide-react';

interface PatientData {
  id: string;
  mru: string;
  visitId: string;
  salutation: string;
  fullName: string;
  dateOfBirth: string;
  age: number;
  gender: string;
  contactNumber: string;
  email: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  bloodGroup: string;
  medicalHistory: string;
  registrationDate: string;
}

export default function PatientRegistration() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    salutation: '',
    fullName: '',
    dateOfBirth: '',
    gender: '',
    contactNumber: '',
    email: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    bloodGroup: '',
    medicalHistory: ''
  });

  const [patients, setPatients] = useState<PatientData[]>([]);
  const [editingPatient, setEditingPatient] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [age, setAge] = useState<number>(0);
  const [mruCounter, setMruCounter] = useState(1);

  // Generate MRU number based on current year
  const generateMRU = (): string => {
    const currentYear = new Date().getFullYear().toString().slice(-2);
    const counter = String(mruCounter).padStart(4, '0');
    return `MRU${currentYear}-${counter}`;
  };

  // Generate Visit ID
  const generateVisitId = (): string => {
    const timestamp = Date.now().toString().slice(-6);
    return `VID-${timestamp}`;
  };

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string): number => {
    if (!dateOfBirth) return 0;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Get age-appropriate salutation options
  const getSalutationOptions = (age: number) => {
    const allOptions = [
      { value: 'Mr.', label: 'Mr.' },
      { value: 'Mrs.', label: 'Mrs.' },
      { value: 'Ms.', label: 'Ms.' },
      { value: 'Dr.', label: 'Dr.' },
      { value: 'Master', label: 'Master' },
      { value: 'Baby', label: 'Baby' },
      { value: 'Miss', label: 'Miss' }
    ];

    // Suggest based on age but allow override
    if (age < 18 && age > 0) {
      // For minors, prioritize Master/Baby/Miss but keep all options
      return allOptions;
    }
    return allOptions;
  };

  // Suggest salutation based on age and gender
  const getSuggestedSalutation = (age: number, gender: string): string => {
    if (age < 18 && age > 0) {
      if (gender === 'male') return 'Master';
      if (gender === 'female') return 'Miss';
      return 'Baby';
    }
    if (age >= 18) {
      if (gender === 'male') return 'Mr.';
      if (gender === 'female') return 'Ms.';
    }
    return '';
  };

  // Handle date of birth change
  const handleDateOfBirthChange = (value: string) => {
    setFormData(prev => ({ ...prev, dateOfBirth: value }));
    const calculatedAge = calculateAge(value);
    setAge(calculatedAge);
    
    // Auto-suggest salutation based on age and gender
    const suggested = getSuggestedSalutation(calculatedAge, formData.gender);
    if (suggested && !formData.salutation) {
      setFormData(prev => ({ ...prev, salutation: suggested }));
    }
  };

  // Handle gender change
  const handleGenderChange = (value: string) => {
    setFormData(prev => ({ ...prev, gender: value }));
    
    // Auto-suggest salutation based on age and gender
    const suggested = getSuggestedSalutation(age, value);
    if (suggested && !formData.salutation) {
      setFormData(prev => ({ ...prev, salutation: suggested }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!formData.fullName.trim()) {
      toast({
        title: 'Error',
        description: 'Full name is required',
        variant: 'destructive',
      });
      return false;
    }

    if (!formData.dateOfBirth) {
      toast({
        title: 'Error',
        description: 'Date of birth is required',
        variant: 'destructive',
      });
      return false;
    }

    if (!formData.gender) {
      toast({
        title: 'Error',
        description: 'Gender is required',
        variant: 'destructive',
      });
      return false;
    }

    if (formData.contactNumber && !/^\d{10}$/.test(formData.contactNumber)) {
      toast({
        title: 'Error',
        description: 'Contact number must be exactly 10 digits',
        variant: 'destructive',
      });
      return false;
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast({
        title: 'Error',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return false;
    }

    if (!formData.emergencyContactName.trim()) {
      toast({
        title: 'Error',
        description: 'Emergency contact name is required',
        variant: 'destructive',
      });
      return false;
    }

    if (!formData.emergencyContactPhone || !/^\d{10}$/.test(formData.emergencyContactPhone)) {
      toast({
        title: 'Error',
        description: 'Emergency contact phone must be exactly 10 digits',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const newPatient: PatientData = {
      id: Date.now().toString(),
      mru: generateMRU(),
      visitId: generateVisitId(),
      salutation: formData.salutation,
      fullName: formData.fullName,
      dateOfBirth: formData.dateOfBirth,
      age: age,
      gender: formData.gender,
      contactNumber: formData.contactNumber,
      email: formData.email,
      address: formData.address,
      emergencyContactName: formData.emergencyContactName,
      emergencyContactPhone: formData.emergencyContactPhone,
      bloodGroup: formData.bloodGroup,
      medicalHistory: formData.medicalHistory,
      registrationDate: new Date().toISOString().split('T')[0]
    };

    if (editingPatient) {
      setPatients(prev => prev.map(p => p.id === editingPatient ? { ...newPatient, id: editingPatient, mru: patients.find(pt => pt.id === editingPatient)?.mru || newPatient.mru } : p));
      setEditingPatient(null);
      toast({
        title: 'Success',
        description: 'Patient updated successfully',
      });
    } else {
      setPatients(prev => [...prev, newPatient]);
      setMruCounter(prev => prev + 1);
      toast({
        title: 'Success',
        description: `Patient registered successfully with MRU: ${newPatient.mru}`,
      });
    }

    // Reset form
    setFormData({
      salutation: '',
      fullName: '',
      dateOfBirth: '',
      gender: '',
      contactNumber: '',
      email: '',
      address: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      bloodGroup: '',
      medicalHistory: ''
    });
    setAge(0);
  };

  // Handle edit patient
  const handleEdit = (patient: PatientData) => {
    setFormData({
      salutation: patient.salutation,
      fullName: patient.fullName,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      contactNumber: patient.contactNumber,
      email: patient.email,
      address: patient.address,
      emergencyContactName: patient.emergencyContactName,
      emergencyContactPhone: patient.emergencyContactPhone,
      bloodGroup: patient.bloodGroup,
      medicalHistory: patient.medicalHistory
    });
    setAge(patient.age);
    setEditingPatient(patient.id);
  };

  // Handle delete patient
  const handleDelete = (patientId: string) => {
    setPatients(prev => prev.filter(p => p.id !== patientId));
    toast({
      title: 'Success',
      description: 'Patient deleted successfully',
    });
  };

  // Filter patients for search
  const filteredPatients = patients.filter(patient =>
    patient.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.mru.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.contactNumber.includes(searchTerm) ||
    patient.visitId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white shadow-lg">
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
        {/* Registration Form */}
        <Card className="mb-8 shadow-lg">
          <CardHeader className="bg-blue-50 border-b">
            <CardTitle className="flex items-center text-blue-800">
              <UserPlus className="h-5 w-5 mr-2" />
              {editingPatient ? 'Edit Patient Registration' : 'New Patient Registration'}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Please fill in all required fields to register a new patient
            </p>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="salutation">Salutation</Label>
                  <Select value={formData.salutation} onValueChange={(value) => setFormData(prev => ({ ...prev, salutation: value }))}>
                    <SelectTrigger className="border-gray-300">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {getSalutationOptions(age).map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {age > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Suggested: {getSuggestedSalutation(age, formData.gender) || 'None'}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="Enter full name"
                    className="border-gray-300"
                    required
                  />
                </div>
              </div>

              {/* Auto-generated fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border">
                <div>
                  <Label>MRU Number (Auto-generated)</Label>
                  <div className="bg-white p-2 border rounded text-gray-700 font-mono">
                    {editingPatient ? patients.find(p => p.id === editingPatient)?.mru : generateMRU()}
                  </div>
                </div>
                <div>
                  <Label>Visit ID (Auto-generated)</Label>
                  <div className="bg-white p-2 border rounded text-gray-700 font-mono">
                    {generateVisitId()}
                  </div>
                </div>
              </div>

              {/* Date and Demographics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleDateOfBirthChange(e.target.value)}
                    className="border-gray-300"
                    required
                  />
                  {age > 0 && (
                    <p className="text-xs text-gray-600 mt-1">Age: {age} years</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="gender">Gender *</Label>
                  <Select value={formData.gender} onValueChange={handleGenderChange}>
                    <SelectTrigger className="border-gray-300">
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
                  <Label htmlFor="bloodGroup">Blood Group</Label>
                  <Select value={formData.bloodGroup} onValueChange={(value) => setFormData(prev => ({ ...prev, bloodGroup: value }))}>
                    <SelectTrigger className="border-gray-300">
                      <SelectValue placeholder="Select" />
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
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactNumber">Contact Number</Label>
                  <Input
                    id="contactNumber"
                    value={formData.contactNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactNumber: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                    placeholder="10-digit phone number"
                    className="border-gray-300"
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
                    placeholder="email@example.com"
                    className="border-gray-300"
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
                  className="border-gray-300"
                  rows={3}
                />
              </div>

              {/* Emergency Contact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-l-4 border-red-500 bg-red-50 p-4 rounded-r-lg">
                <div>
                  <Label htmlFor="emergencyContactName">Emergency Contact Name *</Label>
                  <Input
                    id="emergencyContactName"
                    value={formData.emergencyContactName}
                    onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactName: e.target.value }))}
                    placeholder="Emergency contact name"
                    className="border-gray-300 bg-white"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="emergencyContactPhone">Emergency Contact Phone *</Label>
                  <Input
                    id="emergencyContactPhone"
                    value={formData.emergencyContactPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactPhone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                    placeholder="10-digit phone number"
                    className="border-gray-300 bg-white"
                    maxLength={10}
                    required
                  />
                </div>
              </div>

              {/* Medical History */}
              <div>
                <Label htmlFor="medicalHistory">Medical History / Allergies</Label>
                <Textarea
                  id="medicalHistory"
                  value={formData.medicalHistory}
                  onChange={(e) => setFormData(prev => ({ ...prev, medicalHistory: e.target.value }))}
                  placeholder="Enter medical history, allergies, or any relevant information"
                  className="border-gray-300"
                  rows={3}
                />
              </div>

              {/* Registration Date */}
              <div className="bg-blue-50 p-4 rounded-lg border">
                <Label>Registration Date</Label>
                <div className="text-gray-700 font-medium">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg">
                <Save className="h-4 w-4 mr-2" />
                {editingPatient ? 'Update Patient' : 'Register Patient'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Master Registrar Table */}
        <Card className="shadow-lg">
          <CardHeader className="bg-blue-50 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center text-blue-800">
                <Users className="h-5 w-5 mr-2" />
                Master Patient Register
              </CardTitle>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">
                  Total Patients: {patients.length}
                </div>
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search patients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredPatients.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700">MRU</th>
                      <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700">Visit ID</th>
                      <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                      <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700">Age/Gender</th>
                      <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700">Contact</th>
                      <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700">Blood Group</th>
                      <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700">Registration Date</th>
                      <th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPatients.map((patient, index) => (
                      <tr key={patient.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-300 px-4 py-3 text-sm font-mono">{patient.mru}</td>
                        <td className="border border-gray-300 px-4 py-3 text-sm font-mono">{patient.visitId}</td>
                        <td className="border border-gray-300 px-4 py-3 text-sm">
                          <div className="font-medium">{patient.salutation} {patient.fullName}</div>
                          {patient.email && (
                            <div className="text-xs text-gray-500">{patient.email}</div>
                          )}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-sm">
                          {patient.age} yrs, {patient.gender}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-sm">
                          <div>{patient.contactNumber}</div>
                          <div className="text-xs text-gray-500">
                            Emerg: {patient.emergencyContactPhone}
                          </div>
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-sm text-center">
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-semibold">
                            {patient.bloodGroup || 'N/A'}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-sm">
                          {new Date(patient.registrationDate).toLocaleDateString()}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <div className="flex justify-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(patient)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(patient.id)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  {searchTerm ? 'No patients found matching your search' : 'No patients registered yet'}
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  {searchTerm ? 'Try a different search term' : 'Register your first patient to get started'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}