CREATE TABLE inquiry_form_fields (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_type_id uuid        NOT NULL REFERENCES inquiry_types(id) ON DELETE CASCADE,
  field_label     text        NOT NULL,
  field_type      text        NOT NULL DEFAULT 'text'
                              CHECK (field_type IN ('text','textarea','tel','email','select','checkbox','radio')),
  placeholder     text,
  options         jsonb,
  is_required     boolean     NOT NULL DEFAULT false,
  sort_order      integer     NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- インデックス
CREATE INDEX inquiry_form_fields_type_id_idx ON inquiry_form_fields(inquiry_type_id);

-- RLS（inquiry_types と同じ方針）
ALTER TABLE inquiry_form_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inquiry_form_fields_select_all"
  ON inquiry_form_fields FOR SELECT
  USING (true);

CREATE POLICY "inquiry_form_fields_admin_write"
  ON inquiry_form_fields FOR ALL
  USING (EXISTS (
    SELECT 1 FROM inquiry_types it
    WHERE it.id = inquiry_form_fields.inquiry_type_id
      AND is_admin_of_team(it.team_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM inquiry_types it
    WHERE it.id = inquiry_form_fields.inquiry_type_id
      AND is_admin_of_team(it.team_id)
  ));
