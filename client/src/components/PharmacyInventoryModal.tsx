import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Package, 
  Calendar,
  DollarSign,
  Hash,
  Pill
} from 'lucide-react';

interface MedicineInventory {
  id: string;
  medicineName: string;
  batchNumber: string;
  quantity: number;
  units: string;
  mrp: number;
  manufactureDate?: string;
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
  const [location, navigate] = useLocation();
  
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch all medicines
  const { data: medicines, isLoading } = useQuery({
    queryKey: ['/api/medicines'],
    enabled: isOpen,
    refetchOnWindowFocus: true,
    staleTime: 0, // Always refetch when needed
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

  const handleEdit = (medicine: MedicineInventory) => {
    navigate(`/pharmacy/medicine/edit/${medicine.id}`);
  };

  const handleAddMedicine = () => {
    navigate('/pharmacy/medicine/new');
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
              onClick={handleAddMedicine}
              className="bg-medical-primary hover:bg-medical-primary-dark"
              data-testid="add-medicine-button"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Medicine
            </Button>
          </div>

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
                        <TableHead>Units</TableHead>
                        <TableHead>MRP</TableHead>
                        <TableHead>Manufacture Date</TableHead>
                        <TableHead>Expiry Date</TableHead>
                        <TableHead>Category</TableHead>
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
                              {medicine.quantity}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {medicine.units || 'tablets'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3 text-green-600" />
                              ₹{medicine.mrp}
                            </div>
                          </TableCell>
                          <TableCell>
                            {medicine.manufactureDate ? (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-blue-400" />
                                {new Date(medicine.manufactureDate).toLocaleDateString()}
                              </div>
                            ) : (
                              'N/A'
                            )}
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
                            <Badge variant="outline">
                              {medicine.category || 'N/A'}
                            </Badge>
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
                <div className="text-center py-8">
                  <Package className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <p className="text-gray-500 mb-4">No medicines in inventory</p>
                  <Button
                    onClick={handleAddMedicine}
                    className="bg-medical-primary hover:bg-medical-primary-dark"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Medicine
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}