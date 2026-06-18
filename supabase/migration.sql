-- Run this in Supabase SQL Editor to create the brand_boards table
-- Go to: https://supabase.com/dashboard → Your project → SQL Editor

CREATE TABLE brand_boards (
  id BIGSERIAL PRIMARY KEY,
  board_id TEXT UNIQUE NOT NULL,
  brand_data JSONB NOT NULL DEFAULT '{}',
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by board_id
CREATE INDEX idx_brand_boards_board_id ON brand_boards (board_id);

-- Index for finding boards by email
CREATE INDEX idx_brand_boards_email ON brand_boards (email);

-- Enable Row Level Security (allows public read/write via anon key)
ALTER TABLE brand_boards ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can create a board
CREATE POLICY "Anyone can insert boards"
  ON brand_boards FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy: Anyone can read boards (they need the board_id URL)
CREATE POLICY "Anyone can read boards"
  ON brand_boards FOR SELECT
  TO anon
  USING (true);

-- Policy: Anyone can update their own board (by board_id)
CREATE POLICY "Anyone can update boards"
  ON brand_boards FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);
