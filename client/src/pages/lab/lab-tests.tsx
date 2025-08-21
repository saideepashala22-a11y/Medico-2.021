import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { ArrowLeft, TestTube, Calendar, Search, Filter, Eye, Download, Edit } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';

export default function LabTests() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: labTests, isLoading: testsLoading } = useQuery<any[]>({
    queryKey: ['/api/lab-tests'],
  });

  const filteredTests = labTests?.filter(test => {
    const matchesSearch = searchTerm === '' || 
      test.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.patient.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.testType.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || test.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/lab">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <TestTube className="text-green-600 text-xl mr-3" />
              <span className="text-xl font-bold text-gray-900">Lab Tests Management</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user?.name}</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Laboratory Test Results</h1>
          <p className="text-gray-600 mt-2">View and manage all laboratory test results</p>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="mr-2 h-5 w-5" />
              Filter Tests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by patient name, ID, or test type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Link href="/lab/patient-registration">
                  <Button className="bg-medical-primary hover:bg-medical-primary-dark text-white">
                    <TestTube className="mr-2 h-4 w-4" />
                    New Test
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tests Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Test Results ({filteredTests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {testsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-primary mx-auto mb-4"></div>
                <p className="text-gray-600">Loading lab tests...</p>
              </div>
            ) : filteredTests.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Test Type</TableHead>
                      <TableHead>Ordered Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTests.map((test: any) => (
                      <TableRow key={test.id}>
                        <TableCell>
                          <div>
                            <p className="font-semibold">{test.patient.name}</p>
                            <p className="text-sm text-gray-600">ID: {test.patient.patientId}</p>
                            <p className="text-sm text-gray-600">
                              {test.patient.age}y, {test.patient.gender}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{test.testType}</p>
                            {test.urgency && (
                              <Badge 
                                variant={test.urgency === 'urgent' ? 'destructive' : 'secondary'}
                                className="text-xs mt-1"
                              >
                                {test.urgency}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <Calendar className="mr-1 h-4 w-4 text-gray-400" />
                            {format(new Date(test.createdAt), 'MMM dd, yyyy')}
                          </div>
                          <p className="text-xs text-gray-500">
                            {format(new Date(test.createdAt), 'HH:mm')}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(test.status)}>
                            {test.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{test.doctorName || 'Dr. ' + user?.name}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Link href={`/lab/report?testId=${test.id}`}>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            {test.status === 'completed' && (
                              <Link href={`/lab/report?testId=${test.id}&download=true`}>
                                <Button variant="outline" size="sm">
                                  <Download className="h-4 w-4" />
                                </Button>
                              </Link>
                            )}
                            {test.status !== 'completed' && (
                              <Link href={`/lab/enter-results?testId=${test.id}`}>
                                <Button variant="outline" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </Link>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <TestTube className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm || statusFilter !== 'all' ? 'No tests found' : 'No lab tests yet'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Start by creating a new lab test for a patient.'
                  }
                </p>
                {(!searchTerm && statusFilter === 'all') && (
                  <Link href="/lab/patient-registration">
                    <Button className="bg-medical-primary hover:bg-medical-primary-dark text-white">
                      <TestTube className="mr-2 h-4 w-4" />
                      Create First Test
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}