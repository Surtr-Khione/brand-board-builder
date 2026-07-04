// Brand asset uploads — Supabase Storage 'brand-assets' bucket.
// Files live under {userId}/{boardId?}/{timestamp}-{name}; bucket is public-read.
import { supabase } from './supabase';

const BUCKET = 'brand-assets';
const MAX_BYTES = 10 * 1024 * 1024;

function safeName(name) {
  return name.toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'file';
}

export function canUploadAssets() {
  return !!supabase;
}

// Upload a File/Blob; returns { url, path }. Requires a signed-in user.
export async function uploadAsset(file, { boardId } = {}) {
  if (!supabase) throw new Error('Storage unavailable.');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const err = new Error('Sign in to upload brand assets.');
    err.code = 'AUTH_REQUIRED';
    throw err;
  }
  if (file.size > MAX_BYTES) throw new Error('File too large (10 MB max).');

  const path = [user.id, boardId, `${Date.now()}-${safeName(file.name)}`].filter(Boolean).join('/');
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || 'application/octet-stream',
    upsert: false,
  });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

export async function deleteAsset(path) {
  if (!supabase) return false;
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  return !error;
}

// All assets the signed-in user has uploaded
export async function listMyAssets() {
  if (!supabase) return [];
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase.storage.from(BUCKET).list(user.id, {
    limit: 200,
    sortBy: { column: 'created_at', order: 'desc' },
  });
  if (error) return [];
  return (data || []).map((f) => ({
    ...f,
    path: `${user.id}/${f.name}`,
    url: supabase.storage.from(BUCKET).getPublicUrl(`${user.id}/${f.name}`).data.publicUrl,
  }));
}
