-- Migration: Change conversations.id from UUID to VARCHAR(255)
-- This allows the frontend to use custom string-based conversation IDs

-- Step 1: Drop the existing conversations table (if you have important data, backup first!)
DROP TABLE IF EXISTS conversations CASCADE;

-- Step 2: Recreate the conversations table with VARCHAR id
CREATE TABLE conversations (
  id VARCHAR(255) PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  messages JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Step 3: Recreate the index
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
