CREATE TABLE inquiry_replies (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id   uuid NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
  direction    text NOT NULL CHECK (direction IN ('outbound', 'inbound')),
  from_name    text,
  from_email   text,
  body         text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_inquiry_replies_inquiry_id ON inquiry_replies(inquiry_id, created_at);

ALTER TABLE inquiry_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "team members can read replies"
  ON inquiry_replies FOR SELECT
  USING (
    inquiry_id IN (
      SELECT id FROM inquiries WHERE team_id IN (
        SELECT team_id FROM team_members WHERE user_id = auth.uid()
      )
    )
  );
