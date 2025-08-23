import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Package, 
  Calendar,
  DollarSign,
  Hash,
  Pill,
  Save,
  X
} from 'lucide-react';

interface MedicineInventory {
  id: string;
  medicineName: string;
  batchNumber: string;
  quantity: number;
  mrp: number;
  expiryDate?: string;
  manufacturer?: string;
  category?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

interface PharmacyInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PharmacyInventoryModal({ isOpen, onClose }: PharmacyInventoryModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<MedicineInventory | null>(null);
  
  const [formData, setFormData] = useState({
    medicineName: '',
    batchNumber: '',
    quantity: '',
    mrp: '',
    expiryDate: '',
    manufacturer: '',
    category: 'tablets',
    description: '',
  });

  // Fetch all medicines
  const { data: medicines, isLoading } = useQuery({
    queryKey: ['/api/medicines'],
    enabled: isOpen,
  });

  // Create medicine mutation
  const createMedicineMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/medicines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to create medicine');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/medicines'] });
      resetForm();
      setShowAddForm(false);
      toast({
        title: 'Success',
        description: 'Medicine added to inventory successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add medicine',
        variant: 'destructive',
      });
    },
  });

  // Update medicine mutation
  const updateMedicineMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/medicines/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to update medicine');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/medicines'] });
      resetForm();
      setEditingMedicine(null);
      toast({
        title: 'Success',
        description: 'Medicine updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update medicine',
        variant: 'destructive',
      });
    },
  });

  // Delete medicine mutation
  const deleteMedicineMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/medicines/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to delete medicine');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/medicines'] });
      toast({
        title: 'Success',
        description: 'Medicine removed from inventory',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove medicine',
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      medicineName: '',
      batchNumber: '',
      quantity: '',
      mrp: '',
      expiryDate: '',
      manufacturer: '',
      category: 'tablets',
      description: '',
    });
  };

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
      mrp: formData.mrp, // Keep as string
      expiryDate: formData.expiryDate || undefined,
      manufacturer: formData.manufacturer || undefined,
      category: formData.category || undefined,
      description: formData.description || undefined,
    };

    if (editingMedicine) {
      updateMedicineMutation.mutate({ id: editingMedicine.id, data: medicineData });
    } else {
      createMedicineMutation.mutate(medicineData);
    }
  };

  const handleEdit = (medicine: MedicineInventory) => {
    setFormData({
      medicineName: medicine.medicineName,
      batchNumber: medicine.batchNumber,
      quantity: medicine.quantity.toString(),
      mrp: medicine.mrp.toString(),
      expiryDate: medicine.expiryDate ? medicine.expiryDate.split('T')[0] : '',
      manufacturer: medicine.manufacturer || '',
      category: medicine.category || 'tablets',
      description: medicine.description || '',
    });
    setEditingMedicine(medicine);
    setShowAddForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to remove this medicine from inventory?')) {
      deleteMedicineMutation.mutate(id);
    }
  };

  const filteredMedicines = Array.isArray(medicines) 
    ? medicines.filter((medicine: MedicineInventory) =>
        medicine.medicineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        medicine.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        medicine.category?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-medical-primary">
            <Package className="h-6 w-6" />
            Pharmacy Inventory Management
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Header Actions */}
          <div className="flex justify-between items-center">
            <div className="relative flex-1 max-w-md">
              <Input
                placeholder="Search medicines..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="search-medicines"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
            
            <Button
              onClick={() => {
                resetForm();
                setEditingMedicine(null);
                setShowAddForm(true);
              }}
              className="bg-medical-primary hover:bg-medical-primary-dark"
              data-testid="add-medicine-button"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Medicine
            </Button>
          </div>

          {/* Add/Edit Medicine Form */}
          {showAddForm && (
            <Card className="border-medical-primary">
              <CardHeader>
                <CardTitle className="text-medical-primary">
                  {editingMedicine ? 'Edit Medicine' : 'Add New Medicine'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
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
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="submit"
                      className="bg-medical-primary hover:bg-medical-primary-dark"
                      disabled={createMedicineMutation.isPending || updateMedicineMutation.isPending}
                      data-testid="save-medicine-button"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {editingMedicine ? 'Update Medicine' : 'Add Medicine'}
                    </Button>
                    
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowAddForm(false);
                        setEditingMedicine(null);
                        resetForm();
                      }}
                      data-testid="cancel-button"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Medicine Inventory Table */}
          <Card>
            <CardHeader>
              <CardTitle>Medicine Inventory ({filteredMedicines?.length || 0} items)</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading inventory...</div>
              ) : filteredMedicines && filteredMedicines.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Medicine Name</TableHead>
                        <TableHead>Batch Number</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>MRP</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Expiry Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMedicines.map((medicine: MedicineInventory) => (
                        <TableRow key={medicine.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Pill className="h-4 w-4 text-medical-primary" />
                              {medicine.medicineName}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Hash className="h-3 w-3 text-gray-400" />
                              {medicine.batchNumber}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={medicine.quantity < 10 ? "destructive" : "default"}>
                              {medicine.quantity} units
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3 text-green-600" />
                              ₹{medicine.mrp}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {medicine.category || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {medicine.expiryDate ? (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-gray-400" />
                                {new Date(medicine.expiryDate).toLocaleDateString()}
                              </div>
                            ) : (
                              'N/A'
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={medicine.isActive ? "default" : "secondary"}>
                              {medicine.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(medicine)}
                                data-testid={`edit-medicine-${medicine.id}`}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(medicine.id)}
                                className="text-red-600 hover:text-red-700"
                                data-testid={`delete-medicine-${medicine.id}`}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">
                    {searchTerm ? 'No medicines found matching your search' : 'No medicines in inventory yet'}
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    {searchTerm ? 'Try a different search term' : 'Add your first medicine to get started'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}