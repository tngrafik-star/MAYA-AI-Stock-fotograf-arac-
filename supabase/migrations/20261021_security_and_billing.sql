-- ====================================================================
-- MayaListing - Güvenlik & Faturalandırma Düzeltmeleri (2026-10-21)
-- ====================================================================
-- Mevcut bir veritabanında Supabase "SQL Editor" üzerinden bir kez çalıştırın.
-- Yeni kurulumlarda supabase_schema.sql bu değişiklikleri zaten içerir.
-- ====================================================================

-- 1. Abonelik ve aylık kota takibi için yeni sütunlar
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS usage_reset_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '1 month'),
    ADD COLUMN IF NOT EXISTS subscription_status TEXT,
    ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS lemon_subscription_id TEXT,
    ADD COLUMN IF NOT EXISTS lemon_customer_id TEXT;

-- Şimdiye kadar kota hiç sıfırlanmadığı için mevcut kullanıcıların dönemi
-- bir sonraki analizde yenilensin (ödeme yapıp kilitlenen kullanıcılar dahil).
UPDATE public.profiles SET usage_reset_at = NOW();

-- 2. profiles: kullanıcı yalnızca name/email alanlarını güncelleyebilir.
-- plan, generations_limit, generations_used ve abonelik alanları sadece
-- sunucu (service_role) tarafından değiştirilebilir.
REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM anon, authenticated;
GRANT UPDATE (name, email) ON public.profiles TO authenticated;

DROP POLICY IF EXISTS "Kullanıcılar kendi profillerini güncelleyebilir" ON public.profiles;
CREATE POLICY "Kullanıcılar kendi profillerini güncelleyebilir"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 3. webhook_events: ödeme payload'ları (müşteri e-postası vb.) içerir,
-- istemciye tamamen kapalı olmalı. service_role RLS'i bypass eder.
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.webhook_events FROM anon, authenticated;

-- 4. Atomik kredi tüketimi (aylık dönem dolduysa önce sıfırlar).
-- Limit doluysa satır döndürmez.
CREATE OR REPLACE FUNCTION public.consume_generation(p_user_id UUID)
RETURNS SETOF public.profiles
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    UPDATE public.profiles p
       SET generations_used = 0,
           usage_reset_at = NOW() + INTERVAL '1 month'
     WHERE p.id = p_user_id
       AND p.usage_reset_at <= NOW();

    RETURN QUERY
    UPDATE public.profiles p
       SET generations_used = p.generations_used + 1
     WHERE p.id = p_user_id
       AND p.generations_used < p.generations_limit
    RETURNING p.*;
END;
$$;

-- AI çağrısı başarısız olursa tüketilen krediyi iade eder.
CREATE OR REPLACE FUNCTION public.refund_generation(p_user_id UUID)
RETURNS VOID
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
    UPDATE public.profiles
       SET generations_used = GREATEST(0, generations_used - 1)
     WHERE id = p_user_id;
$$;

-- Fonksiyonlar PostgREST üzerinden istemciye açılmasın
REVOKE EXECUTE ON FUNCTION public.consume_generation(UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.refund_generation(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_generation(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.refund_generation(UUID) TO service_role;

-- 5. SECURITY DEFINER tetikleyicisine sabit search_path
ALTER FUNCTION public.handle_new_user() SET search_path = public;
