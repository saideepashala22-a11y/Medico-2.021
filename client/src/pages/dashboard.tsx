import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { 
  Hospital, 
  LogOut, 
  Users, 
  FlaskConical, 
  Pill, 
  FileText,
  TestTube,
  FileCheck
} from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/stats'],
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Hospital className="text-medical-blue text-2xl mr-3" />
                <span className="text-xl font-bold text-gray-900">HMS Dashboard</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user?.name}</span>
              <span className="bg-medical-blue text-white px-2 py-1 rounded-full text-xs">
                {user?.role === 'doctor' ? 'Doctor' : 'Staff'}
              </span>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-600 mt-2">Select a module to get started</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-8 w-8 text-medical-blue" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Patients</p>
                  <p className="text-2xl font-bold text-gray-900">
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
                  <TestTube className="h-8 w-8 text-medical-green" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Lab Tests Today</p>
                  <p className="text-2xl font-bold text-gray-900">
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
                  <p className="text-sm font-medium text-gray-600">Prescriptions</p>
                  <p className="text-2xl font-bold text-gray-900">
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
                  <FileCheck className="h-8 w-8 text-orange-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Discharges</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {isLoading ? '...' : (stats as any)?.dischargesToday || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Module Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Lab Module */}
          <Link href="/lab">
            <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="bg-medical-blue p-6">
                <FlaskConical className="text-white text-3xl mb-4" />
                <h3 className="text-xl font-bold text-white">Laboratory</h3>
              </div>
              <CardContent className="p-6">
                <p className="text-gray-600 mb-4">Manage lab tests, enter results, and generate reports</p>
                <ul className="text-sm text-gray-500 space-y-2">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-medical-green rounded-full mr-2"></div>
                    Patient Registration
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-medical-green rounded-full mr-2"></div>
                    Test Selection
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-medical-green rounded-full mr-2"></div>
                    Results Entry
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-medical-green rounded-full mr-2"></div>
                    PDF Reports
                  </li>
                </ul>
              </CardContent>
            </Card>
          </Link>

          {/* Pharmacy Module */}
          <Link href="/pharmacy">
            <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="bg-medical-green p-6">
                <Pill className="text-white text-3xl mb-4" />
                <h3 className="text-xl font-bold text-white">Pharmacy</h3>
              </div>
              <CardContent className="p-6">
                <p className="text-gray-600 mb-4">Handle prescriptions, inventory, and billing</p>
                <ul className="text-sm text-gray-500 space-y-2">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-medical-green rounded-full mr-2"></div>
                    Prescription Management
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-medical-green rounded-full mr-2"></div>
                    Medicine Inventory
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-medical-green rounded-full mr-2"></div>
                    Bill Generation
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-medical-green rounded-full mr-2"></div>
                    Stock Tracking
                  </li>
                </ul>
              </CardContent>
            </Card>
          </Link>

          {/* Discharge Module */}
          <Link href="/discharge">
            <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="bg-medical-indigo p-6">
                <FileText className="text-white text-3xl mb-4" />
                <h3 className="text-xl font-bold text-white">Discharge Summary</h3>
              </div>
              <CardContent className="p-6">
                <p className="text-gray-600 mb-4">Generate discharge summaries and final reports</p>
                <ul className="text-sm text-gray-500 space-y-2">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-medical-green rounded-full mr-2"></div>
                    Patient Summary
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-medical-green rounded-full mr-2"></div>
                    Diagnosis Notes
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-medical-green rounded-full mr-2"></div>
                    Treatment History
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-medical-green rounded-full mr-2"></div>
                    PDF Export
                  </li>
                </ul>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
