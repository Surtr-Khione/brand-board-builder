import { supabase, isSupabaseConfigured } from './supabase';

// Generate a short unique ID for board URLs
function generateBoardId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

// ═══════════════════════════════════════════
// SUPABASE STORAGE
// ═══════════════════════════════════════════
// RLS on brand_boards only lets authenticated owners write, so anonymous
// (email-gate) saves go through the save-board edge function, which mints an
// edit token on first save. The token is kept locally per board — it's what
// lets this browser keep updating the board while a visitor who opens the
// share link gets forked to their own copy instead of overwriting.
const tokenKey = (boardId) => `bmd_edit_token_${boardId}`;

async function saveViaFunction(boardId, brandData, email) {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const editToken = boardId ? localStorage.getItem(tokenKey(boardId)) : null;
  const r = await fetch(`${url}/functions/v1/save-board`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ boardId, brand: brandData, email, editToken }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
  if (data.editToken) localStorage.setItem(tokenKey(data.boardId), data.editToken);
  return data.boardId;
}

async function loadFromSupabase(boardId) {
  // Boards are is_public=false, so anonymous REST selects return nothing —
  // reads go through the get-board edge fn, which returns only safe fields
  // (never edit_token or email). Knowing the board URL is the capability.
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const r = await fetch(`${url}/functions/v1/get-board?board=${encodeURIComponent(boardId)}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return await r.json();
}

// ═══════════════════════════════════════════
// LOCALSTORAGE FALLBACK
// ═══════════════════════════════════════════
function saveToLocal(boardId, brandData, email) {
  const boards = JSON.parse(localStorage.getItem('brand_boards') || '{}');
  boards[boardId] = {
    board_id: boardId,
    brand_data: brandData,
    email: email,
    updated_at: new Date().toISOString(),
  };
  localStorage.setItem('brand_boards', JSON.stringify(boards));
  return boards[boardId];
}

function loadFromLocal(boardId) {
  const boards = JSON.parse(localStorage.getItem('brand_boards') || '{}');
  return boards[boardId] || null;
}

// ═══════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════
export async function saveBoard(boardId, brandData, email) {
  if (isSupabaseConfigured()) {
    // May return a different id than passed in (first save, or a fork when
    // saving someone else's shared board) — callers use the returned id.
    return await saveViaFunction(boardId, brandData, email);
  }
  if (!boardId) boardId = generateBoardId();
  saveToLocal(boardId, brandData, email);
  return boardId;
}

export async function loadBoard(boardId) {
  if (isSupabaseConfigured()) {
    return await loadFromSupabase(boardId);
  } else {
    return loadFromLocal(boardId);
  }
}

export { generateBoardId };
