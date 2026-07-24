-- ====================================================================
-- MayaListing - Supabase Database Schema Setup Script
-- ====================================================================
-- Bu scripti Supabase panelinizdeki "SQL Editor" -> "New Query"
-- kısmına yapıştırıp "Run" diyerek tüm tabloları ve otomatik tetikleyicileri
-- tek seferde oluşturabilirsiniz.
-- ====================================================================

-- 1. Tabloların Temizlenmesi (Varsa)
-- Dikkat: Eğer mevcut verileriniz varsa bu satırlar tabloları sıfırlar. 
-- Sıfırdan kuruyorsanız güvenle çalıştırabilirsiniz.
-- DROP TABLE IF EXISTS public.activity_history;
-- DROP TABLE IF EXISTS public.results;
-- DROP TABLE IF EXISTS public.uploads;
-- DROP TABLE IF EXISTS public.profiles;

-- 2. "profiles" Tablosunun Oluşturulması
-- Kullanıcı profillerini ve plan limitlerini tutar.
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    plan TEXT NOT NULL DEFAULT 'free',
    generations_limit INTEGER NOT NULL DEFAULT 5,
    generations_used INTEGER NOT NULL DEFAULT 0,
    gemini_api_key TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. "uploads" Tablosunun Oluşturulması
-- Kullanıcıların yüklediği görsel URL'lerini tutar.
CREATE TABLE public.uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. "results" Tablosunun Oluşturulması
-- Yapay zeka tarafından üretilen metadata (başlık, açıklama, anahtar kelimeler) sonuçlarını tutar.
CREATE TABLE public.results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    upload_id UUID NOT NULL REFERENCES public.uploads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    keywords TEXT NOT NULL,
    tags TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. "activity_history" Tablosunun Oluşturulması
-- Kullanıcıların panel içerisindeki işlem loglarını tutar.
CREATE TABLE public.activity_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. "webhook_events" Tablosunun Oluşturulması
-- Stripe ve Lemon Squeezy webhook'larının idempotency'sini sağlamak için
-- gelen webhook event ID'lerini tracking eder.
CREATE TABLE public.webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL UNIQUE,
    event_type TEXT NOT NULL,
    provider TEXT NOT NULL,
    payload JSONB NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Otomatik Profil Oluşturma Tetikleyicisi (Trigger)
-- Yeni bir kullanıcı kaydolduğunda (auth.users tablosuna eklendiğinde)
-- public.profiles tablosuna otomatik olarak ücretsiz plan ile satır eklenir.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email, plan, generations_limit, generations_used)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', 'Yeni Kullanıcı'),
        NEW.email,
        'free',
        5,
        0
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Tetikleyiciyi Bağlama
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Güvenlik ve RLS (Row Level Security) Ayarları
-- Bu ayarlar sayesinde hiçbir kullanıcı diğer kullanıcının verilerini göremez veya değiştiremez.

-- RLS'leri Aktif Etme
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_history ENABLE ROW LEVEL SECURITY;

-- ** profiles Politikaları **
CREATE POLICY "Kullanıcılar kendi profillerini görebilir" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Kullanıcılar kendi profillerini güncelleyebilir" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

-- ** uploads Politikaları **
CREATE POLICY "Kullanıcılar kendi yüklemelerini görebilir" 
    ON public.uploads FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar yeni yükleme ekleyebilir" 
    ON public.uploads FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- ** results Politikaları **
CREATE POLICY "Kullanıcılar kendi sonuçlarını görebilir" 
    ON public.results FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar yeni sonuç ekleyebilir" 
    ON public.results FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar kendi sonuçlarını silebilir" 
    ON public.results FOR DELETE 
    USING (auth.uid() = user_id);

-- ** activity_history Politikaları **
CREATE POLICY "Kullanıcılar kendi etkinlik geçmişini görebilir" 
    ON public.activity_history FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar etkinlik geçmişi ekleyebilir" 
    ON public.activity_history FOR INSERT 
    WITH CHECK (auth.uid() = user_id);
