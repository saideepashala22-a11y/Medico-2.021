import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth-simple';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Link } from 'wouter';
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Crown,
  User,
  Phone,
  Mail,
  Calendar,
  Shield,
  UserCheck
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

interface Doctor {
  id: string;
  name: string;
  email: string;
  phone?: string;
  specialization?: string;
  licenseNumber?: string;
  isOwner: boolean;
  isActive: boolean;
  isCurrent: boolean; // Currently selected doctor for reports
  createdAt: string;
}

export default function DoctorsManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isAddingDoctor, setIsAddingDoctor] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [doctorForm, setDoctorForm] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: '',
    licenseNumber: '',
    isOwner: false
  });

  // Fetch doctors list
  const { data: doctors, isLoading } = useQuery<Doctor[]>({
    queryKey: ['/api/doctors'],
  });

  // Add new doctor mutation
  const addDoctorMutation = useMutation({
    mutationFn: async (doctorData: any) => {
      const response = await apiRequest('POST', '/api/doctors', doctorData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/doctors'] });
      toast({
        title: 'Success',
        description: 'Doctor added successfully',
      });
      setIsAddingDoctor(false);
      setDoctorForm({
        name: '',
        email: '',
        phone: '',
        specialization: '',
        licenseNumber: '',
        isOwner: false
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add doctor',
        variant: 'destructive',
      });
    },
  });

  // Set current doctor for reports
  const setCurrentDoctorMutation = useMutation({
    mutationFn: async (doctorId: string) => {
      const response = await apiRequest('PATCH', `/api/doctors/${doctorId}/current`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/doctors'] });
      toast({
        title: 'Success',
        description: 'Current doctor updated',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to set current doctor',
        variant: 'destructive',
      });
    },
  });

  // Update doctor owner status
  const updateOwnerMutation = useMutation({
    mutationFn: async ({ doctorId, isOwner }: { doctorId: string; isOwner: boolean }) => {
      const response = await apiRequest('PATCH', `/api/doctors/${doctorId}/owner`, { isOwner });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/doctors'] });
      toast({
        title: 'Success',
        description: 'Doctor owner status updated',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update doctor status',
        variant: 'destructive',
      });
    },
  });

  // Delete doctor mutation
  const deleteDoctorMutation = useMutation({
    mutationFn: async (doctorId: string) => {
      const response = await apiRequest('DELETE', `/api/doctors/${doctorId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/doctors'] });
      toast({
        title: 'Success',
        description: 'Doctor removed successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove doctor',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorForm.name) {
      toast({
        title: 'Error',
        description: 'Please enter the doctor name',
        variant: 'destructive',
      });
      return;
    }

    addDoctorMutation.mutate(doctorForm);
  };

  const handleSetCurrent = (doctorId: string) => {
    setCurrentDoctorMutation.mutate(doctorId);
  };

  const handleSetOwner = (doctorId: string, isOwner: boolean) => {
    updateOwnerMutation.mutate({ doctorId, isOwner });
  };

  const handleDelete = (doctorId: string) => {
    if (confirm('Are you sure you want to remove this doctor?')) {
      deleteDoctorMutation.mutate(doctorId);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      {/* Header Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <Shield className="text-medical-primary text-xl mr-3" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">Doctors Management</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-300">{user?.name}</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Add Doctor Form */}
        {isAddingDoctor && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Add New Doctor</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={doctorForm.name}
                      onChange={(e) => setDoctorForm({...doctorForm, name: e.target.value})}
                      placeholder="Dr. John Smith"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={doctorForm.email}
                      onChange={(e) => setDoctorForm({...doctorForm, email: e.target.value})}
                      placeholder="doctor@hospital.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={doctorForm.phone}
                      onChange={(e) => setDoctorForm({...doctorForm, phone: e.target.value})}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div>
                    <Label htmlFor="specialization">Specialization</Label>
                    <Input
                      id="specialization"
                      value={doctorForm.specialization}
                      onChange={(e) => setDoctorForm({...doctorForm, specialization: e.target.value})}
                      placeholder="Cardiology, Neurology, etc."
                    />
                  </div>
                  <div>
                    <Label htmlFor="licenseNumber">Medical License Number</Label>
                    <Input
                      id="licenseNumber"
                      value={doctorForm.licenseNumber}
                      onChange={(e) => setDoctorForm({...doctorForm, licenseNumber: e.target.value})}
                      placeholder="MD123456"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isOwner"
                    checked={doctorForm.isOwner}
                    onChange={(e) => setDoctorForm({...doctorForm, isOwner: e.target.checked})}
                    className="rounded"
                  />
                  <Label htmlFor="isOwner" className="flex items-center">
                    <Crown className="w-4 h-4 mr-1 text-yellow-500" />
                    Set as Hospital Owner
                  </Label>
                </div>
                <div className="flex space-x-4">
                  <Button type="submit" disabled={addDoctorMutation.isPending}>
                    {addDoctorMutation.isPending ? 'Adding...' : 'Add Doctor'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsAddingDoctor(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Doctors List */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Hospital Doctors</CardTitle>
              <Button onClick={() => setIsAddingDoctor(true)} disabled={isAddingDoctor}>
                <Plus className="h-4 w-4 mr-2" />
                Add New Doctor
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading doctors...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Specialization</TableHead>
                    <TableHead>License</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {doctors?.map((doctor) => (
                    <TableRow key={doctor.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <div>
                            <div className="font-medium flex items-center">
                              {doctor.name}
                              {doctor.isCurrent && (
                                <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 rounded-full">
                                  Current
                                </span>
                              )}
                              {doctor.isOwner && (
                                <Crown className="w-4 h-4 ml-2 text-yellow-500" />
                              )}
                            </div>
                            <div className="text-sm text-gray-500">{doctor.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {doctor.phone && (
                            <div className="flex items-center">
                              <Phone className="w-3 h-3 mr-1" />
                              {doctor.phone}
                            </div>
                          )}
                          <div className="flex items-center">
                            <Mail className="w-3 h-3 mr-1" />
                            {doctor.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{doctor.specialization || 'General'}</TableCell>
                      <TableCell>{doctor.licenseNumber || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge variant={doctor.isActive ? "default" : "secondary"}>
                            {doctor.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          {doctor.isCurrent && (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              Current
                            </Badge>
                          )}
                          {doctor.isOwner && (
                            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                              Owner
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant={doctor.isCurrent ? "default" : "outline"}
                            onClick={() => handleSetCurrent(doctor.id)}
                            disabled={setCurrentDoctorMutation.isPending}
                            title="Set as current doctor for reports"
                          >
                            <User className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant={doctor.isOwner ? "outline" : "default"}
                            onClick={() => handleSetOwner(doctor.id, !doctor.isOwner)}
                            disabled={updateOwnerMutation.isPending}
                            title="Set as hospital owner"
                          >
                            <Crown className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(doctor.id)}
                            disabled={deleteDoctorMutation.isPending || doctor.isOwner}
                            className="text-red-600 hover:text-red-700"
                            title="Delete doctor"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}