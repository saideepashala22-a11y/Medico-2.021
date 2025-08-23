import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Link } from 'wouter';
import { ArrowLeft, Pill, Plus, Printer, Search, Trash2, Loader2 } from 'lucide-react';
import { generatePrescriptionPDF } from '@/components/pdf-generator';
import { PharmacyInventoryModal } from '@/components/PharmacyInventoryModal';

const availableMedicines = [
  { id: 'paracetamol_500', name: 'Paracetamol 500mg', price: 5 },
  { id: 'amoxicillin_250', name: 'Amoxicillin 250mg', price: 8 },
  { id: 'omeprazole_20', name: 'Omeprazole 20mg', price: 12 },
  { id: 'metformin_500', name: 'Metformin 500mg', price: 6 },
  { id: 'aspirin_75', name: 'Aspirin 75mg', price: 3 },
  { id: 'ciprofloxacin_500', name: 'Ciprofloxacin 500mg', price: 15 },
];

interface MedicineItem {
  medicineId: string;
  name: string;
  dosage: string;
  quantity: number;
  price: number;
  total: number;
}

export default function Pharmacy() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [medicines, setMedicines] = useState<MedicineItem[]>([]);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  const { data: searchResults } = useQuery({
    queryKey: ['/api/patients/search', patientSearch],
    queryFn: async () => {
      const response = await fetch(`/api/patients/search?q=${encodeURIComponent(patientSearch)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return response.json();
    },
    enabled: showPatientDropdown, // Only enabled when dropdown should show
  });

  const { data: recentPrescriptions, isLoading: prescriptionsLoading } = useQuery({
    queryKey: ['/api/prescriptions/recent'],
  });

  const createPrescriptionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/prescriptions', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/prescriptions/recent'] });
      toast({
        title: 'Success',
        description: 'Prescription saved successfully',
      });
      // Reset form
      setMedicines([]);
      setSelectedPatient(null);
      setPatientSearch('');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save prescription',
        variant: 'destructive',
      });
    },
  });

  const addMedicine = () => {
    setMedicines([...medicines, {
      medicineId: '',
      name: '',
      dosage: '',
      quantity: 1,
      price: 0,
      total: 0,
    }]);
  };

  const updateMedicine = (index: number, field: keyof MedicineItem, value: any) => {
    const updated = [...medicines];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-calculate total when quantity or price changes
    if (field === 'quantity' || field === 'price') {
      updated[index].total = updated[index].quantity * updated[index].price;
    }
    
    // Auto-fill price when medicine is selected
    if (field === 'medicineId') {
      const medicine = availableMedicines.find(m => m.id === value);
      if (medicine) {
        updated[index].name = medicine.name;
        updated[index].price = medicine.price;
        updated[index].total = updated[index].quantity * medicine.price;
      }
    }
    
    setMedicines(updated);
  };

  const removeMedicine = (index: number) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const getSubtotal = () => {
    return medicines.reduce((sum, item) => sum + item.total, 0);
  };

  const getTax = () => {
    return getSubtotal() * 0.05; // 5% tax
  };

  const getTotal = () => {
    return getSubtotal() + getTax();
  };

  const handleSavePrescription = () => {
    if (!selectedPatient) {
      toast({
        title: 'Error',
        description: 'Please select a patient',
        variant: 'destructive',
      });
      return;
    }

    if (medicines.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one medicine',
        variant: 'destructive',
      });
      return;
    }

    const prescriptionData = {
      patientId: selectedPatient.id,
      medicines: medicines.map(m => ({
        medicineId: m.medicineId,
        name: m.name,
        dosage: m.dosage,
        quantity: m.quantity,
        price: m.price,
        total: m.total,
      })),
      subtotal: getSubtotal().toFixed(2),
      tax: getTax().toFixed(2),
      total: getTotal().toFixed(2),
    };

    createPrescriptionMutation.mutate(prescriptionData);
  };

  const handlePrintBill = () => {
    if (!selectedPatient || medicines.length === 0) {
      toast({
        title: 'Error',
        description: 'Please complete the prescription first',
        variant: 'destructive',
      });
      return;
    }

    const prescriptionData = {
      billNumber: `PH-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      medicines,
      subtotal: getSubtotal().toFixed(2),
      tax: getTax().toFixed(2),
      total: getTotal().toFixed(2),
      createdAt: new Date().toISOString(),
    };

    generatePrescriptionPDF(selectedPatient, prescriptionData as any);
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
              <Pill className="text-medical-green text-xl mr-3" />
              <span className="text-xl font-bold text-gray-900">Pharmacy Module</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Patient Lookup & Prescription */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Patient & Prescription</span>
                <Button 
                  onClick={() => setShowInventoryModal(true)} 
                  className="bg-medical-primary hover:bg-medical-primary-dark"
                  data-testid="pharmacy-management-button"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Pharmacy Management
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Patient Search */}
              <div>
                <Label>Search Patient</Label>
                <div className="relative">
                  <Input
                    placeholder="Enter patient name or ID..."
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    onFocus={() => setShowPatientDropdown(true)}
                    onBlur={() => {
                      // Delay hiding to allow clicks on dropdown items
                      setTimeout(() => setShowPatientDropdown(false), 200);
                    }}
                    className="pl-10"
                  />
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
                
                {showPatientDropdown && searchResults && searchResults.length > 0 && (
                  <div className="mt-2 border rounded-lg bg-white shadow-sm max-h-60 overflow-y-auto">
                    {searchResults.map((patient: any) => (
                      <div
                        key={patient.id}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                        onClick={() => {
                          setSelectedPatient(patient);
                          setPatientSearch('');
                          setShowPatientDropdown(false);
                        }}
                      >
                        <div className="font-medium">{patient.fullName}</div>
                        <div className="text-sm text-gray-500">{patient.mruNumber} • Age: {patient.age} {patient.ageUnit} • {patient.contactPhone}</div>
                      </div>
                    ))}
                  </div>
                )}
                
                {showPatientDropdown && patientSearch && searchResults && searchResults.length === 0 && (
                  <div className="mt-2 border rounded-lg bg-white shadow-sm p-3 text-gray-500 text-center">
                    No patients found matching "{patientSearch}"
                  </div>
                )}
              </div>

              {/* Selected Patient Info */}
              {selectedPatient && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900">Selected Patient</h3>
                  <div className="mt-2 text-sm text-gray-600">
                    <p><strong>Name:</strong> {selectedPatient.fullName}</p>
                    <p><strong>MRU Number:</strong> {selectedPatient.mruNumber}</p>
                    <p><strong>Age:</strong> {selectedPatient.age} {selectedPatient.ageUnit}</p>
                    <p><strong>Contact:</strong> {selectedPatient.contactPhone || 'N/A'}</p>
                  </div>
                </div>
              )}

              {/* Medicine Selection */}
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium text-gray-900">Add Medicines</h3>
                  <Button onClick={addMedicine} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Medicine
                  </Button>
                </div>

                <div className="space-y-4">
                  {medicines.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No medicines added yet</p>
                  ) : (
                    <>
                      <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 uppercase">
                        <div className="col-span-4">Medicine</div>
                        <div className="col-span-2">Dosage</div>
                        <div className="col-span-2">Qty</div>
                        <div className="col-span-2">Price</div>
                        <div className="col-span-1">Total</div>
                        <div className="col-span-1">Action</div>
                      </div>
                      
                      {medicines.map((medicine, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-4">
                            <Select
                              value={medicine.medicineId}
                              onValueChange={(value) => updateMedicine(index, 'medicineId', value)}
                            >
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue placeholder="Select Medicine" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableMedicines.map((med) => (
                                  <SelectItem key={med.id} value={med.id}>
                                    {med.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-2">
                            <Input
                              className="h-8 text-sm"
                              placeholder="1-0-1"
                              value={medicine.dosage}
                              onChange={(e) => updateMedicine(index, 'dosage', e.target.value)}
                            />
                          </div>
                          <div className="col-span-2">
                            <Input
                              className="h-8 text-sm"
                              type="number"
                              min="1"
                              value={medicine.quantity}
                              onChange={(e) => updateMedicine(index, 'quantity', parseInt(e.target.value) || 1)}
                            />
                          </div>
                          <div className="col-span-2">
                            <Input
                              className="h-8 text-sm"
                              type="number"
                              value={medicine.price}
                              readOnly
                            />
                          </div>
                          <div className="col-span-1">
                            <span className="text-sm">₹{medicine.total}</span>
                          </div>
                          <div className="col-span-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeMedicine(index)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
        
        {/* Recent Prescriptions */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Recent Prescriptions</CardTitle>
            </CardHeader>
            <CardContent>
              {prescriptionsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Bill No</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(recentPrescriptions as any[])?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          No prescriptions found
                        </TableCell>
                      </TableRow>
                    ) : (
                      (recentPrescriptions as any[])?.map((prescription: any) => (
                        <TableRow key={prescription.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{prescription.patient.name}</div>
                              <div className="text-sm text-gray-500">{prescription.patient.patientId}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{prescription.billNumber}</TableCell>
                          <TableCell className="text-sm">
                            {prescription.medicines?.length || 0} medicines
                          </TableCell>
                          <TableCell className="text-sm">₹{prescription.total}</TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {new Date(prescription.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="sm">
                                View
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Printer className="h-4 w-4" />
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

      {/* Pharmacy Inventory Management Modal */}
      <PharmacyInventoryModal
        isOpen={showInventoryModal}
        onClose={() => setShowInventoryModal(false)}
      />
    </div>
  );
}
