import { createClient } from "@supabase/supabase-js";

const REMEMBER_ME_KEY = "lipstick_remember_me";

function getActiveAuthStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REMEMBER_ME_KEY) === "true"
    ? window.localStorage
    : window.sessionStorage;
}

const rememberAwareStorage = {
  getItem(key: string) {
    return getActiveAuthStorage()?.getItem(key) ?? null;
  },
  setItem(key: string, value: string) {
    getActiveAuthStorage()?.setItem(key, value);
  },
  removeItem(key: string) {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  },
};

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: rememberAwareStorage,
    },
  }
);
