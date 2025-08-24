import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { ArrowLeft, Save, Hospital, AlertTriangle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface HospitalSettings {
  id: string;
  hospitalName: string;
  hospitalSubtitle: string;
  address: string;
  phone: string;
  email: string;
  accreditation: string;
  logo?: string;
}

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    hospitalName: '',
    hospitalSubtitle: '',
    address: '',
    phone: '',
    email: '',
    accreditation: '',
  });

  const [showNameWarning, setShowNameWarning] = useState(false);
  const [nameChangeConfirmed, setNameChangeConfirmed] = useState(false);
  const [originalHospitalName, setOriginalHospitalName] = useState('');

  // Fetch current hospital settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/hospital-settings'],
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  // Update hospital settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (data: typeof formData) => 
      apiRequest('PATCH', '/api/hospital-settings', data),
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Hospital settings have been updated successfully.",
        duration: 500,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/hospital-settings'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Set form data when settings are loaded
  useEffect(() => {
    if (settings) {
      const settingsData = settings as HospitalSettings;
      const newFormData = {
        hospitalName: settingsData.hospitalName || '',
        hospitalSubtitle: settingsData.hospitalSubtitle || '',
        address: settingsData.address || '',
        phone: settingsData.phone || '',
        email: settingsData.email || '',
        accreditation: settingsData.accreditation || '',
      };
      setFormData(newFormData);
      setOriginalHospitalName(settingsData.hospitalName || '');
    }
  }, [settings]);

  // Handle hospital name change with warning
  const handleHospitalNameChange = (value: string) => {
    // If the name is being changed from the original and not yet confirmed
    if (value !== originalHospitalName && !nameChangeConfirmed) {
      setShowNameWarning(true);
    } else {
      handleInputChange('hospitalName', value);
    }
  };

  // Handle warning confirmation
  const handleNameChangeConfirmation = () => {
    setNameChangeConfirmed(true);
    setShowNameWarning(false);
    // Allow the user to edit the field now
  };

  // Handle warning cancellation
  const handleNameChangeCancel = () => {
    setShowNameWarning(false);
    // Reset to original name
    setFormData(prev => ({
      ...prev,
      hospitalName: originalHospitalName
    }));
  };

  return (
    <div className="min-h-screen bg-medical-background">
      {/* Navigation Header */}
      <nav className="bg-medical-primary shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-white hover:bg-medical-primary-dark mr-4">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
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
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-medical-text">Hospital Settings</CardTitle>
            <CardDescription>
              Configure your hospital information that will appear on reports and documents.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-primary"></div>
                <div className="ml-4 text-medical-text-muted">Loading settings...</div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="hospitalName" className="text-medical-text font-medium">
                      Hospital Name *
                    </Label>
                    <Input
                      id="hospitalName"
                      value={formData.hospitalName}
                      onChange={(e) => handleHospitalNameChange(e.target.value)}
                      placeholder="Enter hospital name"
                      required
                      data-testid="input-hospital-name"
                      className="border-medical-border focus:border-medical-primary"
                      readOnly={!nameChangeConfirmed && formData.hospitalName === originalHospitalName}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hospitalSubtitle" className="text-medical-text font-medium">
                      Hospital Subtitle
                    </Label>
                    <Input
                      id="hospitalSubtitle"
                      value={formData.hospitalSubtitle}
                      onChange={(e) => handleInputChange('hospitalSubtitle', e.target.value)}
                      placeholder="e.g., Multi Specialty Hospital & Research Centre"
                      data-testid="input-hospital-subtitle"
                      className="border-medical-border focus:border-medical-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-medical-text font-medium">
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+91-1234567890"
                      data-testid="input-phone"
                      className="border-medical-border focus:border-medical-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-medical-text font-medium">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="info@hospital.com"
                      data-testid="input-email"
                      className="border-medical-border focus:border-medical-primary"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-medical-text font-medium">
                    Hospital Address
                  </Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Enter complete hospital address"
                    rows={3}
                    data-testid="textarea-address"
                    className="border-medical-border focus:border-medical-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accreditation" className="text-medical-text font-medium">
                    Accreditation Details
                  </Label>
                  <Input
                    id="accreditation"
                    value={formData.accreditation}
                    onChange={(e) => handleInputChange('accreditation', e.target.value)}
                    placeholder="e.g., NABL Accredited Laboratory | ISO 15189:2012 Certified"
                    data-testid="input-accreditation"
                    className="border-medical-border focus:border-medical-primary"
                  />
                </div>

                <div className="flex justify-end space-x-4 pt-6">
                  <Link href="/dashboard">
                    <Button variant="outline" type="button" data-testid="button-cancel">
                      Cancel
                    </Button>
                  </Link>
                  <Button 
                    type="submit" 
                    disabled={updateSettingsMutation.isPending}
                    className="bg-medical-primary hover:bg-medical-primary-dark"
                    data-testid="button-save"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Hospital Name Change Warning Dialog */}
      <AlertDialog open={showNameWarning} onOpenChange={setShowNameWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Warning: Hospital Name Change
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left space-y-2">
              <p>
                <strong>This action will change your hospital name across the entire system!</strong>
              </p>
              <p>The new name will appear on:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>All future pharmacy bills and invoices</li>
                <li>Laboratory test reports</li>
                <li>Surgical case sheets</li>
                <li>All other PDF documents</li>
                <li>System headers and footers</li>
              </ul>
              <p className="font-medium text-amber-700">
                Are you sure you want to proceed with changing the hospital name?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleNameChangeCancel}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleNameChangeConfirmation}
              className="bg-amber-600 hover:bg-amber-700"
            >
              OK, I Understand - Allow Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}