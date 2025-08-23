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
import { ConsultationCardModal } from '@/components/ConsultationCardModal';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
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
  CheckCircle,
  Download
} from 'lucide-react';
import jsPDF from 'jspdf';

interface PatientData {
  id: string;
  mru: string;
  visitId: string;
  salutation: string;
  fullName: string;
  dateOfBirth: string;
  age: number;
  gender: string;
  contactPhone: string;
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nextMRU, setNextMRU] = useState('');
  const [nextVisitId, setNextVisitId] = useState('');

  // Generate unique identifiers
  const generateVisitId = () => {
    const counter = String(Math.floor(Math.random() * 900000) + 100000);
    return `VID-${counter}`;
  };

  // Fetch next MRU number from backend
  const fetchNextMRU = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/patients-registration/next-mru', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setNextMRU(data.mruNumber);
      }
    } catch (error) {
      console.error('Error fetching next MRU:', error);
    }
  };

  const [formData, setFormData] = useState({
    mruNumber: '',
    visitId: generateVisitId(),
    salutation: '',
    fullName: '',
    age: '',
    ageUnit: 'years',
    dateOfBirth: '',
    gender: '',
    contactPhone: '',
    email: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    bloodGroup: '',
    medicalHistory: '',
    referringDoctor: ''
  });

  const [patients, setPatients] = useState<PatientData[]>([]);
  const [editingPatient, setEditingPatient] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [age, setAge] = useState<number>(0);
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [registeredPatientInfo, setRegisteredPatientInfo] = useState<any>(null);

  // Fetch patients data when component loads
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch('/api/patients-registration', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const patientsData = await response.json();
          console.log('Fetched patients:', patientsData);
          
          // Map the database fields to frontend interface
          const mappedPatients = patientsData.map((patient: any) => ({
            id: patient.id,
            mru: patient.mruNumber,
            visitId: patient.visitId,
            salutation: patient.salutation || '',
            fullName: patient.fullName,
            dateOfBirth: patient.dateOfBirth,
            age: patient.age,
            gender: patient.gender,
            contactPhone: patient.contactPhone,
            email: patient.email || '',
            address: patient.address || '',
            emergencyContactName: patient.emergencyContactName || '',
            emergencyContactPhone: patient.emergencyContactPhone || '',
            bloodGroup: patient.bloodGroup || '',
            medicalHistory: patient.medicalHistory || '',
            registrationDate: patient.createdAt, // Map createdAt to registrationDate
          }));
          
          setPatients(mappedPatients);
        }
      } catch (error) {
        console.error('Error fetching patients:', error);
      }
    };

    fetchPatients();
    fetchNextMRU();
  }, []);

  // Generate unique Visit ID
  const generateUniqueVisitId = (): string => {
    const existingVisitIds = patients.map(p => p.visitId);
    
    let visitId = '';
    do {
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      visitId = `VID-${timestamp}${random}`;
    } while (existingVisitIds.includes(visitId));
    
    return visitId;
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
    const calculatedAge = calculateAge(value);
    setFormData(prev => ({ 
      ...prev, 
      dateOfBirth: value,
      age: calculatedAge.toString()
    }));
    setAge(calculatedAge);
    
    // Auto-suggest salutation based on age and gender
    const suggested = getSuggestedSalutation(calculatedAge, formData.gender);
    if (suggested && !formData.salutation) {
      setFormData(prev => ({ ...prev, salutation: suggested }));
    }
  };

  // Handle individual date component changes (year, month, day)
  const handleDateComponentChange = (component: 'year' | 'month' | 'day', value: string) => {
    const currentDate = formData.dateOfBirth ? new Date(formData.dateOfBirth) : new Date();
    
    let year = currentDate.getFullYear();
    let month = currentDate.getMonth() + 1; // getMonth() returns 0-11
    let day = currentDate.getDate();
    
    // Update the specific component
    if (component === 'year') {
      year = parseInt(value);
    } else if (component === 'month') {
      month = parseInt(value);
    } else if (component === 'day') {
      day = parseInt(value);
    }
    
    // Validate day for the selected month/year
    const daysInMonth = new Date(year, month, 0).getDate();
    if (day > daysInMonth) {
      day = daysInMonth;
    }
    
    // Create new date string in YYYY-MM-DD format
    const newDate = new Date(year, month - 1, day); // month is 0-indexed in Date constructor
    const dateString = newDate.toISOString().split('T')[0];
    
    // Update form data and calculate age
    const calculatedAge = calculateAge(dateString);
    setFormData(prev => ({ 
      ...prev, 
      dateOfBirth: dateString,
      age: calculatedAge.toString()
    }));
    setAge(calculatedAge);
    
    // Auto-suggest salutation based on age and gender
    const suggested = getSuggestedSalutation(calculatedAge, formData.gender);
    if (suggested && !formData.salutation) {
      setFormData(prev => ({ ...prev, salutation: suggested }));
    }
  };

  // Handle salutation change
  const handleSalutationChange = (value: string) => {
    setFormData(prev => ({ ...prev, salutation: value }));
    
    // Auto-select gender based on salutation
    let autoGender = '';
    switch (value) {
      case 'Mr.':
      case 'Master':
        autoGender = 'male';
        break;
      case 'Mrs.':
      case 'Ms.':
      case 'Miss':
        autoGender = 'female';
        break;
      case 'Dr.':
      case 'Baby':
        // Keep existing gender or leave empty for user to choose
        autoGender = formData.gender;
        break;
      default:
        autoGender = formData.gender;
    }
    
    if (autoGender) {
      setFormData(prev => ({ ...prev, gender: autoGender }));
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

    if (formData.contactPhone && !/^\d{10}$/.test(formData.contactPhone)) {
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

    if (formData.emergencyContactPhone && !/^\d{10}$/.test(formData.emergencyContactPhone)) {
      toast({
        title: 'Error',
        description: 'Emergency contact phone must be exactly 10 digits when provided',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // For editing, use existing values; for new registration, use pre-fetched values
      const isEditing = editingPatient !== null;
      const uniqueMRU = isEditing ? formData.mruNumber : nextMRU;
      const uniqueVisitId = isEditing ? formData.visitId : generateUniqueVisitId();

      const registrationData = {
        mruNumber: uniqueMRU,
        visitId: uniqueVisitId,
        salutation: formData.salutation || null,
        fullName: formData.fullName,
        age: parseInt(formData.age) || 0,
        ageUnit: formData.ageUnit || 'years',
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth) : null,
        contactPhone: formData.contactPhone,
        email: formData.email || null,
        address: formData.address || null,
        bloodGroup: formData.bloodGroup || null,
        emergencyContactName: formData.emergencyContactName || null,
        emergencyContactPhone: formData.emergencyContactPhone || null,
        medicalHistory: formData.medicalHistory || null,
        referringDoctor: formData.referringDoctor || null,
      };

      // Use different method and endpoint based on edit mode
      const url = isEditing ? `/api/patients-registration/${editingPatient}` : '/api/patients-registration';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(registrationData),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Validation error details:', error);
        const errorMessage = error.errors ? 
          error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join('; ') :
          error.message || 'Failed to register patient';
        throw new Error(errorMessage);
      }

      const patientData = await response.json();

      // Create patient object for state
      const patientForState = {
        id: patientData.id,
        mru: uniqueMRU,
        visitId: uniqueVisitId,
        salutation: formData.salutation,
        fullName: formData.fullName,
        dateOfBirth: formData.dateOfBirth,
        age: parseInt(formData.age) || 0,
        gender: formData.gender,
        contactPhone: formData.contactPhone,
        email: formData.email,
        address: formData.address,
        emergencyContactName: formData.emergencyContactName,
        emergencyContactPhone: formData.emergencyContactPhone,
        bloodGroup: formData.bloodGroup,
        medicalHistory: formData.medicalHistory,
        registrationDate: patientData.createdAt || new Date().toISOString(),
      };

      if (isEditing) {
        // Update existing patient in the list
        setPatients(prev => prev.map(p => p.id === editingPatient ? patientForState : p));
        
        toast({
          title: 'Success',
          description: `Patient ${formData.fullName} updated successfully`,
        });
        
        // Reset editing state
        setEditingPatient(null);
      } else {
        // Add new patient to the beginning of the list
        setPatients(prev => [patientForState, ...prev]);
        
        // Show consultation card modal for new patients
        setRegisteredPatientInfo({
          mruNumber: uniqueMRU,
          visitId: uniqueVisitId,
          fullName: formData.fullName,
          age: parseInt(formData.age) || 0,
          gender: formData.gender,
          contactPhone: formData.contactPhone,
          bloodGroup: formData.bloodGroup,
          registrationDate: new Date().toISOString(),
        });

        setShowConsultationModal(true);
      }

      // Reset form after successful submission and fetch next MRU
      await fetchNextMRU(); // Get the next sequential MRU number
      const newVisitId = generateVisitId();
      
      setFormData({
        mruNumber: '',
        visitId: newVisitId,
        salutation: '',
        fullName: '',
        age: '',
        ageUnit: 'years',
        gender: '',
        dateOfBirth: '',
        contactPhone: '',
        email: '',
        address: '',
        bloodGroup: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        medicalHistory: '',
        referringDoctor: '',
      });
      
      console.log('Patient registered successfully:', patientData);
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to register patient',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate consultation card for existing patients
  const generateConsultationCard = async (patient: PatientData) => {
    setIsDownloading(patient.id);
    
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      
      // Calculate sections: 20% for patient details, 80% for consultation
      const patientSectionHeight = pageHeight * 0.2;
      const consultationStartY = patientSectionHeight + 10;
      
      // Professional Header Design - Compact
      pdf.setFillColor(16, 97, 143);
      pdf.rect(0, 0, pageWidth, 30, 'F');
      
      // Hospital Name
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('NAKSHATRA HOSPITAL', pageWidth / 2, 15, { align: 'center' });
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Patient Consultation Card', pageWidth / 2, 25, { align: 'center' });
      
      // Current date in top right white area
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const currentDate = new Date().toLocaleDateString('en-IN');
      pdf.text(`Date: ${currentDate}`, pageWidth - margin, 35, { align: 'right' });
      
      // Patient Information Section
      let yPos = 40;
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('PATIENT INFORMATION', margin, yPos);
      
      yPos += 8;
      
      // Patient details
      const details = [
        { label: 'NAME', value: patient.fullName.toUpperCase() },
        { label: 'MRU', value: patient.mru },
        { label: 'VISIT ID', value: patient.visitId },
        { label: 'AGE/GENDER', value: `${patient.age}Y / ${patient.gender.toUpperCase()}` },
        { label: 'BLOOD GROUP', value: (patient.bloodGroup || 'N/A').toUpperCase() },
        { label: 'PHONE', value: patient.contactPhone }
      ];
      
      // Clean professional layout without boxes
      const colWidth = (pageWidth - 2 * margin) / 3;
      const rowHeight = 18;
      
      details.forEach((detail, index) => {
        const col = index % 3;
        const row = Math.floor(index / 3);
        const xPos = margin + (col * colWidth);
        const yPosText = yPos + (row * rowHeight);
        
        // Label
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(100, 100, 100);
        pdf.text(detail.label + ':', xPos, yPosText);
        
        // Value
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        pdf.text(detail.value, xPos, yPosText + 8);
      });
      
      // Add separator line for medicine writing area (moved down an inch)
      yPos += 72; // 72 points = 1 inch
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(1);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      
      // Signature section at bottom
      const bottomY = pageHeight - 35;
      const signatureBoxWidth = (pageWidth - 3 * margin) / 2;
      
      // Doctor signature
      pdf.setDrawColor(16, 97, 143);
      pdf.setLineWidth(0.5);
      pdf.rect(margin, bottomY, signatureBoxWidth, 25, 'S');
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(16, 97, 143);
      pdf.text('DOCTOR SIGNATURE & STAMP', margin + 2, bottomY + 6);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.text('Date: ____________', margin + 2, bottomY + 20);
      
      // Next appointment
      const rightBoxX = margin + signatureBoxWidth + 10;
      pdf.rect(rightBoxX, bottomY, signatureBoxWidth, 25, 'S');
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(16, 97, 143);
      pdf.text('NEXT APPOINTMENT', rightBoxX + 2, bottomY + 6);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.text('Date: ____________', rightBoxX + 2, bottomY + 14);
      pdf.text('Time: ____________', rightBoxX + 2, bottomY + 20);
      
      // Footer
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(150, 150, 150);
      pdf.text(`Generated: ${new Date().toLocaleDateString('en-IN')} | Nakshatra Hospital Management System`, pageWidth / 2, pageHeight - 5, { align: 'center' });
      
      // Save the PDF
      pdf.save(`Nakshatra_Hospital_Consultation_Card_${patient.mru}_${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({
        title: 'Success',
        description: `Consultation card downloaded for ${patient.fullName}`,
        duration: 2000, // Auto-dismiss after 2 seconds
      });
      
    } catch (error) {
      console.error('Error generating consultation card:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate consultation card',
        variant: 'destructive',
      });
    } finally {
      setIsDownloading(null);
    }
  };

  // Handle edit patient
  const handleEdit = (patient: PatientData) => {
    setFormData({
      mruNumber: patient.mru,
      visitId: patient.visitId,
      salutation: patient.salutation,
      fullName: patient.fullName,
      age: patient.age.toString(),
      ageUnit: 'years', // Default to years, can be adjusted if needed
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      contactPhone: patient.contactPhone,
      email: patient.email || '',
      address: patient.address || '',
      emergencyContactName: patient.emergencyContactName || '',
      emergencyContactPhone: patient.emergencyContactPhone || '',
      bloodGroup: patient.bloodGroup || '',
      medicalHistory: patient.medicalHistory || '',
      referringDoctor: '' // Not stored in current patient data, so default empty
    });
    setAge(patient.age);
    setEditingPatient(patient.id);
    
    // Scroll to top of form for better UX
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  // Filter patients for search and show latest 5 records
  const filteredPatients = patients
    .filter(patient =>
      patient.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.mru.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.contactPhone.includes(searchTerm) ||
      patient.visitId.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime()) // Sort by most recent first
    .slice(0, 5); // Show only latest 5 records

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
                  <Select value={formData.salutation} onValueChange={handleSalutationChange}>
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
                    {editingPatient ? patients.find(p => p.id === editingPatient)?.mru : nextMRU || 'Loading...'}
                  </div>
                </div>
                <div>
                  <Label>Visit ID (Auto-generated)</Label>
                  <div className="bg-white p-2 border rounded text-gray-700 font-mono">
                    {editingPatient ? patients.find(p => p.id === editingPatient)?.visitId : generateUniqueVisitId()}
                  </div>
                </div>
              </div>

              {/* Date and Demographics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                  <div className="space-y-2">
                    {/* Year, Month, Day Dropdowns */}
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs text-gray-600">Year</Label>
                        <Select
                          value={formData.dateOfBirth ? new Date(formData.dateOfBirth).getFullYear().toString() : ''}
                          onValueChange={(year) => handleDateComponentChange('year', year)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Year" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[200px]">
                            {Array.from({ length: 100 }, (_, i) => {
                              const year = new Date().getFullYear() - i;
                              return (
                                <SelectItem key={year} value={year.toString()}>
                                  {year}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label className="text-xs text-gray-600">Month</Label>
                        <Select
                          value={formData.dateOfBirth ? (new Date(formData.dateOfBirth).getMonth() + 1).toString() : ''}
                          onValueChange={(month) => handleDateComponentChange('month', month)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Month" />
                          </SelectTrigger>
                          <SelectContent>
                            {[
                              { value: '1', label: 'Jan' },
                              { value: '2', label: 'Feb' },
                              { value: '3', label: 'Mar' },
                              { value: '4', label: 'Apr' },
                              { value: '5', label: 'May' },
                              { value: '6', label: 'Jun' },
                              { value: '7', label: 'Jul' },
                              { value: '8', label: 'Aug' },
                              { value: '9', label: 'Sep' },
                              { value: '10', label: 'Oct' },
                              { value: '11', label: 'Nov' },
                              { value: '12', label: 'Dec' }
                            ].map((month) => (
                              <SelectItem key={month.value} value={month.value}>
                                {month.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label className="text-xs text-gray-600">Day</Label>
                        <Select
                          value={formData.dateOfBirth ? new Date(formData.dateOfBirth).getDate().toString() : ''}
                          onValueChange={(day) => handleDateComponentChange('day', day)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Day" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[200px]">
                            {Array.from({ length: 31 }, (_, i) => {
                              const day = i + 1;
                              return (
                                <SelectItem key={day} value={day.toString()}>
                                  {day}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {age > 0 && (
                      <p className="text-xs text-green-600 font-medium">Age: {age} years</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="age">Age (Years) *</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                    className="border-gray-300 bg-gray-50"
                    placeholder="Calculated from DOB"
                    readOnly
                    data-testid="input-age"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    🔄 Auto-calculated from Date of Birth
                  </p>
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
                  <Label htmlFor="contactPhone">Contact Number *</Label>
                  <Input
                    id="contactPhone"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
                <div>
                  <Label htmlFor="emergencyContactName">Emergency Contact Name</Label>
                  <Input
                    id="emergencyContactName"
                    value={formData.emergencyContactName}
                    onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactName: e.target.value }))}
                    placeholder="Emergency contact name (optional)"
                    className="border-gray-300 bg-white"
                  />
                </div>

                <div>
                  <Label htmlFor="emergencyContactPhone">Emergency Contact Phone</Label>
                  <Input
                    id="emergencyContactPhone"
                    value={formData.emergencyContactPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactPhone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                    placeholder="10-digit phone number (optional)"
                    className="border-gray-300 bg-white"
                    maxLength={10}
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

              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white shadow-lg"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Registering...' : 'Register Patient'}
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
                Master Patient Register (Latest 5 Records)
              </CardTitle>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">
                  Showing: {filteredPatients.length} of {patients.length} patients
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
                          <div>{patient.contactPhone}</div>
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
                              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              title="Edit Patient Details"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => generateConsultationCard(patient)}
                              disabled={isDownloading === patient.id}
                              className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                              title="Download Consultation Card"
                            >
                              {isDownloading === patient.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-600 border-t-transparent"></div>
                              ) : (
                                <Download className="h-4 w-4" />
                              )}
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
                  {searchTerm ? 'No patients found matching your search' : 'No recent patient registrations'}
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  {searchTerm ? 'Try a different search term' : 'Latest 5 registrations will appear here'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Consultation Card Download Modal */}
      {showConsultationModal && registeredPatientInfo && (
        <ConsultationCardModal
          isOpen={showConsultationModal}
          onClose={() => {
            setShowConsultationModal(false);
            setRegisteredPatientInfo(null);
            // Show success toast after modal is closed
            toast({
              title: 'Success',
              description: `Patient registered successfully with MRU: ${registeredPatientInfo.mruNumber}`,
            });
          }}
          patientInfo={registeredPatientInfo}
        />
      )}
    </div>
  );
}