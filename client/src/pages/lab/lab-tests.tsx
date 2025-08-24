import { useAuth } from '@/hooks/use-auth-simple';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Link } from 'wouter';
import { ArrowLeft, TestTube, Calendar, Search, Filter, Eye, Download, Edit, Plus, Settings, DollarSign, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';

export default function LabTests() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Test Results state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Test Definitions state
  const [isAddTestOpen, setIsAddTestOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<any>(null);
  const [newTestForm, setNewTestForm] = useState({
    testName: '',
    department: '',
    cost: '',
    description: ''
  });

  const { data: labTests, isLoading: testsLoading } = useQuery<any[]>({
    queryKey: ['/api/lab-tests'],
  });

  const { data: testDefinitions, isLoading: definitionsLoading } = useQuery<any[]>({
    queryKey: ['/api/lab-test-definitions'],
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

  // Mutations for test definitions
  const createTestMutation = useMutation({
    mutationFn: (testData: any) => apiRequest('/api/lab-test-definitions', 'POST', testData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lab-test-definitions'] });
      setIsAddTestOpen(false);
      setNewTestForm({ testName: '', department: '', cost: '', description: '' });
      toast({ title: "Success", description: "Test definition created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create test definition", variant: "destructive" });
    }
  });

  const updateTestMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest(`/api/lab-test-definitions/${id}`, 'PUT', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lab-test-definitions'] });
      setEditingTest(null);
      toast({ title: "Success", description: "Test definition updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update test definition", variant: "destructive" });
    }
  });

  const deleteTestMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/lab-test-definitions/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lab-test-definitions'] });
      toast({ title: "Success", description: "Test definition deactivated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to deactivate test definition", variant: "destructive" });
    }
  });

  const handleCreateTest = () => {
    if (!newTestForm.testName || !newTestForm.department || !newTestForm.cost) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    
    createTestMutation.mutate({
      testName: newTestForm.testName,
      department: newTestForm.department,
      cost: parseFloat(newTestForm.cost),
      description: newTestForm.description || null
    });
  };

  const handleUpdateTest = () => {
    if (!editingTest) return;
    updateTestMutation.mutate(editingTest);
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
          <h1 className="text-3xl font-bold text-gray-900">Laboratory Test Management</h1>
          <p className="text-gray-600 mt-2">Manage test results and configure available lab tests</p>
        </div>

        {/* Main Content with Tabs */}
        <Tabs defaultValue="results" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="results">Test Results</TabsTrigger>
            <TabsTrigger value="definitions">Available Tests</TabsTrigger>
          </TabsList>

          {/* Test Results Tab */}
          <TabsContent value="results" className="space-y-6">

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
          </TabsContent>

          {/* Test Definitions Tab */}
          <TabsContent value="definitions" className="space-y-6">
            {/* Header with Add Button */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Available Lab Tests</h2>
                <p className="text-gray-600">Configure test types and pricing</p>
              </div>
              <Dialog open={isAddTestOpen} onOpenChange={setIsAddTestOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-medical-primary hover:bg-medical-primary-dark text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Test
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Add New Lab Test</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="testName" className="text-right">Test Name *</Label>
                      <Input
                        id="testName"
                        value={newTestForm.testName}
                        onChange={(e) => setNewTestForm({...newTestForm, testName: e.target.value})}
                        className="col-span-3"
                        placeholder="e.g., Complete Blood Count"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="department" className="text-right">Department *</Label>
                      <Select value={newTestForm.department} onValueChange={(value) => setNewTestForm({...newTestForm, department: value})}>
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pathology">Pathology</SelectItem>
                          <SelectItem value="Radiology">Radiology</SelectItem>
                          <SelectItem value="Biochemistry">Biochemistry</SelectItem>
                          <SelectItem value="Microbiology">Microbiology</SelectItem>
                          <SelectItem value="Hematology">Hematology</SelectItem>
                          <SelectItem value="Cardiology">Cardiology</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="cost" className="text-right">Cost ($) *</Label>
                      <Input
                        id="cost"
                        type="number"
                        step="0.01"
                        value={newTestForm.cost}
                        onChange={(e) => setNewTestForm({...newTestForm, cost: e.target.value})}
                        className="col-span-3"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="description" className="text-right">Description</Label>
                      <Textarea
                        id="description"
                        value={newTestForm.description}
                        onChange={(e) => setNewTestForm({...newTestForm, description: e.target.value})}
                        className="col-span-3"
                        placeholder="Optional description or notes"
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsAddTestOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreateTest} 
                      disabled={createTestMutation.isPending}
                      className="bg-medical-primary hover:bg-medical-primary-dark text-white"
                    >
                      {createTestMutation.isPending ? 'Adding...' : 'Add Test'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Test Definitions Table */}
            <Card>
              <CardHeader>
                <CardTitle>Test Catalog ({testDefinitions?.length || 0})</CardTitle>
              </CardHeader>
              <CardContent>
                {definitionsLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-primary mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading test definitions...</p>
                  </div>
                ) : testDefinitions && testDefinitions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Test Name</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Cost</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {testDefinitions.map((test: any) => (
                          <TableRow key={test.id}>
                            <TableCell>
                              <div>
                                <p className="font-semibold">{test.testName}</p>
                                {test.description && (
                                  <p className="text-sm text-gray-600">{test.description}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                {test.department}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                                <span className="font-medium">{parseFloat(test.cost).toFixed(2)}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={test.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                {test.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm">{format(new Date(test.createdAt), 'MMM dd, yyyy')}</p>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setEditingTest(test)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => deleteTestMutation.mutate(test.id)}
                                  disabled={deleteTestMutation.isPending}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Settings className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No lab tests configured</h3>
                    <p className="text-gray-600 mb-4">Start by adding your first lab test definition.</p>
                    <Button 
                      onClick={() => setIsAddTestOpen(true)}
                      className="bg-medical-primary hover:bg-medical-primary-dark text-white"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add First Test
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}