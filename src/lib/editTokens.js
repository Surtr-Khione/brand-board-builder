// Edit tokens prove ownership of boards created before signing up.
// Map of { boardId: editToken } in localStorage; cleared once claimed by an account.
const KEY = "bmd_edit_tokens";

function readMap() {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; }
}

export function getEditToken(boardId) {
  return readMap()[boardId] || null;
}

export function setEditToken(boardId, token) {
  const map = readMap();
  map[boardId] = token;
  localStorage.setItem(KEY, JSON.stringify(map));
}

export function getLocalEditTokens() {
  return Object.values(readMap());
}

export function clearLocalEditTokens() {
  localStorage.removeItem(KEY);
}
