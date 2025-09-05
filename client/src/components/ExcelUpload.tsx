import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertCircle, Download } from 'lucide-react';

interface ExcelUploadProps {
  onSuccess?: () => void;
}

interface UploadResult {
  success: boolean;
  totalRows: number;
  imported: number;
  duplicates: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
}

export function ExcelUpload({ onSuccess }: ExcelUploadProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('excel', file);
      
      const response = await fetch('/api/medicines/upload-excel', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }
      
      return response.json();
    },
    onSuccess: (result: UploadResult) => {
      setUploadResult(result);
      queryClient.invalidateQueries({ queryKey: ['/api/medicines'] });
      
      if (result.success && result.imported > 0) {
        toast({
          title: 'Upload Successful',
          description: `${result.imported} medicines imported successfully${result.duplicates > 0 ? `, ${result.duplicates} duplicates skipped` : ''}`,
        });
        onSuccess?.();
      } else if (result.errors.length > 0) {
        toast({
          title: 'Upload Completed with Issues',
          description: `${result.imported} imported, ${result.errors.length} errors found`,
          variant: 'destructive',
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload Excel file',
        variant: 'destructive',
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validExtensions = ['.xlsx', '.xls'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      if (!validExtensions.includes(fileExtension)) {
        toast({
          title: 'Invalid File Type',
          description: 'Please select an Excel file (.xlsx or .xls)',
          variant: 'destructive',
        });
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File Too Large',
          description: 'Please select a file smaller than 10MB',
          variant: 'destructive',
        });
        return;
      }
      
      setSelectedFile(file);
      setUploadResult(null);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    uploadMutation.mutate(selectedFile);
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadTemplate = () => {
    // Create a sample template for download
    const templateUrl = '/api/medicines/excel-template';
    const link = document.createElement('a');
    link.href = templateUrl;
    link.download = 'medicine-template.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-medical-primary">
          <FileSpreadsheet className="h-5 w-5" />
          Bulk Import Medicines from Excel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Template Download */}
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div>
            <p className="text-sm font-medium text-blue-900">Need a template?</p>
            <p className="text-xs text-blue-700">Download our Excel template to get the correct format</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadTemplate}
            className="text-blue-600 border-blue-300"
            data-testid="download-template"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </Button>
        </div>

        {/* File Selection */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
              data-testid="file-input"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2"
              data-testid="select-file-button"
            >
              <Upload className="h-4 w-4" />
              Select Excel File
            </Button>
            
            {selectedFile && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <FileSpreadsheet className="h-3 w-3" />
                  {selectedFile.name}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFile}
                  className="h-6 w-6 p-0"
                  data-testid="clear-file"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {selectedFile && (
            <div className="flex gap-2">
              <Button
                onClick={handleUpload}
                disabled={uploadMutation.isPending}
                className="bg-medical-primary hover:bg-medical-primary-dark"
                data-testid="upload-button"
              >
                {uploadMutation.isPending ? (
                  <>
                    <Upload className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload & Import
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Upload Results */}
        {uploadResult && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                {uploadResult.success ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                )}
                Upload Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Total Rows</p>
                  <p className="font-semibold">{uploadResult.totalRows}</p>
                </div>
                <div>
                  <p className="text-gray-600">Imported</p>
                  <p className="font-semibold text-green-600">{uploadResult.imported}</p>
                </div>
                <div>
                  <p className="text-gray-600">Duplicates Skipped</p>
                  <p className="font-semibold text-yellow-600">{uploadResult.duplicates}</p>
                </div>
                <div>
                  <p className="text-gray-600">Errors</p>
                  <p className="font-semibold text-red-600">{uploadResult.errors.length}</p>
                </div>
              </div>

              {uploadResult.errors.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-red-700">Errors found:</p>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {uploadResult.errors.map((error, index) => (
                      <div key={index} className="text-xs p-2 bg-red-50 rounded border border-red-200">
                        <span className="font-medium">Row {error.row}:</span> {error.field} - {error.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <div className="text-xs text-gray-600 space-y-1 mt-4 p-4 bg-gray-50 rounded">
          <p className="font-medium">Excel Format Requirements:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Required columns: Medicine Name, Batch Number, Quantity, Units, MRP</li>
            <li>Optional columns: Manufacture Date, Expiry Date, Manufacturer, Category, Description</li>
            <li>Date format: DD/MM/YYYY or MM/DD/YYYY</li>
            <li>Duplicates based on Medicine Name + Batch Number will be skipped</li>
            <li>Maximum file size: 10MB</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}