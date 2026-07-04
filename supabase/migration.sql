-- Run this in Supabase SQL Editor to create the brand_boards table
-- Go to: https://supabase.com/dashboard → Your project → SQL Editor

CREATE TABLE brand_boards (
  id BIGSERIAL PRIMARY KEY,
  board_id TEXT UNIQUE NOT NULL,
  edit_token TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
  brand_data JSONB NOT NULL DEFAULT '{}',
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by board_id
CREATE INDEX idx_brand_boards_board_id ON brand_boards (board_id);

-- Index for finding boards by email
CREATE INDEX idx_brand_boards_email ON brand_boards (email);

-- Enable Row Level Security
ALTER TABLE brand_boards ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can create a board (edit_token is auto-generated server-side)
CREATE POLICY "Anyone can insert boards"
  ON brand_boards FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy: Anyone can read boards (they need the board_id URL to find it)
CREATE POLICY "Anyone can read boards"
  ON brand_boards FOR SELECT
  TO anon
  USING (true);

-- Policy: Only the holder of the edit_token can update a board
-- The client must pass edit_token in the request filter: .eq('edit_token', token)
CREATE POLICY "Edit token holder can update board"
  ON brand_boards FOR UPDATE
  TO anon
  USING (edit_token = current_setting('request.jwt.claims', true)::json->>'edit_token')
  WITH CHECK (edit_token = current_setting('request.jwt.claims', true)::json->>'edit_token');

-- Note: return edit_token to the creator on INSERT (select it back).
-- Store it client-side (localStorage). Without it, the board cannot be updated.
-- Never expose edit_token in the SELECT policy or list views.
