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
async function saveToSupabase(boardId, brandData, email) {
  const { data, error } = await supabase
    .from('brand_boards')
    .upsert({
      board_id: boardId,
      brand_data: brandData,
      email: email,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'board_id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function loadFromSupabase(boardId) {
  const { data, error } = await supabase
    .from('brand_boards')
    .select('*')
    .eq('board_id', boardId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
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
  if (!boardId) boardId = generateBoardId();

  if (isSupabaseConfigured()) {
    await saveToSupabase(boardId, brandData, email);
  } else {
    saveToLocal(boardId, brandData, email);
  }

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
