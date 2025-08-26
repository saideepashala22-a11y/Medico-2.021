import { useState, memo } from 'react';
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
import { useDebounce } from '@/hooks/useDebounce';
import { apiRequest } from '@/lib/queryClient';
import { Link } from 'wouter';
import { 
  ArrowLeft, 
  Plus, 
  Calendar, 
  User, 
  FileText, 
  Heart, 
  Pill,
  AlertTriangle,
  Activity,
  Edit,
  Trash2,
  Search
} from 'lucide-react';
import { format } from 'date-fns';

interface Patient {
  id: string;
  patientId: string;
  name: string;
  age: number;
  gender: string;
  contact?: string;
}

interface MedicalHistoryEntry {
  id: string;
  patientId: string;
  entryType: string;
  title: string;
  description: string;
  category?: string;
  severity?: string;
  status: string;
  startDate?: string;
  endDate?: string;
  providerName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface PatientProfile {
  id: string;
  patientId: string;
  dateOfBirth?: string;
  bloodType?: string;
  height?: number;
  weight?: number;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  address?: string;
  insurance?: string;
  primaryPhysician?: string;
  knownAllergies?: Array<{ name: string; severity: string; notes?: string }>;
  currentMedications?: Array<{ name: string; dosage: string; frequency: string; notes?: string }>;
  chronicConditions?: Array<{ name: string; since: string; notes?: string }>;
}

export default function MedicalHistory() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [editingEntry, setEditingEntry] = useState<MedicalHistoryEntry | null>(null);

  // Debounce search term for better performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Search for patients with debounced term
  const { data: searchResults, isLoading: searchLoading } = useQuery<Patient[]>({
    queryKey: ['/api/patients/search', debouncedSearchTerm],
    enabled: debouncedSearchTerm.length > 2,
    staleTime: 30 * 1000, // Cache for 30 seconds
  });

  // Get patient profile
  const { data: patientProfile } = useQuery<PatientProfile>({
    queryKey: ['/api/patient-profile', selectedPatient?.id],
    enabled: !!selectedPatient,
  });

  // Get medical history
  const { data: medicalHistory } = useQuery<MedicalHistoryEntry[]>({
    queryKey: ['/api/medical-history', selectedPatient?.id],
    enabled: !!selectedPatient,
  });

  // Create medical history entry
  const createEntryMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/medical-history', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/medical-history'] });
      setIsAddingEntry(false);
      toast({
        title: 'Success',
        description: 'Medical history entry added successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add medical history entry',
        variant: 'destructive',
      });
    },
  });

  // Update medical history entry
  const updateEntryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest('PUT', `/api/medical-history/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/medical-history'] });
      setEditingEntry(null);
      toast({
        title: 'Success',
        description: 'Medical history entry updated successfully',
      });
    },
  });

  // Delete medical history entry
  const deleteEntryMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/medical-history/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/medical-history'] });
      toast({
        title: 'Success',
        description: 'Medical history entry deleted successfully',
      });
    },
  });

  const getEntryTypeIcon = (type: string) => {
    switch (type) {
      case 'diagnosis': return <Heart className="h-4 w-4" />;
      case 'allergy': return <AlertTriangle className="h-4 w-4" />;
      case 'medication': return <Pill className="h-4 w-4" />;
      case 'procedure': return <Activity className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'mild': return 'bg-green-100 text-green-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'severe': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-red-100 text-red-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
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
              <User className="text-white text-xl mr-3" />
              <span className="text-xl font-bold text-white">Medical History</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-medical-primary-light">{user?.name}</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-medical-text">Patient Medical History</h1>
          <p className="text-medical-text-muted mt-2">Search for a patient to view and manage their medical history</p>
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
              <Button 
                onClick={() => setSelectedPatient(null)}
                variant="outline"
              >
                Change Patient
              </Button>
            </div>

            <Tabs defaultValue="history" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="history">Medical History</TabsTrigger>
                <TabsTrigger value="profile">Patient Profile</TabsTrigger>
              </TabsList>

              <TabsContent value="history" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Medical History Entries</h3>
                  <Dialog open={isAddingEntry} onOpenChange={setIsAddingEntry}>
                    <DialogTrigger asChild>
                      <Button className="bg-medical-primary hover:bg-medical-primary-dark text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Entry
                      </Button>
                    </DialogTrigger>
                    <MedicalHistoryEntryForm 
                      patient={selectedPatient}
                      onSubmit={(data) => createEntryMutation.mutate(data)}
                      isLoading={createEntryMutation.isPending}
                    />
                  </Dialog>
                </div>

                <div className="space-y-4">
                  {medicalHistory && medicalHistory.length > 0 ? (
                    medicalHistory.map((entry) => (
                      <Card key={entry.id} className="bg-white shadow rounded-lg">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                              <div className="p-2 rounded-full bg-medical-primary-light text-medical-primary">
                                {getEntryTypeIcon(entry.entryType)}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <h4 className="text-lg font-medium">{entry.title}</h4>
                                  <Badge className={getStatusColor(entry.status)}>
                                    {entry.status}
                                  </Badge>
                                  {entry.severity && (
                                    <Badge className={getSeverityColor(entry.severity)}>
                                      {entry.severity}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-medical-text-muted mb-3">{entry.description}</p>
                                
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <span className="font-medium">Type:</span>
                                    <p className="capitalize">{entry.entryType}</p>
                                  </div>
                                  {entry.category && (
                                    <div>
                                      <span className="font-medium">Category:</span>
                                      <p className="capitalize">{entry.category}</p>
                                    </div>
                                  )}
                                  {entry.startDate && (
                                    <div>
                                      <span className="font-medium">Start Date:</span>
                                      <p>{format(new Date(entry.startDate), 'MMM d, yyyy')}</p>
                                    </div>
                                  )}
                                  {entry.providerName && (
                                    <div>
                                      <span className="font-medium">Provider:</span>
                                      <p>{entry.providerName}</p>
                                    </div>
                                  )}
                                </div>
                                
                                {entry.notes && (
                                  <div className="mt-3 p-3 bg-medical-background-dark rounded">
                                    <span className="font-medium text-sm">Notes:</span>
                                    <p className="text-sm mt-1">{entry.notes}</p>
                                  </div>
                                )}
                                
                                <div className="text-xs text-medical-text-muted mt-3">
                                  Added: {format(new Date(entry.createdAt), 'MMM d, yyyy h:mm a')}
                                  {entry.updatedAt !== entry.createdAt && (
                                    <span> • Updated: {format(new Date(entry.updatedAt), 'MMM d, yyyy h:mm a')}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingEntry(entry)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  if (confirm('Are you sure you want to delete this entry?')) {
                                    deleteEntryMutation.mutate(entry.id);
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
                        <FileText className="h-12 w-12 mx-auto text-medical-text-muted mb-4" />
                        <h3 className="text-lg font-medium text-medical-text mb-2">No Medical History</h3>
                        <p className="text-medical-text-muted">
                          This patient has no medical history entries yet. Add the first entry to get started.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="profile" className="space-y-6">
                <PatientProfileSection 
                  patient={selectedPatient}
                  profile={patientProfile}
                  onProfileUpdate={() => {
                    queryClient.invalidateQueries({ queryKey: ['/api/patient-profile'] });
                  }}
                />
              </TabsContent>
            </Tabs>

            {/* Edit Entry Dialog */}
            {editingEntry && (
              <Dialog open={true} onOpenChange={() => setEditingEntry(null)}>
                <MedicalHistoryEntryForm
                  patient={selectedPatient}
                  entry={editingEntry}
                  onSubmit={(data) => updateEntryMutation.mutate({ id: editingEntry.id, data })}
                  isLoading={updateEntryMutation.isPending}
                  isEditing={true}
                />
              </Dialog>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Medical History Entry Form Component
interface MedicalHistoryEntryFormProps {
  patient: Patient;
  entry?: MedicalHistoryEntry;
  onSubmit: (data: any) => void;
  isLoading: boolean;
  isEditing?: boolean;
}

function MedicalHistoryEntryForm({ patient, entry, onSubmit, isLoading, isEditing }: MedicalHistoryEntryFormProps) {
  const [formData, setFormData] = useState({
    patientId: patient.id,
    entryType: entry?.entryType || '',
    title: entry?.title || '',
    description: entry?.description || '',
    category: entry?.category || '',
    severity: entry?.severity || '',
    status: entry?.status || 'active',
    startDate: entry?.startDate || '',
    endDate: entry?.endDate || '',
    providerName: entry?.providerName || '',
    notes: entry?.notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {isEditing ? 'Edit Medical History Entry' : 'Add Medical History Entry'}
        </DialogTitle>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="entryType">Entry Type *</Label>
            <Select value={formData.entryType} onValueChange={(value) => setFormData({ ...formData, entryType: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="diagnosis">Diagnosis</SelectItem>
                <SelectItem value="allergy">Allergy</SelectItem>
                <SelectItem value="medication">Medication</SelectItem>
                <SelectItem value="procedure">Procedure</SelectItem>
                <SelectItem value="note">General Note</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="status">Status *</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Hypertension, Penicillin Allergy, Appendectomy"
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Detailed description of the condition, allergy, procedure, etc."
            rows={3}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="e.g., chronic, acute, surgical"
            />
          </div>
          
          <div>
            <Label htmlFor="severity">Severity</Label>
            <Select value={formData.severity} onValueChange={(value) => setFormData({ ...formData, severity: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mild">Mild</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="severe">Severe</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
          </div>
          
          <div>
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="providerName">Provider Name</Label>
          <Input
            id="providerName"
            type="text"
            value={formData.providerName}
            onChange={(e) => setFormData({ ...formData, providerName: e.target.value })}
            placeholder="Name of healthcare provider"
          />
        </div>

        <div>
          <Label htmlFor="notes">Additional Notes</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Any additional notes or comments"
            rows={2}
          />
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="submit" disabled={isLoading} className="bg-medical-primary hover:bg-medical-primary-dark text-white">
            {isLoading ? 'Saving...' : (isEditing ? 'Update Entry' : 'Add Entry')}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}

// Patient Profile Section Component
interface PatientProfileSectionProps {
  patient: Patient;
  profile?: PatientProfile;
  onProfileUpdate: () => void;
}

function PatientProfileSection({ patient, profile, onProfileUpdate }: PatientProfileSectionProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Patient Profile Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Basic Information */}
        <Card className="bg-white shadow rounded-lg">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-medical-text-muted">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-sm font-medium">Blood Type</Label>
              <p className="text-sm">{profile?.bloodType || 'Not specified'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Height</Label>
              <p className="text-sm">{profile?.height ? `${profile.height} cm` : 'Not specified'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Weight</Label>
              <p className="text-sm">{profile?.weight ? `${profile.weight} kg` : 'Not specified'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Primary Physician</Label>
              <p className="text-sm">{profile?.primaryPhysician || 'Not specified'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card className="bg-white shadow rounded-lg">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-medical-text-muted">Emergency Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-sm font-medium">Name</Label>
              <p className="text-sm">{profile?.emergencyContactName || 'Not specified'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Phone</Label>
              <p className="text-sm">{profile?.emergencyContactPhone || 'Not specified'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Relationship</Label>
              <p className="text-sm">{profile?.emergencyContactRelation || 'Not specified'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Insurance & Address */}
        <Card className="bg-white shadow rounded-lg">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-medical-text-muted">Other Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-sm font-medium">Insurance</Label>
              <p className="text-sm">{profile?.insurance || 'Not specified'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Address</Label>
              <p className="text-sm text-wrap">{profile?.address || 'Not specified'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Medications, Allergies, Chronic Conditions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-white shadow rounded-lg">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-medical-text-muted flex items-center">
              <Pill className="h-4 w-4 mr-2" />
              Current Medications
            </CardTitle>
          </CardHeader>
          <CardContent>
            {profile?.currentMedications && profile.currentMedications.length > 0 ? (
              <div className="space-y-2">
                {profile.currentMedications.map((med: any, index) => (
                  <div key={index} className="p-2 bg-medical-background-dark rounded">
                    <p className="font-medium text-sm">{med.name}</p>
                    <p className="text-xs text-medical-text-muted">{med.dosage} - {med.frequency}</p>
                    {med.notes && <p className="text-xs text-medical-text-muted">{med.notes}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-medical-text-muted">No current medications recorded</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white shadow rounded-lg">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-medical-text-muted flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Known Allergies
            </CardTitle>
          </CardHeader>
          <CardContent>
            {profile?.knownAllergies && profile.knownAllergies.length > 0 ? (
              <div className="space-y-2">
                {profile.knownAllergies.map((allergy: any, index) => (
                  <div key={index} className="p-2 bg-red-50 rounded border-l-4 border-red-400">
                    <p className="font-medium text-sm">{allergy.name}</p>
                    <p className="text-xs text-red-600">Severity: {allergy.severity}</p>
                    {allergy.notes && <p className="text-xs text-medical-text-muted">{allergy.notes}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-medical-text-muted">No known allergies recorded</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white shadow rounded-lg">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-medical-text-muted flex items-center">
              <Heart className="h-4 w-4 mr-2" />
              Chronic Conditions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {profile?.chronicConditions && profile.chronicConditions.length > 0 ? (
              <div className="space-y-2">
                {profile.chronicConditions.map((condition: any, index) => (
                  <div key={index} className="p-2 bg-medical-background-dark rounded">
                    <p className="font-medium text-sm">{condition.name}</p>
                    <p className="text-xs text-medical-text-muted">Since: {condition.since}</p>
                    {condition.notes && <p className="text-xs text-medical-text-muted">{condition.notes}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-medical-text-muted">No chronic conditions recorded</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}