import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'wouter';
import { ArrowLeft, Hospital } from 'lucide-react';

export default function SettingsSimple() {
  const { user } = useAuth();

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
            <div className="text-center py-8">
              <p className="text-lg">Settings page is working!</p>
              <p className="text-sm text-gray-600 mt-2">The routing is now functional.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}