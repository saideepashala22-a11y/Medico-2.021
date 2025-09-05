import React, { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Save, ArrowLeft, Package } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { MedicineInventory } from '@shared/schema';

export default function MedicineForm() {
  const [location, navigate] = useLocation();
  const params = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const isEdit = params?.id;
  
  const [formData, setFormData] = useState({
    medicineName: '',
    batchNumber: '',
    quantity: '',
    units: 'tablets',
    mrp: '',
    manufactureDate: '',
    expiryDate: '',
    manufacturer: '',
    category: 'tablets',
    description: '',
  });

  // Fetch existing medicine data for editing
  const { data: existingMedicine, isLoading: isLoadingMedicine } = useQuery({
    queryKey: ['/api/medicines', params?.id],
    queryFn: async () => {
      if (!params?.id) return null;
      const response = await fetch(`/api/medicines/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch medicine');
      return response.json();
    },
    enabled: !!params?.id,
  });

  // Populate form with existing data when editing
  useEffect(() => {
    if (existingMedicine) {
      setFormData({
        medicineName: existingMedicine.medicineName,
        batchNumber: existingMedicine.batchNumber,
        quantity: existingMedicine.quantity.toString(),
        units: existingMedicine.units || 'tablets',
        mrp: existingMedicine.mrp.toString(),
        manufactureDate: existingMedicine.manufactureDate ? existingMedicine.manufactureDate.split('T')[0] : '',
        expiryDate: existingMedicine.expiryDate ? existingMedicine.expiryDate.split('T')[0] : '',
        manufacturer: existingMedicine.manufacturer || '',
        category: existingMedicine.category || 'tablets',
        description: existingMedicine.description || '',
      });
    }
  }, [existingMedicine]);

  const createMedicineMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/medicines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create medicine');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Medicine added successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/medicines'] });
      navigate('/pharmacy');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add medicine',
        variant: 'destructive',
      });
    },
  });

  const updateMedicineMutation = useMutation({
    mutationFn: async (data: { id: string; data: any }) => {
      const response = await fetch(`/api/medicines/${data.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(data.data),
      });
      if (!response.ok) throw new Error('Failed to update medicine');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Medicine updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/medicines'] });
      navigate('/pharmacy');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update medicine',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.medicineName || !formData.batchNumber || !formData.quantity || !formData.mrp) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    const medicineData = {
      medicineName: formData.medicineName,
      batchNumber: formData.batchNumber,
      quantity: parseInt(formData.quantity),
      units: formData.units,
      mrp: formData.mrp,
      manufactureDate: formData.manufactureDate || undefined,
      expiryDate: formData.expiryDate || undefined,
      manufacturer: formData.manufacturer || undefined,
      category: formData.category || undefined,
      description: formData.description || undefined,
    };

    if (isEdit && params?.id) {
      updateMedicineMutation.mutate({ id: params.id, data: medicineData });
    } else {
      createMedicineMutation.mutate(medicineData);
    }
  };

  const handleBack = () => {
    navigate('/pharmacy');
  };

  if (isLoadingMedicine) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">Loading medicine details...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          onClick={handleBack}
          className="flex items-center gap-2"
          data-testid="back-button"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Pharmacy
        </Button>
        <div className="flex items-center gap-2">
          <Package className="h-6 w-6 text-medical-primary" />
          <h1 className="text-2xl font-bold text-medical-primary">
            {isEdit ? 'Edit Medicine' : 'Add New Medicine'}
          </h1>
        </div>
      </div>

      {/* Medicine Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-medical-primary">
            Medicine Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Row 1: Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="medicineName">Medicine Name *</Label>
                <Input
                  id="medicineName"
                  value={formData.medicineName}
                  onChange={(e) => setFormData(prev => ({ ...prev, medicineName: e.target.value }))}
                  placeholder="Enter medicine name"
                  required
                  data-testid="input-medicine-name"
                />
              </div>
              
              <div>
                <Label htmlFor="batchNumber">Batch Number *</Label>
                <Input
                  id="batchNumber"
                  value={formData.batchNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, batchNumber: e.target.value }))}
                  placeholder="Enter batch number"
                  required
                  data-testid="input-batch-number"
                />
              </div>
              
              <div>
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                  placeholder="Enter quantity"
                  required
                  min="0"
                  data-testid="input-quantity"
                />
              </div>
            </div>
            
            {/* Row 2: Units, MRP, Manufacture Date */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="units">Units *</Label>
                <Select value={formData.units} onValueChange={(value) => setFormData(prev => ({ ...prev, units: value }))}>
                  <SelectTrigger data-testid="select-units">
                    <SelectValue placeholder="Select units" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tablets">Tablets</SelectItem>
                    <SelectItem value="capsules">Capsules</SelectItem>
                    <SelectItem value="ml">ML (Milliliters)</SelectItem>
                    <SelectItem value="grams">Grams</SelectItem>
                    <SelectItem value="bottles">Bottles</SelectItem>
                    <SelectItem value="vials">Vials</SelectItem>
                    <SelectItem value="strips">Strips</SelectItem>
                    <SelectItem value="boxes">Boxes</SelectItem>
                    <SelectItem value="pieces">Pieces</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="mrp">MRP (₹) *</Label>
                <Input
                  id="mrp"
                  type="number"
                  step="0.01"
                  value={formData.mrp}
                  onChange={(e) => setFormData(prev => ({ ...prev, mrp: e.target.value }))}
                  placeholder="Enter MRP"
                  required
                  min="0"
                  data-testid="input-mrp"
                />
              </div>
              
              <div>
                <Label htmlFor="manufactureDate">Manufacture Date</Label>
                <Input
                  id="manufactureDate"
                  type="date"
                  value={formData.manufactureDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, manufactureDate: e.target.value }))}
                  data-testid="input-manufacture-date"
                />
              </div>
            </div>
            
            {/* Row 3: Expiry Date, Category, Manufacturer */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                  data-testid="input-expiry-date"
                />
              </div>
              
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger data-testid="select-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tablets">Tablets</SelectItem>
                    <SelectItem value="capsules">Capsules</SelectItem>
                    <SelectItem value="syrup">Syrup</SelectItem>
                    <SelectItem value="injection">Injection</SelectItem>
                    <SelectItem value="ointment">Ointment</SelectItem>
                    <SelectItem value="drops">Drops</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="manufacturer">Manufacturer</Label>
                <Input
                  id="manufacturer"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData(prev => ({ ...prev, manufacturer: e.target.value }))}
                  placeholder="Enter manufacturer name"
                  data-testid="input-manufacturer"
                />
              </div>
            </div>
            
            {/* Row 4: Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter description (optional)"
                data-testid="input-description"
              />
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                className="bg-medical-primary hover:bg-medical-primary-dark"
                disabled={createMedicineMutation.isPending || updateMedicineMutation.isPending}
                data-testid="save-medicine-button"
              >
                <Save className="h-4 w-4 mr-2" />
                {isEdit ? 'Update Medicine' : 'Add Medicine'}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                data-testid="cancel-button"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}