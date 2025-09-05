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
                <div className="w-full">
                  <Table className="w-full table-fixed">
                    <TableHeader>
                      <TableRow className="text-xs">
                        <TableHead className="w-[22%] px-2 py-2">Medicine Name</TableHead>
                        <TableHead className="w-[12%] px-2 py-2">Batch</TableHead>
                        <TableHead className="w-[8%] px-2 py-2 text-center">Qty</TableHead>
                        <TableHead className="w-[8%] px-2 py-2 text-center">Units</TableHead>
                        <TableHead className="w-[10%] px-2 py-2">MRP</TableHead>
                        <TableHead className="w-[10%] px-2 py-2 hidden sm:table-cell">Mfg Date</TableHead>
                        <TableHead className="w-[10%] px-2 py-2">Expiry</TableHead>
                        <TableHead className="w-[8%] px-2 py-2 hidden md:table-cell">Category</TableHead>
                        <TableHead className="w-[7%] px-2 py-2 text-center">Status</TableHead>
                        <TableHead className="w-[5%] px-2 py-2 text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMedicines.map((medicine: MedicineInventory) => (
                        <TableRow key={medicine.id} className="text-xs">
                          <TableCell className="font-medium px-2 py-2">
                            <div className="flex items-center gap-1 truncate">
                              <Pill className="h-3 w-3 text-medical-primary flex-shrink-0" />
                              <span className="truncate" title={medicine.medicineName}>
                                {medicine.medicineName}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="px-2 py-2">
                            <div className="flex items-center gap-1 truncate">
                              <Hash className="h-2 w-2 text-gray-400 flex-shrink-0" />
                              <span className="truncate" title={medicine.batchNumber}>
                                {medicine.batchNumber}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="px-2 py-2 text-center">
                            <Badge 
                              variant={medicine.quantity === 0 ? "destructive" : medicine.quantity < 10 ? "secondary" : "default"}
                              className="text-xs px-1 py-0"
                            >
                              {medicine.quantity}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-2 py-2 text-center">
                            <Badge variant="secondary" className="text-xs px-1 py-0">
                              {medicine.units || 'tabs'}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-2 py-2">
                            <div className="flex items-center gap-1">
                              <span className="text-green-600">₹</span>
                              <span>{medicine.mrp}</span>
                            </div>
                          </TableCell>
                          <TableCell className="px-2 py-2 hidden sm:table-cell">
                            {medicine.manufactureDate ? (
                              <span className="text-xs">
                                {new Date(medicine.manufactureDate).toLocaleDateString('en-GB')}
                              </span>
                            ) : (
                              <span className="text-gray-400">N/A</span>
                            )}
                          </TableCell>
                          <TableCell className="px-2 py-2">
                            {medicine.expiryDate ? (
                              <span className="text-xs">
                                {new Date(medicine.expiryDate).toLocaleDateString('en-GB')}
                              </span>
                            ) : (
                              <span className="text-gray-400">N/A</span>
                            )}
                          </TableCell>
                          <TableCell className="px-2 py-2 hidden md:table-cell">
                            <Badge variant="outline" className="text-xs px-1 py-0 truncate">
                              {medicine.category || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-2 py-2 text-center">
                            <Badge 
                              variant={medicine.isActive ? "default" : "secondary"}
                              className="text-xs px-1 py-0"
                            >
                              {medicine.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-1 py-2">
                            <div className="flex gap-1 justify-center">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(medicine)}
                                data-testid={`edit-medicine-${medicine.id}`}
                                className="h-6 w-6 p-0"
                                title="Edit Medicine"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(medicine.id)}
                                className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                data-testid={`delete-medicine-${medicine.id}`}
                                title="Delete Medicine"
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