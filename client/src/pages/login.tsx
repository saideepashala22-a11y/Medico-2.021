import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth-simple';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Hospital, Loader2 } from 'lucide-react';
import { ForgotPasswordModal } from '@/components/ForgotPasswordModal';
import { FloatingElements } from '@/components/FloatingElements';

export default function Login() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.password || !formData.role) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      await login(formData.username, formData.password, formData.role);
      toast({
        title: 'Success',
        description: 'Logged in successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Login failed',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg-page relative">
      <FloatingElements />
      <Card className="glass-card w-full max-w-md animate-scale-in">
        <CardHeader className="text-center">
          <div className="mx-auto h-16 w-16 gradient-bg-primary rounded-full flex items-center justify-center mb-6 float-icon">
            <Hospital className="text-white text-2xl" />
          </div>
          <CardTitle className="text-3xl font-bold gradient-text mb-2">Hospital Management</CardTitle>
          <p className="text-lg text-gray-600">Welcome back to your digital healthcare platform</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
            <div className="space-y-2">
              <Label htmlFor="username" className="font-medium text-gray-700">Username</Label>
              <Input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Enter your username"
                autoComplete="username"
                className="modern-input"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="font-medium text-gray-700">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter your password"
                autoComplete="new-password"
                className="modern-input"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role" className="font-medium text-gray-700">Role</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger className="modern-input">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="doctor">Doctor/Admin</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              type="submit" 
              className="btn-modern w-full text-white shadow-lg transform transition-all duration-200 hover:scale-105"
              disabled={isLoading}
              data-testid="button-login"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <button
              type="button"
              className="text-sm gradient-text hover:opacity-80 underline transition-opacity"
              onClick={() => setShowForgotPassword(true)}
              data-testid="link-forgot-password"
            >
              Forgot Password?
            </button>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">Demo Credentials: doctor/admin123 or staff/staff123</p>
          </div>
        </CardContent>
      </Card>
      
      <ForgotPasswordModal 
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />
    </div>
  );
}
