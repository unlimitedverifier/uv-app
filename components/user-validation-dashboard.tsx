"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Download, 
  Eye, 
  RefreshCw,
  Mail,
  TrendingUp,
  Calendar,
  FileText,
  Trash2,
  RotateCcw
} from "lucide-react";

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

interface UserValidationDashboardProps {
  userId: string;
}

export function UserValidationDashboard({ userId }: UserValidationDashboardProps) {
  const router = useRouter();
  const [userLists, setUserLists] = useState<UserListSnippet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Fetch user's validation lists
  const fetchUserLists = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/user-lists/${userId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch user lists`);
      }
      
      const data = await response.json();
      setUserLists(data.lists || []);
    } catch (err) {
      console.error('Error fetching user lists:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch validation lists');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Delete list function
  const deleteList = useCallback(async (listId: string, listName: string) => {
    if (!confirm(`Are you sure you want to delete "${listName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/delete-list/${userId}/${listId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to delete list`);
      }

      // Refresh the list after deletion
      await fetchUserLists();
    } catch (err) {
      console.error('Error deleting list:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete list');
    }
  }, [userId, fetchUserLists]);

  // Revalidate list function
  const revalidateList = useCallback(async (listId: string, listName: string) => {
    if (!confirm(`Restart validation for "${listName}"?`)) {
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

      // Refresh the list after revalidation
      await fetchUserLists();
    } catch (err) {
      console.error('Error revalidating list:', err);
      setError(err instanceof Error ? err.message : 'Failed to restart validation');
    }
  }, [userId, fetchUserLists]);

  // Download results
  const downloadResults = useCallback(async (listId: string, fileName: string, format: 'json' | 'csv' = 'csv') => {
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
        a.download = `${fileName.replace(/\.[^/.]+$/, "")}_validated.csv`;
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
        a.download = `${fileName.replace(/\.[^/.]+$/, "")}_validated.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
      }
    } catch (err) {
      console.error('Error downloading results:', err);
      setError(err instanceof Error ? err.message : 'Failed to download results');
    }
  }, [userId]);

  useEffect(() => {
    fetchUserLists();
  }, [fetchUserLists]);

  // Auto-refresh in-progress jobs every 1 minute (changed from 30 seconds)
  useEffect(() => {
    const inProgressLists = userLists.filter(list => list.status === 'in_progress');
    
    if (inProgressLists.length > 0) {
      const interval = setInterval(() => {
        fetchUserLists();
      }, 60000); // Refresh every 1 minute

      return () => clearInterval(interval);
    }
  }, [userLists, fetchUserLists]);

  const inProgressLists = userLists.filter(list => list.status === 'in_progress');
  const completedLists = userLists.filter(list => list.status === 'completed');
  const failedLists = userLists.filter(list => list.status === 'failed');

  const formatDate = (dateString: string) => {
    if (!dateString) return 'In progress...';
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const ListCard = ({ list }: { list: UserListSnippet }) => {
    const totalEmails = parseInt(list.totalEmails);
    const validCount = parseInt(list.validCount);
    const catchAllCount = parseInt(list.catchAllCount || '0');
    const unknownCount = parseInt(list.unknownCount);
    const invalidCount = parseInt(list.invalidCount);
    const processedEmails = validCount + catchAllCount + unknownCount + invalidCount;
    const progress = totalEmails > 0 ? (processedEmails / totalEmails) * 100 : 0;

    // Calculate estimated time and countdown for in-progress jobs
    const estimatedTimeMs = calculateEstimatedTime(totalEmails);
    const timeRemaining = list.status === 'in_progress' ? getTimeRemaining(list.uploadTimestamp, totalEmails) : 0;
    const estimatedMinutes = Math.ceil(estimatedTimeMs / 60000);
    const jobStuck = isJobStuck(list);

    // Calculate auto-delete countdown
    const autoDeleteCountdown = getAutoDeleteCountdown(list.uploadTimestamp);

    return (
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">{list.listName}</CardTitle>
              <CardDescription className="flex items-center gap-4 mt-1 flex-wrap">
                <span className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {list.totalEmails} emails
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(list.uploadTimestamp)}
                </span>
                {list.status === 'in_progress' && (
                  <span className="flex items-center gap-1 text-orange-600">
                    <Clock className="w-4 h-4" />
                    Est. {estimatedMinutes}min ({timeRemaining > 0 ? `${formatTime(timeRemaining)} left` : 'Should be done'})
                  </span>
                )}
                <span className={`flex items-center gap-1 text-xs ${autoDeleteCountdown.expired ? 'text-red-600' : autoDeleteCountdown.days < 1 ? 'text-orange-600' : 'text-muted-foreground'}`}>
                  <TrendingUp className="w-4 h-4" />
                  Auto-delete: {formatAutoDeleteCountdown(autoDeleteCountdown)}
                </span>
              </CardDescription>
            </div>
            {getStatusBadge(list.status)}
          </div>
        </CardHeader>
        
        <CardContent>
          {list.status === 'in_progress' && (
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Progress: {processedEmails} / {totalEmails}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
              {jobStuck && (
                <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-sm text-orange-800">
                  ⚠️ This job appears to be stuck. Try revalidating to restart the process.
                </div>
              )}
            </div>
          )}

          {list.status === 'completed' && (
            <div className="grid grid-cols-4 gap-3 mb-4">
              <div className="text-center">
                <div className="text-xl font-bold text-green-600">{list.validCount}</div>
                <div className="text-xs text-muted-foreground">Good ({parseFloat(list.percentValid).toFixed(1)}%)</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-blue-600">{list.catchAllCount || '0'}</div>
                <div className="text-xs text-muted-foreground">Catch all ({parseFloat(list.percentCatchAll || '0').toFixed(1)}%)</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-orange-600">{list.unknownCount}</div>
                <div className="text-xs text-muted-foreground">Risky ({parseFloat(list.percentUnknown).toFixed(1)}%)</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-red-600">{list.invalidCount}</div>
                <div className="text-xs text-muted-foreground">Bad ({parseFloat(list.percentInvalid).toFixed(1)}%)</div>
              </div>
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            {list.status === 'completed' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadResults(list.listId, list.listName, 'csv')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadResults(list.listId, list.listName, 'json')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  JSON
                </Button>
              </>
            )}
            
            {/* Only show revalidate button for stuck jobs or failed jobs */}
            {(jobStuck || list.status === 'failed') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => revalidateList(list.listId, list.listName)}
                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Revalidate
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/protected/validation-details/${userId}/${list.listId}`)}
            >
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => deleteList(list.listId, list.listName)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          Loading validation history...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-red-800">
              <XCircle className="w-5 h-5" />
              {error}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-xl">History</h2>
        <Button onClick={fetchUserLists} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All ({userLists.length})</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress ({inProgressLists.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedLists.length})</TabsTrigger>
          <TabsTrigger value="failed">Failed ({failedLists.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          {userLists.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No validation jobs found</h3>
                <p className="text-muted-foreground">Upload a CSV or XLSX file to start validating emails.</p>
              </CardContent>
            </Card>
          ) : (
            userLists.map((list) => <ListCard key={list.listId} list={list} />)
          )}
        </TabsContent>
        
        <TabsContent value="in_progress" className="space-y-4">
          {inProgressLists.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No jobs in progress</h3>
                <p className="text-muted-foreground">All your validation jobs have completed.</p>
              </CardContent>
            </Card>
          ) : (
            inProgressLists.map((list) => <ListCard key={list.listId} list={list} />)
          )}
        </TabsContent>
        
        <TabsContent value="completed" className="space-y-4">
          {completedLists.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No completed jobs</h3>
                <p className="text-muted-foreground">Your completed validation jobs will appear here.</p>
              </CardContent>
            </Card>
          ) : (
            completedLists.map((list) => <ListCard key={list.listId} list={list} />)
          )}
        </TabsContent>
        
        <TabsContent value="failed" className="space-y-4">
          {failedLists.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <XCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No failed jobs</h3>
                <p className="text-muted-foreground">Your failed validation jobs will appear here.</p>
              </CardContent>
            </Card>
          ) : (
            failedLists.map((list) => <ListCard key={list.listId} list={list} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 