-- teams テーブルに slug 列追加
ALTER TABLE public.teams
  ADD COLUMN slug text UNIQUE
  CONSTRAINT teams_slug_format CHECK (slug ~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$' OR length(slug) = 1);

COMMENT ON COLUMN public.teams.slug IS
  '問い合わせ送信元メールアドレスのローカルパート。contact-{slug}@minibas.ballershub.net で使用。設定済みチームのみ問い合わせフォームが有効。';

-- slug を anon から取得できる公開 RPC（contact ページ用）
CREATE OR REPLACE FUNCTION public.get_team_slug(tid uuid)
RETURNS text AS $$
DECLARE
  result text;
BEGIN
  SELECT slug INTO result FROM public.teams WHERE id = tid;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_team_slug(uuid) TO anon;
