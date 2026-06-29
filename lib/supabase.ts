import { createClient } from "@supabase/supabase-js";

export const REMEMBER_ME_STORAGE_KEY = "lipstick_remember_me";

function findSupabaseAuthKeys(storage: Storage): string[] {
  const keys: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key && key.startsWith("sb-")) {
      keys.push(key);
    }
  }
  return keys;
}

export function clearSupabaseAuthKeys(storage: Storage) {
  for (const key of findSupabaseAuthKeys(storage)) {
    storage.removeItem(key);
  }
}

export function clearAllAuthStorage() {
  if (typeof window === "undefined") return;
  clearSupabaseAuthKeys(window.localStorage);
  clearSupabaseAuthKeys(window.sessionStorage);
}

function getActiveAuthStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REMEMBER_ME_STORAGE_KEY) === "true"
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

/** Move or dedupe auth tokens left in the wrong browser storage from older builds. */
export function migrateAuthStorageIfNeeded() {
  if (typeof window === "undefined") return;

  const rememberMe = localStorage.getItem(REMEMBER_ME_STORAGE_KEY) === "true";
  const primary = rememberMe ? window.localStorage : window.sessionStorage;
  const secondary = rememberMe ? window.sessionStorage : window.localStorage;

  const primaryKeys = findSupabaseAuthKeys(primary);
  const secondaryKeys = findSupabaseAuthKeys(secondary);

  if (primaryKeys.length === 0 && secondaryKeys.length > 0) {
    for (const key of secondaryKeys) {
      const value = secondary.getItem(key);
      if (value) {
        primary.setItem(key, value);
      }
      secondary.removeItem(key);
    }
    return;
  }

  if (primaryKeys.length > 0 && secondaryKeys.length > 0) {
    clearSupabaseAuthKeys(secondary);
  }
}

/** Clear conflicting sessions before a new sign-in attempt. */
export async function prepareForSignIn(rememberMe: boolean) {
  localStorage.setItem(REMEMBER_ME_STORAGE_KEY, rememberMe ? "true" : "false");
  await supabase.auth.signOut();
  clearAllAuthStorage();
}
