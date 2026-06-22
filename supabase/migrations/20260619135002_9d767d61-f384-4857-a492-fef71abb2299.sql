
-- 1. Expand property_status enum
ALTER TYPE property_status ADD VALUE IF NOT EXISTS 'available';
ALTER TYPE property_status ADD VALUE IF NOT EXISTS 'under_negotiation';
ALTER TYPE property_status ADD VALUE IF NOT EXISTS 'rented_out';
ALTER TYPE property_status ADD VALUE IF NOT EXISTS 'temporarily_unavailable';

-- 2. Property status tracking
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS status_updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS status_updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. Status history
CREATE TABLE IF NOT EXISTS public.property_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  status text NOT NULL,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_at timestamptz NOT NULL DEFAULT now(),
  notes text
);
GRANT SELECT, INSERT ON public.property_status_history TO authenticated;
GRANT SELECT ON public.property_status_history TO anon;
GRANT ALL ON public.property_status_history TO service_role;
ALTER TABLE public.property_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads status history" ON public.property_status_history FOR SELECT USING (true);
CREATE POLICY "Owners write status history" ON public.property_status_history FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.properties p WHERE p.id=property_id AND p.owner_id=auth.uid())
  OR public.has_role(auth.uid(),'admin')
);

-- 4. Conversations & messages
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(property_id, buyer_id)
);
GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants view conversations" ON public.conversations FOR SELECT USING (auth.uid() IN (buyer_id, owner_id) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Buyer creates conversation" ON public.conversations FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Participants update conversation" ON public.conversations FOR UPDATE USING (auth.uid() IN (buyer_id, owner_id));

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants view messages" ON public.messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.conversations c WHERE c.id=conversation_id AND (auth.uid() IN (c.buyer_id, c.owner_id) OR public.has_role(auth.uid(),'admin')))
);
CREATE POLICY "Participants send messages" ON public.messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND EXISTS (SELECT 1 FROM public.conversations c WHERE c.id=conversation_id AND auth.uid() IN (c.buyer_id, c.owner_id))
);
CREATE POLICY "Participants mark read" ON public.messages FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.conversations c WHERE c.id=conversation_id AND auth.uid() IN (c.buyer_id, c.owner_id))
);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON public.messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_buyer ON public.conversations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_owner ON public.conversations(owner_id);

-- 5. Migrate any 'agent' users to 'owner' (keep enum value to avoid breakage)
UPDATE public.profiles SET user_type='owner' WHERE user_type='agent';

-- 6. Admin policies
DROP POLICY IF EXISTS "Admins manage all profiles" ON public.profiles;
CREATE POLICY "Admins manage all profiles" ON public.profiles FOR ALL USING (public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Admins view inquiries" ON public.inquiries;
CREATE POLICY "Admins view inquiries" ON public.inquiries FOR SELECT USING (public.has_role(auth.uid(),'admin'));

-- 7. Bookings policies: allow owner to update status
DROP POLICY IF EXISTS "Users manage own bookings" ON public.bookings;
CREATE POLICY "Bookings select" ON public.bookings FOR SELECT USING (auth.uid()=user_id OR auth.uid()=owner_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Bookings insert" ON public.bookings FOR INSERT WITH CHECK (auth.uid()=user_id);
CREATE POLICY "Bookings update" ON public.bookings FOR UPDATE USING (auth.uid()=user_id OR auth.uid()=owner_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Bookings delete" ON public.bookings FOR DELETE USING (auth.uid()=user_id OR public.has_role(auth.uid(),'admin'));

-- 8. Properties select policy: include new statuses (use ::text to avoid enum-in-transaction issue)
DROP POLICY IF EXISTS "Public reads published properties" ON public.properties;
CREATE POLICY "Public reads listed properties" ON public.properties FOR SELECT
USING (
  (status::text IN ('published','available','under_negotiation','sold','rented','rented_out','temporarily_unavailable'))
  OR auth.uid()=owner_id
  OR public.has_role(auth.uid(),'admin')
);

-- 9. Status change trigger
CREATE OR REPLACE FUNCTION public.log_property_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF (TG_OP='UPDATE' AND NEW.status IS DISTINCT FROM OLD.status) THEN
    NEW.status_updated_at := now();
    NEW.status_updated_by := auth.uid();
    INSERT INTO public.property_status_history(property_id, status, changed_by)
    VALUES (NEW.id, NEW.status::text, auth.uid());
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_props_status ON public.properties;
CREATE TRIGGER trg_props_status BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION public.log_property_status_change();

-- 10. Conversation bump trigger
CREATE OR REPLACE FUNCTION public.bump_conversation()
RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  UPDATE public.conversations SET last_message_at=now() WHERE id=NEW.conversation_id;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_msg_bump_conv ON public.messages;
CREATE TRIGGER trg_msg_bump_conv AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.bump_conversation();

-- 11. Conversations updated trigger
CREATE TRIGGER trg_conv_updated BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
