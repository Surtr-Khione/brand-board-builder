// Account system — real Supabase auth backed by the profiles table.
// Keeps the original synchronous getter API (getTier/getCredits/isUnlocked)
// by mirroring the signed-in profile into localStorage, which also serves
// as the fallback for anonymous visitors.
import { supabase } from './supabase';
import { getLocalEditTokens, clearLocalEditTokens } from './editTokens';

export const TIERS = { free: 0, registered: 1, pro: 2 };
export const TIER_NAMES = { free: "Free", registered: "Registered", pro: "Pro" };

export const CREDIT_PACKS = [
  { id: "starter", credits: 15,  price: "$9",   amountCents: 900,   label: "Starter", perCredit: "60¢" },
  { id: "creator", credits: 50,  price: "$25",  amountCents: 2500,  label: "Creator", perCredit: "50¢" },
  { id: "studio",  credits: 150, price: "$59",  amountCents: 5900,  label: "Studio",  perCredit: "39¢" },
  { id: "agency",  credits: 500, price: "$149", amountCents: 14900, label: "Agency",  perCredit: "30¢" },
];

const K = {
  tier: "brandmd_tier",
  credits: "brandmd_credits",
  email: "brandmd_email",
  refCode: "brandmd_ref_code",
  pendingRef: "brandmd_pending_ref",
  contacts: "brandmd_contacts",
};

// ─── Session state ────────────────────────────────────────────────────────────
let currentUser = null;
let currentProfile = null;
let initialized = false;
const listeners = new Set();

const notify = () => listeners.forEach((cb) => {
  try { cb({ user: currentUser, profile: currentProfile }); } catch { /* listener errors are theirs */ }
});

// Components subscribe to re-render on sign-in/out/credit changes
export function subscribeAuth(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export const getUser = () => currentUser;
export const getProfile = () => currentProfile;
export const isSignedIn = () => !!currentUser;

function cacheProfile(p) {
  if (!p) return;
  localStorage.setItem(K.tier, p.tier);
  localStorage.setItem(K.credits, String(p.credits));
  if (p.email) localStorage.setItem(K.email, p.email);
  if (p.ref_code) localStorage.setItem(K.refCode, p.ref_code);
}

export async function refreshProfile() {
  if (!supabase || !currentUser) return null;
  const { data } = await supabase
    .from('profiles')
    .select('id, email, display_name, tier, credits, ref_code')
    .eq('id', currentUser.id)
    .single();
  if (data) {
    currentProfile = data;
    cacheProfile(data);
    notify();
  }
  return data;
}

async function handleSession(session) {
  const prevId = currentUser?.id;
  currentUser = session?.user || null;
  if (!currentUser) {
    currentProfile = null;
    // Signed out: drop the mirrored account state so tiers re-lock
    localStorage.setItem(K.tier, "free");
    localStorage.setItem(K.credits, "0");
    notify();
    return;
  }
  if (currentUser.id !== prevId) {
    await refreshProfile();
    claimAnonymousBoards();
  }
}

// Call once at app start
export function initAuth() {
  if (initialized || !supabase) return;
  initialized = true;
  supabase.auth.getSession().then(({ data }) => handleSession(data.session));
  supabase.auth.onAuthStateChange((_event, session) => handleSession(session));
}

// Attach anonymous boards created before signup to the new account
async function claimAnonymousBoards() {
  const tokens = getLocalEditTokens();
  if (!supabase || !tokens.length) return;
  const { error } = await supabase.rpc('bmd_claim_boards', { p_tokens: tokens });
  if (!error) clearLocalEditTokens();
}

function friendlyAuthError(error) {
  const m = (error?.message || "").toLowerCase();
  if (m.includes("already registered")) return "That email already has an account — sign in instead.";
  if (m.includes("password")) return "Password must be at least 6 characters.";
  if (m.includes("invalid login")) return "Wrong email or password.";
  if (m.includes("rate limit")) return "Too many attempts — wait a minute and try again.";
  return error?.message || "Something went wrong. Please try again.";
}

// ─── Sign up / in / out ───────────────────────────────────────────────────────
export async function signUp({ email, password, displayName }) {
  if (!supabase) throw new Error("Accounts are unavailable right now.");
  const refCode = localStorage.getItem(K.pendingRef) || null;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName || "", ref_code: refCode } },
  });
  if (error) throw new Error(friendlyAuthError(error));
  // Auto-confirm is on, so a session comes back immediately
  if (data.session) await handleSession(data.session);
  localStorage.removeItem(K.pendingRef);
  return data.user;
}

export async function signIn({ email, password }) {
  if (!supabase) throw new Error("Accounts are unavailable right now.");
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(friendlyAuthError(error));
  await handleSession(data.session);
  return data.user;
}

export async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function resetPassword(email) {
  if (!supabase) throw new Error("Accounts are unavailable right now.");
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/builder`,
  });
  if (error) throw new Error(friendlyAuthError(error));
}

// ─── Tier & credits (sync getters backed by cache) ────────────────────────────
export const getTier = () => localStorage.getItem(K.tier) || "free";
export const setTier = (t) => localStorage.setItem(K.tier, t);
export const getCredits = () => parseInt(localStorage.getItem(K.credits) || "0");
export const setCredits = (n) => localStorage.setItem(K.credits, String(Math.max(0, n)));
export const getEmail = () => currentProfile?.email || localStorage.getItem(K.email) || "";
export const setEmail = (e) => localStorage.setItem(K.email, e);

export const isUnlocked = (sectionTier) => TIERS[getTier()] >= TIERS[sectionTier || "free"];

// Legacy email-only registration — only a fallback when the backend is down.
// Real registration goes through signUp().
export function register(email) {
  setEmail(email);
  setTier("registered");
  if (getCredits() === 0) setCredits(3);
}

export function spendCredit() {
  const c = getCredits();
  if (c <= 0) return false;
  setCredits(c - 1); // optimistic; RPC below reconciles
  notify();
  if (currentUser && supabase) {
    supabase.rpc('bmd_spend_credits', { p_amount: 1, p_reason: 'generation' })
      .then(({ data, error }) => {
        if (error) refreshProfile();
        else { setCredits(data); notify(); }
      });
  }
  return true;
}

// ─── Referral / viral ─────────────────────────────────────────────────────────
export function captureReferral() {
  const ref = new URLSearchParams(window.location.search).get("ref");
  if (ref && ref !== getReferralCode()) {
    localStorage.setItem(K.pendingRef, ref);
  }
}

export function getReferralCode() {
  if (currentProfile?.ref_code) return currentProfile.ref_code;
  let code = localStorage.getItem(K.refCode);
  if (!code) {
    code = Math.random().toString(36).slice(2, 10).toUpperCase();
    localStorage.setItem(K.refCode, code);
  }
  return code;
}

export function getReferralUrl() {
  return `${window.location.origin}/?ref=${getReferralCode()}`;
}

const EARN_ACTIONS = ["share_fb", "share_li", "share_x", "share_link", "refer_friend"];

export function hasEarnedAction(action) {
  return localStorage.getItem(`brandmd_earned_${action}`) === "1";
}

export async function claimEarnAction(action) {
  if (!EARN_ACTIONS.includes(action)) return false;
  if (hasEarnedAction(action)) return false;
  localStorage.setItem(`brandmd_earned_${action}`, "1");
  if (currentUser && supabase) {
    const { data, error } = await supabase.rpc('bmd_claim_earn_action', { p_action: action });
    if (error) return false;
    setCredits(data);
    notify();
    return true;
  }
  setCredits(getCredits() + 1);
  notify();
  return true;
}

// Contact import — up to 25 credits
export function getContactsImported() {
  return parseInt(localStorage.getItem(K.contacts) || "0");
}

export async function importContacts(emails = []) {
  const valid = [...new Set(
    emails.filter((e) => e.includes("@") && e.includes(".")).map((e) => e.trim().toLowerCase())
  )];
  if (currentUser && supabase) {
    const { data, error } = await supabase.rpc('bmd_import_contacts', { p_emails: valid });
    if (error) return { added: 0, total: getContactsImported() };
    await refreshProfile();
    return { added: data, total: getContactsImported() + data };
  }
  const prev = getContactsImported();
  const cap = 25;
  const addable = Math.max(0, Math.min(valid.length, cap - prev));
  if (addable > 0) {
    localStorage.setItem(K.contacts, String(prev + addable));
    setCredits(getCredits() + addable);
    notify();
  }
  return { added: addable, total: prev + addable };
}
