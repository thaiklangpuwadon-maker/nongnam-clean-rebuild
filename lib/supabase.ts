import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Manifest } from "./appData";

/* =========================================================
   SUPABASE CONFIG — ทุกอย่างเป็น optional
   ถ้าไม่มี env แอปต้องไม่พัง
   ========================================================= */
export const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || "nongnam-assets";
const MANIFEST_PATH = "config/manifest.json";

export function hasSupabaseConfig(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

let _client: SupabaseClient | null = null;
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (typeof window === "undefined") return null;
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  _client = createClient(url, key);
  return _client;
}

/* =========================================================
   IMAGE UPLOAD — outfits/{id}_chatImage.jpg + outfits/{id}_bookImage.jpg
   ========================================================= */
export type OutfitImageVariant = "chatImage" | "bookImage";

export async function uploadOutfitImageRemote(
  id: string,
  variant: OutfitImageVariant,
  file: File
): Promise<{ ok: boolean; url?: string; error?: string }> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { ok: false, error: "no_supabase" };
  const path = `outfits/${id}_${variant}.jpg`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type || "image/jpeg" });
  if (error) return { ok: false, error: error.message };
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { ok: true, url: `${data.publicUrl}?v=${Date.now()}` };
}

export async function uploadBookCoverRemote(
  id: string,
  file: File
): Promise<{ ok: boolean; url?: string; error?: string }> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { ok: false, error: "no_supabase" };
  const path = `books/${id}_cover.jpg`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type || "image/jpeg" });
  if (error) return { ok: false, error: error.message };
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { ok: true, url: `${data.publicUrl}?v=${Date.now()}` };
}

/* =========================================================
   MANIFEST SYNC — config/manifest.json
   ========================================================= */
export async function uploadManifestRemote(
  manifest: Manifest
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { ok: false, error: "no_supabase" };
  const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: "application/json" });
  const file = new File([blob], "manifest.json", { type: "application/json" });
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(MANIFEST_PATH, file, { upsert: true, contentType: "application/json" });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function fetchManifestRemote(): Promise<Manifest | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;
  try {
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(MANIFEST_PATH);
    if (!data?.publicUrl) return null;
    const r = await fetch(`${data.publicUrl}?v=${Date.now()}`);
    if (!r.ok) return null;
    return (await r.json()) as Manifest;
  } catch {
    return null;
  }
}
