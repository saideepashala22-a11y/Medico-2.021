import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { insertSurgicalCaseSheetSchema, type InsertSurgicalCaseSheet } from '@shared/schema';
import { format } from 'date-fns';
import { 
  ArrowLeft, 
  Plus, 
  Download, 
  Scissors, 
  Calendar, 
  User,
  FileText,
  Search
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import jsPDF from 'jspdf';

export default function SurgicalCaseSheets() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch recent surgical case sheets
  const { data: caseSheets, isLoading } = useQuery({
    queryKey: ['/api/surgical-case-sheets'],
  });

  // Fetch patients for the dropdown
  const { data: patients } = useQuery({
    queryKey: ['/api/patients'],
  });

  const form = useForm<InsertSurgicalCaseSheet>({
    resolver: zodResolver(insertSurgicalCaseSheetSchema),
    defaultValues: {
      patientId: '',
      patientName: '',
      husbandFatherName: '',
      religion: '',
      nationality: '',
      age: 0,
      sex: '',
      address: '',
      village: '',
      district: '',
      diagnosis: '',
      natureOfOperation: '',
      complaintsAndDuration: '',
      historyOfPresentIllness: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertSurgicalCaseSheet) => 
      apiRequest('/api/surgical-case-sheets', 'POST', data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Surgical case sheet created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/surgical-case-sheets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      setShowCreateForm(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create surgical case sheet",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertSurgicalCaseSheet) => {
    createMutation.mutate(data);
  };

  // Generate PDF function
  const generatePDF = (caseSheet: any) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('SURGICAL CASE SHEET', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Case Number: ${caseSheet.caseNumber}`, 20, 35);
    
    // Patient Information Section
    doc.setFont('helvetica', 'bold');
    doc.text('PATIENT INFORMATION', 20, 50);
    doc.setFont('helvetica', 'normal');
    
    let y = 60;
    const addField = (label: string, value: string) => {
      if (value) {
        doc.text(`${label}: ${value}`, 20, y);
        y += 10;
      }
    };
    
    addField('Name', caseSheet.patientName);
    addField('Husband/Father Name', caseSheet.husbandFatherName);
    addField('Age', caseSheet.age?.toString());
    addField('Sex', caseSheet.sex);
    addField('Religion', caseSheet.religion);
    addField('Nationality', caseSheet.nationality);
    addField('Address', caseSheet.address);
    addField('Village', caseSheet.village);
    addField('District', caseSheet.district);
    
    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('MEDICAL INFORMATION', 20, y);
    doc.setFont('helvetica', 'normal');
    y += 10;
    
    addField('Diagnosis', caseSheet.diagnosis);
    addField('Nature of Operation', caseSheet.natureOfOperation);
    addField('LP No', caseSheet.lpNo);
    addField('Complaints and Duration', caseSheet.complaintsAndDuration);
    addField('History of Present Illness', caseSheet.historyOfPresentIllness);
    
    // Dates
    if (caseSheet.dateOfAdmission) {
      addField('Date of Admission', format(new Date(caseSheet.dateOfAdmission), 'dd/MM/yyyy'));
    }
    if (caseSheet.dateOfOperation) {
      addField('Date of Operation', format(new Date(caseSheet.dateOfOperation), 'dd/MM/yyyy'));
    }
    if (caseSheet.dateOfDischarge) {
      addField('Date of Discharge', format(new Date(caseSheet.dateOfDischarge), 'dd/MM/yyyy'));
    }
    if (caseSheet.edd) {
      addField('EDD', format(new Date(caseSheet.edd), 'dd/MM/yyyy'));
    }
    
    // Investigation Results (if they fit on page)
    if (y < 250) {
      y += 10;
      doc.setFont('helvetica', 'bold');
      doc.text('INVESTIGATION RESULTS', 20, y);
      doc.setFont('helvetica', 'normal');
      y += 10;
      
      addField('Hb', caseSheet.hb);
      addField('BSA', caseSheet.bsa);
      addField('CT', caseSheet.ct);
      addField('BT', caseSheet.bt);
      addField('Blood Grouping', caseSheet.bloodGrouping);
      addField('Rh Factor', caseSheet.rhFactor);
      addField('PRL', caseSheet.prl);
      addField('RBS', caseSheet.rbs);
      addField('Urine Sugar', caseSheet.urineSugar);
      addField('X-Ray', caseSheet.xray);
      addField('ECG', caseSheet.ecg);
      addField('Blood Urea', caseSheet.bloodUrea);
      addField('Serum Creatinine', caseSheet.serumCreatinine);
      addField('Serum Bilirubin', caseSheet.serumBilirubin);
      addField('HBsAg', caseSheet.hbsag);
    }
    
    // Add page 2 if needed for examination results
    if (y > 250 || caseSheet.generalCondition) {
      doc.addPage();
      y = 20;
      
      doc.setFont('helvetica', 'bold');
      doc.text('ON EXAMINATION', 20, y);
      doc.setFont('helvetica', 'normal');
      y += 10;
      
      addField('General Condition', caseSheet.generalCondition);
      addField('Temperature', caseSheet.temperature);
      addField('Pulse', caseSheet.pulse);
      addField('Blood Pressure', caseSheet.bloodPressure);
      addField('Respiratory Rate', caseSheet.respiratoryRate);
      addField('Heart', caseSheet.heart);
      addField('Lungs', caseSheet.lungs);
      addField('Abdomen', caseSheet.abdomen);
      addField('CNS', caseSheet.cns);
    }
    
    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.text(`Generated on: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 20, 285);
      doc.text(`Page ${i} of ${pageCount}`, 180, 285);
    }
    
    // Save PDF
    doc.save(`surgical-case-sheet-${caseSheet.caseNumber}.pdf`);
    
    toast({
      title: "Success",
      description: "PDF downloaded successfully",
    });
  };

  const filteredCaseSheets = Array.isArray(caseSheets) ? caseSheets.filter((caseSheet: any) =>
    caseSheet.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    caseSheet.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    caseSheet.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  return (
    <div className="min-h-screen bg-medical-background">
      {/* Header */}
      <div className="bg-red-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-white hover:bg-red-700 mr-4">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <Scissors className="text-white text-2xl mr-3" />
              <h1 className="text-xl font-bold text-white">Surgical Case Sheets</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-red-100">{user?.name}</span>
              <Button 
                onClick={() => setShowCreateForm(true)}
                className="bg-white text-red-600 hover:bg-red-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Case Sheet
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showCreateForm ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Create New Surgical Case Sheet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Patient Selection */}
                    <FormField
                      control={form.control}
                      name="patientId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Patient</FormLabel>
                          <Select onValueChange={(value) => {
                            field.onChange(value);
                            const selectedPatient = Array.isArray(patients) ? patients.find((p: any) => p.id === value) : null;
                            if (selectedPatient) {
                              form.setValue('patientName', selectedPatient.name);
                              form.setValue('age', selectedPatient.age);
                              form.setValue('sex', selectedPatient.gender);
                            }
                          }}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select patient" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Array.isArray(patients) && patients.map((patient: any) => (
                                <SelectItem key={patient.id} value={patient.id}>
                                  {patient.name} - {patient.patientId}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Patient Name */}
                    <FormField
                      control={form.control}
                      name="patientName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Patient Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Husband/Father Name */}
                    <FormField
                      control={form.control}
                      name="husbandFatherName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Husband/Father Name</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Age */}
                    <FormField
                      control={form.control}
                      name="age"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Age</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Sex */}
                    <FormField
                      control={form.control}
                      name="sex"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sex</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select sex" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Male">Male</SelectItem>
                              <SelectItem value="Female">Female</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Religion */}
                    <FormField
                      control={form.control}
                      name="religion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Religion</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Nationality */}
                    <FormField
                      control={form.control}
                      name="nationality"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nationality</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Address */}
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Village */}
                    <FormField
                      control={form.control}
                      name="village"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Village</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* District */}
                    <FormField
                      control={form.control}
                      name="district"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>District</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Diagnosis */}
                    <FormField
                      control={form.control}
                      name="diagnosis"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Diagnosis</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Nature of Operation */}
                    <FormField
                      control={form.control}
                      name="natureOfOperation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nature of Operation</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name="dateOfAdmission"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Admission</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field} 
                              value={field.value ? format(new Date(field.value), 'yyyy-MM-dd') : ''}
                              onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dateOfOperation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Operation</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field} 
                              value={field.value ? format(new Date(field.value), 'yyyy-MM-dd') : ''}
                              onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dateOfDischarge"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Discharge</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field} 
                              value={field.value ? format(new Date(field.value), 'yyyy-MM-dd') : ''}
                              onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="edd"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>EDD</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field} 
                              value={field.value ? format(new Date(field.value), 'yyyy-MM-dd') : ''}
                              onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Medical History */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Medical History</h3>
                    
                    <FormField
                      control={form.control}
                      name="complaintsAndDuration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Complaints and Duration</FormLabel>
                          <FormControl>
                            <Textarea {...field} value={field.value || ''} rows={3} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="historyOfPresentIllness"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>History of Present Illness</FormLabel>
                          <FormControl>
                            <Textarea {...field} value={field.value || ''} rows={3} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end space-x-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowCreateForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createMutation.isPending}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {createMutation.isPending ? 'Creating...' : 'Create Case Sheet'}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Search and Stats */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search case sheets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <div className="text-sm text-gray-600">
                Total: {filteredCaseSheets.length} case sheets
              </div>
            </div>

            {/* Case Sheets List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded mb-4"></div>
                      <div className="h-3 bg-gray-200 rounded"></div>
                    </CardContent>
                  </Card>
                ))
              ) : filteredCaseSheets.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <Scissors className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No surgical case sheets found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm ? 'Try adjusting your search terms.' : 'Create your first surgical case sheet to get started.'}
                  </p>
                  {!searchTerm && (
                    <Button 
                      onClick={() => setShowCreateForm(true)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Case Sheet
                    </Button>
                  )}
                </div>
              ) : (
                filteredCaseSheets.map((caseSheet: any) => (
                  <Card key={caseSheet.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900">
                            {caseSheet.caseNumber}
                          </h3>
                          <p className="text-gray-600">{caseSheet.patientName}</p>
                        </div>
                        <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                          {caseSheet.sex}, {caseSheet.age}y
                        </span>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        {caseSheet.diagnosis && (
                          <div className="flex items-center text-sm">
                            <span className="font-medium text-gray-500 w-20">Diagnosis:</span>
                            <span className="text-gray-900">{caseSheet.diagnosis}</span>
                          </div>
                        )}
                        {caseSheet.natureOfOperation && (
                          <div className="flex items-center text-sm">
                            <span className="font-medium text-gray-500 w-20">Operation:</span>
                            <span className="text-gray-900">{caseSheet.natureOfOperation}</span>
                          </div>
                        )}
                        {caseSheet.dateOfOperation && (
                          <div className="flex items-center text-sm">
                            <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                            <span className="text-gray-600">
                              {format(new Date(caseSheet.dateOfOperation), 'dd MMM yyyy')}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">
                          Created {format(new Date(caseSheet.createdAt), 'dd MMM yyyy')}
                        </span>
                        <Button
                          size="sm"
                          onClick={() => generatePDF(caseSheet)}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          PDF
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}