 -- FIX FOR: "campaigns" violates foreign key constraint "campaigns_dm_id_fkey"
-- This ensures all auth users have profiles in the profiles table

-- STEP 1: Create profiles for any existing auth users that don't have them
INSERT INTO public.profiles (id, username, display_name)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'username', u.email, 'user_' || u.id::text),
  COALESCE(u.raw_user_meta_data->>'display_name', u.raw_user_meta_data->>'username', u.email, 'User')
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;

-- STEP 2: Recreate the trigger function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email, 'user_' || NEW.id::text),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'username', NEW.email, 'User')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 3: Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- STEP 4: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;

-- STEP 5: Verify all users have profiles
SELECT 
  COUNT(*) as total_auth_users,
  (SELECT COUNT(*) FROM public.profiles) as total_profiles
FROM auth.users;
