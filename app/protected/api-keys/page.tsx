"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Eye, 
  EyeOff, 
  Copy, 
  Check,
  Trash2, 
  Plus, 
  Key,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Activity,
  AlertTriangle,
  X
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ApiKey {
  id: number;
  key: string;
  name: string;
  is_active: boolean;
  created_at: string;
  last_used: string;
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<number>>(new Set());
  const [copiedKeys, setCopiedKeys] = useState<Set<string>>(new Set());
  
  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState<ApiKey | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Create dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Alert visibility state
  const [showError, setShowError] = useState(true);
  const [showSuccess, setShowSuccess] = useState(true);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/api-keys');
      
      if (!response.ok) {
        throw new Error('Failed to fetch API keys');
      }

      const data = await response.json();
      setApiKeys(data.apiKeys || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch API keys');
    } finally {
      setIsLoading(false);
    }
  };

  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      setError('Please enter a name for your API key');
      setShowError(true);
      return;
    }

    try {
      setIsCreating(true);
      setError(null);
      setShowError(true);
      
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newKeyName.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create API key');
      }

      // Don't need to store the response data
      await response.json();
      setNewKeyName("");
      setSuccess('API key created successfully!');
      setShowSuccess(true);
      setCreateDialogOpen(false); // Close the dialog
      
      // Refresh the list
      await fetchApiKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create API key');
      setShowError(true);
    } finally {
      setIsCreating(false);
    }
  };

  const deleteApiKey = async (keyId: number) => {
    try {
      setIsDeleting(true);
      const response = await fetch('/api/api-keys', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keyId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete API key');
      }

      setSuccess('API key deleted successfully!');
      setShowSuccess(true);
      await fetchApiKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete API key');
      setShowError(true);
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setKeyToDelete(null);
    }
  };

  const handleDeleteClick = (apiKey: ApiKey) => {
    setKeyToDelete(apiKey);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (keyToDelete) {
      deleteApiKey(keyToDelete.id);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setKeyToDelete(null);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSuccess('API key copied to clipboard!');
      setShowSuccess(true);
      
      // Add visual feedback
      setCopiedKeys(prev => new Set(prev).add(text));
      
      // Remove the feedback after 2 seconds
      setTimeout(() => {
        setCopiedKeys(prev => {
          const newSet = new Set(prev);
          newSet.delete(text);
          return newSet;
        });
      }, 2000);
    } catch {
      setError('Failed to copy to clipboard');
      setShowError(true);
    }
  };

  const toggleKeyVisibility = (keyId: number) => {
    const newVisible = new Set(visibleKeys);
    if (newVisible.has(keyId)) {
      newVisible.delete(keyId);
    } else {
      newVisible.add(keyId);
    }
    setVisibleKeys(newVisible);
  };

  const maskApiKey = (key: string) => {
    if (key.length <= 8) return key;
    return key.substring(0, 8) + '•'.repeat(key.length - 8);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">API Keys</h1>
            <p className="text-muted-foreground">
              Manage your API keys for the email verification service
            </p>
          </div>
          
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create API Key
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New API Key</DialogTitle>
                <DialogDescription>
                  Give your API key a memorable name to help you identify it later.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">API Key Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Production App, Development"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && createApiKey()}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={createApiKey} 
                  disabled={isCreating || !newKeyName.trim()}
                >
                  {isCreating ? 'Creating...' : 'Create API Key'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Delete API Key
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the API key &ldquo;{keyToDelete?.name}&rdquo;? This action cannot be undone and will immediately revoke access for any applications using this key.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={handleDeleteCancel}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete API Key'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Alerts */}
        {error && showError && (
          <Alert variant="destructive" className="relative">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="pr-8">{error}</AlertDescription>
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-2 h-6 w-6 p-0"
              onClick={() => {
                setShowError(false);
                setTimeout(() => setError(null), 300);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </Alert>
        )}

        {success && showSuccess && (
          <Alert className="relative border-green-200 bg-green-50 text-green-800 [&>svg]:text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription className="pr-8">{success}</AlertDescription>
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-2 h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-100"
              onClick={() => {
                setShowSuccess(false);
                setTimeout(() => setSuccess(null), 300);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </Alert>
        )}

        {/* API Keys List */}
        <Card>
          <CardHeader>
            <CardTitle>Your API Keys</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading API keys...</p>
              </div>
            ) : apiKeys.length === 0 ? (
              <div className="text-center py-8">
                <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No API keys found</h3>
                <p className="text-muted-foreground">Create your first API key to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {apiKeys.map((apiKey) => (
                  <div 
                    key={apiKey.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center space-x-3">
                        <h4 className="font-medium">{apiKey.name}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          apiKey.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {apiKey.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <code className="px-2 py-1 bg-muted rounded">
                          {visibleKeys.has(apiKey.id) ? apiKey.key : maskApiKey(apiKey.key)}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleKeyVisibility(apiKey.id)}
                        >
                          {visibleKeys.has(apiKey.id) ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(apiKey.key)}
                          className={copiedKeys.has(apiKey.key) ? 'text-green-600' : ''}
                        >
                          {copiedKeys.has(apiKey.key) ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>Created: {formatDate(apiKey.created_at)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Activity className="h-3 w-3" />
                          <span>Last used: {formatDate(apiKey.last_used)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteClick(apiKey)}
                      className="ml-4 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* API Documentation */}
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">API Endpoint</h4>
              <code className="block p-3 bg-muted rounded text-sm">
                POST https://api.unlimitedverifier.com/email_verification
              </code>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Authentication</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Include your API key in the request headers:
              </p>
              <code className="block p-3 bg-muted rounded text-sm">
                X-API-Key: your_api_key_here
              </code>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Usage Limits</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Maximum 500 emails per request</li>
                <li>• 10,000 emails per day per account</li>
                <li>• Rate limits reset daily at midnight UTC</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 