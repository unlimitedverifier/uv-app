# Asynchronous Email Validation System with Upstash Workflows

This document outlines the complete implementation of an asynchronous email validation feature using Upstash Workflows and three separate Railway Redis databases.

## Overview

The system validates up to 100,000 emails (or up to 9.9 MB of full list data) per user, processing them in chunks of 250 emails. It provides real-time progress tracking, stores both raw and validated data in Redis, and automatically expires all data after 30 days.

## Environment Variables

Create a `.env.local` file with the following variables:

```env
# Upstash Workflows token (local development)
QSTASH_TOKEN=eyJVc2VySUQiOiJkZWZhdWx0VXNlciIsIlBhc3N3b3JkIjoiZGVmYXVsdFBhc3N3b3JkIn0=
QSTASH_URL=http://127.0.0.1:8080

# Railway Redis URLs (production ready)
USER_LIST_SNIPPETS_REDIS_URL=redis://default:KlSHRWwAytvCJAVygYOemDgfZZfEeJew@metro.proxy.rlwy.net:17875
USER_LISTS_DATA_URL=redis://default:SxOyRYVadyeRVtYafmNPcrCRjaUeNOtq@switchyard.proxy.rlwy.net:22481
USER_VALIDATION_JOB_RESPONSES_URL=redis://default:DmmdAMOJZROHkvAestjeXFPIDWXWZgtj@centerbeam.proxy.rlwy.net:31458

# Validation endpoint (IMPORTANT: Use HTTPS, not HTTP)
HTTP_VALIDATION_URL=https://http-standard-server-production.up.railway.app/email_verification
```

**⚠️ IMPORTANT**: The validation URL must use `https://` not `http://` for Railway deployments.

## Technology Stack

- **Redis Client**: `ioredis` (compatible with Railway Redis)
- **Workflow Engine**: Upstash Workflows with local QStash server
- **Frontend**: Next.js 15 with enhanced CSV upload component
- **Database**: Three Railway Redis instances for data separation

## Architecture

The system consists of three main Upstash Workflows:

1. **Create List Job** - Initial file processing and setup
2. **Verify 250 Emails** - Chunk processing with retry logic (4 attempts, exponential backoff)
3. **Complete List Job** - Final data merging and completion

## Required Dependencies

```json
{
  "ioredis": "^5.6.1",
  "@upstash/workflow": "^0.2.13", 
  "xlsx": "^0.18.5",
  "@radix-ui/react-progress": "^1.0.0"
}
```

## Setup Instructions

1. **Install Dependencies**:
   ```bash
   pnpm add ioredis @upstash/workflow xlsx @radix-ui/react-progress
   ```

2. **Start Local QStash Server**:
   ```bash
   npx @upstash/qstash-cli dev
   ```

3. **Start Next.js Development Server**:
   ```bash
   pnpm dev
   ```

4. **Test the System**:
   - Navigate to `http://localhost:3000/protected/csv-upload`
   - Upload a CSV/XLSX file with email addresses
   - Watch real-time validation progress

## System Status

✅ **Railway Redis Integration**: Using three separate Railway Redis databases  
✅ **Workflow Processing**: All three workflows implemented and tested  
✅ **Error Handling**: Robust retry logic with exponential backoff  
✅ **Real-time Progress**: Live updates via polling API  
✅ **Data Persistence**: 30-day TTL with automatic cleanup  
✅ **Download Functionality**: CSV and JSON export formats  

## Known Limitations

- **Validation Server**: May return HTTP 500 when sleeping (expected behavior)
- **Demo Compatibility**: Falls back to mock Redis when Railway URLs unavailable
- **Local Development**: Requires QStash CLI for workflow execution

## Redis Database Schemas

### 1. USER_LIST_SNIPPETS_REDIS_URL
**Purpose**: Metadata and progress tracking

**Key Pattern**: `userListSnippet:<userId>:<listId>`
**Type**: Redis Hash

**Fields** (all stored as strings):
- `userId`: User identifier
- `listId`: Generated unique list ID  
- `listName`: Original filename as uploaded
- `uploadTimestamp`: ISO 8601 timestamp
- `dateValidated`: ISO 8601 timestamp (empty until completion)
- `totalEmails`: Integer count (≤ 100,000)
- `validCount`, `invalidCount`, `unknownCount`: Integer counts
- `percentValid`, `percentInvalid`, `percentUnknown`: Float percentages
- `status`: "in_progress" or "completed"
- `additionalMetadata`: JSON string for extra data

**TTL**: 30 days from upload

### 2. USER_LISTS_DATA_URL
**Purpose**: Full data storage (original + validated)

**Key Pattern**: `userListData:<userId>:<listId>`
**Type**: Redis String (JSON object)

**Structure**:
```json
{
  "metadata": {
    "userId": "<userId>",
    "listId": "<listId>", 
    "listName": "<originalFileName>",
    "columns": ["firstName", "lastName", "email", "company"],
    "uploadTimestamp": "2024-01-01T00:00:00.000Z",
    "dateValidated": "", // Empty until completion
    "expiryDays": 30
  },
  "rows": [
    {
      "firstName": "Alice",
      "lastName": "Brown", 
      "email": "alice@example.com",
      "company": "ACME",
      // After validation:
      "validStatus": "Valid",
      "catchAll": "No",
      "category": "Good",
      "errorMessage": null
    }
  ]
}
```

**TTL**: 30 days from upload

### 3. USER_VALIDATION_JOB_RESPONSES_URL
**Purpose**: Temporary validation results storage

**Key Pattern**: `validationJobResponses:<userId>:<listId>`
**Type**: Redis List (each element is a JSON-stringified chunk)

**Structure**: Each list element contains up to 250 validation results:
```json
[
  {
    "email": "user@example.com",
    "valid": "Valid|Invalid|Unknown",
    "catch_all": "Yes|No|Unknown",
    "category": "Good|Risky|Bad",
    "error": null
  }
]
```

**TTL**: 30 days from upload (no early deletion)

## API Endpoints

### Check Progress
**GET** `/api/list-progress/[userId]/[listId]`

**Response**:
```json
{
  "userId": "user123",
  "listId": "list-1234567890-abc123", 
  "listName": "contacts.xlsx",
  "status": "in_progress",
  "uploadTimestamp": "2024-01-01T00:00:00.000Z",
  "dateValidated": null,
  "totalEmails": 950,
  "processedEmails": 500,
  "overallProgress": 53,
  "results": {
    "validCount": 450,
    "invalidCount": 30,
    "unknownCount": 20,
    "percentValid": 47.37,
    "percentInvalid": 3.16,
    "percentUnknown": 2.11
  }
}
```

### Download Results
**GET** `/api/download-validated-data/[userId]/[listId]?format=json|csv`

**JSON Response**: Complete data with metadata and validation results
**CSV Response**: File download with all original columns + validation columns

## Testing Workflow

1. **Upload CSV/XLSX**: Navigate to `/protected/csv-upload`
2. **Select Email Column**: Click on the column containing email addresses
3. **Start Validation**: Click the "Start Email Validation" button
4. **Monitor Progress**: Watch real-time progress updates
5. **Download Results**: Export validated data when complete

Your email validation system is ready for production use! 🚀 