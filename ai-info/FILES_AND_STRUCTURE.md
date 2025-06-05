# Email Validation System - File Structure Reference

## 📁 **Core System Files**

### **Workflow Files** (The Heart of the System)
```
app/api/workflows/
├── create-list-job/route.ts         # 🚀 Initial job setup, file processing, data storage
├── verify-250-emails/route.ts       # ⚡ Email chunk validation with retry logic
└── complete-list-job/route.ts       # 🎯 Final merging, statistics, job completion
```

### **API Endpoints** (Data Access Layer)
```
app/api/
├── user-lists/[userId]/route.ts                        # 📋 Get all validation jobs for user
├── list-progress/[userId]/[listId]/route.ts           # 📊 Real-time progress tracking
├── list-details/[userId]/[listId]/route.ts            # 📄 Full data for details view
├── download-validated-data/[userId]/[listId]/route.ts # 📥 CSV/JSON export
└── delete-list/[userId]/[listId]/route.ts             # 🗑️ Delete validation job
```

### **Page Components** (User Interface)
```
app/protected/
├── page.tsx                                    # 🏠 Main dashboard (uses UserValidationDashboard)
├── csv-upload/page.tsx                        # 📤 Upload interface (uses CsvXlsxUpload)
└── validation-details/[userId]/[listId]/page.tsx # 🔍 Detailed results (uses ValidationDetailsView)
```

### **React Components** (UI Building Blocks)
```
components/
├── csv-xlsx-upload.tsx           # 📂 File upload, column selection, validation start
├── user-validation-dashboard.tsx # 📊 4-tab dashboard with auto-refresh & actions
├── validation-details-view.tsx   # 📋 Full table view with search/filter/pagination
└── ui/                          # 🎨 shadcn/ui components
    ├── card.tsx                 # Card containers
    ├── button.tsx               # Interactive buttons
    ├── badge.tsx                # Status/category indicators
    ├── progress.tsx             # Progress bars
    ├── tabs.tsx                 # Tab navigation
    ├── dialog.tsx               # Modal dialogs
    └── input.tsx                # Form inputs
```

### **Utility & Configuration**
```
utils/
├── redis-clients.ts             # 🔌 3x Railway Redis connections, types, helpers
└── supabase/
    ├── server.ts               # 🔒 Server-side Supabase client
    └── client.ts               # 🔒 Client-side Supabase client

Configuration Files:
├── .env.local                   # 🔐 Environment variables (Redis URLs, API keys)
├── package.json                 # 📦 Dependencies and npm scripts
├── tsconfig.json               # ⚙️ TypeScript configuration
├── tailwind.config.ts          # 🎨 Tailwind CSS setup
└── next.config.js              # ⚙️ Next.js configuration
```

## 🗄️ **Database Schema (3 Redis Instances)**

### **USER_LIST_SNIPPETS_REDIS** - Dashboard Data
```
Key: userListSnippet:<userId>:<listId>
Purpose: Fast dashboard queries, progress tracking
Data: Job metadata, counts, percentages, status
```

### **USER_LISTS_DATA_REDIS** - Full Dataset
```
Key: userListData:<userId>:<listId>
Purpose: Complete data storage (original + validation results)
Data: All CSV columns + validation results (validStatus, category, etc.)
```

### **USER_VALIDATION_JOB_RESPONSES_REDIS** - Temporary Processing
```
Key: validationJobResponses:<userId>:<listId>
Purpose: Store chunked validation results during processing
Data: List of validation result arrays (250 emails per chunk)
```

## 🔄 **Data Flow Summary**

### **1. Upload Phase**
```
csv-xlsx-upload.tsx → File parsing → Column detection → Email extraction
```

### **2. Validation Phase**
```
create-list-job → verify-250-emails (chunked) → complete-list-job
```

### **3. Display Phase**
```
user-validation-dashboard.tsx → Real-time progress → validation-details-view.tsx
```

## 🎯 **Key Features Per File**

### **csv-xlsx-upload.tsx**
- Drag & drop file upload
- XLSX/CSV parsing with XLSX.js
- Auto-detect email columns
- Duplicate removal & data cleaning
- Real-time progress polling
- Download results (CSV/JSON)

### **user-validation-dashboard.tsx**
- 4-tab interface (All, In Progress, Completed, Failed)
- Auto-refresh every 60 seconds
- Stuck job detection (>10 min + no progress)
- Auto-delete countdown (30-day TTL)
- Context-aware action buttons

### **validation-details-view.tsx**
- Full data table with all columns
- Real-time search across all fields
- Category filtering (Good, Catch all, Risky, Bad)
- Pagination (50 items per page)
- Download & delete functionality

### **Workflow Files (create-list-job/route.ts)**
- Input validation & email extraction
- Redis data storage with TTL
- Constraint checking (≤100k emails, ≤9.9MB)
- Revalidation support
- First chunk trigger

### **Workflow Files (verify-250-emails/route.ts)**
- 4-attempt retry logic with exponential backoff
- External API response parsing (both array & object formats)
- 4-category classification system
- Progress updates to Redis
- Next chunk/completion triggering

### **Workflow Files (complete-list-job/route.ts)**
- Results merging from all chunks
- Email-based data matching
- Final statistics calculation
- Job completion & status update

## 🔧 **Development Tools & Commands**

### **Local Development**
```bash
# Install dependencies
pnpm install

# Start QStash server (separate terminal)
npx @upstash/qstash-cli dev

# Start Next.js dev server
pnpm dev

# Type checking
npx tsc --noEmit

# Linting
pnpm lint

# Production build
pnpm build
```

### **Environment Variables Required**
```bash
# QStash (Local Development)
QSTASH_TOKEN=eyJVc2VySUQiOiJkZWZhdWx0VXNlciIsIlBhc3N3b3JkIjoiZGVmYXVsdFBhc3N3b3JkIn0=
QSTASH_URL=http://127.0.0.1:8080

# Railway Redis (3 instances)
USER_LIST_SNIPPETS_REDIS_URL=redis://default:password@host:port
USER_LISTS_DATA_URL=redis://default:password@host:port
USER_VALIDATION_JOB_RESPONSES_URL=redis://default:password@host:port

# External Validation API
HTTP_VALIDATION_URL=https://http-standard-server-production.up.railway.app/email_verification

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
```

## 📊 **System Status** (All Issues Resolved)

- ✅ **Workflow Nesting Error**: Fixed by moving context.call outside context.run
- ✅ **API Response Format**: Now handles both array and object.results formats
- ✅ **Failed State Handling**: Jobs marked as 'failed' after 4 retry attempts
- ✅ **Stuck Job Detection**: Smart logic (>10 min + >estimated time + no progress)
- ✅ **Auto-delete Countdown**: 30-day TTL with visual countdown
- ✅ **Real-time Progress**: 60-second polling for in-progress jobs
- ✅ **4-Category System**: Good, Catch all, Risky, Bad (matches Flask API)
- ✅ **Minimum Estimates**: All time estimates minimum 10 minutes
- ✅ **TypeScript Errors**: All linter and type errors resolved
- ✅ **User Authentication**: Real Supabase user IDs throughout system

## 🚀 **Production Ready**

The system is fully production-ready with:
- Robust error handling and recovery
- Real-time progress tracking
- User-friendly interface with proper feedback
- Automatic data cleanup (30-day TTL)
- Comprehensive logging and debugging
- Type-safe TypeScript implementation
- Responsive design with proper loading states 