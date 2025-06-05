"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, 
  Download, 
  Search,
  RefreshCw,
  Mail,
  Calendar,
  Filter,
  ChevronLeft,
  ChevronRight,
  Clock,
  TrendingUp,
  Trash2,
  RotateCcw
} from "lucide-react";

interface DetailedListData {
  metadata: {
    userId: string;
    listId: string;
    listName: string;
    columns: string[];
    uploadTimestamp: string;
    dateValidated: string;
    expiryDays: number;
  };
  rows: Record<string, unknown>[];
}

interface UserListSnippet {
  userId: string;
  listId: string;
  listName: string;
  uploadTimestamp: string;
  dateValidated: string;
  totalEmails: string;
  validCount: string;
  catchAllCount: string;
  unknownCount: string;
  invalidCount: string;
  percentValid: string;
  percentCatchAll: string;
  percentUnknown: string;
  percentInvalid: string;
  status: 'in_progress' | 'completed' | 'failed';
  additionalMetadata: string;
}

interface ValidationDetailsViewProps {
  userId: string;
  listId: string;
}

const ITEMS_PER_PAGE = 50;

export function ValidationDetailsView({ userId, listId }: ValidationDetailsViewProps) {
  const router = useRouter();
  const [listData, setListData] = useState<DetailedListData | null>(null);
  const [listSnippet, setListSnippet] = useState<UserListSnippet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Helper function to calculate estimated time (2 minutes per 1000 emails, minimum 10 minutes)
  const calculateEstimatedTime = (totalEmails: number): number => {
    const baseEstimate = Math.ceil((totalEmails / 1000) * 2 * 60000); // milliseconds
    const minEstimate = 10 * 60000; // 10 minutes minimum
    return Math.max(baseEstimate, minEstimate);
  };

  // Helper function to get time remaining for completion
  const getTimeRemaining = (uploadTimestamp: string, totalEmails: number): number => {
    const uploadTime = new Date(uploadTimestamp).getTime();
    const estimatedDuration = calculateEstimatedTime(totalEmails);
    const expectedCompletion = uploadTime + estimatedDuration;
    const now = Date.now();
    return Math.max(0, expectedCompletion - now);
  };

  // Helper function to check if job is stuck (over estimated time with no progress)
  const isJobStuck = (list: UserListSnippet): boolean => {
    if (list.status !== 'in_progress') return false;
    
    const totalEmails = parseInt(list.totalEmails);
    const validCount = parseInt(list.validCount);
    const catchAllCount = parseInt(list.catchAllCount || '0');
    const unknownCount = parseInt(list.unknownCount);
    const invalidCount = parseInt(list.invalidCount);
    const processedEmails = validCount + catchAllCount + unknownCount + invalidCount;
    
    // Calculate how long the job has been running (in milliseconds)
    const uploadTime = new Date(list.uploadTimestamp).getTime();
    const now = Date.now();
    const actualRunTime = now - uploadTime;
    
    // Minimum 10 minutes before considering a job stuck
    const minStuckTime = 10 * 60 * 1000; // 10 minutes in milliseconds
    
    // Estimated time for completion
    const estimatedTime = calculateEstimatedTime(totalEmails);
    
    // Job is stuck only if:
    // 1. It's been running for more than 10 minutes
    // 2. It's been running longer than the estimated time
    // 3. There's no progress (0 emails processed)
    return actualRunTime > minStuckTime && actualRunTime > estimatedTime && processedEmails === 0;
  };

  // Helper function to calculate auto-delete countdown (30 days from upload)
  const getAutoDeleteCountdown = (uploadTimestamp: string): { days: number; hours: number; minutes: number; expired: boolean } => {
    const uploadTime = new Date(uploadTimestamp).getTime();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
    const expiryTime = uploadTime + thirtyDaysMs;
    const now = Date.now();
    const timeLeft = expiryTime - now;

    if (timeLeft <= 0) {
      return { days: 0, hours: 0, minutes: 0, expired: true };
    }

    const days = Math.floor(timeLeft / (24 * 60 * 60 * 1000));
    const hours = Math.floor((timeLeft % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));

    return { days, hours, minutes, expired: false };
  };

  // Helper function to format time
  const formatTime = (milliseconds: number): string => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  // Helper function to format auto-delete countdown
  const formatAutoDeleteCountdown = (countdown: { days: number; hours: number; minutes: number; expired: boolean }): string => {
    if (countdown.expired) return 'Expired';
    if (countdown.days > 0) return `${countdown.days}d ${countdown.hours}h`;
    if (countdown.hours > 0) return `${countdown.hours}h ${countdown.minutes}m`;
    return `${countdown.minutes}m`;
  };

  // Fetch detailed list data
  const fetchListData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch both detailed data and snippet data
      const [detailResponse, snippetResponse] = await Promise.all([
        fetch(`/api/list-details/${userId}/${listId}`),
        fetch(`/api/user-lists/${userId}`)
      ]);
      
      if (!detailResponse.ok) {
        throw new Error(`HTTP ${detailResponse.status}: Failed to fetch list details`);
      }
      
      const detailData = await detailResponse.json();
      setListData(detailData);

      if (snippetResponse.ok) {
        const snippetData = await snippetResponse.json();
        const snippet = snippetData.lists?.find((list: UserListSnippet) => list.listId === listId);
        setListSnippet(snippet || null);
      }
      
    } catch (err) {
      console.error('Error fetching list data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch list data');
    } finally {
      setIsLoading(false);
    }
  }, [userId, listId]);

  useEffect(() => {
    fetchListData();
  }, [fetchListData]);

  // Download results
  const downloadResults = useCallback(async (format: 'json' | 'csv' = 'csv') => {
    try {
      const url = `/api/download-validated-data/${userId}/${listId}?format=${format}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to download results`);
      }

      if (format === 'csv') {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `${listData?.metadata.listName.replace(/\.[^/.]+$/, "")}_validated.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
      } else {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `${listData?.metadata.listName.replace(/\.[^/.]+$/, "")}_validated.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
      }
    } catch (err) {
      console.error('Error downloading results:', err);
      setError(err instanceof Error ? err.message : 'Failed to download results');
    }
  }, [userId, listId, listData]);

  // Filter and search data
  const filteredData = useMemo(() => {
    if (!listData) return [];
    
    let filtered = listData.rows;
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(row => 
        Object.values(row).some(value => 
          String(value || '').toLowerCase().includes(searchLower)
        )
      );
    }
    
    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(row => row.category === categoryFilter);
    }
    
    return filtered;
  }, [listData, searchTerm, categoryFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentPageData = filteredData.slice(startIndex, endIndex);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getCategoryBadge = (category: string) => {
    const baseClasses = "text-xs font-medium";
    switch (category) {
      case 'Good':
        return `${baseClasses} bg-green-100 text-green-800 border-green-200`;
      case 'Catch all':
        return `${baseClasses} bg-blue-100 text-blue-800 border-blue-200`;
      case 'Risky':
        return `${baseClasses} bg-orange-100 text-orange-800 border-orange-200`;
      case 'Bad':
        return `${baseClasses} bg-red-100 text-red-800 border-red-200`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 border-gray-200`;
    }
  };

  const getValidStatusBadge = (status: string) => {
    switch (status) {
      case 'Valid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Invalid':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Unknown':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Delete list function
  const deleteList = useCallback(async () => {
    if (!listData || !confirm(`Are you sure you want to delete "${listData.metadata.listName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/delete-list/${userId}/${listId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to delete list`);
      }

      // Navigate back to dashboard after deletion
      router.push('/protected');
    } catch (err) {
      console.error('Error deleting list:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete list');
    }
  }, [userId, listId, listData, router]);

  // Revalidate list function
  const revalidateList = useCallback(async () => {
    if (!listData || !confirm(`Restart validation for "${listData.metadata.listName}"?`)) {
      return;
    }

    try {
      // Trigger a new validation workflow for this list
      const response = await fetch('/api/workflows/create-list-job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          listId, // Reuse the same listId
          revalidate: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to restart validation`);
      }

      // Refresh the data after revalidation
      await fetchListData();
    } catch (err) {
      console.error('Error revalidating list:', err);
      setError(err instanceof Error ? err.message : 'Failed to restart validation');
    }
  }, [userId, listId, listData, fetchListData]);

  // Calculate stats for display
  const jobStuck = listSnippet ? isJobStuck(listSnippet) : false;
  const autoDeleteCountdown = listData ? getAutoDeleteCountdown(listData.metadata.uploadTimestamp) : null;
  const totalEmails = listSnippet ? parseInt(listSnippet.totalEmails) : 0;
  const estimatedMinutes = Math.ceil(calculateEstimatedTime(totalEmails) / 60000);
  const timeRemaining = listSnippet?.status === 'in_progress' ? getTimeRemaining(listData?.metadata.uploadTimestamp || '', totalEmails) : 0;

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin mr-3" />
            Loading validation details...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !listData) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">Failed to Load Data</h3>
              <p className="text-muted-foreground mb-4">{error || 'List data not found'}</p>
              <Button onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.back()}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to History
                </Button>
              </div>
              <CardTitle className="text-2xl">{listData.metadata.listName}</CardTitle>
              <CardDescription className="flex items-center gap-6 flex-wrap">
                <span className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {listData.rows.length} total rows
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Uploaded: {formatDate(listData.metadata.uploadTimestamp)}
                </span>
                {listData.metadata.dateValidated && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Validated: {formatDate(listData.metadata.dateValidated)}
                  </span>
                )}
                {listSnippet?.status === 'in_progress' && (
                  <span className="flex items-center gap-1 text-orange-600">
                    <Clock className="w-4 h-4" />
                    Est. {estimatedMinutes}min ({timeRemaining > 0 ? `${formatTime(timeRemaining)} left` : 'Should be done'})
                  </span>
                )}
                {autoDeleteCountdown && (
                  <span className={`flex items-center gap-1 text-xs ${autoDeleteCountdown.expired ? 'text-red-600' : autoDeleteCountdown.days < 1 ? 'text-orange-600' : 'text-muted-foreground'}`}>
                    <TrendingUp className="w-4 h-4" />
                    Auto-delete: {formatAutoDeleteCountdown(autoDeleteCountdown)}
                  </span>
                )}
              </CardDescription>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                {jobStuck && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={revalidateList}
                    className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Revalidate
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={deleteList}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete List
                </Button>
              </div>

              {/* Stuck Job Warning */}
              {jobStuck && (
                <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-sm text-orange-800">
                  ⚠️ This job appears to be stuck. Try revalidating to restart the process.
                </div>
              )}
            </div>
            
            {/* Summary Stats */}
            {listSnippet && (
              <div className="grid grid-cols-4 gap-4 ml-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{listSnippet.validCount}</div>
                  <div className="text-sm text-muted-foreground">Good</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{listSnippet.catchAllCount || '0'}</div>
                  <div className="text-sm text-muted-foreground">Catch all</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{listSnippet.unknownCount}</div>
                  <div className="text-sm text-muted-foreground">Risky</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{listSnippet.invalidCount}</div>
                  <div className="text-sm text-muted-foreground">Bad</div>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search all columns..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1); // Reset to first page on search
                  }}
                  className="pl-10"
                />
              </div>
              
              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setCurrentPage(1); // Reset to first page on filter
                  }}
                  className="border border-input bg-background px-3 py-2 text-sm rounded-md"
                >
                  <option value="all">All Categories</option>
                  <option value="Good">Good</option>
                  <option value="Catch all">Catch all</option>
                  <option value="Risky">Risky</option>
                  <option value="Bad">Bad</option>
                </select>
              </div>
            </div>
            
            {/* Download Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadResults('csv')}
              >
                <Download className="w-4 h-4 mr-2" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadResults('json')}
              >
                <Download className="w-4 h-4 mr-2" />
                JSON
              </Button>
            </div>
          </div>
          
          {/* Results count */}
          <div className="mt-3 text-sm text-muted-foreground">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredData.length)} of {filteredData.length} results
            {searchTerm && ` (filtered from ${listData.rows.length} total)`}
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted border-b sticky top-0">
                <tr>
                  {listData.metadata.columns.map((column, index) => (
                    <th key={index} className="px-4 py-3 text-left font-medium">
                      {column}
                    </th>
                  ))}
                  {listSnippet?.status === 'completed' && (
                    <>
                      <th className="px-4 py-3 text-left font-medium">Valid Status</th>
                      <th className="px-4 py-3 text-left font-medium">Category</th>
                      <th className="px-4 py-3 text-left font-medium">Catch All</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {currentPageData.map((row, index) => (
                  <tr key={startIndex + index} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/50'}>
                    {listData.metadata.columns.map((column, colIndex) => (
                      <td key={colIndex} className="px-4 py-3 max-w-xs">
                        <div className="truncate" title={String(row[column] || '')}>
                          {String(row[column] || '')}
                        </div>
                      </td>
                    ))}
                    {listSnippet?.status === 'completed' && (
                      <>
                        <td className="px-4 py-3">
                          <Badge className={`text-xs ${getValidStatusBadge(String(row.validStatus || ''))}`}>
                            {String(row.validStatus || '')}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={getCategoryBadge(String(row.category || ''))}>
                            {String(row.category || '')}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-muted-foreground">
                            {String(row.catchAll || '')}
                          </span>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredData.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              {searchTerm || categoryFilter !== 'all' 
                ? 'No results found with current filters' 
                : 'No data available'
              }
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 