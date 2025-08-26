import { useAuth } from '@/hooks/use-auth-simple';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { ChatWidget } from '@/components/ChatWidget';
import { EditDoctorDialog } from '@/components/EditDoctorDialog';
import { 
  Hospital, 
  LogOut, 
  Users, 
  FlaskConical, 
  Pill, 
  FileText,
  TestTube,
  FileCheck,
  Heart,
  Scissors,
  UserPlus,
  Settings
} from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/stats'],
  });

  // Fetch hospital settings for dynamic title
  const { data: hospitalSettings } = useQuery<{
    hospitalName: string;
    hospitalSubtitle?: string;
    address?: string;
    phone?: string;
    email?: string;
    accreditation?: string;
  }>({
    queryKey: ['/api/hospital-settings'],
    staleTime: 0, // Always fetch fresh data
  });

  return (
    <div className="min-h-screen bg-medical-background">
      {/* Navigation Header */}
      <nav className="bg-medical-primary shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Hospital className="text-white text-2xl mr-3" />
                <span className="text-xl font-bold text-white">
                  {hospitalSettings?.hospitalName || 'Hospital Management System'}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-medical-primary-light">{user?.name}</span>
                {user?.role === 'doctor' && <EditDoctorDialog />}
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-white hover:bg-medical-primary-dark" 
                data-testid="button-settings"
                onClick={() => {
                  console.log('Settings button clicked');
                  window.location.href = '/settings';
                }}
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={logout} className="text-white hover:bg-medical-primary-dark">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-medical-text">Welcome Back</h1>
          <p className="text-medical-text-muted mt-2">Select a module to get started</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-8 w-8 text-medical-primary" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-medical-text-muted">Total Patients</p>
                  <p className="text-2xl font-bold text-medical-text">
                    {isLoading ? '...' : (stats as any)?.totalPatients || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TestTube className="h-8 w-8 text-medical-secondary" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-medical-text-muted">Lab Tests Today</p>
                  <p className="text-2xl font-bold text-medical-text">
                    {isLoading ? '...' : (stats as any)?.labTestsToday || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Pill className="h-8 w-8 text-medical-indigo" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-medical-text-muted">Prescriptions</p>
                  <p className="text-2xl font-bold text-medical-text">
                    {isLoading ? '...' : (stats as any)?.prescriptionsToday || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FileCheck className="h-8 w-8 text-medical-warning" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-medical-text-muted">Discharges</p>
                  <p className="text-2xl font-bold text-medical-text">
                    {isLoading ? '...' : (stats as any)?.dischargesToday || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Scissors className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-medical-text-muted">Surgery Cases</p>
                  <p className="text-2xl font-bold text-medical-text">
                    {isLoading ? '...' : (stats as any)?.surgicalCasesToday || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Module Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Patient Registration Module - FIRST */}
          <Link href="/patient-registration">
            <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white shadow-lg rounded-xl">
              <div className="bg-green-600 p-6">
                <UserPlus className="text-white text-3xl mb-4" />
                <h3 className="text-xl font-bold text-white">Patient Registration & Consultation</h3>
              </div>
              <CardContent className="p-6">
                <p className="text-medical-text-muted mb-4">Central patient registration with unique ID for all modules</p>
                <ul className="text-sm text-medical-text-muted space-y-2">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Unique Patient ID
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Complete Profile
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Cross-Module Access
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Medical History
                  </li>
                </ul>
              </CardContent>
            </Card>
          </Link>

          {/* Laboratory Module - SECOND */}
          <Link href="/lab">
            <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white shadow-lg rounded-xl">
              <div className="bg-medical-primary p-6">
                <FlaskConical className="text-white text-3xl mb-4" />
                <h3 className="text-xl font-bold text-white">Laboratory</h3>
              </div>
              <CardContent className="p-6">
                <p className="text-medical-text-muted mb-4">Manage lab tests, enter results, and generate reports</p>
                <ul className="text-sm text-medical-text-muted space-y-2">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-medical-secondary rounded-full mr-2"></div>
                    Patient Registration
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-medical-secondary rounded-full mr-2"></div>
                    Test Selection
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-medical-secondary rounded-full mr-2"></div>
                    Results Entry
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-medical-secondary rounded-full mr-2"></div>
                    PDF Reports
                  </li>
                </ul>
              </CardContent>
            </Card>
          </Link>

          {/* Pharmacy Module - THIRD */}
          <Link href="/pharmacy">
            <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white shadow-lg rounded-xl">
              <div className="bg-medical-secondary p-6">
                <Pill className="text-white text-3xl mb-4" />
                <h3 className="text-xl font-bold text-white">Pharmacy</h3>
              </div>
              <CardContent className="p-6">
                <p className="text-medical-text-muted mb-4">Handle prescriptions, inventory, and billing</p>
                <ul className="text-sm text-medical-text-muted space-y-2">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-medical-primary rounded-full mr-2"></div>
                    Prescription Management
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-medical-primary rounded-full mr-2"></div>
                    Medicine Inventory
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-medical-primary rounded-full mr-2"></div>
                    Bill Generation
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-medical-primary rounded-full mr-2"></div>
                    Stock Tracking
                  </li>
                </ul>
              </CardContent>
            </Card>
          </Link>

          {/* Discharge Summary Module - FOURTH */}
          <Link href="/discharge">
            <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white shadow-lg rounded-xl">
              <div className="bg-medical-warning p-6">
                <FileText className="text-white text-3xl mb-4" />
                <h3 className="text-xl font-bold text-white">Discharge Summary</h3>
              </div>
              <CardContent className="p-6">
                <p className="text-medical-text-muted mb-4">Create and manage patient discharge summaries</p>
                <ul className="text-sm text-medical-text-muted space-y-2">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-medical-primary rounded-full mr-2"></div>
                    Discharge Planning
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-medical-secondary rounded-full mr-2"></div>
                    Summary Generation
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-medical-warning rounded-full mr-2"></div>
                    Follow-up Instructions
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-medical-accent rounded-full mr-2"></div>
                    PDF Reports
                  </li>
                </ul>
              </CardContent>
            </Card>
          </Link>

          {/* Surgical Case Sheet Module - FIFTH */}
          <Link href="/surgical-case-sheets">
            <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white shadow-lg rounded-xl">
              <div className="bg-red-600 p-6">
                <Scissors className="text-white text-3xl mb-4" />
                <h3 className="text-xl font-bold text-white">Surgical Case Sheet</h3>
              </div>
              <CardContent className="p-6">
                <p className="text-medical-text-muted mb-4">Create and manage surgical case sheets with downloadable forms</p>
                <ul className="text-sm text-medical-text-muted space-y-2">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-medical-primary rounded-full mr-2"></div>
                    Patient Information
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-red-600 rounded-full mr-2"></div>
                    Surgery Details
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-medical-secondary rounded-full mr-2"></div>
                    Investigation Results
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-medical-accent rounded-full mr-2"></div>
                    PDF Download
                  </li>
                </ul>
              </CardContent>
            </Card>
          </Link>

          {/* Track Patient (Medical History) Module - SIXTH */}
          <Link href="/medical-history">
            <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white shadow-lg rounded-xl">
              <div className="bg-medical-accent p-6">
                <Heart className="text-white text-3xl mb-4" />
                <h3 className="text-xl font-bold text-white">Track Patient</h3>
              </div>
              <CardContent className="p-6">
                <p className="text-medical-text-muted mb-4">Track patient medical history, conditions, and profiles</p>
                <ul className="text-sm text-medical-text-muted space-y-2">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-medical-primary rounded-full mr-2"></div>
                    Patient Profiles
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-medical-primary rounded-full mr-2"></div>
                    Medical History
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-medical-secondary rounded-full mr-2"></div>
                    Allergies & Conditions
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-medical-secondary rounded-full mr-2"></div>
                    Treatment Records
                  </li>
                </ul>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
      
      {/* AI Chat Widget */}
      <ChatWidget />
    </div>
  );
}
