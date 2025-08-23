import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { ArrowLeft, TestTube, Plus, FileText, User, Calendar, Clipboard, FlaskConical, Search } from 'lucide-react';

export default function Lab() {
  const { user } = useAuth();
  const [showPatientSearch, setShowPatientSearch] = useState(false);

  const { data: recentTests, isLoading: testsLoading } = useQuery<any[]>({
    queryKey: ['/api/lab-tests/recent'],
  });

  // Fetch recent 3 patients
  const { data: recentPatients } = useQuery({
    queryKey: ['/api/patients-registration/recent'],
    queryFn: async () => {
      const response = await fetch('/api/patients-registration/recent', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return response.json();
    },
    enabled: showPatientSearch, // Only fetch when search is shown
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <FlaskConical className="text-medical-blue text-xl mr-3" />
              <span className="text-xl font-bold text-gray-900">Laboratory Management</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user?.name}</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <Link href="/lab/patient-registration">
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-medical-blue bg-opacity-10 rounded-full flex items-center justify-center mb-4 group-hover:bg-opacity-20 transition-colors">
                  <User className="h-6 w-6 text-medical-blue" />
                </div>
                <CardTitle className="text-lg">Start New Test</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">Register a new patient and begin the lab testing workflow</p>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <Link href="/lab/lab-tests">
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-green-500 bg-opacity-10 rounded-full flex items-center justify-center mb-4 group-hover:bg-opacity-20 transition-colors">
                  <TestTube className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="text-lg">Lab Tests</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">View and manage laboratory test results</p>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-purple-500 bg-opacity-10 rounded-full flex items-center justify-center mb-4 group-hover:bg-opacity-20 transition-colors">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle className="text-lg">Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center">Generate and download lab test reports</p>
            </CardContent>
          </Card>
        </div>

        {/* Patient Search Bar */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Patient Search</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search recent patients or click to see recent 3..."
                  className="pl-10"
                  onFocus={() => setShowPatientSearch(true)}
                  onBlur={() => setTimeout(() => setShowPatientSearch(false), 150)}
                  data-testid="patient-search-input"
                />
                
                {showPatientSearch && recentPatients && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {recentPatients.length === 0 ? (
                      <div className="p-3 text-sm text-gray-500">No recent patients found</div>
                    ) : (
                      <>
                        <div className="p-2 bg-gray-50 border-b">
                          <p className="text-xs text-gray-600 font-medium">Recent 3 Patients</p>
                        </div>
                        {recentPatients.slice(0, 3).map((patient: any) => (
                          <Link key={patient.id} href={`/lab/patient-registration?patientId=${patient.id}`}>
                            <div className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {patient.salutation} {patient.fullName}
                                  </p>
                                  <p className="text-sm text-gray-500">{patient.mruNumber}</p>
                                  <p className="text-xs text-gray-400">
                                    {patient.contactPhone} • Age: {patient.age} {patient.ageUnit}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <Badge variant="outline" className="text-xs">
                                    {patient.bloodGroup || 'Unknown'}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Action */}
        <div className="text-center mb-8">
          <Link href="/lab/patient-registration">
            <Button size="lg" className="bg-medical-blue hover:bg-blue-700">
              <Plus className="mr-2 h-5 w-5" />
              Start New Lab Test
            </Button>
          </Link>
        </div>

        {/* Recent Tests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clipboard className="mr-2 h-5 w-5" />
              Recent Lab Tests
            </CardTitle>
          </CardHeader>
          <CardContent>
            {testsLoading ? (
              <div className="text-center py-8">Loading recent tests...</div>
            ) : recentTests && recentTests.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Tests</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTests.map((test: any) => (
                    <TableRow key={test.id}>
                      <TableCell>
                        <div>
                          <p className="font-semibold">{test.patient.name}</p>
                          <p className="text-sm text-gray-600">{test.patient.patientId}</p>
                        </div>
                      </TableCell>
                      <TableCell>{test.testType}</TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="mr-1 h-4 w-4" />
                          {new Date(test.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                          Completed
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Link href={`/lab/report/${test.id}`}>
                          <Button variant="ghost" size="sm">
                            <FileText className="mr-1 h-4 w-4" />
                            View Report
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <TestTube className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600">No recent lab tests found</p>
                <Link href="/lab/patient-registration">
                  <Button className="mt-4 bg-medical-blue hover:bg-blue-700">
                    Start First Test
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}