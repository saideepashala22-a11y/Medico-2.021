import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Phone, Shield, Key } from 'lucide-react';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [formData, setFormData] = useState({
    username: '',
    phoneNumber: '',
    otp: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.phoneNumber) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    // Validate phone number format
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    if (!phoneRegex.test(formData.phoneNumber)) {
      toast({
        title: 'Error',
        description: 'Please enter a valid phone number',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          phoneNumber: formData.phoneNumber,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'OTP sent to your phone number',
        });
        setStep('verify');
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to send OTP',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Network error. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.otp || !formData.newPassword || !formData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (formData.newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters long',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/verify-otp-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          otp: formData.otp,
          newPassword: formData.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Password reset successfully',
        });
        onClose();
        // Reset form
        setFormData({
          username: '',
          phoneNumber: '',
          otp: '',
          newPassword: '',
          confirmPassword: '',
        });
        setStep('request');
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to reset password',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Network error. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setStep('request');
    setFormData({
      username: '',
      phoneNumber: '',
      otp: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-medical-primary" />
            Reset Password
          </DialogTitle>
        </DialogHeader>

        {step === 'request' ? (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div>
              <Label htmlFor="username" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Username
              </Label>
              <Input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Enter your username"
                required
                data-testid="input-username"
              />
            </div>

            <div>
              <Label htmlFor="phoneNumber" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Number
              </Label>
              <Input
                id="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="Enter your phone number (+91xxxxxxxxxx)"
                required
                data-testid="input-phone"
              />
              <p className="text-xs text-gray-500 mt-1">
                We'll send a 6-digit OTP to this number
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-medical-primary hover:bg-medical-primary-dark"
              disabled={isLoading}
              data-testid="button-send-otp"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending OTP...
                </>
              ) : (
                'Send OTP'
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyAndReset} className="space-y-4">
            <div className="text-center text-sm text-gray-600 mb-4">
              Enter the 6-digit OTP sent to your phone number
            </div>

            <div>
              <Label htmlFor="otp">OTP Code</Label>
              <Input
                id="otp"
                type="text"
                value={formData.otp}
                onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                required
                data-testid="input-otp"
              />
            </div>

            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                placeholder="Enter new password"
                required
                data-testid="input-new-password"
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Confirm new password"
                required
                data-testid="input-confirm-password"
              />
            </div>

            <div className="flex gap-2">
              <Button 
                type="button"
                variant="outline"
                onClick={() => setStep('request')}
                className="flex-1"
                data-testid="button-back"
              >
                Back
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-medical-primary hover:bg-medical-primary-dark"
                disabled={isLoading}
                data-testid="button-reset-password"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}