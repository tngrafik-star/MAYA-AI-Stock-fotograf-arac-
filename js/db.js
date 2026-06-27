import { supabase } from './supabase.js';

// Setup listener for auth state change to sync profiles to localStorage
supabase.auth.onAuthStateChange((event, session) => {
  if (session && session.user) {
    // Run the profile sync asynchronously in the next event loop tick to prevent auth deadlocks
    setTimeout(async () => {
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (error) throw error;

        if (profile) {
          localStorage.setItem('maya_current_user', JSON.stringify({
            id: session.user.id,
            name: profile.name,
            email: profile.email,
            plan: profile.plan,
            generations_limit: profile.generations_limit,
            generations_used: profile.generations_used,
            gemini_api_key: profile.gemini_api_key,
            created_at: profile.created_at
          }));
        } else {
          // Basic fallback
          localStorage.setItem('maya_current_user', JSON.stringify({
            id: session.user.id,
            name: session.user.user_metadata?.name || 'Yeni Kullanıcı',
            email: session.user.email,
            plan: 'free',
            generations_limit: 5,
            generations_used: 0,
            created_at: session.user.created_at
          }));
        }
      } catch (err) {
        console.error('Failed to sync profile in onAuthStateChange:', err);
      }
    }, 0);
  } else {
    // User logged out
    localStorage.removeItem('maya_current_user');
  }
});

// Stubs for backward compatibility
export function initDB() {
  // Database is hosted on Supabase, seeding is handled via SQL script
  console.log('Supabase DB initialized.');
}

export function getTable(key) {
  return [];
}

export function saveTable(key, data) {
  // Stored remotely
}

export function addUser(user) {
  // User creation is handled by Supabase Auth
}

// Active user methods
export function getCurrentUser() {
  const user = localStorage.getItem('maya_current_user');
  return user ? JSON.parse(user) : null;
}

export function setCurrentUser(user) {
  if (user) {
    localStorage.setItem('maya_current_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('maya_current_user');
  }
}

// Base64 to Blob helper for file uploads
function base64ToBlob(base64, mimeType) {
  const byteCharacters = atob(base64.split(',')[1]);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

// Upload & Results methods
export async function saveGeneration(userId, imageUrl, metadata) {
  try {
    if (supabase.isDummy) {
      const uploadId = `upload_${Date.now()}`;
      const resultId = `result_${Date.now()}`;
      
      const resultItem = {
        id: resultId,
        upload_id: uploadId,
        user_id: userId,
        image_url: imageUrl,
        upload_date: new Date().toISOString(),
        title: metadata.title,
        description: metadata.description,
        keywords: metadata.keywords,
        tags: metadata.tags,
        category: metadata.category || 'general',
        created_at: new Date().toISOString()
      };

      // Save to localStorage history
      const localHistory = JSON.parse(localStorage.getItem('maya_history') || '[]');
      localHistory.unshift(resultItem);
      localStorage.setItem('maya_history', JSON.stringify(localHistory));

      // Increment generations_used in local profile
      const currentUser = getCurrentUser();
      if (currentUser) {
        currentUser.generations_used = (currentUser.generations_used || 0) + 1;
        setCurrentUser(currentUser);
      }

      // Log activity
      await logActivity(userId, `Metadata Oluşturuldu: ${metadata.title.substring(0, 15)}...`);

      return { uploadId, resultId };
    }

    let finalImageUrl = imageUrl;

    // If it's a base64 string, upload it to Supabase Storage
    if (imageUrl.startsWith('data:')) {
      const mimeType = imageUrl.substring(5, imageUrl.indexOf(';'));
      const extension = mimeType.split('/')[1] || 'jpg';
      const fileName = `${userId}/${Math.random().toString(36).substr(2, 9)}_${Date.now()}.${extension}`;
      const blob = base64ToBlob(imageUrl, mimeType);

      // Upload to 'images' bucket
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('images')
        .upload(fileName, blob, { contentType: mimeType, cacheControl: '3600' });

      if (uploadError) {
        console.error('Storage upload error, using raw URL/base64 instead:', uploadError);
      } else {
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('images')
          .getPublicUrl(fileName);
        finalImageUrl = urlData.publicUrl;
      }
    }

    // 1. Insert record into uploads
    const { data: uploadRecord, error: uploadDbError } = await supabase
      .from('uploads')
      .insert({
        user_id: userId,
        image_url: finalImageUrl
      })
      .select()
      .single();

    if (uploadDbError) throw uploadDbError;

    // 2. Insert record into results
    const { data: resultRecord, error: resultDbError } = await supabase
      .from('results')
      .insert({
        upload_id: uploadRecord.id,
        user_id: userId,
        title: metadata.title,
        description: metadata.description,
        keywords: metadata.keywords,
        tags: metadata.tags,
        category: metadata.category || 'general'
      })
      .select()
      .single();

    if (resultDbError) throw resultDbError;

    // 3. Increment generations_used in profile
    const currentUser = getCurrentUser();
    if (currentUser) {
      const newUsed = (currentUser.generations_used || 0) + 1;
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ generations_used: newUsed })
        .eq('id', userId);
      
      if (!profileError) {
        currentUser.generations_used = newUsed;
        setCurrentUser(currentUser);
      }
    }

    // 4. Log activity
    await logActivity(userId, `Metadata Oluşturuldu: ${metadata.title.substring(0, 15)}...`);

    return { uploadId: uploadRecord.id, resultId: resultRecord.id };
  } catch (error) {
    console.error('saveGeneration error:', error);
    throw error;
  }
}

export async function getUserHistory(userId) {
  try {
    if (supabase.isDummy) {
      const localHistory = JSON.parse(localStorage.getItem('maya_history') || '[]');
      return localHistory.filter(item => item.user_id === userId);
    }

    const { data, error } = await supabase
      .from('results')
      .select(`
        id,
        upload_id,
        title,
        description,
        keywords,
        tags,
        category,
        created_at,
        uploads:upload_id (
          image_url,
          upload_date
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(item => ({
      id: item.id,
      upload_id: item.upload_id,
      image_url: item.uploads?.image_url || '',
      upload_date: item.uploads?.upload_date || item.created_at,
      title: item.title,
      description: item.description,
      keywords: item.keywords,
      tags: item.tags,
      category: item.category
    }));
  } catch (error) {
    console.error('getUserHistory error:', error);
    return [];
  }
}

// Log activity history
export async function logActivity(userId, action) {
  try {
    if (supabase.isDummy) {
      const localActivity = JSON.parse(localStorage.getItem('maya_activity') || '[]');
      localActivity.unshift({
        user_id: userId,
        action,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('maya_activity', JSON.stringify(localActivity));
      return;
    }

    const { error } = await supabase
      .from('activity_history')
      .insert({
        user_id: userId,
        action: action
      });
    if (error) throw error;
  } catch (error) {
    console.error('logActivity error:', error);
  }
}

export async function getActivityLogs(userId) {
  try {
    if (supabase.isDummy) {
      const localActivity = JSON.parse(localStorage.getItem('maya_activity') || '[]');
      return localActivity.filter(item => item.user_id === userId);
    }

    const { data, error } = await supabase
      .from('activity_history')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('getActivityLogs error:', error);
    return [];
  }
}
