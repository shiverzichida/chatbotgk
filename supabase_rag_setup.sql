-- =========================================================================
-- SCRIPT PENYIAPAN TABEL DOCUMENT CHUNKS (RAG BASIS PENGETAHUAN)
-- Jalankan script ini di menu "SQL Editor" pada Dashboard Supabase Anda
-- =========================================================================

-- 1. BUAT TABEL DOCUMENT CHUNKS
CREATE TABLE IF NOT EXISTS public.document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,                  -- Isi potongan teks
    chapter_title TEXT,                     -- Judul bab atau judul berkas PDF
    page_start INTEGER,                     -- Halaman awal potongan teks
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. AKTIFKAN ROW LEVEL SECURITY (RLS)
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;

-- Hapus policy lama jika ada
DROP POLICY IF EXISTS "Siapa saja dapat membaca document_chunks" ON public.document_chunks;
DROP POLICY IF EXISTS "Hanya Admin yang dapat memanipulasi document_chunks" ON public.document_chunks;

-- 3. BUAT KEBIJAKAN AKSES (POLICIES)
-- Kebijakan Read: Siapa saja (termasuk user & chatbot) bisa membaca referensi teks rujukan
CREATE POLICY "Siapa saja dapat membaca document_chunks"
    ON public.document_chunks FOR SELECT
    USING (true);

-- Kebijakan Write/All: Hanya Admin (atau menggunakan Service Role Key) yang dapat mengupload & memotong teks
CREATE POLICY "Hanya Admin yang dapat memanipulasi document_chunks"
    ON public.document_chunks FOR ALL
    USING (
        auth.jwt() ->> 'email' = 'admin@gizikebugaran.com' 
        or (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    );
