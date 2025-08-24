import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth-simple';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Link } from 'wouter';
import { 
  ArrowLeft, 
  Plus, 
  Calendar, 
  User, 
  FileText, 
  Stethoscope,
  Pill,
  Clock,
  Search,
  Edit,
  Trash2,
  Download,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';

interface Patient {
  id: string;
  patientId: string;
  name: string;
  age: number;
  gender: string;
  contact?: string;
  bloodGroup?: string;
  address?: string;
}

interface Consultation {
  id: string;
  patientId: string;
  doctorName: string;
  consultationDate: string;
  chiefComplaint: string;
  presentIllnessHistory?: string;
  pastMedicalHistory?: string;
  examination?: string;
  diagnosis: string;
  treatment?: string;
  prescription?: Array<{
    medicine: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }>;
  followUpDate?: string;
  notes?: string;
  consultationType: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function ConsultationPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isAddingConsultation, setIsAddingConsultation] = useState(false);
  const [editingConsultation, setEditingConsultation] = useState<Consultation | null>(null);
  const [viewingConsultation, setViewingConsultation] = useState<Consultation | null>(null);

  // Search for patients
  const { data: searchResults, isLoading: searchLoading } = useQuery<Patient[]>({
    queryKey: ['/api/patients/search', searchTerm],
    enabled: searchTerm.length > 2,
  });

  // Get consultations for selected patient
  const { data: consultations } = useQuery<Consultation[]>({
    queryKey: ['/api/consultations', selectedPatient?.id],
    enabled: !!selectedPatient,
  });

  // Create consultation
  const createConsultationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/consultations', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/consultations'] });
      setIsAddingConsultation(false);
      toast({
        title: 'Success',
        description: 'Consultation created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create consultation',
        variant: 'destructive',
      });
    },
  });

  // Update consultation
  const updateConsultationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest('PUT', `/api/consultations/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/consultations'] });
      setEditingConsultation(null);
      toast({
        title: 'Success',
        description: 'Consultation updated successfully',
      });
    },
  });

  // Delete consultation
  const deleteConsultationMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/consultations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/consultations'] });
      toast({
        title: 'Success',
        description: 'Consultation deleted successfully',
      });
    },
  });

  const generateConsultationPDF = (consultation: Consultation, patient: Patient) => {
    const doc = new jsPDF();
    
    // Hospital Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('CityMed Hospital', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Excellence in Healthcare', 105, 28, { align: 'center' });
    
    // Draw header line
    doc.setLineWidth(0.5);
    doc.line(20, 35, 190, 35);
    
    // Consultation Report Title
    doc.setFontSize(16);
    doc.text('Consultation Report', 105, 45, { align: 'center' });
    
    // Patient Information Section
    let yPos = 60;
    doc.setFontSize(14);
    doc.text('Patient Information', 20, yPos);
    
    yPos += 10;
    doc.setFontSize(12);
    doc.text(`Name: ${patient.name}`, 20, yPos);
    doc.text(`Patient ID: ${patient.patientId}`, 120, yPos);
    
    yPos += 8;
    doc.text(`Age: ${patient.age} years`, 20, yPos);
    doc.text(`Gender: ${patient.gender}`, 120, yPos);
    
    if (patient.bloodGroup) {
      yPos += 8;
      doc.text(`Blood Group: ${patient.bloodGroup}`, 20, yPos);
    }
    
    if (patient.contact) {
      doc.text(`Contact: ${patient.contact}`, 120, yPos);
    }
    
    // Consultation Details Section
    yPos += 20;
    doc.setFontSize(14);
    doc.text('Consultation Details', 20, yPos);
    
    yPos += 10;
    doc.setFontSize(12);
    doc.text(`Doctor: ${consultation.doctorName}`, 20, yPos);
    doc.text(`Date: ${format(new Date(consultation.consultationDate), 'MMM d, yyyy')}`, 120, yPos);
    
    yPos += 8;
    doc.text(`Type: ${consultation.consultationType}`, 20, yPos);
    doc.text(`Status: ${consultation.status}`, 120, yPos);
    
    // Chief Complaint
    yPos += 15;
    doc.text('Chief Complaint:', 20, yPos);
    yPos += 8;
    const complaint = doc.splitTextToSize(consultation.chiefComplaint, 170);
    doc.text(complaint, 20, yPos);
    yPos += complaint.length * 6;
    
    // Diagnosis
    yPos += 10;
    doc.text('Diagnosis:', 20, yPos);
    yPos += 8;
    const diagnosis = doc.splitTextToSize(consultation.diagnosis, 170);
    doc.text(diagnosis, 20, yPos);
    yPos += diagnosis.length * 6;
    
    // Examination (if provided)
    if (consultation.examination) {
      yPos += 10;
      doc.text('Examination:', 20, yPos);
      yPos += 8;
      const examination = doc.splitTextToSize(consultation.examination, 170);
      doc.text(examination, 20, yPos);
      yPos += examination.length * 6;
    }
    
    // Treatment (if provided)
    if (consultation.treatment) {
      yPos += 10;
      doc.text('Treatment:', 20, yPos);
      yPos += 8;
      const treatment = doc.splitTextToSize(consultation.treatment, 170);
      doc.text(treatment, 20, yPos);
      yPos += treatment.length * 6;
    }
    
    // Prescription (if provided)
    if (consultation.prescription && consultation.prescription.length > 0) {
      yPos += 10;
      doc.text('Prescription:', 20, yPos);
      yPos += 8;
      
      consultation.prescription.forEach((med, index) => {
        doc.text(`${index + 1}. ${med.medicine}`, 25, yPos);
        yPos += 6;
        doc.text(`   Dosage: ${med.dosage} | Frequency: ${med.frequency} | Duration: ${med.duration}`, 25, yPos);
        if (med.instructions) {
          yPos += 6;
          doc.text(`   Instructions: ${med.instructions}`, 25, yPos);
        }
        yPos += 8;
      });
    }
    
    // Notes (if provided)
    if (consultation.notes) {
      yPos += 10;
      doc.text('Additional Notes:', 20, yPos);
      yPos += 8;
      const notes = doc.splitTextToSize(consultation.notes, 170);
      doc.text(notes, 20, yPos);
      yPos += notes.length * 6;
    }
    
    // Follow-up (if provided)
    if (consultation.followUpDate) {
      yPos += 10;
      doc.text(`Follow-up Date: ${format(new Date(consultation.followUpDate), 'MMM d, yyyy')}`, 20, yPos);
    }
    
    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setLineWidth(0.5);
    doc.line(20, pageHeight - 30, 190, pageHeight - 30);
    
    doc.setFontSize(10);
    doc.text('CityMed Hospital', 105, pageHeight - 22, { align: 'center' });
    doc.text('123 Medical Street, Healthcare City, HC 12345', 105, pageHeight - 16, { align: 'center' });
    doc.text('Phone: (555) 123-4567 | Email: info@citymed.hospital', 105, pageHeight - 10, { align: 'center' });
    
    // Save the PDF
    doc.save(`consultation_${patient.name}_${format(new Date(consultation.consultationDate), 'yyyy-MM-dd')}.pdf`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'emergency': return 'bg-red-100 text-red-800';
      case 'follow-up': return 'bg-blue-100 text-blue-800';
      case 'general': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
              <Stethoscope className="text-white text-xl mr-3" />
              <span className="text-xl font-bold text-white">Consultations</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-medical-primary-light">{user?.name}</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-medical-text">Patient Consultations</h1>
          <p className="text-medical-text-muted mt-2">Manage doctor consultations, patient notes, and generate reports</p>
        </div>

        {!selectedPatient ? (
          <Card className="bg-white shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="h-5 w-5 mr-2" />
                Search Patients
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="search">Patient Name or ID</Label>
                <Input
                  id="search"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Enter patient name or ID (min 3 characters)"
                  className="mt-1"
                />
              </div>

              {searchLoading && (
                <div className="text-center py-4 text-medical-text-muted">
                  Searching patients...
                </div>
              )}

              {searchResults && Array.isArray(searchResults) && searchResults.length > 0 && (
                <div className="space-y-2">
                  <Label>Search Results</Label>
                  {searchResults.map((patient: Patient) => (
                    <div
                      key={patient.id}
                      className="p-4 border rounded-lg hover:bg-medical-primary-light cursor-pointer transition-colors"
                      onClick={() => setSelectedPatient(patient)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium">{patient.name}</h3>
                          <p className="text-sm text-medical-text-muted">
                            ID: {patient.patientId} • Age: {patient.age} • Gender: {patient.gender}
                          </p>
                          {patient.contact && (
                            <p className="text-sm text-medical-text-muted">Contact: {patient.contact}</p>
                          )}
                        </div>
                        <Button size="sm" className="bg-medical-primary hover:bg-medical-primary-dark text-white">
                          Select
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {searchTerm.length > 2 && searchResults && Array.isArray(searchResults) && searchResults.length === 0 && (
                <div className="text-center py-4 text-medical-text-muted">
                  No patients found matching "{searchTerm}"
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Patient Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-medical-text">{selectedPatient.name}</h2>
                <p className="text-medical-text-muted">
                  Patient ID: {selectedPatient.patientId} • Age: {selectedPatient.age} • Gender: {selectedPatient.gender}
                </p>
              </div>
              <div className="flex space-x-2">
                <Dialog open={isAddingConsultation} onOpenChange={setIsAddingConsultation}>
                  <DialogTrigger asChild>
                    <Button className="bg-medical-primary hover:bg-medical-primary-dark text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      New Consultation
                    </Button>
                  </DialogTrigger>
                  <ConsultationForm 
                    patient={selectedPatient}
                    onSubmit={(data) => createConsultationMutation.mutate(data)}
                    isLoading={createConsultationMutation.isPending}
                  />
                </Dialog>
                <Button 
                  onClick={() => setSelectedPatient(null)}
                  variant="outline"
                >
                  Change Patient
                </Button>
              </div>
            </div>

            {/* Consultations List */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Consultation History</h3>
              
              {consultations && consultations.length > 0 ? (
                consultations.map((consultation) => (
                  <Card key={consultation.id} className="bg-white shadow rounded-lg">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className="p-3 rounded-full bg-medical-primary-light text-medical-primary">
                            <Stethoscope className="h-6 w-6" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="text-lg font-medium">{consultation.doctorName}</h4>
                              <Badge className={getStatusColor(consultation.status)}>
                                {consultation.status}
                              </Badge>
                              <Badge className={getTypeColor(consultation.consultationType)}>
                                {consultation.consultationType}
                              </Badge>
                            </div>
                            
                            <p className="text-medical-text-muted mb-2">
                              <Calendar className="h-4 w-4 inline mr-1" />
                              {format(new Date(consultation.consultationDate), 'MMM d, yyyy h:mm a')}
                            </p>
                            
                            <div className="mb-3">
                              <span className="font-medium">Chief Complaint:</span>
                              <p className="text-medical-text-muted">{consultation.chiefComplaint}</p>
                            </div>
                            
                            <div className="mb-3">
                              <span className="font-medium">Diagnosis:</span>
                              <p className="text-medical-text-muted">{consultation.diagnosis}</p>
                            </div>
                            
                            {consultation.prescription && consultation.prescription.length > 0 && (
                              <div className="mb-3">
                                <span className="font-medium flex items-center">
                                  <Pill className="h-4 w-4 mr-1" />
                                  Prescription ({consultation.prescription.length} medicines)
                                </span>
                              </div>
                            )}
                            
                            {consultation.followUpDate && (
                              <p className="text-sm text-medical-text-muted">
                                <Clock className="h-4 w-4 inline mr-1" />
                                Follow-up: {format(new Date(consultation.followUpDate), 'MMM d, yyyy')}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setViewingConsultation(consultation)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => generateConsultationPDF(consultation, selectedPatient)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingConsultation(consultation)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this consultation?')) {
                                deleteConsultationMutation.mutate(consultation.id);
                              }
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="bg-white shadow rounded-lg">
                  <CardContent className="p-12 text-center">
                    <Stethoscope className="h-12 w-12 mx-auto text-medical-text-muted mb-4" />
                    <h3 className="text-lg font-medium text-medical-text mb-2">No Consultations</h3>
                    <p className="text-medical-text-muted">
                      This patient has no consultation records yet. Start by creating the first consultation.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Edit Consultation Dialog */}
            {editingConsultation && (
              <Dialog open={true} onOpenChange={() => setEditingConsultation(null)}>
                <ConsultationForm
                  patient={selectedPatient}
                  consultation={editingConsultation}
                  onSubmit={(data) => updateConsultationMutation.mutate({ id: editingConsultation.id, data })}
                  isLoading={updateConsultationMutation.isPending}
                  isEditing={true}
                />
              </Dialog>
            )}

            {/* View Consultation Dialog */}
            {viewingConsultation && (
              <Dialog open={true} onOpenChange={() => setViewingConsultation(null)}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Consultation Details</DialogTitle>
                  </DialogHeader>
                  <ConsultationDetails 
                    consultation={viewingConsultation} 
                    patient={selectedPatient}
                    onGeneratePDF={() => generateConsultationPDF(viewingConsultation, selectedPatient)}
                  />
                </DialogContent>
              </Dialog>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Consultation Form Component
interface ConsultationFormProps {
  patient: Patient;
  consultation?: Consultation;
  onSubmit: (data: any) => void;
  isLoading: boolean;
  isEditing?: boolean;
}

function ConsultationForm({ patient, consultation, onSubmit, isLoading, isEditing }: ConsultationFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    patientId: patient.id,
    doctorName: consultation?.doctorName || user?.name || '',
    consultationDate: consultation?.consultationDate ? new Date(consultation.consultationDate).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
    chiefComplaint: consultation?.chiefComplaint || '',
    presentIllnessHistory: consultation?.presentIllnessHistory || '',
    pastMedicalHistory: consultation?.pastMedicalHistory || '',
    examination: consultation?.examination || '',
    diagnosis: consultation?.diagnosis || '',
    treatment: consultation?.treatment || '',
    followUpDate: consultation?.followUpDate ? new Date(consultation.followUpDate).toISOString().slice(0, 10) : '',
    notes: consultation?.notes || '',
    consultationType: consultation?.consultationType || 'general',
    status: consultation?.status || 'completed',
  });

  const [prescriptions, setPrescriptions] = useState<Array<{
    medicine: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }>>(consultation?.prescription?.map(p => ({ ...p, instructions: p.instructions || '' })) || []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      prescription: prescriptions.filter(p => p.medicine.trim() !== ''),
    });
  };

  const addPrescription = () => {
    setPrescriptions([...prescriptions, { medicine: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
  };

  const removePrescription = (index: number) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== index));
  };

  return (
    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {isEditing ? 'Edit Consultation' : 'New Consultation'}
        </DialogTitle>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="doctorName">Doctor Name *</Label>
            <Input
              id="doctorName"
              type="text"
              value={formData.doctorName}
              onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="consultationDate">Consultation Date & Time *</Label>
            <Input
              id="consultationDate"
              type="datetime-local"
              value={formData.consultationDate}
              onChange={(e) => setFormData({ ...formData, consultationDate: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="consultationType">Consultation Type</Label>
            <Select value={formData.consultationType} onValueChange={(value) => setFormData({ ...formData, consultationType: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
                <SelectItem value="follow-up">Follow-up</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="chiefComplaint">Chief Complaint *</Label>
          <Textarea
            id="chiefComplaint"
            value={formData.chiefComplaint}
            onChange={(e) => setFormData({ ...formData, chiefComplaint: e.target.value })}
            placeholder="Patient's main concern or reason for visit"
            rows={3}
            required
          />
        </div>

        <div>
          <Label htmlFor="presentIllnessHistory">Present Illness History</Label>
          <Textarea
            id="presentIllnessHistory"
            value={formData.presentIllnessHistory}
            onChange={(e) => setFormData({ ...formData, presentIllnessHistory: e.target.value })}
            placeholder="History of current illness"
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="pastMedicalHistory">Past Medical History</Label>
          <Textarea
            id="pastMedicalHistory"
            value={formData.pastMedicalHistory}
            onChange={(e) => setFormData({ ...formData, pastMedicalHistory: e.target.value })}
            placeholder="Previous medical conditions, surgeries, etc."
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="examination">Examination Findings</Label>
          <Textarea
            id="examination"
            value={formData.examination}
            onChange={(e) => setFormData({ ...formData, examination: e.target.value })}
            placeholder="Physical examination findings"
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="diagnosis">Diagnosis *</Label>
          <Textarea
            id="diagnosis"
            value={formData.diagnosis}
            onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
            placeholder="Clinical diagnosis"
            rows={2}
            required
          />
        </div>

        <div>
          <Label htmlFor="treatment">Treatment Plan</Label>
          <Textarea
            id="treatment"
            value={formData.treatment}
            onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
            placeholder="Treatment recommendations"
            rows={3}
          />
        </div>

        {/* Prescription Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <Label>Prescription</Label>
            <Button type="button" onClick={addPrescription} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Medicine
            </Button>
          </div>
          
          {prescriptions.map((prescription, index) => (
            <div key={index} className="border rounded-lg p-4 mb-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Medicine {index + 1}</span>
                <Button type="button" onClick={() => removePrescription(index)} variant="outline" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Medicine Name</Label>
                  <Input
                    value={prescription.medicine}
                    onChange={(e) => {
                      const updated = [...prescriptions];
                      updated[index].medicine = e.target.value;
                      setPrescriptions(updated);
                    }}
                    placeholder="e.g., Paracetamol"
                  />
                </div>
                
                <div>
                  <Label>Dosage</Label>
                  <Input
                    value={prescription.dosage}
                    onChange={(e) => {
                      const updated = [...prescriptions];
                      updated[index].dosage = e.target.value;
                      setPrescriptions(updated);
                    }}
                    placeholder="e.g., 500mg"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Frequency</Label>
                  <Input
                    value={prescription.frequency}
                    onChange={(e) => {
                      const updated = [...prescriptions];
                      updated[index].frequency = e.target.value;
                      setPrescriptions(updated);
                    }}
                    placeholder="e.g., 3 times daily"
                  />
                </div>
                
                <div>
                  <Label>Duration</Label>
                  <Input
                    value={prescription.duration}
                    onChange={(e) => {
                      const updated = [...prescriptions];
                      updated[index].duration = e.target.value;
                      setPrescriptions(updated);
                    }}
                    placeholder="e.g., 7 days"
                  />
                </div>
              </div>
              
              <div>
                <Label>Instructions</Label>
                <Input
                  value={prescription.instructions}
                  onChange={(e) => {
                    const updated = [...prescriptions];
                    updated[index].instructions = e.target.value;
                    setPrescriptions(updated);
                  }}
                  placeholder="e.g., After meals"
                />
              </div>
            </div>
          ))}
        </div>

        <div>
          <Label htmlFor="followUpDate">Follow-up Date</Label>
          <Input
            id="followUpDate"
            type="date"
            value={formData.followUpDate}
            onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="notes">Additional Notes</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Any additional observations or notes"
            rows={3}
          />
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="submit" disabled={isLoading} className="bg-medical-primary hover:bg-medical-primary-dark text-white">
            {isLoading ? 'Saving...' : (isEditing ? 'Update Consultation' : 'Save Consultation')}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}

// Consultation Details Component
interface ConsultationDetailsProps {
  consultation: Consultation;
  patient: Patient;
  onGeneratePDF: () => void;
}

function ConsultationDetails({ consultation, patient, onGeneratePDF }: ConsultationDetailsProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Consultation Summary</h3>
        <Button onClick={onGeneratePDF} className="bg-medical-primary hover:bg-medical-primary-dark text-white">
          <Download className="h-4 w-4 mr-2" />
          Generate PDF
        </Button>
      </div>
      
      {/* Patient Info */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h4 className="font-medium text-medical-text mb-3">Patient Information</h4>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Name:</span> {patient.name}</p>
            <p><span className="font-medium">ID:</span> {patient.patientId}</p>
            <p><span className="font-medium">Age:</span> {patient.age}</p>
            <p><span className="font-medium">Gender:</span> {patient.gender}</p>
            {patient.bloodGroup && <p><span className="font-medium">Blood Group:</span> {patient.bloodGroup}</p>}
          </div>
        </div>
        
        <div>
          <h4 className="font-medium text-medical-text mb-3">Consultation Info</h4>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Doctor:</span> {consultation.doctorName}</p>
            <p><span className="font-medium">Date:</span> {format(new Date(consultation.consultationDate), 'MMM d, yyyy h:mm a')}</p>
            <p><span className="font-medium">Type:</span> <Badge className={consultation.consultationType === 'emergency' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}>{consultation.consultationType}</Badge></p>
            <p><span className="font-medium">Status:</span> <Badge className={consultation.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>{consultation.status}</Badge></p>
          </div>
        </div>
      </div>
      
      {/* Medical Details */}
      <div className="space-y-4">
        <div>
          <h4 className="font-medium text-medical-text mb-2">Chief Complaint</h4>
          <p className="text-sm text-medical-text-muted bg-medical-background-dark p-3 rounded">{consultation.chiefComplaint}</p>
        </div>
        
        {consultation.presentIllnessHistory && (
          <div>
            <h4 className="font-medium text-medical-text mb-2">Present Illness History</h4>
            <p className="text-sm text-medical-text-muted bg-medical-background-dark p-3 rounded">{consultation.presentIllnessHistory}</p>
          </div>
        )}
        
        {consultation.examination && (
          <div>
            <h4 className="font-medium text-medical-text mb-2">Examination</h4>
            <p className="text-sm text-medical-text-muted bg-medical-background-dark p-3 rounded">{consultation.examination}</p>
          </div>
        )}
        
        <div>
          <h4 className="font-medium text-medical-text mb-2">Diagnosis</h4>
          <p className="text-sm text-medical-text-muted bg-medical-background-dark p-3 rounded">{consultation.diagnosis}</p>
        </div>
        
        {consultation.treatment && (
          <div>
            <h4 className="font-medium text-medical-text mb-2">Treatment</h4>
            <p className="text-sm text-medical-text-muted bg-medical-background-dark p-3 rounded">{consultation.treatment}</p>
          </div>
        )}
        
        {consultation.prescription && consultation.prescription.length > 0 && (
          <div>
            <h4 className="font-medium text-medical-text mb-2">Prescription</h4>
            <div className="space-y-2">
              {consultation.prescription.map((med, index) => (
                <div key={index} className="bg-medical-background-dark p-3 rounded">
                  <p className="font-medium">{index + 1}. {med.medicine}</p>
                  <p className="text-sm text-medical-text-muted">
                    Dosage: {med.dosage} | Frequency: {med.frequency} | Duration: {med.duration}
                  </p>
                  {med.instructions && (
                    <p className="text-sm text-medical-text-muted">Instructions: {med.instructions}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {consultation.notes && (
          <div>
            <h4 className="font-medium text-medical-text mb-2">Additional Notes</h4>
            <p className="text-sm text-medical-text-muted bg-medical-background-dark p-3 rounded">{consultation.notes}</p>
          </div>
        )}
        
        {consultation.followUpDate && (
          <div>
            <h4 className="font-medium text-medical-text mb-2">Follow-up</h4>
            <p className="text-sm text-medical-text-muted">
              <Clock className="h-4 w-4 inline mr-1" />
              {format(new Date(consultation.followUpDate), 'MMM d, yyyy')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}