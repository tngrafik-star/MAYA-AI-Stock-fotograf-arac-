import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isValidUrl = (url) => {
  try {
    return url && url.startsWith('http') && !url.includes('your_supabase_project_url_here');
  } catch (e) {
    return false;
  }
};

const createDummySupabase = () => {
  console.warn('⚠️ Supabase configuration is missing or invalid. Using a fallback mock client.');
  return {
    isDummy: true,
    auth: {
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      getSession: async () => ({ data: { session: null }, error: null }),
      signInWithPassword: async () => ({ data: { user: null }, error: new Error('Supabase yapılandırılmamış. Lütfen .env dosyasını kontrol edin.') }),
      signUp: async () => ({ data: { user: null }, error: new Error('Supabase yapılandırılmamış. Lütfen .env dosyasını kontrol edin.') }),
      signInWithOAuth: async () => ({ error: new Error('Supabase yapılandırılmamış. Lütfen .env dosyasını kontrol edin.') }),
      signOut: async () => ({ error: null }),
      resetPasswordForEmail: async () => ({ error: new Error('Supabase yapılandırılmamış. Lütfen .env dosyasını kontrol edin.') }),
      updateUser: async () => ({ error: new Error('Supabase yapılandırılmamış. Lütfen .env dosyasını kontrol edin.') })
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: null, error: null }),
          single: async () => ({ data: null, error: new Error('Supabase yapılandırılmamış.') }),
          order: async () => ({ data: [], error: null })
        }),
        order: async () => ({ data: [], error: null })
      }),
      insert: () => ({
        select: () => ({
          single: async () => ({ data: null, error: new Error('Supabase yapılandırılmamış.') })
        })
      }),
      update: () => ({
        eq: async () => ({ error: new Error('Supabase yapılandırılmamış.') })
      })
    }),
    storage: {
      from: () => ({
        upload: async () => ({ data: null, error: new Error('Supabase yapılandırılmamış.') }),
        getPublicUrl: () => ({ data: { publicUrl: '' } })
      })
    }
  };
};

export const supabase = isValidUrl(supabaseUrl) && supabaseAnonKey && !supabaseAnonKey.includes('your_supabase_anon_key_here')
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createDummySupabase();

