import type { Database } from "@financial-control/shared";
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    // sessionStorage (not localStorage) so the session ends when the
    // browser/tab is closed, not just when the token naturally expires.
    auth: { storage: window.sessionStorage },
  }
);
