-- Fix user role assignment bug in handle_new_user trigger
-- The previous version was hardcoding role as 'CREATOR' instead of using the role from metadata

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.users (id, email, role, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    -- Fix: Use role from metadata, default to 'CREATOR' if not provided
    COALESCE(NEW.raw_user_meta_data->>'role', 'CREATOR')::user_role,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$function$;

-- Log this fix for audit trail
INSERT INTO events (type, actor_user_id, payload) 
VALUES (
  'system.database_fix',
  NULL, -- system operation
  jsonb_build_object(
    'fix_type', 'user_role_assignment',
    'description', 'Fixed handle_new_user trigger to properly assign user roles from signup metadata',
    'previous_behavior', 'All users were being assigned CREATOR role regardless of selection',
    'new_behavior', 'Users are assigned the role they selected during signup',
    'timestamp', now(),
    'migration_file', '20250908000000_fix_user_role_assignment.sql'
  )
);