"use client";

import { useState, useCallback, useEffect } from "react";
import { Upload, FileSpreadsheet, X, AlertCircle, Check, Info, Play, Download, RefreshCw, File } from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

interface ColumnData {
  name: string;
  data: (string | number | null)[];
  type: string;
}

interface FileData {
  columns: ColumnData[];
  fileName: string;
}

interface ProcessingAlertInfo {
  emptyOrInvalidRemoved: number;
  duplicatesRemoved: number;
  originalCount: number;
  finalCount: number;
  isEmailColumn: boolean;
}

interface ValidationJob {
  listId: string;
  status: 'in_progress' | 'completed' | 'failed';
  totalEmails: number;
  processedEmails: number;
  overallProgress: number;
  results: {
    validCount: number;
    catchAllCount: number;
    unknownCount: number;
    invalidCount: number;
    percentValid: number;
    percentCatchAll: number;
    percentUnknown: number;
    percentInvalid: number;
  };
  dateValidated?: string;
}

interface FileUploadCardProps {
  userId: string; // Accept userId as prop
}

export function FileUploadCard({ userId }: FileUploadCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<FileData | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [processedDisplayData, setProcessedDisplayData] = useState<(string | number | null)[]>([]);
  const [processingAlertInfo, setProcessingAlertInfo] = useState<ProcessingAlertInfo | null>(null);

  // Validation states
  const [validationJob, setValidationJob] = useState<ValidationJob | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [validationStarted, setValidationStarted] = useState(false); // Prevent duplicates

  // Function to detect if a value looks like an email
  const isEmailLike = useCallback((value: unknown): boolean => {
    if (!value || typeof value !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value.trim());
  }, []);

  // Function to find the best email column
  const findBestEmailColumn = useCallback((columns: ColumnData[]): string | null => {
    for (const column of columns) {
      if (column.name.toLowerCase() === 'email') {
        return column.name;
      }
    }

    let bestColumn: { name: string; score: number } | null = null;
    for (const column of columns) {
      let score = 0;
      const columnNameLower = column.name.toLowerCase();
      const emailKeywords = ['e-mail', 'mail', 'address', 'contact'];
      
      if (emailKeywords.some(keyword => columnNameLower.includes(keyword))) {
        score += 10; 
      }

      const sampleValues = column.data
        .filter(val => val !== null && val !== undefined && val !== '')
        .slice(0, 8);

      if (sampleValues.length > 0) {
        const emailCount = sampleValues.filter(val => isEmailLike(val)).length;
        const emailRatio = emailCount / sampleValues.length;
        score += emailRatio * 8; 
        if (emailRatio >= 0.5) {
          score += 5;
        }
      }

      if (!bestColumn || score > bestColumn.score) {
        bestColumn = { name: column.name, score };
      }
    }
    return bestColumn && bestColumn.score >= 2 ? bestColumn.name : null;
  }, [isEmailLike]);

  // Function to process the file
  const processFile = useCallback(async (file: File) => {
    setError(null);
    setIsProcessing(true);

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !['csv', 'xlsx', 'xls'].includes(fileExtension)) {
      setError('Invalid file type. Please upload only CSV or XLSX files.');
      setIsProcessing(false);
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      let workbook: XLSX.WorkBook;

      if (fileExtension === 'csv') {
        const text = new TextDecoder().decode(buffer);
        workbook = XLSX.read(text, { type: 'string' });
      } else {
        workbook = XLSX.read(buffer, { type: 'array' });
      }

      const worksheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[worksheetName];
      
      // Use the correct typing for sheet_to_json
      const jsonData = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });
      
      if (!Array.isArray(jsonData) || jsonData.length === 0) {
        setError('The file appears to be empty.');
        setUploadedFile(null);
        setSelectedColumn(null);
        setProcessedDisplayData([]);
        setProcessingAlertInfo(null);
        setIsProcessing(false);
        return;
      }

      const headers = jsonData[0] as string[];
      const dataRows = jsonData.slice(1);

      // Create columns with proper type casting
      const columns: ColumnData[] = headers.map((header, index) => {
        // Explicitly cast each cell value to string or number
        const columnData = dataRows.map((row) => {
          // Safely access the row data with proper type checking
          if (!Array.isArray(row)) return null;
          
          const value = row[index];
          if (value === null || value === undefined || value === '') return null;
          
          // Convert to number if it's a numeric value
          const numValue = Number(value);
          if (!isNaN(numValue) && typeof value !== 'boolean') {
            return numValue;
          }
          
          // Otherwise convert to string
          return String(value);
        });
        
        let type = 'text';
        const sampleValues = columnData.filter(val => val !== null).slice(0, 10);
        if (sampleValues.length > 0) {
          const allNumbers = sampleValues.every(val => typeof val === 'number' || (typeof val === 'string' && !isNaN(Number(val))));
          const allDates = sampleValues.every(val => {
            if (val === null) return false;
            try {
              return !isNaN(Date.parse(String(val)));
            } catch {
              return false;
            }
          });
          
          if (allNumbers) type = 'number';
          else if (allDates) type = 'date';
        }
        
        return {
          name: header || `Column ${index + 1}`,
          data: columnData,
          type
        };
      });

      const fileData = { columns, fileName: file.name };
      setUploadedFile(fileData);

      // Reset dependent states for the new file
      setSelectedColumn(null); 
      setProcessedDisplayData([]);
      setProcessingAlertInfo(null);
      setValidationJob(null);

      const bestEmailColumn = findBestEmailColumn(columns);
      if (bestEmailColumn) {
        setSelectedColumn(bestEmailColumn);
      }

    } catch (err) {
      console.error('Error processing file:', err);
      setError('Error processing file. Please ensure it is a valid CSV or XLSX file.');
      setUploadedFile(null);
      setSelectedColumn(null);
      setProcessedDisplayData([]);
      setProcessingAlertInfo(null);
    } finally {
      setIsProcessing(false);
    }
  }, [findBestEmailColumn]);

  // Function to start email validation
  const startValidation = useCallback(async () => {
    if (!uploadedFile || !selectedColumn || !processingAlertInfo?.isEmailColumn) {
      setError('Please select an email column before starting validation.');
      return;
    }

    // Prevent duplicate calls - enhanced protection
    if (isValidating || validationJob || validationStarted) {
      console.log('⚠️ Validation already in progress or started, ignoring duplicate call');
      return;
    }

    setIsValidating(true);
    setValidationStarted(true);
    setError(null);

    try {
      // Prepare the file payload by converting columns back to rows format
      const emailColumnData = uploadedFile.columns.find(col => col.name === selectedColumn);
      if (!emailColumnData || !emailColumnData.data) {
        throw new Error('Selected email column not found or has no data');
      }

      // Create rows format expected by the backend
      const filePayload = emailColumnData.data.map((email, index) => {
        const row: Record<string, unknown> = {};
        
        // Add all columns for this row
        uploadedFile.columns.forEach(column => {
          row[column.name] = column.data[index];
        });

        return row;
      }).filter(row => row[selectedColumn] && String(row[selectedColumn]).trim() !== '');

      // Validate that we have data to send
      if (!Array.isArray(filePayload) || filePayload.length === 0) {
        throw new Error('No valid email data found to validate. Please check your email column.');
      }

      // Generate listId client-side to use consistently
      const listId = `list-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Use the passed userId instead of hardcoded demo-user
      console.log(`🚀 Starting validation with userId: ${userId}, listId: ${listId}, totalEmails: ${filePayload.length}`);

      const response = await fetch('/api/workflows/create-list-job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          originalFileName: uploadedFile.fileName,
          filePayload,
          selectedColumn,
          listId
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to start validation`);
      }

      const result = await response.json();
      console.log(`✅ Workflow created successfully:`, result);
      
      // Use the same listId for progress tracking
      setValidationJob({
        listId, // Use our generated listId
        status: 'in_progress',
        totalEmails: filePayload.length,
        processedEmails: 0,
        overallProgress: 0,
        results: {
          validCount: 0,
          catchAllCount: 0,
          unknownCount: 0,
          invalidCount: 0,
          percentValid: 0,
          percentCatchAll: 0,
          percentUnknown: 0,
          percentInvalid: 0
        }
      });

      // Start polling for progress with the generated listId
      setIsPolling(true);
      // Wait a moment for the workflow to initialize data in Redis
      setTimeout(() => pollProgress(userId, listId), 30000); // Wait 30 seconds before first poll

    } catch (err) {
      console.error('Error starting validation:', err);
      setError(err instanceof Error ? err.message : 'Failed to start email validation');
      setValidationJob(null); // Clear any partial validation job
      setValidationStarted(false); // Reset flag on error
    } finally {
      setIsValidating(false);
    }
  }, [uploadedFile, selectedColumn, processingAlertInfo, isValidating, validationJob, validationStarted, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Function to poll validation progress
  const pollProgress = useCallback(async (userId: string, listId: string) => {
    // Safety check: ensure we have valid parameters
    if (!userId || !listId || listId === 'undefined') {
      console.error('Invalid polling parameters:', { userId, listId });
      setIsPolling(false);
      setError('Invalid polling parameters - cannot check progress');
      return;
    }

    try {
      const response = await fetch(`/api/list-progress/${userId}/${listId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch progress`);
      }

      const progress = await response.json();
      
      setValidationJob(prevJob => ({
        ...prevJob!,
        status: progress.status,
        totalEmails: progress.totalEmails,
        processedEmails: progress.processedEmails,
        overallProgress: progress.overallProgress,
        results: progress.results,
        dateValidated: progress.dateValidated
      }));

      // Continue polling if still in progress (every 1 minute)
      if (progress.status === 'in_progress') {
        setTimeout(() => pollProgress(userId, listId), 60000); // Poll every 1 minute
      } else {
        setIsPolling(false);
      }

    } catch (err) {
      console.error('Error polling progress:', err);
      setIsPolling(false);
      // Only set error for critical failures, not temporary network issues
      if (err instanceof Error && err.message.includes('404')) {
        setError('Validation job not found - it may have expired or failed to start');
      }
    }
  }, []);

  // Function to download validated results
  const downloadResults = useCallback(async (format: 'json' | 'csv' = 'csv') => {
    if (!validationJob || validationJob.status !== 'completed') return;

    try {
      // Use the passed userId instead of hardcoded demo-user
      const url = `/api/download-validated-data/${userId}/${validationJob.listId}?format=${format}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to download results`);
      }

      if (format === 'csv') {
        // Download CSV file
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `${uploadedFile?.fileName.replace(/\.[^/.]+$/, "")}_validated.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
      } else {
        // Download JSON file
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `${uploadedFile?.fileName.replace(/\.[^/.]+$/, "")}_validated.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
      }

    } catch (err) {
      console.error('Error downloading results:', err);
      setError(err instanceof Error ? err.message : 'Failed to download results');
    }
  }, [validationJob, uploadedFile, userId]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!uploadedFile) {
    setIsDragging(true);
    }
  }, [uploadedFile]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (uploadedFile) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    if (files.length > 1) {
      setError('Please upload only one file at a time.');
      return;
    }
    
    const file = files[0];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (!fileExtension || !['csv', 'xlsx', 'xls'].includes(fileExtension)) {
      setError('Invalid file type. Please upload only CSV or XLSX files. Folders and ZIP files are not supported.');
      return;
    }
    // Basic check for folders
    if (file.type === "" && file.size % 4096 === 0 && !fileExtension) {
        setError('Folders are not supported. Please upload a single CSV or XLSX file.');
        return;
    }

    processFile(file);
  }, [uploadedFile, processFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (uploadedFile) return;

    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (files.length > 1) {
      setError('Please upload only one file at a time.');
       e.target.value = '';
      return;
    }

    const file = files[0];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !['csv', 'xlsx', 'xls'].includes(fileExtension)) {
      setError('Invalid file type. Please upload only CSV or XLSX files.');
      e.target.value = '';
      return;
    }
    
    processFile(file);
    e.target.value = '';
  }, [uploadedFile, processFile]);

  useEffect(() => {
    if (selectedColumn && uploadedFile) {
      const columnData = uploadedFile.columns.find(col => col.name === selectedColumn);
      if (columnData) {
        const originalData = columnData.data;
        const originalCount = originalData.length;
        
        const sampleData = originalData.filter(v => v !== null && String(v).trim() !== '').slice(0, 20);
        const emailLikeCount = sampleData.filter(v => isEmailLike(v)).length;
        const isLikelyEmailColumn = sampleData.length > 0 && (emailLikeCount / sampleData.length) > 0.5;

        if (isLikelyEmailColumn) {
          const validEmails = originalData
            .map(val => val !== null ? String(val).trim() : null)
            .filter(val => val && isEmailLike(val)) as string[];
          
          const emptyOrInvalidRemoved = originalCount - validEmails.length;
          
          const uniqueEmails = Array.from(new Set(validEmails.map(email => email.toLowerCase())));
          const duplicatesRemoved = validEmails.length - uniqueEmails.length;
          const finalCount = uniqueEmails.length;

          setProcessedDisplayData(uniqueEmails);
          setProcessingAlertInfo({
            emptyOrInvalidRemoved,
            duplicatesRemoved,
            originalCount,
            finalCount,
            isEmailColumn: true,
          });
        } else {
          setProcessedDisplayData(originalData);
          setProcessingAlertInfo({
            emptyOrInvalidRemoved: 0,
            duplicatesRemoved: 0,
            originalCount,
            finalCount: originalCount,
            isEmailColumn: false,
          });
        }
      }
    } else {
      // If no column is selected or no file, clear processed data and alert
      if (!selectedColumn) {
          setProcessedDisplayData([]);
          setProcessingAlertInfo(null);
      }
    }
  }, [selectedColumn, uploadedFile, isEmailLike]);

  const triggerFileSelect = () => {
    // Only trigger if no file is uploaded, to prevent interaction when dropzone is hidden
    if (!uploadedFile) {
    document.getElementById('file-upload-main')?.click();
    }
  };

  const clearFile = () => {
    setUploadedFile(null);
    setSelectedColumn(null);
    setError(null);
    setProcessedDisplayData([]);
    setProcessingAlertInfo(null);
    setValidationJob(null);
    setIsPolling(false);
    setValidationStarted(false); // Reset validation flag
  };

  const selectColumn = (columnName: string) => {
    setSelectedColumn(selectedColumn === columnName ? null : columnName);
  };

  return (
    <div className="flex w-full flex-col rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-black">
      
      {/* Header Section */}
      <div className="flex w-full flex-col rounded-lg p-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-medium text-slate-900 dark:text-slate-100">
              CSV & XLSX Email Validation
          </h2>
          </div>
          <p className="text-sm font-normal text-slate-900/60 dark:text-slate-100/60">
            Upload your CSV or XLSX file with email addresses and get detailed validation results.
          </p>
        </div>
      </div>
      
      {/* Divider */}
      <div className="flex w-full px-6">
        <div className="w-full border-b border-slate-200 dark:border-slate-800" />
      </div>
      
      {/* Main Content Area */}
      <div className="relative mx-auto flex w-full flex-col items-center p-6">

        {/* Error Display */}
        {error && (
          <Alert variant="destructive" className="mb-6 w-full">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Upload Area - Conditionally Rendered */}
        {!uploadedFile && (
        <label 
          htmlFor="file-upload-main"
          className={`relative flex w-full flex-col items-center justify-center gap-6 overflow-hidden rounded-lg border px-6 py-24 cursor-pointer transition-all duration-200 group ${
            isDragging 
              ? 'border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
              : 'border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          
          {/* Content */}
          <div className="z-10 flex max-w-[460px] flex-col items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-900/20 bg-white hover:border-slate-900/40 dark:border-slate-100/20 dark:bg-slate-950 dark:hover:border-slate-100/40 transition-all duration-200 group-hover:scale-105 group-hover:shadow-lg">
              <Upload className="h-8 w-8 stroke-[1.5px] text-slate-900/60 dark:text-slate-100/60" />
            </div>
            
            <div className="flex flex-col items-center gap-2">
              <p className="text-base font-medium text-slate-900 dark:text-slate-100">
                  {isProcessing ? 'Processing file...' : 'Drop your CSV or XLSX file here'}
              </p>
              <p className="text-center text-base font-normal text-slate-900/60 dark:text-slate-100/60">
                  or click to browse (single .csv or .xlsx file)
              </p>
              <span className="select-none items-center rounded-full bg-blue-500/5 px-3 py-1 text-xs font-medium tracking-tight text-blue-700 ring-1 ring-inset ring-blue-600/20 backdrop-blur-md dark:bg-blue-900/40 dark:text-blue-100 flex">
                  ✨ Email Validation Enabled
              </span>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3" onClick={(e) => e.stopPropagation()}>
              <button 
                onClick={triggerFileSelect}
                  disabled={isProcessing}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors bg-slate-900 text-slate-50 hover:bg-slate-900/90 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-100/90 h-10 px-4 py-2 disabled:opacity-50"
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Select File
              </button>
            </div>
          </div>
          
          {/* Hidden File Input */}
          <input 
            id="file-upload-main" 
            type="file" 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
              accept=".csv,.xlsx,.xls"
            onChange={handleFileSelect}
          />
          
          {/* Background Grid Pattern */}
          <div 
            className="absolute h-full w-full opacity-40 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(148, 163, 184, 0.3) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(148, 163, 184, 0.3) 1px, transparent 1px)
              `,
              backgroundSize: '24px 24px'
            }}
          />
          
          {/* Bottom Gradient Overlay */}
          <div className="absolute bottom-0 h-full w-full bg-gradient-to-t from-white to-transparent dark:from-slate-900 pointer-events-none" />
          
          {/* Drag Overlay - Shows when dragging */}
          {isDragging && (
            <div className="absolute inset-0 bg-blue-500/10 border-2 border-blue-400 border-dashed rounded-lg pointer-events-none" />
          )}
        </label>
        )}

        {/* File Info and Column Preview - Only show if a file is uploaded */}
        {uploadedFile && (
          <div className="w-full space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-green-600" />
                <span className="font-medium">{uploadedFile.fileName}</span>
                <span className="text-sm text-muted-foreground">
                  ({uploadedFile.columns.length} columns, {uploadedFile.columns[0]?.data.length || 0} rows)
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={clearFile}>
                <X className="h-4 w-4 mr-2" />
                Clear & Upload New
              </Button>
            </div>
            
            {/* Column Table Preview */}
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2">Select Email Column to Validate</h3>
                <p className="text-sm text-muted-foreground">
                  Click on any column header or data to select it for email validation
                </p>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  <div className={`inline-flex ${uploadedFile.columns.length * 192 <= 1200 ? 'justify-center w-full' : 'min-w-full'}`}>
                    {uploadedFile.columns.map((column, columnIndex) => {
                      const isSelected = selectedColumn === column.name;
                      const sampleData = column.data.filter(val => val !== null && val !== '').slice(0, 8);
                      const valueCount = column.data.filter(val => val !== null && val !== '').length;
                      
                      return (
                        <div
                          key={`${column.name}-${columnIndex}`}
                          className={`flex-shrink-0 w-48 border-r last:border-r-0 cursor-pointer transition-all hover:bg-muted/30 ${
                            isSelected ? 'bg-primary/10 ring-2 ring-primary/20' : ''
                          }`}
                          onClick={() => selectColumn(column.name)}
                        >
                          <div className={`p-3 border-b bg-muted/50 ${isSelected ? 'bg-primary/20' : ''}`}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={(e) => { e.stopPropagation(); selectColumn(column.name); }}
                                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                    isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/30 hover:border-primary'
                                  }`}
                                >{isSelected && <Check className="h-3 w-3" />}</button>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <h4 className="font-medium text-sm truncate" title={column.name}>{column.name}</h4>
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{column.type}</span>
                                <span>{valueCount} values</span>
                              </div>
                            </div>
                          </div>
                          <div className="divide-y">
                            {sampleData.length > 0 ? (
                              sampleData.map((value, index) => (
                                <div key={index} className={`p-2 text-sm ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
                                  <div className="truncate" title={String(value)}>{String(value)}</div>
                                </div>))
                            ) : (<div className="p-3 text-sm text-muted-foreground italic text-center">No data</div>)}
                            {valueCount > 8 && (<div className="p-2 text-xs text-muted-foreground text-center bg-muted/30">+{valueCount - 8} more</div>)}
                            {sampleData.length < 8 && Array.from({ length: 8 - sampleData.length }).map((_, index) => (
                              <div key={`empty-${index}`} className={`p-2 h-9 ${(sampleData.length + index) % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}/>))}
                          </div>
                        </div>);
                    })}
                  </div>
                </div>
              </div>
              {uploadedFile.columns.length * 192 > 1200 && (<p className="text-xs text-muted-foreground text-center">← Scroll horizontally to see all columns →</p>)}
            </div>

            {/* Processing Info Alert */}
            {processingAlertInfo && (processingAlertInfo.emptyOrInvalidRemoved > 0 || processingAlertInfo.duplicatesRemoved > 0) && processingAlertInfo.isEmailColumn && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Email Column Processed</AlertTitle>
                <AlertDescription>
                  {processingAlertInfo.emptyOrInvalidRemoved > 0 && (
                    <span className="block">
                      • Removed {processingAlertInfo.emptyOrInvalidRemoved} empty or invalid email entries.
                    </span>
                  )}
                  {processingAlertInfo.duplicatesRemoved > 0 && (
                    <span className="block">
                      • Removed {processingAlertInfo.duplicatesRemoved} duplicate email entries.
                    </span>
                  )}
                  <span className="block">
                    • Original entries: {processingAlertInfo.originalCount}. Final unique emails: {processingAlertInfo.finalCount}.
                  </span>
                </AlertDescription>
              </Alert>
            )}

            {/* Start Validation Button */}
            {selectedColumn && processingAlertInfo?.isEmailColumn && !validationJob && (
              <div className="flex justify-center">
                <Button 
                  onClick={startValidation} 
                  disabled={isValidating}
                  size="lg"
                  className="bg-primary hover:bg-primary/90"
                >
                  {isValidating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Starting Validation...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Start Email Validation ({processingAlertInfo.finalCount} emails)
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Validation Progress */}
            {validationJob && (
              <Card className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Email Validation Progress</h3>
                    <div className="flex items-center gap-2">
                      {isPolling && <RefreshCw className="h-4 w-4 animate-spin" />}
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        validationJob.status === 'completed' ? 'bg-green-100 text-green-800' :
                        validationJob.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {validationJob.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress: {validationJob.processedEmails} / {validationJob.totalEmails}</span>
                      <span>{validationJob.overallProgress}%</span>
                    </div>
                    <Progress value={validationJob.overallProgress} className="w-full" />
                  </div>
                  
                  {validationJob.processedEmails > 0 && (
                    <div className="grid grid-cols-4 gap-3 pt-4">
                      <div key="valid-category" className="text-center">
                        <div className="text-xl font-bold text-green-600">{validationJob.results.validCount}</div>
                        <div className="text-sm text-muted-foreground">Good ({validationJob.results.percentValid.toFixed(1)}%)</div>
                      </div>
                      <div key="catchall-category" className="text-center">
                        <div className="text-xl font-bold text-blue-600">{validationJob.results.catchAllCount}</div>
                        <div className="text-sm text-muted-foreground">Catch all ({validationJob.results.percentCatchAll.toFixed(1)}%)</div>
                      </div>
                      <div key="risky-category" className="text-center">
                        <div className="text-xl font-bold text-orange-600">{validationJob.results.unknownCount}</div>
                        <div className="text-sm text-muted-foreground">Risky ({validationJob.results.percentUnknown.toFixed(1)}%)</div>
                      </div>
                      <div key="invalid-category" className="text-center">
                        <div className="text-xl font-bold text-red-600">{validationJob.results.invalidCount}</div>
                        <div className="text-sm text-muted-foreground">Bad ({validationJob.results.percentInvalid.toFixed(1)}%)</div>
                      </div>
                    </div>
                  )}

                  {validationJob.status === 'completed' && (
                    <div className="flex gap-3 pt-4">
                      <Button onClick={() => downloadResults('csv')} className="flex-1">
                        <Download className="h-4 w-4 mr-2" />
                        Download CSV
                      </Button>
                      <Button onClick={() => downloadResults('json')} variant="outline" className="flex-1">
                        <Download className="h-4 w-4 mr-2" />
                        Download JSON
                      </Button>
                    </div>
                  )}

                  {validationJob.dateValidated && (
                    <p className="text-xs text-muted-foreground text-center">
                      Completed: {new Date(validationJob.dateValidated).toLocaleString()}
                    </p>
                  )}
                </div>
              </Card>
            )}

            {/* Selected Column Full Data Display */}
            {selectedColumn && processedDisplayData.length > 0 && !validationJob && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Displaying Data for &quot;{selectedColumn}&quot;</h3>
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground">{processedDisplayData.length} values</div>
                    <Button variant="outline" size="sm" onClick={() => setSelectedColumn(null)}>Deselect</Button>
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto border rounded-lg">
                  <div className="grid gap-0">
                    {processedDisplayData.slice(0, 100).map((value, index) => (
                      <div key={index} className={`px-4 py-2 border-b last:border-b-0 ${index % 2 === 0 ? 'bg-muted/30' : 'bg-background'}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">{value !== null && String(value).trim() !== '' ? String(value) : (<span className="text-muted-foreground italic">empty</span>)}</span>
                          <span className="text-xs text-muted-foreground">Row {index + 1}</span>
                        </div>
                      </div>))}
                    {processedDisplayData.length > 100 && (<div className="px-4 py-3 text-center text-sm text-muted-foreground bg-muted/50">... and {processedDisplayData.length - 100} more rows</div>)}
                    {processedDisplayData.length === 0 && selectedColumn && (<div className="px-4 py-3 text-center text-sm text-muted-foreground">No valid data to display for this column after processing.</div>)}
                  </div>
                </div>
            </div>
            )}
            {selectedColumn && processedDisplayData.length === 0 && !validationJob && (
                <div className="text-center py-4 text-muted-foreground">
                    No data to display for &quot;{selectedColumn}&quot;.
                    {processingAlertInfo?.isEmailColumn && " This might be due to all entries being empty, invalid, or duplicates."}
            </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 