import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Lab from "@/pages/lab";
import LabTests from "@/pages/lab/lab-tests";
import PatientRegistration from "@/pages/lab/patient-registration";
import TestSelection from "@/pages/lab/test-selection";
import EnterResults from "@/pages/lab/enter-results";
import LabReport from "@/pages/lab/report";
import Pharmacy from "@/pages/pharmacy";
import Discharge from "@/pages/discharge";
import MedicalHistory from "@/pages/medical-history";
import Consultation from "@/pages/consultation";
import { Loader2 } from "lucide-react";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-medical-blue" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-medical-blue" />
      </div>
    );
  }

  if (user) {
    return <Dashboard />;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/login">
        <PublicRoute>
          <Login />
        </PublicRoute>
      </Route>
      
      <Route path="/dashboard">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      
      <Route path="/lab">
        <ProtectedRoute>
          <Lab />
        </ProtectedRoute>
      </Route>
      
      <Route path="/lab/lab-tests">
        <ProtectedRoute>
          <LabTests />
        </ProtectedRoute>
      </Route>
      
      <Route path="/lab/patient-registration">
        <ProtectedRoute>
          <PatientRegistration />
        </ProtectedRoute>
      </Route>
      <Route path="/lab/test-selection/:patientId">
        <ProtectedRoute>
          <TestSelection />
        </ProtectedRoute>
      </Route>
      
      <Route path="/lab/enter-results/:testId">
        <ProtectedRoute>
          <EnterResults />
        </ProtectedRoute>
      </Route>
      
      <Route path="/lab/report/:labTestId">
        <ProtectedRoute>
          <LabReport />
        </ProtectedRoute>
      </Route>
      
      <Route path="/pharmacy">
        <ProtectedRoute>
          <Pharmacy />
        </ProtectedRoute>
      </Route>
      
      <Route path="/discharge">
        <ProtectedRoute>
          <Discharge />
        </ProtectedRoute>
      </Route>
      
      <Route path="/medical-history">
        <ProtectedRoute>
          <MedicalHistory />
        </ProtectedRoute>
      </Route>
      
      <Route path="/consultation">
        <ProtectedRoute>
          <Consultation />
        </ProtectedRoute>
      </Route>
      
      <Route path="/">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
