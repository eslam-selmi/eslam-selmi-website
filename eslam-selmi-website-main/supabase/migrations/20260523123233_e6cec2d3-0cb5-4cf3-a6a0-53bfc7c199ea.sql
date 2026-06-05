-- Restrict Realtime channel subscriptions so users can only listen on topics scoped to their own user id.
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users subscribe to own notif channel" ON realtime.messages;

CREATE POLICY "users subscribe to own notif channel"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() LIKE ('notifs-' || auth.uid()::text || '-%')
);