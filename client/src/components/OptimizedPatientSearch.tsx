import { memo } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Loader2 } from 'lucide-react';

interface Patient {
  id: string;
  patientId: string;
  name: string;
  age: number;
  gender: string;
  contact?: string;
}

interface OptimizedPatientSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchResults: Patient[];
  isLoading: boolean;
  onPatientSelect: (patient: Patient) => void;
  placeholder?: string;
}

// Memoized patient search component to prevent unnecessary re-renders
export const OptimizedPatientSearch = memo(({
  searchTerm,
  onSearchChange,
  searchResults,
  isLoading,
  onPatientSelect,
  placeholder = "Search patients by name or ID..."
}: OptimizedPatientSearchProps) => {
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
          data-testid="input-patient-search"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-400" />
        )}
      </div>

      {searchResults && searchResults.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="max-h-60 overflow-y-auto">
              {searchResults.map((patient) => (
                <div
                  key={patient.id}
                  className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                  onClick={() => onPatientSelect(patient)}
                  data-testid={`patient-result-${patient.id}`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{patient.name}</p>
                      <p className="text-sm text-gray-600">
                        ID: {patient.patientId} • Age: {patient.age} • {patient.gender}
                      </p>
                      {patient.contact && (
                        <p className="text-sm text-gray-500">Contact: {patient.contact}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {searchTerm.length > 2 && !isLoading && searchResults?.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            No patients found matching "{searchTerm}"
          </CardContent>
        </Card>
      )}
    </div>
  );
});

OptimizedPatientSearch.displayName = 'OptimizedPatientSearch';