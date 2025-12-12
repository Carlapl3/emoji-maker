-- Create a function to atomically decrement credits
CREATE OR REPLACE FUNCTION public.decrement_user_credits(user_id UUID)
RETURNS TABLE (credits_before INT, credits_after INT) AS $$
DECLARE
    current_credits INT;
BEGIN
    -- Get the current credits with FOR UPDATE to lock the row
    SELECT credits INTO current_credits
    FROM public.profiles
    WHERE id = user_id
    FOR UPDATE;
    
    IF NOT FOUND THEN
        -- If no user found, return NULL to indicate error
        RETURN QUERY SELECT NULL::INT, NULL::INT;
        RETURN;
    END IF;
    
    IF current_credits <= 0 THEN
        -- If no credits, return current value (which is 0 or negative)
        RETURN QUERY SELECT current_credits, current_credits;
        RETURN;
    END IF;
    
    -- Decrement credits and return old and new values
    RETURN QUERY
    UPDATE public.profiles
    SET credits = credits - 1
    WHERE id = user_id
    RETURNING credits + 1, credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.decrement_user_credits(UUID) TO authenticated;
