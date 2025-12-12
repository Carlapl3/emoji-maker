-- Add credits column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS credits INTEGER NOT NULL DEFAULT 5; -- Give new users 5 free credits

-- Update the handle_new_user function to set initial credits
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, credits)
  VALUES (NEW.id, 5); -- New users start with 5 credits
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
