-- Fix security linter warnings

-- Fix function search path security issue
CREATE OR REPLACE FUNCTION log_security_event()
RETURNS TRIGGER AS $$
BEGIN
  -- Log sensitive operations for audit trail
  IF TG_OP = 'UPDATE' AND TG_TABLE_NAME = 'payouts' THEN
    INSERT INTO events (type, actor_user_id, payload) 
    VALUES (
      'security.payout_updated',
      auth.uid(),
      jsonb_build_object(
        'payout_id', NEW.id,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'timestamp', now()
      )
    );
  END IF;
  
  IF TG_OP = 'UPDATE' AND TG_TABLE_NAME = 'deals' AND OLD.state != NEW.state THEN
    INSERT INTO events (type, actor_user_id, payload) 
    VALUES (
      'security.deal_state_changed',
      auth.uid(),
      jsonb_build_object(
        'deal_id', NEW.id,
        'old_state', OLD.state,
        'new_state', NEW.state,
        'timestamp', now()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Also fix existing functions to have secure search_path
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
    'CREATOR', -- Default role, can be changed later
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;