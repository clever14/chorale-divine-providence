import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  // Aide au diagnostic si les variables d'env manquent (Vercel / .env.local)
  console.error(
    "Variables d'environnement Supabase manquantes. " +
    "Définissez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY."
  )
}

export const supabase = createClient(url || 'http://localhost', anonKey || 'anon', {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
})

/** URL publique d'un fichier dans un bucket Storage. */
export function publicUrl(bucket, path) {
  if (!path) return null
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data?.publicUrl || null
}

/** Upload un fichier et renvoie son chemin de stockage. */
export async function uploadFile(bucket, path, file) {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true, cacheControl: '3600' })
  if (error) throw error
  return path
}
