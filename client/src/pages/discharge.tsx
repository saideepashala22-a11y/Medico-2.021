import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Link } from 'wouter';
import { ArrowLeft, FileText, Search, Download, Loader2 } from 'lucide-react';
import { generateDischargeSummaryPDF } from '@/components/pdf-generator';

export default function Discharge() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [summaryData, setSummaryData] = useState({
    primaryDiagnosis: '',
    secondaryDiagnosis: '',
    treatmentSummary: '',
    medications: '',
    followupInstructions: '',
    dischargeDate: '',
    dischargeTime: '',
    attendingPhysician: user?.name || '',
    admissionDate: '',
  });

  const { data: searchResults } = useQuery({
    queryKey: ['/api/patients/search', patientSearch],
    queryFn: async () => {
      if (!patientSearch.trim()) return [];
      const response = await fetch(`/api/patients/search?q=${encodeURIComponent(patientSearch)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return response.json();
    },
    enabled: patientSearch.length > 2,
  });

  const { data: recentDischarges, isLoading: dischargesLoading } = useQuery({
    queryKey: ['/api/discharge-summaries/recent'],
  });

  const createDischargeMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/discharge-summaries', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/discharge-summaries/recent'] });
      toast({
        title: 'Success',
        description: 'Discharge summary saved successfully',
      });
      // Reset form
      setSummaryData({
        primaryDiagnosis: '',
        secondaryDiagnosis: '',
        treatmentSummary: '',
        medications: '',
        followupInstructions: '',
        dischargeDate: '',
        dischargeTime: '',
        attendingPhysician: user?.name || '',
        admissionDate: '',
      });
      setSelectedPatient(null);
      setPatientSearch('');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save discharge summary',
        variant: 'destructive',
      });
    },
  });

  const handleSaveSummary = () => {
    if (!selectedPatient) {
      toast({
        title: 'Error',
        description: 'Please select a patient',
        variant: 'destructive',
      });
      return;
    }

    if (!summaryData.primaryDiagnosis || !summaryData.treatmentSummary || !summaryData.dischargeDate) {
      toast({
        title: 'Error',
        description: 'Please fill in required fields',
        variant: 'destructive',
      });
      return;
    }

    const dischargeDateTime = summaryData.dischargeTime 
      ? new Date(`${summaryData.dischargeDate}T${summaryData.dischargeTime}`)
      : new Date(summaryData.dischargeDate);

    const admissionDateTime = summaryData.admissionDate 
      ? new Date(summaryData.admissionDate)
      : null;

    createDischargeMutation.mutate({
      patientId: selectedPatient.id,
      primaryDiagnosis: summaryData.primaryDiagnosis,
      secondaryDiagnosis: summaryData.secondaryDiagnosis || null,
      treatmentSummary: summaryData.treatmentSummary,
      medications: summaryData.medications || null,
      followupInstructions: summaryData.followupInstructions || null,
      dischargeDate: dischargeDateTime.toISOString(),
      attendingPhysician: summaryData.attendingPhysician,
      admissionDate: admissionDateTime?.toISOString() || null,
    });
  };

  const handlePreviewSummary = () => {
    if (!selectedPatient) {
      toast({
        title: 'Error',
        description: 'Please select a patient first',
        variant: 'destructive',
      });
      return;
    }
    // For now, just show a toast. In a real app, this could open a modal or separate view
    toast({
      title: 'Preview',
      description: 'Preview functionality would show the formatted summary',
    });
  };

  const handleGeneratePDF = () => {
    if (!selectedPatient || !summaryData.primaryDiagnosis) {
      toast({
        title: 'Error',
        description: 'Please complete the discharge summary first',
        variant: 'destructive',
      });
      return;
    }

    const summaryForPDF = {
      ...summaryData,
      patientName: selectedPatient.name,
      patientId: selectedPatient.patientId,
      ageGender: `${selectedPatient.age}/${selectedPatient.gender}`,
      dischargeDate: new Date(summaryData.dischargeDate).toISOString(),
      admissionDate: summaryData.admissionDate ? new Date(summaryData.admissionDate).toISOString() : null,
      generatedDate: new Date().toISOString(),
    };

    generateDischargeSummaryPDF(selectedPatient, summaryForPDF as any);
  };

  const getLengthOfStay = () => {
    if (!summaryData.admissionDate || !summaryData.dischargeDate) return 'N/A';
    const admission = new Date(summaryData.admissionDate);
    const discharge = new Date(summaryData.dischargeDate);
    const diffTime = Math.abs(discharge.getTime() - admission.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
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
              <FileText className="text-medical-indigo text-xl mr-3" />
              <span className="text-xl font-bold text-gray-900">Discharge Summary</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Patient Selection & Summary Form */}
          <Card>
            <CardHeader>
              <CardTitle>Discharge Summary Form</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Patient Search */}
              <div>
                <Label>Select Patient</Label>
                <div className="relative">
                  <Input
                    placeholder="Search patient for discharge..."
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    className="pl-10"
                  />
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
                
                {searchResults && searchResults.length > 0 && (
                  <div className="mt-2 border rounded-lg bg-white shadow-sm">
                    {searchResults.map((patient: any) => (
                      <div
                        key={patient.id}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                        onClick={() => {
                          setSelectedPatient(patient);
                          setPatientSearch('');
                        }}
                      >
                        <div className="font-medium">{patient.name}</div>
                        <div className="text-sm text-gray-500">{patient.patientId} • Age: {patient.age}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Patient Info */}
              {selectedPatient && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900">Patient Information</h3>
                  <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <p><strong>Name:</strong> {selectedPatient.name}</p>
                      <p><strong>Age:</strong> {selectedPatient.age}</p>
                      <p><strong>Gender:</strong> {selectedPatient.gender}</p>
                    </div>
                    <div>
                      <p><strong>ID:</strong> {selectedPatient.patientId}</p>
                      <p><strong>Contact:</strong> {selectedPatient.contact || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Discharge Form */}
              <div className="space-y-6">
                <div>
                  <Label>Primary Diagnosis *</Label>
                  <Input
                    value={summaryData.primaryDiagnosis}
                    onChange={(e) => setSummaryData({ ...summaryData, primaryDiagnosis: e.target.value })}
                    placeholder="Enter primary diagnosis"
                    required
                  />
                </div>

                <div>
                  <Label>Secondary Diagnosis</Label>
                  <Textarea
                    rows={2}
                    value={summaryData.secondaryDiagnosis}
                    onChange={(e) => setSummaryData({ ...summaryData, secondaryDiagnosis: e.target.value })}
                    placeholder="Any secondary conditions..."
                  />
                </div>

                <div>
                  <Label>Treatment Summary *</Label>
                  <Textarea
                    rows={4}
                    value={summaryData.treatmentSummary}
                    onChange={(e) => setSummaryData({ ...summaryData, treatmentSummary: e.target.value })}
                    placeholder="Describe treatment provided during admission..."
                    required
                  />
                </div>

                <div>
                  <Label>Medications at Discharge</Label>
                  <Textarea
                    rows={3}
                    value={summaryData.medications}
                    onChange={(e) => setSummaryData({ ...summaryData, medications: e.target.value })}
                    placeholder="List medications to continue at home..."
                  />
                </div>

                <div>
                  <Label>Follow-up Instructions</Label>
                  <Textarea
                    rows={3}
                    value={summaryData.followupInstructions}
                    onChange={(e) => setSummaryData({ ...summaryData, followupInstructions: e.target.value })}
                    placeholder="Follow-up appointments and care instructions..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Admission Date</Label>
                    <Input
                      type="date"
                      value={summaryData.admissionDate}
                      onChange={(e) => setSummaryData({ ...summaryData, admissionDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Discharge Date *</Label>
                    <Input
                      type="date"
                      value={summaryData.dischargeDate}
                      onChange={(e) => setSummaryData({ ...summaryData, dischargeDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Discharge Time</Label>
                    <Input
                      type="time"
                      value={summaryData.dischargeTime}
                      onChange={(e) => setSummaryData({ ...summaryData, dischargeTime: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Attending Physician</Label>
                    <Input
                      value={summaryData.attendingPhysician}
                      onChange={(e) => setSummaryData({ ...summaryData, attendingPhysician: e.target.value })}
                      placeholder="Doctor name"
                    />
                  </div>
                </div>

                <div className="flex space-x-4">
                  <Button
                    onClick={handleSaveSummary}
                    className="flex-1 bg-medical-indigo hover:bg-indigo-700"
                    disabled={createDischargeMutation.isPending || !selectedPatient}
                  >
                    {createDischargeMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Summary'
                    )}
                  </Button>
                  <Button
                    onClick={handlePreviewSummary}
                    className="flex-1 bg-medical-blue hover:bg-blue-700"
                    disabled={!selectedPatient}
                  >
                    Preview Summary
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Preview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Summary Preview</CardTitle>
                <Button
                  onClick={handleGeneratePDF}
                  className="bg-medical-indigo hover:bg-indigo-700"
                  disabled={!selectedPatient || !summaryData.primaryDiagnosis}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Generate PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Summary Document Preview */}
              <div className="border rounded-lg p-6 bg-gray-50 min-h-96">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-bold text-gray-900">Hospital Management System</h3>
                  <h4 className="text-md font-semibold text-gray-700">DISCHARGE SUMMARY</h4>
                </div>

                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p><strong>Patient Name:</strong> {selectedPatient?.name || 'Not selected'}</p>
                      <p><strong>Patient ID:</strong> {selectedPatient?.patientId || 'N/A'}</p>
                      <p><strong>Age/Gender:</strong> {selectedPatient ? `${selectedPatient.age}/${selectedPatient.gender}` : 'N/A'}</p>
                    </div>
                    <div>
                      <p><strong>Admission Date:</strong> {summaryData.admissionDate ? new Date(summaryData.admissionDate).toLocaleDateString() : 'N/A'}</p>
                      <p><strong>Discharge Date:</strong> {summaryData.dischargeDate ? new Date(summaryData.dischargeDate).toLocaleDateString() : 'N/A'}</p>
                      <p><strong>Length of Stay:</strong> {getLengthOfStay()}</p>
                    </div>
                  </div>

                  <hr className="my-4" />

                  <div>
                    <p><strong>Primary Diagnosis:</strong></p>
                    <p className="mt-1 text-gray-700">{summaryData.primaryDiagnosis || 'Not specified'}</p>
                  </div>

                  {summaryData.secondaryDiagnosis && (
                    <div>
                      <p><strong>Secondary Diagnosis:</strong></p>
                      <p className="mt-1 text-gray-700">{summaryData.secondaryDiagnosis}</p>
                    </div>
                  )}

                  <div>
                    <p><strong>Treatment Summary:</strong></p>
                    <p className="mt-1 text-gray-700">{summaryData.treatmentSummary || 'Not specified'}</p>
                  </div>

                  {summaryData.medications && (
                    <div>
                      <p><strong>Medications at Discharge:</strong></p>
                      <p className="mt-1 text-gray-700 whitespace-pre-line">{summaryData.medications}</p>
                    </div>
                  )}

                  {summaryData.followupInstructions && (
                    <div>
                      <p><strong>Follow-up Instructions:</strong></p>
                      <p className="mt-1 text-gray-700">{summaryData.followupInstructions}</p>
                    </div>
                  )}

                  <hr className="my-4" />

                  <div className="flex justify-between items-end">
                    <div>
                      <p><strong>Attending Physician:</strong></p>
                      <p className="mt-4">{summaryData.attendingPhysician || 'Not specified'}</p>
                      <p className="text-xs text-gray-500">Digital Signature</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Generated on:</p>
                      <p className="text-xs">{new Date().toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Discharges */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Recent Discharges</CardTitle>
            </CardHeader>
            <CardContent>
              {dischargesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Admission</TableHead>
                      <TableHead>Discharge</TableHead>
                      <TableHead>Diagnosis</TableHead>
                      <TableHead>Physician</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(recentDischarges as any[])?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          No discharge summaries found
                        </TableCell>
                      </TableRow>
                    ) : (
                      (recentDischarges as any[])?.map((discharge: any) => (
                        <TableRow key={discharge.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{discharge.patient.name}</div>
                              <div className="text-sm text-gray-500">{discharge.patient.patientId}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {discharge.admissionDate ? new Date(discharge.admissionDate).toLocaleDateString() : 'N/A'}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {new Date(discharge.dischargeDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-sm">{discharge.primaryDiagnosis}</TableCell>
                          <TableCell className="text-sm text-gray-500">{discharge.attendingPhysician}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="sm">
                                View
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
