-- Migration 002: Add characters and reading_progress tables
-- For the BookWise character exploration platform

-- Characters extracted from books
CREATE TABLE IF NOT EXISTS characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  aliases TEXT[] DEFAULT '{}',
  description TEXT,
  traits JSONB DEFAULT '{}',
  relationships JSONB DEFAULT '[]',
  first_appearance JSONB DEFAULT '{}',
  extracted_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(book_id, name)
);

-- Reading progress per user per book
CREATE TABLE IF NOT EXISTS reading_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  current_page INTEGER DEFAULT 1,
  total_pages INTEGER,
  last_read_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);

-- Add mode field to conversations
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS mode VARCHAR(50) DEFAULT 'companion';
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS character_id UUID REFERENCES characters(id) ON DELETE SET NULL;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS book_id UUID REFERENCES books(id) ON DELETE CASCADE;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_characters_book_id ON characters(book_id);
CREATE INDEX IF NOT EXISTS idx_reading_progress_user_book ON reading_progress(user_id, book_id);
CREATE INDEX IF NOT EXISTS idx_conversations_book_id ON conversations(book_id);
