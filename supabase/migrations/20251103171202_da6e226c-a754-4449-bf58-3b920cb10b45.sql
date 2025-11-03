-- Fix RLS policies for daily_challenges
CREATE POLICY "Users can create their own challenges"
ON public.daily_challenges
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add some default exercises
INSERT INTO public.exercises (name, description, xp_per_set) VALUES
  ('Push-ups', 'Classic bodyweight exercise for chest and arms', 10),
  ('Squats', 'Lower body strength exercise', 10),
  ('Plank', 'Core stability exercise', 15),
  ('Lunges', 'Lower body and balance exercise', 10),
  ('Burpees', 'Full body cardio exercise', 20),
  ('Pull-ups', 'Upper body pulling exercise', 15),
  ('Mountain Climbers', 'Cardio and core exercise', 10),
  ('Jumping Jacks', 'Warm-up cardio exercise', 5)
ON CONFLICT DO NOTHING;