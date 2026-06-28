import { supabase } from './supabase.js';

const initCallback = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  
  const error = urlParams.get('error_description') || urlParams.get('error') || 
                hashParams.get('error_description') || hashParams.get('error');
                
  if (error) {
    console.error('OAuth callback error:', error);
    window.location.href = `/index.html?auth_error=${encodeURIComponent(error)}`;
    return;
  }

  const redirectPath = urlParams.get('redirect') || '/app/';

  // Listen for auth state changes (e.g. SIGNED_IN)
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    if (session && session.user) {
      subscription.unsubscribe();
      // Delay slightly for a premium loading feel
      setTimeout(() => {
        window.location.href = redirectPath;
      }, 1000);
    }
  });

  // Check if session is already active immediately
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session && session.user) {
      subscription.unsubscribe();
      setTimeout(() => {
        window.location.href = redirectPath;
      }, 1000);
    }
  });

  // Fallback timeout in case auth fails or is canceled
  setTimeout(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        subscription.unsubscribe();
        console.error('OAuth callback timeout, no session found.');
        window.location.href = '/index.html';
      }
    });
  }, 8000);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCallback);
} else {
  initCallback();
}
