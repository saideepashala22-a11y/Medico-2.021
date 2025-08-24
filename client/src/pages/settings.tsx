import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth-simple';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ArrowLeft, Save, AlertTriangle, Hospital } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

const hospitalSchema = z.object({
  name: z.string().min(1, 'Hospital name is required'),
  address: z.string().min(1, 'Address is required'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  email: z.string().email('Invalid email address'),
  website: z.string().optional(),
  registrationNumber: z.string().min(1, 'Registration number is required'),
});

type HospitalFormData = z.infer<typeof hospitalSchema>;

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showNameChangeWarning, setShowNameChangeWarning] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<HospitalFormData | null>(null);

  // Fetch hospital settings with caching
  const { data: hospitalSettings, isLoading } = useQuery({
    queryKey: ['/api/hospital-settings'],
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  const form = useForm<HospitalFormData>({
    resolver: zodResolver(hospitalSchema),
    defaultValues: {
      name: hospitalSettings?.name || '',
      address: hospitalSettings?.address || '',
      phone: hospitalSettings?.phone || '',
      email: hospitalSettings?.email || '',
      website: hospitalSettings?.website || '',
      registrationNumber: hospitalSettings?.registrationNumber || '',
    },
  });

  // Reset form when data loads
  if (hospitalSettings && !form.formState.isDirty) {
    form.reset({
      name: hospitalSettings.name || '',
      address: hospitalSettings.address || '',
      phone: hospitalSettings.phone || '',
      email: hospitalSettings.email || '',
      website: hospitalSettings.website || '',
      registrationNumber: hospitalSettings.registrationNumber || '',
    });
  }

  const updateHospitalMutation = useMutation({
    mutationFn: (data: HospitalFormData) => apiRequest('/api/hospital-settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/hospital-settings'] });
      toast({
        title: 'Settings Updated',
        description: 'Hospital settings have been successfully updated.',
      });
      setPendingFormData(null);
      setShowNameChangeWarning(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update hospital settings.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: HospitalFormData) => {
    const originalName = hospitalSettings?.name;
    const nameChanged = originalName && originalName !== data.name;

    if (nameChanged) {
      setPendingFormData(data);
      setShowNameChangeWarning(true);
    } else {
      updateHospitalMutation.mutate(data);
    }
  };

  const confirmNameChange = () => {
    if (pendingFormData) {
      updateHospitalMutation.mutate(pendingFormData);
    }
  };

  const goBack = () => {
    window.location.href = '/dashboard';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-medical-background flex items-center justify-center">
        <div className="text-center">
          <Hospital className="h-12 w-12 text-medical-primary mx-auto mb-4 animate-pulse" />
          <p className="text-medical-text-muted">Loading hospital settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-medical-background">
      {/* Navigation Header */}
      <nav className="bg-medical-primary shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={goBack}
                className="text-white hover:bg-medical-primary-dark mr-4"
                data-testid="button-back"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex-shrink-0 flex items-center">
                <Hospital className="text-white text-2xl mr-3" />
                <span className="text-xl font-bold text-white">Hospital Settings</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-medical-primary-light">{user?.name}</span>
              <span className="bg-medical-secondary text-white px-2 py-1 rounded-full text-xs">
                {user?.role === 'doctor' ? 'Doctor' : 'Staff'}
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Settings Content */}
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-medical-text flex items-center">
              <Hospital className="h-6 w-6 mr-2 text-medical-primary" />
              Hospital Information
            </CardTitle>
            <p className="text-medical-text-muted">
              Configure your hospital's basic information. This will appear on all reports, bills, and documents.
            </p>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-medical-text font-medium">Hospital Name *</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-hospital-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="registrationNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-medical-text font-medium">Registration Number *</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-registration-number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-medical-text font-medium">Phone Number *</FormLabel>
                        <FormControl>
                          <Input {...field} type="tel" data-testid="input-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-medical-text font-medium">Email Address *</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" data-testid="input-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-medical-text font-medium">Website</FormLabel>
                        <FormControl>
                          <Input {...field} type="url" placeholder="https://example.com" data-testid="input-website" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-medical-text font-medium">Address *</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} data-testid="textarea-address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end pt-4">
                  <Button
                    type="submit"
                    disabled={updateHospitalMutation.isPending}
                    className="bg-medical-primary hover:bg-medical-primary-dark text-white"
                    data-testid="button-save-settings"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateHospitalMutation.isPending ? 'Saving...' : 'Save Settings'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {/* Hospital Name Change Warning Dialog */}
      <AlertDialog open={showNameChangeWarning} onOpenChange={setShowNameChangeWarning}>
        <AlertDialogContent data-testid="dialog-name-change-warning">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-orange-600">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Hospital Name Change Warning
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p className="font-medium">
                You are about to change the hospital name. This will affect the entire system:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-sm">
                <li>All future pharmacy bills and receipts</li>
                <li>Laboratory test reports and certificates</li>
                <li>Surgical case sheets and medical documents</li>
                <li>Consultation reports and prescriptions</li>
                <li>Patient discharge summaries</li>
                <li>All system-generated PDF documents</li>
              </ul>
              <p className="text-red-600 font-medium">
                Previously generated documents will keep the old hospital name, but all new documents will use the updated name.
              </p>
              <p>Are you sure you want to proceed with this change?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-name-change">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmNameChange}
              className="bg-orange-600 hover:bg-orange-700"
              data-testid="button-confirm-name-change"
            >
              Yes, Update Hospital Name
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}