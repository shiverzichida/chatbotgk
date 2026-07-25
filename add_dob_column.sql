-- Tambahkan kolom date_of_birth ke tabel public.profiles jika belum ada
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
