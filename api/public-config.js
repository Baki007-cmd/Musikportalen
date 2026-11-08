module.exports = function handler(req, res) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  res.setHeader("Cache-Control", "no-store");
  if (!url || !key || !/^https:\/\//.test(url) || !key.startsWith("sb_publishable_")) {
    return res.status(503).json({ error: "Supabase är inte konfigurerat i Vercel." });
  }
  return res.status(200).json({ url, key, googleDriveClientId: process.env.GOOGLE_DRIVE_CLIENT_ID || null });
};
