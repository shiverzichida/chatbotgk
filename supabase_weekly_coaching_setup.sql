-- SQL Script to set up targets, workout logging, and weekly reviews

-- 1. Create table user_targets
CREATE TABLE IF NOT EXISTS public.user_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL,
  start_weight DECIMAL(5,2) NOT NULL,
  target_weight DECIMAL(5,2) NOT NULL,
  weekly_loss_target DECIMAL(3,2) NOT NULL, -- Target change per week (+/- kg)
  daily_calorie_target INT NOT NULL DEFAULT 2000,
  daily_protein_target INT NOT NULL DEFAULT 120,
  weekly_workout_target INT NOT NULL DEFAULT 3,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_targets ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Users can view their own targets"
ON public.user_targets FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own targets"
ON public.user_targets FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own targets"
ON public.user_targets FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can do everything on user_targets"
ON public.user_targets FOR ALL
USING (auth.jwt()->>'email' = 'admin@gizikebugaran.com' OR (auth.jwt()->'user_metadata'->>'role') = 'admin');


-- 2. Create table workout_logs
CREATE TABLE IF NOT EXISTS public.workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  workout_type VARCHAR(100) NOT NULL, -- 'Beban', 'Kardio', 'Lari', etc.
  duration_minutes INT NOT NULL,
  intensity VARCHAR(20) NOT NULL, -- 'ringan', 'sedang', 'berat'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Users can view their own workouts"
ON public.workout_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workouts"
ON public.workout_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update/delete their own workouts"
ON public.workout_logs FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Admins can do everything on workout_logs"
ON public.workout_logs FOR ALL
USING (auth.jwt()->>'email' = 'admin@gizikebugaran.com' OR (auth.jwt()->'user_metadata'->>'role') = 'admin');


-- 3. Create table weekly_reviews
CREATE TABLE IF NOT EXISTS public.weekly_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_number INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  weight_change DECIMAL(5,2) NOT NULL, -- actual weight change during this week
  compliance_score DECIMAL(5,2) NOT NULL, -- percentage of calories/workouts done
  ai_feedback TEXT, -- AI-generated report
  coach_feedback TEXT, -- Coach Mury's manual review notes
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.weekly_reviews ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Users can view their own weekly reviews"
ON public.weekly_reviews FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can do everything on weekly_reviews"
ON public.weekly_reviews FOR ALL
USING (auth.jwt()->>'email' = 'admin@gizikebugaran.com' OR (auth.jwt()->'user_metadata'->>'role') = 'admin');
