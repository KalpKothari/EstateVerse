-- Fix messaging error: trg_conv_updated trigger calls touch_updated_at() which sets NEW.updated_at,
-- but conversations table has no updated_at column. Remove the bad trigger.
DROP TRIGGER IF EXISTS trg_conv_updated ON public.conversations;