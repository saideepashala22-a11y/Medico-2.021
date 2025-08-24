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
import { ArrowLeft, Save, Hospital } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

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

  // Fetch current hospital settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/hospital-settings'],
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
      setFormData({
        hospitalName: settingsData.hospitalName || '',
        hospitalSubtitle: settingsData.hospitalSubtitle || '',
        address: settingsData.address || '',
        phone: settingsData.phone || '',
        email: settingsData.email || '',
        accreditation: settingsData.accreditation || '',
      });
    }
  }, [settings]);

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
                <div className="text-medical-text-muted">Loading settings...</div>
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
                      onChange={(e) => handleInputChange('hospitalName', e.target.value)}
                      placeholder="Enter hospital name"
                      required
                      data-testid="input-hospital-name"
                      className="border-medical-border focus:border-medical-primary"
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
    </div>
  );
}