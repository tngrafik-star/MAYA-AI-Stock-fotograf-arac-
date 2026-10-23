-- ====================================================================
-- MayaListing - Studio adil kullanım sınırı: günde 100 analiz (2026-10-23)
-- ====================================================================
-- Karar: Studio planı aylık sınırsız, günde en fazla 100 analiz.
-- Fiyat sayfası ve uygulama metinleri bu sayıya göre güncellendi;
-- sayıyı yeniden değiştirirseniz o metinleri de güncelleyin.
-- ====================================================================
UPDATE public.app_limits SET daily_cap_studio = 100 WHERE id = 1;
ALTER TABLE public.app_limits ALTER COLUMN daily_cap_studio SET DEFAULT 100;

SELECT daily_cap_free, daily_cap_starter, daily_cap_pro, daily_cap_studio FROM public.app_limits WHERE id = 1;
