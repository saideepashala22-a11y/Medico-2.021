import { useAuth } from '@/hooks/use-auth-simple';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { ChatWidget } from '@/components/ChatWidget';
import { StatCard } from '@/components/StatCard';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useState } from 'react';
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
  Settings,
  Search,
  Bell,
  User,
  Home,
  BarChart3,
  Menu,
  Plus,
  Calendar,
  Activity,
  TrendingUp
} from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Navigation Bar */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Left: Logo + Hospital Name */}
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="mr-3 lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="flex-shrink-0 flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                  <Hospital className="text-white text-lg" />
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  {hospitalSettings?.hospitalName || 'Babai Hospital'}
                </span>
              </div>
            </div>
            
            {/* Center: Global Search */}
            <div className="flex-1 flex justify-center px-6 max-w-2xl">
              <div className="w-full max-w-lg">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    type="text"
                    placeholder="Search patients, reports..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
              </div>
            </div>
            
            {/* Right: Notifications + User Profile */}
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                className="relative"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
              >
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">3</span>
              </Button>
              <ThemeToggle />
              <Button variant="ghost" size="sm">
                <User className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={logout} className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>
      
      <div className="flex">
        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Sidebar Navigation */}
        <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 mt-16 lg:mt-0`}>
          <div className="flex flex-col h-full">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <nav className="mt-5 flex-1 px-2 space-y-1">
                <Link href="/dashboard">
                  <Button variant="ghost" className="w-full justify-start bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                    <Home className="mr-3 h-5 w-5" />
                    Dashboard
                  </Button>
                </Link>
                <Link href="/patient-registration">
                  <Button variant="ghost" className="w-full justify-start text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700">
                    <Users className="mr-3 h-5 w-5" />
                    Patients
                  </Button>
                </Link>
                <Link href="/pharmacy">
                  <Button variant="ghost" className="w-full justify-start text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700">
                    <Pill className="mr-3 h-5 w-5" />
                    Pharmacy
                  </Button>
                </Link>
                <Link href="/lab">
                  <Button variant="ghost" className="w-full justify-start text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700">
                    <FlaskConical className="mr-3 h-5 w-5" />
                    Laboratory
                  </Button>
                </Link>
                <Link href="/discharge">
                  <Button variant="ghost" className="w-full justify-start text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700">
                    <FileText className="mr-3 h-5 w-5" />
                    Discharges
                  </Button>
                </Link>
                <Link href="/surgical-case-sheets">
                  <Button variant="ghost" className="w-full justify-start text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700">
                    <Scissors className="mr-3 h-5 w-5" />
                    Surgery
                  </Button>
                </Link>
                <Link href="/medical-history">
                  <Button variant="ghost" className="w-full justify-start text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700">
                    <BarChart3 className="mr-3 h-5 w-5" />
                    Reports
                  </Button>
                </Link>
                <Link href="/settings">
                  <Button variant="ghost" className="w-full justify-start text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700">
                    <Settings className="mr-3 h-5 w-5" />
                    Settings
                  </Button>
                </Link>
              </nav>
            </div>
          </div>
        </aside>

        {/* Main Dashboard Content */}
        <main 
          className="flex-1 lg:ml-64 relative"
          onClick={() => {
            if (sidebarOpen && window.innerWidth < 1024) {
              setSidebarOpen(false);
            }
            if (notificationsOpen) {
              setNotificationsOpen(false);
            }
          }}
        >
          {/* Notifications Panel */}
          {notificationsOpen && (
            <div className="absolute top-4 right-4 z-50 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setNotificationsOpen(false);
                    }}
                  >
                    ✕
                  </Button>
                </div>
              </div>
              <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                    <UserPlus className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">New patient registered</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">John Doe has been admitted to Ward 3</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">2 hours ago</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                    <TestTube className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Lab test completed</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Blood work results ready for Patient #102</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">4 hours ago</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
                    <FileText className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Discharge summary ready</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Mary Smith's discharge summary is ready for review</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">6 hours ago</p>
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <Button 
                  variant="outline" 
                  className="w-full text-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setNotificationsOpen(false);
                    // You can navigate to a notifications page here
                    alert('This would navigate to a full notifications page showing all notifications with search, filters, and mark as read functionality.');
                  }}
                >
                  View All Notifications
                </Button>
              </div>
            </div>
          )}
          
          <div className="py-8 px-4 sm:px-6 lg:px-8">
            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome Back, Dr. {user?.username}</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">Here's what's happening at your hospital today</p>
            </div>
            
            {/* Quick Actions */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
              <div className="flex flex-wrap gap-4">
                <Link href="/patient-registration">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
                    <Plus className="mr-2 h-4 w-4" />
                    Register Patient
                  </Button>
                </Link>
                <Link href="/pharmacy">
                  <Button className="bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
                    <Pill className="mr-2 h-4 w-4" />
                    Add Medicines
                  </Button>
                </Link>
                <Link href="/lab">
                  <Button className="bg-teal-600 hover:bg-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
                    <TestTube className="mr-2 h-4 w-4" />
                    New Lab Test
                  </Button>
                </Link>
                <Link href="/discharge">
                  <Button className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Discharge
                  </Button>
                </Link>
              </div>
            </div>

            {/* Overview Stats Cards */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <Card className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-0 rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                          <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Patients</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">
                          {isLoading ? (
                            <span className="animate-pulse">...</span>
                          ) : (
                            (stats as any)?.totalPatients || 0
                          )}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-0 rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/20 rounded-xl flex items-center justify-center">
                          <TestTube className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Lab Tests Today</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">
                          {isLoading ? (
                            <span className="animate-pulse">...</span>
                          ) : (
                            (stats as any)?.labTestsToday || 0
                          )}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-0 rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
                          <Pill className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Prescriptions</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">
                          {isLoading ? (
                            <span className="animate-pulse">...</span>
                          ) : (
                            (stats as any)?.prescriptionsToday || 0
                          )}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-0 rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-xl flex items-center justify-center">
                          <FileCheck className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Discharges</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">
                          {isLoading ? (
                            <span className="animate-pulse">...</span>
                          ) : (
                            (stats as any)?.dischargesToday || 0
                          )}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-0 rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center">
                          <Scissors className="h-6 w-6 text-red-600 dark:text-red-400" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Surgery Cases</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">
                          {isLoading ? (
                            <span className="animate-pulse">...</span>
                          ) : (
                            (stats as any)?.surgicalCasesToday || 0
                          )}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Cards Grid View - Hospital Modules */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Hospital Modules</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Patient Registration */}
                <Link href="/patient-registration">
                  <Card className="cursor-pointer bg-white dark:bg-gray-800 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border-0 rounded-2xl overflow-hidden group">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 group-hover:from-green-600 group-hover:to-emerald-700 transition-all duration-300">
                      <UserPlus className="text-white text-3xl mb-4" />
                      <h3 className="text-xl font-bold text-white">Patient Registration</h3>
                      <p className="text-green-100 text-sm">Manage Prescriptions & Billing</p>
                    </div>
                    <CardContent className="p-6">
                      <p className="text-gray-600 dark:text-gray-300 mb-4">Central patient registration with unique ID for all modules</p>
                      <Button variant="outline" className="w-full group-hover:bg-green-50 group-hover:text-green-700 group-hover:border-green-200 transition-all duration-300">
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                </Link>

                {/* Laboratory */}
                <Link href="/lab">
                  <Card className="cursor-pointer bg-white dark:bg-gray-800 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border-0 rounded-2xl overflow-hidden group">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 group-hover:from-blue-600 group-hover:to-indigo-700 transition-all duration-300">
                      <FlaskConical className="text-white text-3xl mb-4" />
                      <h3 className="text-xl font-bold text-white">Laboratory</h3>
                      <p className="text-blue-100 text-sm">Manage Tests & Reports</p>
                    </div>
                    <CardContent className="p-6">
                      <p className="text-gray-600 dark:text-gray-300 mb-4">Manage lab tests, enter results, and generate reports</p>
                      <Button variant="outline" className="w-full group-hover:bg-blue-50 group-hover:text-blue-700 group-hover:border-blue-200 transition-all duration-300">
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                </Link>

                {/* Pharmacy */}
                <Link href="/pharmacy">
                  <Card className="cursor-pointer bg-white dark:bg-gray-800 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border-0 rounded-2xl overflow-hidden group">
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 group-hover:from-emerald-600 group-hover:to-teal-700 transition-all duration-300">
                      <Pill className="text-white text-3xl mb-4" />
                      <h3 className="text-xl font-bold text-white">Pharmacy</h3>
                      <p className="text-emerald-100 text-sm">Manage Prescriptions & Billing</p>
                    </div>
                    <CardContent className="p-6">
                      <p className="text-gray-600 dark:text-gray-300 mb-4">Handle prescriptions, inventory, and billing</p>
                      <Button variant="outline" className="w-full group-hover:bg-emerald-50 group-hover:text-emerald-700 group-hover:border-emerald-200 transition-all duration-300">
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                </Link>

                {/* Discharge Summary */}
                <Link href="/discharge">
                  <Card className="cursor-pointer bg-white dark:bg-gray-800 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border-0 rounded-2xl overflow-hidden group">
                    <div className="bg-gradient-to-r from-orange-500 to-amber-600 p-6 group-hover:from-orange-600 group-hover:to-amber-700 transition-all duration-300">
                      <FileText className="text-white text-3xl mb-4" />
                      <h3 className="text-xl font-bold text-white">Discharge Summary</h3>
                      <p className="text-orange-100 text-sm">Create & Manage Patient Reports</p>
                    </div>
                    <CardContent className="p-6">
                      <p className="text-gray-600 dark:text-gray-300 mb-4">Create and manage patient discharge summaries</p>
                      <Button variant="outline" className="w-full group-hover:bg-orange-50 group-hover:text-orange-700 group-hover:border-orange-200 transition-all duration-300">
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                </Link>

                {/* Surgical Case Sheets */}
                <Link href="/surgical-case-sheets">
                  <Card className="cursor-pointer bg-white dark:bg-gray-800 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border-0 rounded-2xl overflow-hidden group">
                    <div className="bg-gradient-to-r from-red-500 to-rose-600 p-6 group-hover:from-red-600 group-hover:to-rose-700 transition-all duration-300">
                      <Scissors className="text-white text-3xl mb-4" />
                      <h3 className="text-xl font-bold text-white">Surgical Case Sheet</h3>
                      <p className="text-red-100 text-sm">Surgery Documentation</p>
                    </div>
                    <CardContent className="p-6">
                      <p className="text-gray-600 dark:text-gray-300 mb-4">Create and manage surgical case sheets with downloadable forms</p>
                      <Button variant="outline" className="w-full group-hover:bg-red-50 group-hover:text-red-700 group-hover:border-red-200 transition-all duration-300">
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                </Link>

                {/* Medical History */}
                <Link href="/medical-history">
                  <Card className="cursor-pointer bg-white dark:bg-gray-800 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border-0 rounded-2xl overflow-hidden group">
                    <div className="bg-gradient-to-r from-purple-500 to-violet-600 p-6 group-hover:from-purple-600 group-hover:to-violet-700 transition-all duration-300">
                      <Heart className="text-white text-3xl mb-4" />
                      <h3 className="text-xl font-bold text-white">Track Patient</h3>
                      <p className="text-purple-100 text-sm">Medical History & Profiles</p>
                    </div>
                    <CardContent className="p-6">
                      <p className="text-gray-600 dark:text-gray-300 mb-4">Track patient medical history, conditions, and profiles</p>
                      <Button variant="outline" className="w-full group-hover:bg-purple-50 group-hover:text-purple-700 group-hover:border-purple-200 transition-all duration-300">
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
              <Card className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl border-0">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                        <UserPlus className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">New patient registered</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">John Doe admitted to Ward 3</p>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">2 hours ago</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                        <TestTube className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Lab test completed</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Blood work results for Patient #102</p>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">4 hours ago</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
                        <FileText className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Discharge summary created</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Patient Mary Smith ready for discharge</p>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">6 hours ago</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
      
      {/* AI Chat Widget */}
      <ChatWidget />
    </div>
  );
}