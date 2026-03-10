-- task-035: ステージング環境の問い合わせページ修正
-- get_team_name 関数と inquiries INSERT ポリシーを冪等に適用する

-- get_team_name: 公開フォームから team_id でチーム名を取得する関数
CREATE OR REPLACE FUNCTION public.get_team_name(tid uuid)
RETURNS text AS $$
DECLARE
  result text;
BEGIN
  SELECT name INTO result
  FROM public.teams
  WHERE id = tid;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_team_name(uuid) TO anon;

-- inquiries: anon の INSERT ポリシーが存在しない場合のみ作成
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'inquiries'
      AND cmd = 'INSERT'
  ) THEN
    EXECUTE 'CREATE POLICY "Anyone can submit inquiry" ON inquiries FOR INSERT WITH CHECK (true)';
  END IF;
END $$;
