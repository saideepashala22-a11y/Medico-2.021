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
  const { data: patients, isLoading: patientsLoading, error: patientsError } = useQuery({
    queryKey: ['/api/patients'],
  });

  // Debug patients data
  console.log('Patients data:', patients);
  console.log('Patients loading:', patientsLoading);
  console.log('Patients error:', patientsError);
  
  // Use the patients data directly now that the API is fixed
  const displayPatients = Array.isArray(patients) ? patients : [];

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
      apiRequest('POST', '/api/surgical-case-sheets', data),
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
    console.log('Form submitted with data:', data);
    console.log('Form errors:', form.formState.errors);
    
    // Validate required fields
    if (!data.patientId || !data.patientName || !data.age || !data.sex) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Patient, Patient Name, Age, Sex)",
        variant: "destructive",
      });
      return;
    }
    
    // Add required fields
    const submitData = {
      ...data,
      createdBy: user?.id || '',
    };
    
    console.log('Submitting data:', submitData);
    
    // Generate and download PDF immediately
    try {
      const mockCaseSheet = {
        ...submitData,
        caseNumber: `SCS-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
        id: 'temp-id',
      };
      generatePDF(mockCaseSheet);
      
      toast({
        title: "PDF Generated",
        description: "Surgical case sheet PDF has been downloaded",
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: "PDF Error",
        description: "Failed to generate PDF, but form will still be saved",
        variant: "destructive",
      });
    }
    
    // Then submit to database
    createMutation.mutate(submitData);
  };

  // Generate PDF using HTML/CSS with perfect grid alignment
  const generatePDF = (caseSheet: any) => {
    // Generate unique case sheet number based on patient ID
    const patientIdShort = caseSheet.patientId?.slice(-4) || Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    const caseSheetNumber = `SCS${patientIdShort}-${String(Math.floor(Math.random() * 99) + 1).padStart(2, '0')}`;
    const currentDate = new Date().toLocaleDateString('en-GB');
    
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Surgical Case Sheet - ${caseSheetNumber}</title>
<style>
  :root { --label-w: 40%; --gap: 12px; --border: #bfc7d1; }
  * { box-sizing: border-box; }
  html, body { height:100%; background:#f6f7f9; }
  body { margin:0; font: 13px/1.35 system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; color:#1d232a; }
  @page { size: A4; margin:18mm; }
  .page { width: 210mm; min-height: 297mm; background:#fff; margin: 0 auto; padding: 0; }
  .inner { padding: 18mm; }
  .hospital-header {
    text-align:center; margin-bottom: 20px;
  }
  .hospital-name {
    font-size: 18px; font-weight: bold; margin: 0;
  }
  .hospital-address {
    font-size: 10px; margin: 5px 0 2px;
  }
  .hospital-phone {
    font-size: 10px; margin: 2px 0 15px;
  }
  .title {
    text-align:center; font-weight:700; font-size: 14px; margin:0 0 16px;
    text-decoration: underline;
  }
  .meta { 
    display:flex; justify-content:space-between; align-items:center; 
    margin: 20px 0; font-size: 11px;
  }
  .meta div { font-weight:600; }
  .form {
    display:grid; grid-template-columns: var(--label-w) 1fr; column-gap:16px; row-gap: var(--gap);
    margin-bottom: 20px;
  }
  .label { text-align:left; font-weight:600; white-space:nowrap; padding-top:2px; }
  .value { display:flex; align-items:flex-end; min-height:20px; }
  .underline { flex:1; border-bottom:1px solid #222; height:16px; min-width: 200px; }
  .filled { border: none; font-weight: normal; }
  .inline { display:flex; gap:15px; align-items:flex-end; }
  .section-header { 
    font-weight: bold; font-size: 12px; margin: 15px 0 10px; 
    grid-column: 1 / -1;
  }
  .spacer { height: 10px; grid-column: 1 / -1; }
</style>
</head>
<body>
  <div class="page">
    <div class="inner">
      <div class="hospital-header">
        <h1 class="hospital-name">NAKSHATRA HOSPITAL</h1>
        <div class="hospital-address">Opp. to SBI Bank, Thurkappally (V&M), Yadadri Bhongiri District, T.S.</div>
        <div class="hospital-phone">Cell: 7093939205</div>
      </div>

      <h2 class="title">SURGICAL CASE SHEET</h2>

      <div class="meta">
        <div>Case Sheet No: <strong>${caseSheetNumber}</strong></div>
        <div>Date: <strong>${currentDate}</strong></div>
      </div>

      <section class="form">
        <div class="label">Name of the Patient :</div>
        <div class="value">
          ${caseSheet.patientName ? `<span class="filled">${caseSheet.patientName}</span>` : '<span class="underline"></span>'}
        </div>

        <div class="label">Husband's/Father's Name :</div>
        <div class="value">
          ${caseSheet.husbandFatherName ? `<span class="filled">${caseSheet.husbandFatherName}</span>` : '<span class="underline"></span>'}
        </div>

        <div class="label">Religion & Nationality :</div>
        <div class="value">
          ${caseSheet.religion || caseSheet.nationality ? 
            `<span class="filled">${(caseSheet.religion || '') + ' ' + (caseSheet.nationality || '')}</span>` : 
            '<span class="underline"></span>'}
        </div>

        <div class="label">Address :</div>
        <div class="value">
          ${caseSheet.address ? `<span class="filled">${caseSheet.address}</span>` : '<span class="underline"></span>'}
        </div>

        <div class="label">Vlg :</div>
        <div class="value">
          ${caseSheet.village ? `<span class="filled">${caseSheet.village}</span>` : '<span class="underline"></span>'}
        </div>

        <div class="label">Mdl :</div>
        <div class="value">
          ${caseSheet.mandal ? `<span class="filled">${caseSheet.mandal}</span>` : '<span class="underline"></span>'}
        </div>

        <div class="label">Dist :</div>
        <div class="value">
          ${caseSheet.district ? `<span class="filled">${caseSheet.district}</span>` : '<span class="underline"></span>'}
        </div>

        <div class="label">Age :</div>
        <div class="value inline">
          ${caseSheet.age ? `<span class="filled">${caseSheet.age}</span>` : '<span class="underline" style="max-width:60px"></span>'}
          <span style="margin-left: 40px; font-weight: 600;">Sex :</span>
          ${caseSheet.sex ? `<span class="filled">${caseSheet.sex}</span>` : '<span class="underline" style="max-width:100px"></span>'}
        </div>

        <div class="spacer"></div>

        <div class="label">Diagnosis :</div>
        <div class="value">
          ${caseSheet.diagnosis ? `<span class="filled">${caseSheet.diagnosis}</span>` : '<span class="underline"></span>'}
        </div>

        <div class="label">Nature of Operation :</div>
        <div class="value">
          ${caseSheet.natureOfOperation ? `<span class="filled">${caseSheet.natureOfOperation}</span>` : '<span class="underline"></span>'}
        </div>

        <div class="label">Date of Admission :</div>
        <div class="value">
          ${caseSheet.dateOfAdmission ? `<span class="filled">${format(new Date(caseSheet.dateOfAdmission), 'dd/MM/yyyy')}</span>` : '<span class="underline"></span>'}
        </div>

        <div class="label">Date of Operation :</div>
        <div class="value">
          ${caseSheet.dateOfOperation ? `<span class="filled">${format(new Date(caseSheet.dateOfOperation), 'dd/MM/yyyy')}</span>` : '<span class="underline"></span>'}
        </div>

        <div class="label">Date of Discharge :</div>
        <div class="value">
          ${caseSheet.dateOfDischarge ? `<span class="filled">${format(new Date(caseSheet.dateOfDischarge), 'dd/MM/yyyy')}</span>` : '<span class="underline"></span>'}
        </div>

        <div class="label">Complaints & Duration :</div>
        <div class="value">
          ${caseSheet.complaintsAndDuration ? `<span class="filled">${caseSheet.complaintsAndDuration}</span>` : '<span class="underline"></span>'}
        </div>

        <div class="label">History of Present Illness :</div>
        <div class="value">
          ${caseSheet.historyOfPresentIllness ? `<span class="filled">${caseSheet.historyOfPresentIllness}</span>` : '<span class="underline"></span>'}
        </div>

        <div class="section-header">INVESTIGATION:</div>
        
        <div class="label">1) Hb% :</div>
        <div class="value"><span class="underline"></span></div>
        
        <div class="label">2) E.S.R. :</div>
        <div class="value"><span class="underline"></span></div>
        
        <div class="label">3) C.T. :</div>
        <div class="value"><span class="underline"></span></div>
        
        <div class="label">4) B.T. :</div>
        <div class="value"><span class="underline"></span></div>
        
        <div class="label">5) Bl. Grouping :</div>
        <div class="value"><span class="underline"></span></div>
        
        <div class="label">6) RPL :</div>
        <div class="value"><span class="underline"></span></div>
        
        <div class="label">7) R.B.S :</div>
        <div class="value"><span class="underline"></span></div>
        
        <div class="label">8) Urine Sugar :</div>
        <div class="value"><span class="underline"></span></div>
        
        <div class="label">9) R.M. :</div>
        <div class="value"><span class="underline"></span></div>
        
        <div class="label">10) X-ray :</div>
        <div class="value"><span class="underline"></span></div>
        
        <div class="label">11) E.C.G :</div>
        <div class="value"><span class="underline"></span></div>
        
        <div class="label">12) Blood Urea :</div>
        <div class="value"><span class="underline"></span></div>
        
        <div class="label">13) Serum Creatinine :</div>
        <div class="value"><span class="underline"></span></div>
        
        <div class="label">14) Serum Bilirubin :</div>
        <div class="value"><span class="underline"></span></div>
        
        <div class="label">15) HBS A.G :</div>
        <div class="value"><span class="underline"></span></div>

        <div class="section-header">ON EXAMINATION:</div>
        
        <div class="label">G.C. :</div>
        <div class="value"><span class="underline"></span></div>
        
        <div class="label">Temp. :</div>
        <div class="value"><span class="underline" style="max-width:60px"></span> <span style="margin-left:5px;">°F</span></div>
        
        <div class="label">P.R. :</div>
        <div class="value"><span class="underline" style="max-width:60px"></span> <span style="margin-left:5px;">/Min</span></div>
        
        <div class="label">B.P. :</div>
        <div class="value"><span class="underline" style="max-width:60px"></span> <span style="margin-left:5px;">mmHg</span></div>
        
        <div class="label">R.R. :</div>
        <div class="value"><span class="underline" style="max-width:60px"></span> <span style="margin-left:5px;">/Min</span></div>
        
        <div class="label">Heart :</div>
        <div class="value"><span class="underline"></span></div>
        
        <div class="label">Lungs :</div>
        <div class="value"><span class="underline"></span></div>
        
        <div class="label">Abd. :</div>
        <div class="value"><span class="underline"></span></div>
        
        <div class="label">C.N.S. :</div>
        <div class="value"><span class="underline"></span></div>
      </section>
    </div>
  </div>
  
  <!-- CONSENT FOR SURGERY PAGE -->
  <div class="page" style="page-break-before: always;">
    <div class="inner">
      <div style="margin-top: 40px;">
        <h2 style="font-size: 16px; font-weight: bold; margin: 0 0 30px 0; text-align: left;">CONSENT FOR SURGERY</h2>
        
        <div style="font-size: 12px; line-height: 1.6; margin-bottom: 40px; text-align: left;">
          I/We unreservedly and in my sense, give my complete consent for admission, Diagnostic procedures, 
          Transfusions, Anaesthesia, Modification in anaesthesia during Surgery, Operation and Modification in 
          Surgical procedures during the surgical procedures during depending the survey, depending of patient 
          condition. No responsibility will be attached to the Surgeon, Anaesthesiologist or Hospital Management.
        </div>
        
        <h3 style="font-size: 14px; font-weight: bold; margin: 30px 0 20px 0; text-align: left;">శస్త్ర చికిత్సకు అంగీకార పత్రము</h3>
        
        <div style="font-size: 12px; line-height: 1.6; margin-bottom: 40px; text-align: left;">
          నేను / మేము నా / మా పూర్తి స్పృహతో ఆసుపత్రిలో చేరికకు, నిర్ధారణాత్మక పరీక్షలకు, రక్త మార్పిడి, రోగ స్థితిని బట్టి శస్త్రచికిత్సలో అనస్థీషియాలో మార్పులు, శస్త్రచికిత్సలో అవసరమైన శస్త్ర విధానాల్లో మార్పులు మొదలైన వాటికి నా / మా పూర్తి అంగీకారాన్ని ఇస్తున్నాము.<br>
          శస్త్రచికిత్స సమయంలో రోగి స్థితిని బట్టి వైద్యులు తగిన నిర్ణయాలు తీసుకోవచ్చని నాకు అవగాహన ఉంది.<br>
          దీనికి సంబంధించి ఎటువంటి బాధ్యతను శస్త్రచికిత్స నిపుణుడు, అనస్థీషియాలజిస్ట్ లేదా ఆసుపత్రి నిర్వహణ స్వీకరించరాదని అంగీకరిస్తున్నాము.
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-top: 50px;">
          <!-- Left side: Representatives -->
          <div style="flex: 1; margin-right: 40px;">
            <div style="font-size: 12px; font-weight: bold; margin-bottom: 20px;">
              Name of the Representatives & Signature / సాక్షుల పేర్లు
            </div>
            
            <div style="margin-bottom: 30px;">
              <div style="font-size: 12px;">1)</div>
              <div style="border-bottom: 1px solid #000; width: 200px; margin-top: 10px;"></div>
            </div>
            
            <div style="margin-bottom: 30px;">
              <div style="font-size: 12px;">2)</div>
              <div style="border-bottom: 1px solid #000; width: 200px; margin-top: 10px;"></div>
            </div>
          </div>
          
          <!-- Right side: Patient -->
          <div style="flex: 1; text-align: right;">
            <div style="font-size: 12px; font-weight: bold; margin-bottom: 40px;">
              Name of the Patient & Signature<br>
              (రోగి పేరు మరియు సంతకం)
            </div>
            <div style="border-bottom: 1px solid #000; width: 200px; margin-left: auto; margin-bottom: 10px;"></div>
            <div style="font-size: 12px; width: 200px; margin-left: auto; text-align: left;">
              Date :
            </div>
          </div>
        </div>
        
        <!-- PRE-OPERATIVE PREPARATION BOX -->
        <div style="margin-top: 50px; border: 2px solid #000; min-height: 400px; padding: 20px;">
          <h3 style="font-size: 14px; font-weight: bold; margin: 0 0 20px 0; text-align: left;">PRE-OPERATIVE PREPARATION & INSTRUCTION :</h3>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

    // Create new window and write HTML content
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Wait for content to load then trigger print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };
    }
  };

  const filteredCaseSheets = Array.isArray(caseSheets) ? caseSheets.filter((caseSheet: any) => {
    const matchesPatientName = caseSheet.patientName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCaseNumber = caseSheet.caseNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDiagnosis = caseSheet.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Debug log to see the data structure and search matching (remove in production)
    // if (searchTerm) {
    //   console.log('Search term:', searchTerm);
    //   console.log('Case sheet data:', { 
    //     patientName: caseSheet.patientName, 
    //     caseNumber: caseSheet.caseNumber, 
    //     diagnosis: caseSheet.diagnosis 
    //   });
    //   console.log('Matches:', { matchesPatientName, matchesCaseNumber, matchesDiagnosis });
    // }
    
    return matchesPatientName || matchesCaseNumber || matchesDiagnosis;
  }) : [];

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
                            const selectedPatient = displayPatients.find((p: any) => p.id === value);
                            if (selectedPatient) {
                              form.setValue('patientName', selectedPatient.name);
                              form.setValue('age', selectedPatient.age);
                              form.setValue('sex', selectedPatient.gender || '');
                            }
                          }} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select patient" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {displayPatients.map((patient: any) => (
                                <SelectItem key={patient.id} value={patient.id}>
                                  {patient.name} - {patient.patientId || `Age: ${patient.age}`}
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
                      onClick={() => {
                        console.log('Create Case Sheet button clicked!');
                        console.log('Form valid:', form.formState.isValid);
                        console.log('Form errors:', form.formState.errors);
                      }}
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