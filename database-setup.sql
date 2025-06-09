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

-- Insert some sample data (optional)
-- INSERT INTO api_keys (user_id, key, name) VALUES 
-- ('4261ac09-3816-4a0e-a978-c6e1596e8c32', 'uv_test_key_12345', 'Development Key'); 