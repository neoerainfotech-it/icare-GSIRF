// ═══════════════════════════════════════════════════════════════
//  GARVI — Supabase Client Configuration
//  Included by all portal pages via <script src="js/garvi-supabase.js">
//
//  ⚠️  REPLACE the two placeholder values below with your
//      actual Supabase project credentials before deploying.
// ═══════════════════════════════════════════════════════════════

const SUPABASE_URL      = 'https://zdjsmizotwimyabpepdc.supabase.co';       // e.g. https://xxxx.supabase.co
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkanNtaXpvdHdpbXlhYnBlcGRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0OTkwNjQsImV4cCI6MjA5OTA3NTA2NH0.Xh8VsiL5hAUCq0nDjb2VswhDHxc2Uq1MHd9NBMRa7Rs';  // from Settings → API → anon public
const EDGE_FN_BASE      = `${SUPABASE_URL}/functions/v1`;

// Shared client (used across all pages)
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Session helpers ──────────────────────────────────────────────

/** Get the current session. Returns null if not logged in. */
async function getSession() {
  const { data: { session } } = await sb.auth.getSession();
  return session;
}

/** Require a valid session. Redirects to login.html if not logged in. */
async function requireAuth(redirectTo = 'login.html') {
  const session = await getSession();
  if (!session) {
    window.location.href = redirectTo;
    return null;
  }
  return session;
}

/** Check if the current user is an admin. */
async function isAdmin() {
  const session = await getSession();
  if (!session) return false;
  const { data } = await sb.from('admins').select('id').eq('id', session.user.id).maybeSingle();
  return !!data;
}

/** Get the institute record for the current user. */
async function getMyInstitute() {
  const session = await getSession();
  if (!session) return null;
  const { data } = await sb.from('institutes').select('*').eq('id', session.user.id).maybeSingle();
  return data;
}

/** Sign out and go to GSIRF home. */
async function signOut() {
  await sb.auth.signOut();
  window.location.href = 'index.html';
}
