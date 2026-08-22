
-- Add User Profiles table with role column for Supabase Auth
-- Run this in Supabase Dashboard > SQL Editor

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  role text NOT NULL CHECK (role IN ('student', 'college', 'admin')) DEFAULT 'student',
  full_name text,
  avatar_url text,
  college_id text,
  department text,
  roll_number text,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 4. Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (new.id, 'student', new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ language plpgsql security definer;

-- Trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. Migrate existing users (one-time)
INSERT INTO public.profiles (id, role, full_name)
SELECT id, 
       COALESCE((raw_user_meta_data->>'role')::text, 'student') as role,
       raw_user_meta_data->>'full_name'
FROM auth.users 
ON CONFLICT (id) DO UPDATE SET 
  role = EXCLUDED.role,
  full_name = EXCLUDED.full_name,
  updated_at = now();

COMMENT ON TABLE public.profiles IS 'Extended user profiles with roles for HubblerX app';

