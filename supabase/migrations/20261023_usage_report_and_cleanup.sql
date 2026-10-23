-- ====================================================================
-- MayaListing - Kullanım raporu ve sayaç temizliği (2026-10-23)
-- ====================================================================
-- 20261023_abuse_and_cost_limits.sql'den SONRA, Supabase "SQL Editor"
-- üzerinden bir kez çalıştırın. Tekrar çalıştırmak güvenlidir.
--
-- Kullanım (SQL Editor):
--   SELECT * FROM public.admin_usage_daily LIMIT 14;      -- son günler
--   SELECT * FROM public.admin_usage_today;               -- bugünkü sayaçlar
--   SELECT * FROM public.admin_top_users_today;           -- bugün en çok kullananlar
-- ====================================================================

-- 1. Analiz başına tahmini maliyet (USD). Gemini fiyatı değişirse güncelleyin:
--    UPDATE public.app_limits SET est_cost_flash_usd = 0.004, est_cost_pro_usd = 0.022 WHERE id = 1;
-- Varsayılanlar ~1.300 girdi + ~1.500 çıktı token'ı (Pro'da +512 düşünme)
-- varsayımıyla kabaca hesaplanmıştır; kesin değil.
ALTER TABLE public.app_limits
    ADD COLUMN IF NOT EXISTS est_cost_flash_usd NUMERIC(10, 5) NOT NULL DEFAULT 0.004,
    ADD COLUMN IF NOT EXISTS est_cost_pro_usd NUMERIC(10, 5) NOT NULL DEFAULT 0.022;

-- 2. Günlük analiz sayısı, modele göre dağılım ve tahmini maliyet.
-- Kaynak: kaydedilen sonuçlar (results). Plan, kullanıcının şu anki planıdır.
CREATE OR REPLACE VIEW public.admin_usage_daily
WITH (security_invoker = true) AS
SELECT
    r.created_at::DATE AS day,
    COUNT(*) AS analyses,
    COUNT(*) FILTER (WHERE p.plan IN ('pro', 'studio')) AS pro_model,
    COUNT(*) FILTER (WHERE p.plan NOT IN ('pro', 'studio')) AS flash_model,
    COUNT(DISTINCT r.user_id) AS active_users,
    ROUND(
        COUNT(*) FILTER (WHERE p.plan IN ('pro', 'studio')) * MAX(l.est_cost_pro_usd)
        + COUNT(*) FILTER (WHERE p.plan NOT IN ('pro', 'studio')) * MAX(l.est_cost_flash_usd),
        2
    ) AS est_cost_usd,
    MAX(l.global_daily_cap) AS global_daily_cap
FROM public.results r
JOIN public.profiles p ON p.id = r.user_id
CROSS JOIN public.app_limits l
GROUP BY r.created_at::DATE
ORDER BY day DESC;

-- 3. Bugünkü sayaçlar (genel tavan, IP'ler, e-posta) ve tavana oran
CREATE OR REPLACE VIEW public.admin_usage_today
WITH (security_invoker = true) AS
SELECT
    c.key,
    c.count,
    CASE WHEN c.key = 'global' THEN ROUND(100.0 * c.count / NULLIF(l.global_daily_cap, 0), 1) END AS percent_of_global_cap
FROM public.usage_counters c
CROSS JOIN public.app_limits l
WHERE c.day = CURRENT_DATE
ORDER BY c.count DESC;

-- 4. Bugün en çok analiz yapan hesaplar
CREATE OR REPLACE VIEW public.admin_top_users_today
WITH (security_invoker = true) AS
SELECT
    p.email,
    p.plan,
    p.daily_used AS today,
    p.generations_used AS this_period,
    p.generations_limit AS period_limit
FROM public.profiles p
WHERE p.daily_reset_on = CURRENT_DATE AND p.daily_used > 0
ORDER BY p.daily_used DESC
LIMIT 20;

-- Raporlar yalnızca panelden (SQL Editor / service_role) okunur
REVOKE ALL ON public.admin_usage_daily FROM anon, authenticated;
REVOKE ALL ON public.admin_usage_today FROM anon, authenticated;
REVOKE ALL ON public.admin_top_users_today FROM anon, authenticated;

-- 5. 30 günden eski sayaçları her gece 03:15'te (UTC) sil (pg_cron).
-- pg_cron Supabase'de hazır gelir; bu satır eklentiyi açar.
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
    PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'maya-cleanup-usage-counters';
    PERFORM cron.schedule(
        'maya-cleanup-usage-counters',
        '15 3 * * *',
        $job$DELETE FROM public.usage_counters WHERE day < CURRENT_DATE - 30$job$
    );
END;
$$;

-- Kontrol: zamanlanmış iş
SELECT jobname, schedule, command FROM cron.job WHERE jobname = 'maya-cleanup-usage-counters';
