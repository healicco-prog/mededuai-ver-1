-- Add new roles to existing user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'department_admin';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'institution_admin';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'master_admin';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_admin';
COMMIT;

-- Create the profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    institution_id UUID,
    department_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on the profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create the function that inserts into profiles and users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'student'::public.user_role)
    );

    INSERT INTO public.users (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'student'::public.user_role)
    ) ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Attach the trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Clear old policies if needed
DROP POLICY IF EXISTS "Super Admins have full access" ON public.profiles;
DROP POLICY IF EXISTS "Master Admins manage their institution" ON public.profiles;
DROP POLICY IF EXISTS "Institution Admins manage their institution" ON public.profiles;
DROP POLICY IF EXISTS "Department Admins manage their department" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- RLS Policies
CREATE POLICY "Super Admins have full access" ON public.profiles FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'));
CREATE POLICY "Master Admins manage their institution" ON public.profiles FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'master_admin' AND p.institution_id = profiles.institution_id));
CREATE POLICY "Institution Admins manage their institution" ON public.profiles FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'institution_admin' AND p.institution_id = profiles.institution_id));
CREATE POLICY "Department Admins manage their department" ON public.profiles FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'department_admin' AND p.department_id = profiles.department_id AND p.institution_id = profiles.institution_id));
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
