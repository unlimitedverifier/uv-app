#!/bin/bash

# Email Verification API Database Setup Script
# This script creates the required tables in your Neon database

echo "Setting up Email Verification API database tables..."

PGPASSWORD="npg_7RP3jveWAUuf" psql \
  -h ep-mute-violet-a5j5rrd6-pooler.us-east-2.aws.neon.tech \
  -U uv-api_owner \
  -d uv-api \
  -c "
-- API Keys table for the email verification service
CREATE TABLE IF NOT EXISTS api_keys (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    key VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys (key);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys (user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys (is_active);

-- Verify table creation
SELECT 'Database setup completed successfully!' as status;
"

echo "Database setup completed!" 