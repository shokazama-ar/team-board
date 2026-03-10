-- inquiry_type_id 列を追加（nullable: 既存データは NULL のまま、新規はこちらを使う）
ALTER TABLE inquiries ADD COLUMN inquiry_type_id uuid REFERENCES inquiry_types(id) ON DELETE SET NULL;

-- カスタムフィールド値を保存する列を追加
ALTER TABLE inquiries ADD COLUMN custom_fields jsonb;

-- インデックス
CREATE INDEX inquiries_inquiry_type_id_idx ON inquiries(inquiry_type_id);
