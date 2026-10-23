-- ====================================================================
-- MayaListing - Kötüye kullanım ve maliyet sınırları (2026-10-23)
-- ====================================================================
-- Supabase "SQL Editor" üzerinden bir kez çalıştırın (tekrar çalıştırmak
-- güvenlidir). Yeni kodu deploy etmeden ÖNCE çalıştırın: sunucu yeni
-- consume_generation(p_user_id, p_ip) imzasını kullanır.
--
-- Sınırları deploy gerektirmeden değiştirmek için:
--   UPDATE public.app_limits SET global_daily_cap = 5000 WHERE id = 1;
-- ====================================================================

-- 1. Ayarlanabilir sınırlar (tek satır)
CREATE TABLE IF NOT EXISTS public.app_limits (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    -- Tüm kullanıcılar için günlük toplam AI analizi (maliyet sigortası)
    global_daily_cap INTEGER NOT NULL DEFAULT 2000,
    -- Ücretsiz planda aynı IP'den günlük analiz (çoklu hesap açmaya karşı)
    free_ip_daily_cap INTEGER NOT NULL DEFAULT 10,
    -- Plan başına günlük analiz (aylık kotanın yanında, ani patlamalara karşı)
    daily_cap_free INTEGER NOT NULL DEFAULT 5,
    daily_cap_starter INTEGER NOT NULL DEFAULT 60,
    daily_cap_pro INTEGER NOT NULL DEFAULT 150,
    daily_cap_studio INTEGER NOT NULL DEFAULT 150,
    -- Otomatik e-posta yanıtı: gönderen başına ve toplam günlük
    mail_sender_daily_cap INTEGER NOT NULL DEFAULT 3,
    mail_global_daily_cap INTEGER NOT NULL DEFAULT 100
);
INSERT INTO public.app_limits (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- 2. Günlük sayaçlar (anahtar: 'global', 'ip:<adres>', 'mail:<e-posta>', ...)
CREATE TABLE IF NOT EXISTS public.usage_counters (
    key TEXT NOT NULL,
    day DATE NOT NULL DEFAULT CURRENT_DATE,
    count INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (key, day)
);

ALTER TABLE public.app_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_counters ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.app_limits FROM anon, authenticated;
REVOKE ALL ON public.usage_counters FROM anon, authenticated;

-- 3. Kullanıcı başına günlük sayaç
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS daily_used INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS daily_reset_on DATE NOT NULL DEFAULT CURRENT_DATE;

-- 4. Sayaç yardımcıları: sınır doluysa artırmaz ve false döner
CREATE OR REPLACE FUNCTION public.try_increment_counter(p_key TEXT, p_cap INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_count INTEGER;
BEGIN
    IF p_cap <= 0 THEN
        RETURN FALSE;
    END IF;

    INSERT INTO public.usage_counters AS c (key, day, count)
    VALUES (p_key, CURRENT_DATE, 1)
    ON CONFLICT (key, day) DO UPDATE
        SET count = c.count + 1
        WHERE c.count < p_cap
    RETURNING c.count INTO v_count;

    RETURN v_count IS NOT NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_counter(p_key TEXT)
RETURNS VOID
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
    UPDATE public.usage_counters
       SET count = GREATEST(0, count - 1)
     WHERE key = p_key AND day = CURRENT_DATE;
$$;

-- 5. Kredi tüketimi: tüm sınırları tek yerde kontrol eder.
-- ok = false ise reason: email_not_confirmed | no_profile | monthly_limit |
-- daily_limit | service_busy | ip_limit. Hiçbir sayaç artırılmaz.
DROP FUNCTION IF EXISTS public.consume_generation(UUID);
DROP FUNCTION IF EXISTS public.consume_generation(UUID, TEXT);
CREATE FUNCTION public.consume_generation(p_user_id UUID, p_ip TEXT DEFAULT NULL)
RETURNS TABLE (
    ok BOOLEAN,
    reason TEXT,
    plan TEXT,
    generations_used INTEGER,
    generations_limit INTEGER,
    usage_reset_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
#variable_conflict use_column
DECLARE
    lim public.app_limits%ROWTYPE;
    prof public.profiles%ROWTYPE;
    v_confirmed TIMESTAMP WITH TIME ZONE;
    v_daily_cap INTEGER;
BEGIN
    SELECT * INTO lim FROM public.app_limits WHERE id = 1;

    -- Onaylanmamış e-postalarla açılan hesaplar analiz yapamaz
    SELECT u.email_confirmed_at INTO v_confirmed FROM auth.users u WHERE u.id = p_user_id;
    IF v_confirmed IS NULL THEN
        RETURN QUERY SELECT FALSE, 'email_not_confirmed'::TEXT, NULL::TEXT, NULL::INTEGER, NULL::INTEGER, NULL::TIMESTAMPTZ;
        RETURN;
    END IF;

    -- Aylık ve günlük dönem yenileme
    UPDATE public.profiles p
       SET generations_used = 0, usage_reset_at = NOW() + INTERVAL '1 month'
     WHERE p.id = p_user_id AND p.usage_reset_at <= NOW();
    UPDATE public.profiles p
       SET daily_used = 0, daily_reset_on = CURRENT_DATE
     WHERE p.id = p_user_id AND p.daily_reset_on < CURRENT_DATE;

    SELECT * INTO prof FROM public.profiles p WHERE p.id = p_user_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'no_profile'::TEXT, NULL::TEXT, NULL::INTEGER, NULL::INTEGER, NULL::TIMESTAMPTZ;
        RETURN;
    END IF;

    IF prof.generations_used >= prof.generations_limit THEN
        RETURN QUERY SELECT FALSE, 'monthly_limit'::TEXT, prof.plan, prof.generations_used, prof.generations_limit, prof.usage_reset_at;
        RETURN;
    END IF;

    v_daily_cap := CASE prof.plan
        WHEN 'starter' THEN lim.daily_cap_starter
        WHEN 'pro' THEN lim.daily_cap_pro
        WHEN 'studio' THEN lim.daily_cap_studio
        ELSE lim.daily_cap_free
    END;
    IF prof.daily_used >= v_daily_cap THEN
        RETURN QUERY SELECT FALSE, 'daily_limit'::TEXT, prof.plan, prof.generations_used, prof.generations_limit, prof.usage_reset_at;
        RETURN;
    END IF;

    IF NOT public.try_increment_counter('global', lim.global_daily_cap) THEN
        RETURN QUERY SELECT FALSE, 'service_busy'::TEXT, prof.plan, prof.generations_used, prof.generations_limit, prof.usage_reset_at;
        RETURN;
    END IF;

    IF prof.plan = 'free' AND p_ip IS NOT NULL THEN
        IF NOT public.try_increment_counter('ip:' || p_ip, lim.free_ip_daily_cap) THEN
            PERFORM public.decrement_counter('global');
            RETURN QUERY SELECT FALSE, 'ip_limit'::TEXT, prof.plan, prof.generations_used, prof.generations_limit, prof.usage_reset_at;
            RETURN;
        END IF;
    END IF;

    UPDATE public.profiles p
       SET generations_used = p.generations_used + 1,
           daily_used = p.daily_used + 1
     WHERE p.id = p_user_id;

    RETURN QUERY SELECT TRUE, NULL::TEXT, prof.plan, prof.generations_used + 1, prof.generations_limit, prof.usage_reset_at;
END;
$$;

-- 6. Başarısız AI çağrısında her şeyi geri al
DROP FUNCTION IF EXISTS public.refund_generation(UUID);
DROP FUNCTION IF EXISTS public.refund_generation(UUID, TEXT);
CREATE FUNCTION public.refund_generation(p_user_id UUID, p_ip TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_plan TEXT;
BEGIN
    UPDATE public.profiles p
       SET generations_used = GREATEST(0, p.generations_used - 1),
           daily_used = GREATEST(0, p.daily_used - 1)
     WHERE p.id = p_user_id
    RETURNING p.plan INTO v_plan;

    PERFORM public.decrement_counter('global');
    IF v_plan = 'free' AND p_ip IS NOT NULL THEN
        PERFORM public.decrement_counter('ip:' || p_ip);
    END IF;
END;
$$;

-- 7. Otomatik e-posta yanıtı izni (gönderen başına + toplam günlük)
CREATE OR REPLACE FUNCTION public.allow_mail_reply(p_sender TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    lim public.app_limits%ROWTYPE;
BEGIN
    SELECT * INTO lim FROM public.app_limits WHERE id = 1;
    IF NOT public.try_increment_counter('mail:' || lower(p_sender), lim.mail_sender_daily_cap) THEN
        RETURN FALSE;
    END IF;
    IF NOT public.try_increment_counter('mail:global', lim.mail_global_daily_cap) THEN
        PERFORM public.decrement_counter('mail:' || lower(p_sender));
        RETURN FALSE;
    END IF;
    RETURN TRUE;
END;
$$;

-- 8. Fonksiyonlar yalnızca sunucuya (service_role) açık
REVOKE EXECUTE ON FUNCTION public.try_increment_counter(TEXT, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.decrement_counter(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.consume_generation(UUID, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.refund_generation(UUID, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.allow_mail_reply(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.try_increment_counter(TEXT, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.decrement_counter(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.consume_generation(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.refund_generation(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.allow_mail_reply(TEXT) TO service_role;

-- 9. Eski sayaçları temizlemek için (isteğe bağlı, ara sıra çalıştırın):
--   DELETE FROM public.usage_counters WHERE day < CURRENT_DATE - 30;
-- Bugünkü kullanımı görmek için:
--   SELECT key, count FROM public.usage_counters WHERE day = CURRENT_DATE ORDER BY count DESC;
