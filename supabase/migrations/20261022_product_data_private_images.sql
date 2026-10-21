-- ====================================================================
-- MayaListing - Ürün verisi ve özel görsel deposu (2026-10-22)
-- ====================================================================
-- 20261021_security_and_billing.sql'den SONRA, Supabase "SQL Editor"
-- üzerinden bir kez çalıştırın. Tekrar çalıştırmak güvenlidir.
-- ====================================================================

-- 1. CSV dışa aktarımında stok sitelerinin dosyayı eşleştirebilmesi için
-- orijinal dosya adı; özel depodaki görselin yolu
ALTER TABLE public.uploads
    ADD COLUMN IF NOT EXISTS original_filename TEXT,
    ADD COLUMN IF NOT EXISTS image_path TEXT;

-- 2. Platforma özel çıktıların tamamı (Adobe, Shutterstock, Freepik,
-- Vecteezy, e-ticaret). Eski kayıtlarda boş kalır; arayüz o zaman
-- temel başlık/açıklamadan yeniden kurar.
ALTER TABLE public.results
    ADD COLUMN IF NOT EXISTS platform_data JSONB;

-- 3. Mevcut public URL'lerden depo yolunu çıkar
UPDATE public.uploads
   SET image_path = split_part(image_url, '/storage/v1/object/public/images/', 2)
 WHERE image_path IS NULL
   AND image_url LIKE '%/storage/v1/object/public/images/%';

-- 4. "images" deposunu özel yap: görseller artık yalnızca sahibine
-- imzalı (süreli) URL ile gösterilir
UPDATE storage.buckets SET public = false WHERE id = 'images';

DROP POLICY IF EXISTS "Kullanıcılar kendi görsellerini görebilir" ON storage.objects;
CREATE POLICY "Kullanıcılar kendi görsellerini görebilir"
    ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'images' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Kullanıcılar kendi klasörüne görsel yükleyebilir" ON storage.objects;
CREATE POLICY "Kullanıcılar kendi klasörüne görsel yükleyebilir"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- NOT: Daha önce panelden eklenmiş, herkese okuma veren bir politika varsa
-- (ör. "Public Access") görseller hâlâ API üzerinden okunabilir. Kontrol için:
--   select policyname, cmd, qual from pg_policies
--    where schemaname = 'storage' and tablename = 'objects';
-- 'images' için herkese açık SELECT veren politikayı silin.

-- 5. Kullanılmayan ve soul.md'ye aykırı API anahtarı sütunu
ALTER TABLE public.profiles DROP COLUMN IF EXISTS gemini_api_key;
