import fs from 'fs';

// Check if running on Vercel CI environment
if (process.env.VERCEL) {
  const envContent = `
VITE_SUPABASE_URL=${process.env.VITE_SUPABASE_URL || ''}
VITE_SUPABASE_ANON_KEY=${process.env.VITE_SUPABASE_ANON_KEY || ''}
VITE_GEMINI_API_KEY=${process.env.VITE_GEMINI_API_KEY || ''}
`;
  fs.writeFileSync('.env', envContent.trim());
  console.log('✅ Vercel: .env file generated dynamically from environment variables.');
} else {
  console.log('ℹ️ Local environment: skipping dynamic .env generation.');
}
