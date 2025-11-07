-- Fix public data exposure by requiring authentication for profiles and exercises

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Exercises are viewable by everyone" ON exercises;

-- Create new policies requiring authentication for profiles
CREATE POLICY "Authenticated users can view profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Create new policy requiring authentication for exercises
CREATE POLICY "Authenticated users can view exercises"
  ON exercises FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);