import { supabase } from './supabase.js';
import { getCurrentUser, setCurrentUser, logActivity } from './db.js';
import { t } from './i18n/index.js';

const DISPOSABLE_DOMAINS = [
  'mailinator.com', 'yopmail.com', 'tempmail.com', '10minutemail.com', 
  'trashmail.com', 'dispostable.com', 'guerrillamail.com', 'sharklasers.com', 
  'getairmail.com', 'burnermail.io', 'temp-mail.org', 'tempmailo.com', 
  'maildrop.cc', 'generator.email', 'mock.com', 'test.com', 'example.com',
  'tempmail.net', 'minuteinbox.com', 'crazymailing.com', 'owlymail.com'
];

const COMMON_TYPOS = {
  'gamil.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gmeil.com': 'gmail.com',
  'hotamil.com': 'hotmail.com',
  'hotmal.com': 'hotmail.com',
  'yaho.com': 'yahoo.com',
  'yahoo.co': 'yahoo.com'
};

function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    throw new Error(t('validation.invalidEmail'));
  }
  
  const cleanEmail = email.trim().toLowerCase();
  const domain = cleanEmail.split('@')[1];
  
  if (!domain) {
    throw new Error(t('validation.invalidEmailFormat'));
  }

  // 1. Check for disposable domains
  if (DISPOSABLE_DOMAINS.includes(domain)) {
    throw new Error(t('validation.disposableEmail'));
  }

  // 2. Check for common domain typos to prevent bounces
  if (COMMON_TYPOS[domain]) {
    throw new Error(t('validation.emailTypo', { suggested: COMMON_TYPOS[domain] }));
  }

  return true;
}

export async function signup(name, email, password) {
  // Validate email domain to prevent bounce emails on Supabase
  validateEmail(email);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name }
    }
  });
  if (error) throw error;
  
  if (data.user) {
    await logActivity(data.user.id, 'Hesap Oluşturuldu ve Giriş Yapıldı');
  }
  return data.user;
}

export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  if (error) throw error;
  
  if (data.user) {
    await logActivity(data.user.id, 'Giriş Yapıldı');
  }
  return data.user;
}

export async function loginWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin + '/auth/callback/'
    }
  });
  if (error) throw error;
}

export async function logout() {
  const user = getCurrentUser();
  if (user) {
    await logActivity(user.id, 'Çıkış Yapıldı');
  }
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  setCurrentUser(null);
}

export async function resetPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/auth/callback/?reset=true'
  });
  if (error) throw error;
  return true;
}

export async function updateProfile(name, email, password = null) {
  const user = getCurrentUser();
  if (!user) throw new Error(t('validation.sessionNotFound'));
  
  const profileUpdates = {
    name: name,
    email: email
  };
  
  // 1. Update Profiles table
  const { error: profileError } = await supabase
    .from('profiles')
    .update(profileUpdates)
    .eq('id', user.id);
    
  if (profileError) throw profileError;
  
  // 2. Update email and/or password via Auth API if changed
  const authUpdates = {};
  if (email && email !== user.email) {
    authUpdates.email = email;
  }
  if (password && password.trim() !== '') {
    authUpdates.password = password;
  }
  if (Object.keys(authUpdates).length > 0) {
    const { error: authError } = await supabase.auth.updateUser(authUpdates);
    if (authError) throw authError;
  }
  
  // 3. Update cached user in localStorage
  const updatedUser = {
    ...user,
    name,
    email
  };
  setCurrentUser(updatedUser);
  await logActivity(user.id, 'Profil Bilgileri Güncellendi');
  
  return updatedUser;
}

// Plan/credit columns are server-only; downgrading to free cancels the paid
// subscription at the end of the current period.
export async function cancelSubscription() {
  const user = getCurrentUser();
  if (!user) throw new Error(t('validation.sessionNotFound'));

  const { data: { session } } = await supabase.auth.getSession();
  const response = await fetch('/api/payment/lemon/cancel-subscription', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
    }
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error?.message || t('toast.paymentSessionError'));
  }

  setCurrentUser({
    ...user,
    subscription_status: data.status,
    subscription_ends_at: data.endsAt
  });
  await logActivity(user.id, 'Abonelik Güncellendi: CANCELLED');

  return data;
}

// Permanently deletes the account, its history and images (server cancels
// any paid subscription first). Signs out locally afterwards.
export async function deleteAccount(confirmEmail) {
  const { data: { session } } = await supabase.auth.getSession();
  const response = await fetch('/api/account/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
    },
    body: JSON.stringify({ confirmEmail })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error?.message || t('toast.accountDeleteFailed'));
  }

  await supabase.auth.signOut().catch(() => {});
  setCurrentUser(null);
  return true;
}
