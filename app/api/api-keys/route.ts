import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/utils/supabase/server';
import { Pool } from 'pg';
import crypto from 'crypto';

// Create connection to your new Neon database
const pool = new Pool({
  connectionString: process.env.API_SYSTEM_NEON_CONNECTION_STRING,
  ssl: { rejectUnauthorized: false }
});

// Generate a secure API key
function generateApiKey(): string {
  return 'uv_' + crypto.randomBytes(32).toString('hex');
}

// Helper function to get authenticated user
async function getAuthenticatedUser() {
  try {
    const supabaseClient = await createSupabaseClient();
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    
    if (error || !user) {
      return { user: null, error: error?.message || 'User not found' };
    }

    return { user, error: null };
  } catch (error) {
    console.error('Auth error:', error);
    return { user: null, error: 'Authentication failed' };
  }
}

// GET - List all API keys for a user
export async function GET() {
  try {
    const { user, error: authError } = await getAuthenticatedUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT id, key, name, is_active, created_at, last_used FROM api_keys WHERE user_id = $1 ORDER BY created_at DESC',
        [user.id]
      );

      return NextResponse.json({
        apiKeys: result.rows
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new API key
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { name } = await request.json();

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'API key name is required' },
        { status: 400 }
      );
    }

    const apiKey = generateApiKey();
    
    const client = await pool.connect();
    try {
      const result = await client.query(
        'INSERT INTO api_keys (user_id, key, name) VALUES ($1, $2, $3) RETURNING id, key, name, is_active, created_at',
        [user.id, apiKey, name.trim()]
      );

      return NextResponse.json({
        apiKey: result.rows[0],
        message: 'API key created successfully'
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating API key:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete an API key
export async function DELETE(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { keyId } = await request.json();

    if (!keyId) {
      return NextResponse.json(
        { error: 'API key ID is required' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      const result = await client.query(
        'DELETE FROM api_keys WHERE id = $1 AND user_id = $2 RETURNING id',
        [keyId, user.id]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'API key not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        message: 'API key deleted successfully'
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error deleting API key:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 