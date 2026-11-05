"use strict";
window.getMusikportalenSupabase = async function () {
  if (window.__musikSupabase) return window.__musikSupabase;
  if (!window.supabase) throw new Error("Supabase-biblioteket kunde inte laddas.");
  const response = await fetch("/api/public-config", {cache:"no-store"});
  if (!response.ok) throw new Error("Kunde inte läsa inställningarna. Kontrollera Vercel-miljövariabler och gör en ny deployment.");
  const config = await response.json();
  window.__musikSupabase = window.supabase.createClient(config.url, config.key);
  return window.__musikSupabase;
};
