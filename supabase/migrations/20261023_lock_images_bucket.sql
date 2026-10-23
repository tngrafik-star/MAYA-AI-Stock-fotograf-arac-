-- ====================================================================
-- MayaListing - "images" deposunu kilitle (2026-10-23)
-- ====================================================================
-- Canlı kontrol: anon anahtarla depo listelenebiliyor, imzalı URL
-- alınabiliyor ve public URL'ler 200 dönüyordu. Yani depo hâlâ public ve
-- panelden eklenmiş herkese açık politika(lar) duruyor.
-- Supabase "SQL Editor" üzerinden bir kez çalıştırın. Tekrar çalıştırmak
-- güvenlidir. Sonuç tablosu silinen politikaları listeler.
-- ====================================================================

-- 1. Depoyu özel yap (public URL'ler artık çalışmaz; uygulama imzalı URL kullanıyor)
UPDATE storage.buckets SET public = false WHERE id = 'images';

-- 2. storage.objects üzerinde 'images' deposuna dokunan ve bizim iki
-- politikamız dışında kalan TÜM politikaları sil (ör. "Public Access",
-- "Allow public read", anon için listeleme/okuma izinleri).
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname
          FROM pg_policies
         WHERE schemaname = 'storage'
           AND tablename = 'objects'
           AND policyname NOT IN (
               'Kullanıcılar kendi görsellerini görebilir',
               'Kullanıcılar kendi klasörüne görsel yükleyebilir'
           )
           AND (
               coalesce(qual, '') LIKE '%images%'
               OR coalesce(with_check, '') LIKE '%images%'
               OR (coalesce(qual, '') = '' AND coalesce(with_check, '') = '')
               OR qual = 'true'
               OR with_check = 'true'
           )
    LOOP
        RAISE NOTICE 'Dropping storage policy: %', pol.policyname;
        EXECUTE format('DROP POLICY %I ON storage.objects', pol.policyname);
    END LOOP;
END;
$$;

-- 3. Kendi politikalarımızı (yoksa) yeniden kur: yalnızca giriş yapmış
-- kullanıcı, yalnızca kendi klasörünü görür ve oraya yükler
DROP POLICY IF EXISTS "Kullanıcılar kendi görsellerini görebilir" ON storage.objects;
CREATE POLICY "Kullanıcılar kendi görsellerini görebilir"
    ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'images' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Kullanıcılar kendi klasörüne görsel yükleyebilir" ON storage.objects;
CREATE POLICY "Kullanıcılar kendi klasörüne görsel yükleyebilir"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 4. Kontrol: depo özel mi ve storage.objects'te hangi politikalar kaldı?
SELECT id, public FROM storage.buckets WHERE id = 'images';
SELECT policyname, cmd, roles, qual, with_check
  FROM pg_policies
 WHERE schemaname = 'storage' AND tablename = 'objects';
