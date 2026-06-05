
CREATE TYPE public.support_ticket_status AS ENUM ('open', 'pending_admin', 'pending_user', 'closed');

CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  subject text NOT NULL CHECK (char_length(subject) BETWEEN 1 AND 200),
  status public.support_ticket_status NOT NULL DEFAULT 'pending_admin',
  unread_for_admin boolean NOT NULL DEFAULT true,
  unread_for_user boolean NOT NULL DEFAULT false,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_support_tickets_user ON public.support_tickets(user_id, last_message_at DESC);
CREATE INDEX idx_support_tickets_admin ON public.support_tickets(status, last_message_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user view own tickets" ON public.support_tickets FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "user create own tickets" ON public.support_tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user update own ticket read state" ON public.support_tickets FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admin manage tickets" ON public.support_tickets FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.support_ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  sender_role text NOT NULL CHECK (sender_role IN ('user','admin')),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 4000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ticket_messages_ticket ON public.support_ticket_messages(ticket_id, created_at);

GRANT SELECT, INSERT ON public.support_ticket_messages TO authenticated;
GRANT ALL ON public.support_ticket_messages TO service_role;

ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view messages of own ticket" ON public.support_ticket_messages FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid())
  );

CREATE POLICY "user send messages to own ticket" ON public.support_ticket_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND sender_role = 'user'
    AND EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid())
  );

CREATE POLICY "admin send messages" ON public.support_ticket_messages FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    AND sender_role = 'admin'
    AND sender_id = auth.uid()
  );

CREATE OR REPLACE FUNCTION public.fn_support_ticket_message_after_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.sender_role = 'user' THEN
    UPDATE public.support_tickets
      SET unread_for_admin = true, unread_for_user = false,
          status = 'pending_admin', last_message_at = now(), updated_at = now()
      WHERE id = NEW.ticket_id;
  ELSE
    UPDATE public.support_tickets
      SET unread_for_user = true, unread_for_admin = false,
          status = 'pending_user', last_message_at = now(), updated_at = now()
      WHERE id = NEW.ticket_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_support_ticket_msg_ai
AFTER INSERT ON public.support_ticket_messages
FOR EACH ROW EXECUTE FUNCTION public.fn_support_ticket_message_after_insert();

ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_ticket_messages;
