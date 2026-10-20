import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Singleton client — import this wherever you need Supabase access.
// It is null when the environment variables are missing: this module is part of
// the main bundle, so throwing here would blank the entire site, not just uploads.
export const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

if (!supabase) {
  console.warn(
    '[supabase] VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are not set — image uploads are disabled.'
  );
}
