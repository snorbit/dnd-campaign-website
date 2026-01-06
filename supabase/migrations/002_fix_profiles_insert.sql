-- Fix for RLS Policy Error During Signup
-- This adds the missing INSERT policy to allow users to create their profile

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
