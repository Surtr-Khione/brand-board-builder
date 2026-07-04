import { supabase, isSupabaseConfigured } from './supabase';
import { getEditToken, setEditToken } from './editTokens';

// Columns clients may read — edit_token is deliberately excluded (column-level grant)
const BOARD_COLS = 'board_id, user_id, title, brand_data, email, is_public, created_at, updated_at';
const NIL_TOKEN = '00000000-0000-0000-0000-000000000000';

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
  // One RPC handles every case: signed-in owner, editor share,
  // anonymous creator with an edit token, or brand-new board.
  const { data, error } = await supabase.rpc('bmd_save_board', {
    p_board_id: boardId,
    p_edit_token: getEditToken(boardId) || NIL_TOKEN,
    p_brand_data: brandData,
    p_email: email || null,
    p_title: brandData?.brandName || null,
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (row?.edit_token) setEditToken(boardId, row.edit_token);
  return row;
}

async function loadFromSupabase(boardId) {
  const { data, error } = await supabase
    .from('brand_boards')
    .select(BOARD_COLS)
    .eq('board_id', boardId)
    .maybeSingle();
  if (error) throw error;
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

// Boards owned by the signed-in user
export async function listMyBoards() {
  if (!supabase) return [];
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('brand_boards')
    .select(BOARD_COLS)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });
  if (error) { console.error('listMyBoards:', error); return []; }
  return data || [];
}

// Boards other people shared with me
export async function listSharedWithMe() {
  if (!supabase) return [];
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return [];
  const { data, error } = await supabase
    .from('board_shares')
    .select('board_id, role, created_at, brand_boards ( board_id, title, brand_data, updated_at )')
    .ilike('shared_with_email', user.email);
  if (error) { console.error('listSharedWithMe:', error); return []; }
  return (data || [])
    .filter((s) => s.brand_boards)
    .map((s) => ({ ...s.brand_boards, share_role: s.role }));
}

export async function deleteBoard(boardId) {
  if (!supabase) return false;
  const { error } = await supabase.from('brand_boards').delete().eq('board_id', boardId);
  return !error;
}

// ═══════════════════════════════════════════
// SHARING / PERMISSIONS
// ═══════════════════════════════════════════
export async function shareBoard(boardId, sharedWithEmail, role = 'viewer') {
  if (!supabase) throw new Error('Sharing requires the backend.');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in to share boards.');
  const { data, error } = await supabase
    .from('board_shares')
    .upsert(
      { board_id: boardId, owner_id: user.id, shared_with_email: sharedWithEmail.trim().toLowerCase(), role },
      { onConflict: 'board_id,shared_with_email' }
    )
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function listShares(boardId) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('board_shares')
    .select('id, shared_with_email, role, created_at')
    .eq('board_id', boardId)
    .order('created_at');
  if (error) return [];
  return data || [];
}

export async function removeShare(shareId) {
  if (!supabase) return false;
  const { error } = await supabase.from('board_shares').delete().eq('id', shareId);
  return !error;
}

export { generateBoardId };
