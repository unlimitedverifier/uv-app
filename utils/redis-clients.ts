import Redis from 'ioredis';

// Check if we're in demo mode (when URLs don't start with redis://)
const isDemoMode = !process.env.USER_LIST_SNIPPETS_REDIS_URL?.startsWith('redis://');

// Mock Redis client for demo mode with all required methods
const createMockRedis = () => ({
  hset: async (...args: any[]) => {
    console.log('[DEMO MODE] Redis HSET:', args);
    return 1;
  },
  hget: async (...args: any[]) => {
    console.log('[DEMO MODE] Redis HGET:', args);
    return null;
  },
  hgetall: async (...args: any[]) => {
    console.log('[DEMO MODE] Redis HGETALL:', args);
    return {};
  },
  get: async (...args: any[]) => {
    console.log('[DEMO MODE] Redis GET:', args);
    return null;
  },
  set: async (...args: any[]) => {
    console.log('[DEMO MODE] Redis SET:', args);
    return 'OK';
  },
  expire: async (...args: any[]) => {
    console.log('[DEMO MODE] Redis EXPIRE:', args);
    return 1;
  },
  del: async (...args: any[]) => {
    console.log('[DEMO MODE] Redis DEL:', args);
    return 1;
  },
  rpush: async (...args: any[]) => {
    console.log('[DEMO MODE] Redis RPUSH:', args);
    return 1;
  },
  lrange: async (...args: any[]) => {
    console.log('[DEMO MODE] Redis LRANGE:', args);
    return [];
  },
  keys: async (...args: any[]) => {
    console.log('[DEMO MODE] Redis KEYS:', args);
    return []; // Return empty array for demo mode
  },
  disconnect: () => {
    console.log('[DEMO MODE] Redis DISCONNECT');
  }
});

// Create Redis clients (real or mock based on environment)
export const userListSnippetsRedis = isDemoMode 
  ? createMockRedis()
  : new Redis(process.env.USER_LIST_SNIPPETS_REDIS_URL!);

export const userListsDataRedis = isDemoMode
  ? createMockRedis()
  : new Redis(process.env.USER_LISTS_DATA_URL!);

export const userValidationJobResponsesRedis = isDemoMode
  ? createMockRedis()
  : new Redis(process.env.USER_VALIDATION_JOB_RESPONSES_URL!);

if (isDemoMode) {
  console.log('🚧 Running in DEMO MODE - Redis operations will be mocked');
  console.log('To use Railway Redis, set the environment variables with redis:// URLs');
} else {
  console.log('✅ Using Railway Redis databases');
}

// TTL in seconds (30 days)
export const THIRTY_DAYS_TTL = 30 * 24 * 60 * 60;

// Helper function to set TTL on a Redis key safely
export async function setTTL(redisClient: any, key: string, ttlSeconds: number) {
  try {
    await redisClient.expire(key, ttlSeconds);
  } catch (error) {
    console.warn(`Failed to set TTL for key ${key}:`, error);
    // Non-critical error, continue execution
  }
}

// Helper function to generate unique list ID
export function generateListId(): string {
  return `list-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Helper function to extract emails from file payload
export function extractEmailsFromRows(rows: any[], selectedColumn?: string): { email: string; rowIndex: number }[] {
  const emails: { email: string; rowIndex: number }[] = [];
  
  // Handle undefined, null, or non-array input
  if (!rows || !Array.isArray(rows)) {
    console.warn('extractEmailsFromRows: Invalid input - expected array, got:', typeof rows);
    return emails;
  }
  
  // Function to check if a value looks like an email
  const isEmailLike = (value: unknown): boolean => {
    if (!value || typeof value !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value.trim());
  };
  
  rows.forEach((row, index) => {
    if (!row || typeof row !== 'object') return;
    
    let emailField: string | undefined;
    
    if (selectedColumn) {
      // Use the user-selected column
      emailField = selectedColumn;
    } else {
      // Fallback: auto-detect email field in row (could be 'email', 'Email', etc.)
      emailField = Object.keys(row).find(key => 
        key.toLowerCase() === 'email' || 
        key.toLowerCase().includes('email') ||
        (typeof row[key] === 'string' && isEmailLike(row[key]))
      );
    }
    
    if (emailField && row[emailField] && typeof row[emailField] === 'string') {
      const emailValue = row[emailField].trim();
      if (emailValue && isEmailLike(emailValue)) {
        emails.push({ email: emailValue, rowIndex: index });
      }
    }
  });
  
  return emails;
}

// Types for the workflow system
export interface UserListSnippet {
  [key: string]: string; // Index signature for Redis hset compatibility
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
  status: 'in_progress' | 'completed';
  additionalMetadata: string;
}

export interface UserListData {
  metadata: {
    userId: string;
    listId: string;
    listName: string;
    columns: string[];
    uploadTimestamp: string;
    dateValidated: string;
    expiryDays: number;
  };
  rows: any[];
}

export interface ValidationResult {
  email: string;
  valid: 'Valid' | 'Invalid' | 'Unknown';
  catch_all: 'Yes' | 'No' | 'Unknown';
  category: 'Good' | 'Catch all' | 'Risky' | 'Bad';
  error: string | null;
}

export interface WorkflowInputs {
  createListJob: {
    userId: string;
    originalFileName: string;
    filePayload: any[];
    selectedColumn?: string; // Add selectedColumn parameter
    listId?: string; // Optional parameter
    revalidate?: boolean; // Add revalidate parameter
  };
  
  verify250Emails: {
    userId: string;
    listId: string;
    startIndex: number;
    chunkSize: number;
    attempt: number;
  };
  
  completeListJob: {
    userId: string;
    listId: string;
  };
} 