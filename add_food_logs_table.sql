-- Tabel untuk menyimpan riwayat asupan makanan harian (Daily Food Logs)
CREATE TABLE IF NOT EXISTS public.food_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    meal_type TEXT NOT NULL CHECK (meal_type IN ('sarapan', 'makan_siang', 'makan_malam', 'snack')),
    food_name TEXT NOT NULL,
    calories INTEGER NOT NULL DEFAULT 0,
    protein INTEGER NOT NULL DEFAULT 0,
    carbs INTEGER DEFAULT 0,
    fat INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indeks untuk pencarian cepat berdasarkan user_id dan date
CREATE INDEX IF NOT EXISTS idx_food_logs_user_date ON public.food_logs(user_id, date);

-- Enable RLS
ALTER TABLE public.food_logs ENABLE ROW LEVEL SECURITY;

-- Policy agar user hanya bisa membaca dan mengedit log makanan miliknya sendiri
CREATE POLICY "Users can manage their own food logs"
    ON public.food_logs
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
