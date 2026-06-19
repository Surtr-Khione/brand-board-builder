// Tier system — localStorage-backed for now, ready to swap for real auth
export const TIERS = { free: 0, registered: 1, pro: 2 };
export const TIER_NAMES = { free: "Free", registered: "Registered", pro: "Pro" };

export const getTier     = ()  => localStorage.getItem("brandmd_tier") || "free";
export const setTier     = (t) => localStorage.setItem("brandmd_tier", t);
export const getCredits  = ()  => parseInt(localStorage.getItem("brandmd_credits") || "0");
export const setCredits  = (n) => localStorage.setItem("brandmd_credits", String(Math.max(0, n)));
export const getEmail    = ()  => localStorage.getItem("brandmd_email") || "";
export const setEmail    = (e) => localStorage.setItem("brandmd_email", e);

export const isUnlocked  = (sectionTier) => TIERS[getTier()] >= TIERS[sectionTier || "free"];

export function register(email) {
  setEmail(email);
  setTier("registered");
  if (getCredits() === 0) setCredits(3);
  // Credit the referrer (send ref code to edge fn in real impl; for now just store locally)
  const refBy = new URLSearchParams(window.location.search).get("ref");
  if (refBy) localStorage.setItem("brandmd_ref_by", refBy);
}

// Called when someone visits via a referral link — stores the code
export function captureReferral() {
  const ref = new URLSearchParams(window.location.search).get("ref");
  if (ref && ref !== getReferralCode()) {
    localStorage.setItem("brandmd_pending_ref", ref);
  }
}

export function upgradePro(creditPack = 0) {
  setTier("pro");
  setCredits(getCredits() + creditPack);
}

export function spendCredit() {
  const c = getCredits();
  if (c <= 0) return false;
  setCredits(c - 1);
  return true;
}

// ─── Referral / viral ─────────────────────────────────────────────────────────
export function getReferralCode() {
  let code = localStorage.getItem("brandmd_ref_code");
  if (!code) {
    code = Math.random().toString(36).slice(2, 10).toUpperCase();
    localStorage.setItem("brandmd_ref_code", code);
  }
  return code;
}

export function getReferralUrl() {
  const code = getReferralCode();
  return `https://brandmd.space?ref=${code}`;
}

// Actions that each award 1 credit (one-time per action)
const EARN_ACTIONS = ["share_fb", "share_li", "share_x", "share_link", "refer_friend"];

export function hasEarnedAction(action) {
  return localStorage.getItem(`brandmd_earned_${action}`) === "1";
}

export function claimEarnAction(action) {
  if (hasEarnedAction(action)) return false;
  if (!EARN_ACTIONS.includes(action)) return false;
  localStorage.setItem(`brandmd_earned_${action}`, "1");
  setCredits(getCredits() + 1);
  return true;
}

// Contact import — up to 25 credits
export function getContactsImported() {
  return parseInt(localStorage.getItem("brandmd_contacts") || "0");
}

export function importContacts(emails = []) {
  const valid = [...new Set(emails.filter(e => e.includes("@") && e.includes(".")).map(e => e.trim().toLowerCase()))];
  const prev  = getContactsImported();
  const cap   = 25;
  const addable = Math.max(0, Math.min(valid.length, cap - prev));
  if (addable > 0) {
    localStorage.setItem("brandmd_contacts", String(prev + addable));
    setCredits(getCredits() + addable);
  }
  return { added: addable, total: prev + addable };
}

// Credit packs
export const CREDIT_PACKS = [
  { id: "starter",     credits: 15,  price: "$9",  label: "Starter",     perCredit: "60¢" },
  { id: "creator",     credits: 50,  price: "$25", label: "Creator",     perCredit: "50¢" },
  { id: "studio",      credits: 150, price: "$59", label: "Studio",      perCredit: "39¢" },
  { id: "agency",      credits: 500, price: "$149",label: "Agency",      perCredit: "30¢" },
];
