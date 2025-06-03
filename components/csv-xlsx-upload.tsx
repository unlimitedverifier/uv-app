"use client";

import { useState, useCallback, useEffect } from "react";
import { Upload, FileSpreadsheet, X, AlertCircle, Check, Info } from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

export function CsvXlsxUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<FileData | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [processedDisplayData, setProcessedDisplayData] = useState<(string | number | null)[]>([]);
  const [processingAlertInfo, setProcessingAlertInfo] = useState<ProcessingAlertInfo | null>(null);

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
        document.getElementById('csv-xlsx-upload')?.click();
    }
  };

  const clearFile = () => {
    setUploadedFile(null);
    setSelectedColumn(null);
    setError(null);
    setProcessedDisplayData([]);
    setProcessingAlertInfo(null);
  };

  const selectColumn = (columnName: string) => {
    setSelectedColumn(selectedColumn === columnName ? null : columnName);
  };
  
  return (
    <Card className="w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-xl font-semibold">CSV & XLSX File Upload</h2>
            <p className="text-sm text-muted-foreground">
              Upload a single CSV or XLSX file to process its columns.
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Upload Area - Conditionally Rendered */}
        {!uploadedFile && (
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              id="csv-xlsx-upload"
              type="file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
            />
            
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-lg font-medium">
                  {isProcessing ? 'Processing file...' : 'Drop your CSV or XLSX file here'}
                </p>
                <p className="text-sm text-muted-foreground">
                  or click to browse (single .csv or .xlsx file)
                </p>
              </div>
              <Button onClick={triggerFileSelect} disabled={isProcessing}>
                Select File
              </Button>
            </div>
          </div>
        )}

        {/* File Info and Column Preview - Only show if a file is uploaded */}
        {uploadedFile && (
          <>
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
                Clear &amp; Upload New
              </Button>
            </div>

            {/* Column Table Preview */}
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2">Select Column to Process</h3>
                <p className="text-sm text-muted-foreground">
                  Click on any column header or data to select it for processing
                </p>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  <div className={`inline-flex ${uploadedFile.columns.length * 192 <= 1200 ? 'justify-center w-full' : 'min-w-full'}`}>
                    {uploadedFile.columns.map((column) => {
                      const isSelected = selectedColumn === column.name;
                      const sampleData = column.data.filter(val => val !== null && val !== '').slice(0, 8);
                      const valueCount = column.data.filter(val => val !== null && val !== '').length;
                      
                      return (
                        <div
                          key={column.name}
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

            {/* Selected Column Full Data Display */}
            {selectedColumn && processedDisplayData.length > 0 && (
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
            {selectedColumn && processedDisplayData.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                    No data to display for &quot;{selectedColumn}&quot;.
                    {processingAlertInfo?.isEmailColumn && " This might be due to all entries being empty, invalid, or duplicates."}
                </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
} 