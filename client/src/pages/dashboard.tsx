import { useAuth } from '@/hooks/use-auth-simple';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { ChatWidget } from '@/components/ChatWidget';
import { EditDoctorDialog } from '@/components/EditDoctorDialog';
import { StatCard } from '@/components/StatCard';
import { FloatingElements } from '@/components/FloatingElements';
import { memo, useMemo } from 'react';
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

  // Cache stats for 30 seconds to avoid constant refetching
  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/stats'],
    staleTime: 30 * 1000, // Cache for 30 seconds
    refetchInterval: 60 * 1000, // Auto-refresh every minute
  });

  // Fetch hospital settings for dynamic title (cached for 5 minutes)
  const { data: hospitalSettings } = useQuery<{
    hospitalName: string;
    hospitalSubtitle?: string;
    address?: string;
    phone?: string;
    email?: string;
    accreditation?: string;
  }>({
    queryKey: ['/api/hospital-settings'],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  return (
    <div className="min-h-screen gradient-bg-page relative">
      <FloatingElements />
      {/* Enhanced Navigation Header */}
      <nav className="nav-enhanced shadow-lg border-b border-white/20">
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
        <div className="mb-8 animate-slide-in">
          <h1 className="text-4xl font-bold gradient-text mb-2">Welcome Back</h1>
          <p className="text-lg text-medical-text-muted">Transform healthcare with our intelligent system</p>
        </div>

        {/* Enhanced Stats with animations */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <StatCard
            title="Total Patients"
            value={(stats as any)?.totalPatients}
            icon={Users}
            iconColor="text-medical-primary"
            isLoading={isLoading}
          />
          <StatCard
            title="Lab Tests Today"
            value={(stats as any)?.labTestsToday}
            icon={TestTube}
            iconColor="text-medical-secondary"
            isLoading={isLoading}
          />
          <StatCard
            title="Prescriptions"
            value={(stats as any)?.prescriptionsToday}
            icon={Pill}
            iconColor="text-medical-indigo"
            isLoading={isLoading}
          />
          <StatCard
            title="Discharges"
            value={(stats as any)?.dischargesToday}
            icon={FileCheck}
            iconColor="text-medical-warning"
            isLoading={isLoading}
          />
          <StatCard
            title="Surgery Cases"
            value={(stats as any)?.surgicalCasesToday}
            icon={Scissors}
            iconColor="text-red-600"
            isLoading={isLoading}
          />
        </div>

        {/* Enhanced Module Cards with Glass Effect */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Patient Registration Module - FIRST */}
          <Link href="/patient-registration">
            <Card className="glass-card cursor-pointer group animate-delay-100">
              <div className="gradient-bg-secondary p-6 rounded-t-xl">
                <UserPlus className="text-white text-3xl mb-4 float-icon" />
                <h3 className="text-xl font-bold text-white group-hover:scale-105 transition-transform">Patient Registration & Consultation</h3>
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
            <Card className="glass-card cursor-pointer group animate-delay-200">
              <div className="gradient-bg-primary p-6 rounded-t-xl">
                <FlaskConical className="text-white text-3xl mb-4 float-icon" />
                <h3 className="text-xl font-bold text-white group-hover:scale-105 transition-transform">Laboratory</h3>
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
            <Card className="glass-card cursor-pointer group animate-delay-300">
              <div className="gradient-bg-secondary p-6 rounded-t-xl">
                <Pill className="text-white text-3xl mb-4 float-icon" />
                <h3 className="text-xl font-bold text-white group-hover:scale-105 transition-transform">Pharmacy</h3>
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
            <Card className="glass-card cursor-pointer group animate-delay-400">
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-6 rounded-t-xl">
                <FileText className="text-white text-3xl mb-4 float-icon" />
                <h3 className="text-xl font-bold text-white group-hover:scale-105 transition-transform">Discharge Summary</h3>
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
            <Card className="glass-card cursor-pointer group animate-delay-500">
              <div className="bg-gradient-to-br from-red-500 to-rose-600 p-6 rounded-t-xl">
                <Scissors className="text-white text-3xl mb-4 float-icon" />
                <h3 className="text-xl font-bold text-white group-hover:scale-105 transition-transform">Surgical Case Sheet</h3>
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
            <Card className="glass-card cursor-pointer group">
              <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-6 rounded-t-xl">
                <Heart className="text-white text-3xl mb-4 float-icon" />
                <h3 className="text-xl font-bold text-white group-hover:scale-105 transition-transform">Track Patient</h3>
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
