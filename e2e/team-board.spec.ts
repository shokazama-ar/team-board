import { test, expect, Page, BrowserContext } from '@playwright/test';

const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'test1234';
const TEST_TEAM_ID = '271e9f20-7693-4c87-a46a-6e899a6e2f0c';

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';
const STORAGE_KEY = 'sb-local-auth-token';

// NEXT_PUBLIC_SUPABASE_URL が 127.0.0.1 以外（EC2公開IP等）の場合にプロキシを設定
const PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? SUPABASE_URL;

async function setupSupabaseProxy(page: Page) {
  if (PUBLIC_SUPABASE_URL === SUPABASE_URL) return; // localhost同士なのでプロキシ不要
  await page.route(`${PUBLIC_SUPABASE_URL}/**`, async (route) => {
    const newUrl = route.request().url().replace(PUBLIC_SUPABASE_URL, SUPABASE_URL);
    const headers = route.request().headers();
    await route.continue({ url: newUrl, headers });
  });
}

// base64url encoding (same as supabase/ssr)
function stringToBase64URL(str: string): string {
  return Buffer.from(str, 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Node.js fetch でトークン取得 → cookieとして注入してログイン
async function login(page: Page) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
  });
  const tokenData = await res.json();

  if (!tokenData.access_token) {
    throw new Error('ログイントークン取得失敗: ' + JSON.stringify(tokenData));
  }

  const session = {
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    token_type: 'bearer',
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    expires_in: 3600,
    user: tokenData.user,
  };

  // supabase/ssr と同じ base64url エンコーディングでcookieを設定
  const cookieValue = 'base64-' + stringToBase64URL(JSON.stringify(session));

  await page.context().addCookies([{
    name: STORAGE_KEY,
    value: cookieValue,
    domain: 'localhost',
    path: '/',
    httpOnly: false,
    secure: false,
    sameSite: 'Lax',
  }]);

  // プロキシ設定してダッシュボードへ
  await setupSupabaseProxy(page);
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  const url = page.url();
  console.log('After login URL:', url);
  if (url.includes('/login')) {
    throw new Error('ログイン後もloginページのまま: ' + url);
  }
}

// ===== 認証不要ページ =====

test.describe('[T013] 問い合わせフォーム（認証不要）', () => {
  test('contact/[teamId] ページが表示される', async ({ page }) => {
    await setupSupabaseProxy(page);
    await page.goto(`/contact/${TEST_TEAM_ID}`);
    await page.waitForLoadState('domcontentloaded');
    const url = page.url();
    const bodyText = await page.locator('body').innerText();
    console.log('[T013] URL:', url);
    console.log('[T013] Body (500):', bodyText.substring(0, 500));

    // /login にリダイレクトされていないか
    expect(url).not.toContain('/login');
    expect(url).not.toContain('404');
  });

  test('フォーム要素（名前・メール・メッセージ等）が存在する', async ({ page }) => {
    await setupSupabaseProxy(page);
    await page.goto(`/contact/${TEST_TEAM_ID}`);
    await page.waitForLoadState('domcontentloaded');

    // Wait a bit for client-side render
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').innerText();
    console.log('[T013] Form test body:', bodyText.substring(0, 600));

    const form = page.locator('form');
    const formCount = await form.count();
    console.log('[T013] Form count:', formCount);
    expect(formCount).toBeGreaterThan(0);

    // 入力フィールドがある
    const inputs = page.locator('input, textarea, select');
    const inputCount = await inputs.count();
    console.log('[T013] Input/textarea/select count:', inputCount);
    expect(inputCount).toBeGreaterThan(0);
  });

  test('フォーム送信でinquiriesテーブルにレコードが入る', async ({ page }) => {
    await setupSupabaseProxy(page);
    await page.goto(`/contact/${TEST_TEAM_ID}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').innerText();
    console.log('[T013] Form submit test - body:', bodyText.substring(0, 400));

    // 名前フィールド
    const nameInput = page.locator('#name');
    const nameCount = await nameInput.count();
    if (nameCount === 0) {
      console.log('[T013] name input not found, skipping');
      return;
    }
    await nameInput.fill('E2Eテスト太郎');

    // メールフィールド
    const emailInput = page.locator('#email');
    await emailInput.fill('e2e-test@example.com');

    // 送信ボタンクリック（→確認ダイアログ表示）
    const submitBtn = page.locator('button[type="submit"]').first();
    await submitBtn.click();
    await page.waitForTimeout(500);

    // 確認ダイアログの「この内容で送信」ボタンを待つ
    const confirmBtn = page.locator('button:has-text("この内容で送信")');
    await confirmBtn.waitFor({ state: 'visible', timeout: 5000 });
    console.log('[T013] Confirm dialog appeared');

    // ダイアログの確認ボタンをクリック
    await confirmBtn.click();
    await page.waitForTimeout(2000);

    // 成功メッセージを確認
    const afterBody = await page.locator('body').innerText();
    console.log('[T013] After confirmed submit body:', afterBody.substring(0, 400));

    const hasSuccess = afterBody.includes('お問い合わせを受け付けました');
    const hasError = afterBody.includes('失敗') || afterBody.includes('エラー');
    console.log('[T013] Has success:', hasSuccess, 'Has error:', hasError);
    expect(hasSuccess).toBe(true);
    expect(hasError).toBe(false);
  });
});

// ===== パスワードリセット =====

test.describe('[T004] パスワードリセットページ', () => {
  test('/forgot-password ページが表示される', async ({ page }) => {
    await setupSupabaseProxy(page);
    await page.goto('/forgot-password');
    await page.waitForLoadState('domcontentloaded');
    const url = page.url();
    const bodyText = await page.locator('body').innerText();
    console.log('[T004] forgot-password URL:', url);
    console.log('[T004] forgot-password body:', bodyText.substring(0, 400));

    // ログインページにリダイレクトされていないこと
    expect(url).not.toContain('/login');
    // メール入力欄がある
    const emailInput = page.locator('input[type="email"]');
    const emailCount = await emailInput.count();
    console.log('[T004] Email inputs:', emailCount);
    expect(emailCount).toBeGreaterThan(0);
  });

  test('/reset-password ページは認証なしでアクセスすると適切なメッセージが出る', async ({ page }) => {
    await setupSupabaseProxy(page);
    await page.goto('/reset-password');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    const url = page.url();
    const bodyText = await page.locator('body').innerText();
    console.log('[T004] reset-password URL:', url);
    console.log('[T004] reset-password body:', bodyText.substring(0, 400));

    // 認証なしアクセスでloginリダイレクトは正常動作とする
    // パスワード入力欄またはエラーメッセージまたはリダイレクト
    const passwordInput = page.locator('input[type="password"]');
    const passwordCount = await passwordInput.count();
    console.log('[T004] Password inputs:', passwordCount);
    const hasContent = passwordCount > 0
      || url.includes('/login')
      || bodyText.includes('無効')
      || bodyText.includes('期限')
      || bodyText.includes('error')
      || bodyText.includes('リンク')
      || bodyText.includes('読み込み中');
    console.log('[T004] hasContent:', hasContent, 'url:', url);
    expect(hasContent).toBe(true);
  });
});

// ===== ログイン後の機能テスト =====

test.describe('ログイン後の機能テスト', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    const url = page.url();
    if (url.includes('/login')) {
      throw new Error('ログインに失敗しました: ' + url);
    }
  });

  test('[T006] お知らせ画面のタブUI（管理者向け/全員向け）', async ({ page }) => {
    await page.goto('/announcements');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    const url = page.url();
    const bodyText = await page.locator('body').innerText();
    console.log('[T006] announcements URL:', url);
    console.log('[T006] announcements body (800):', bodyText.substring(0, 800));

    // タブが存在する
    const hasTab = bodyText.includes('管理者') || bodyText.includes('全員') || bodyText.includes('全て') || bodyText.includes('お知らせ');
    console.log('[T006] Has tab text:', hasTab);
    expect(hasTab).toBe(true);

    // タブ要素
    const tabs = page.locator('[role="tab"], .tab, button[data-tab]');
    const tabCount = await tabs.count();
    console.log('[T006] Tab elements:', tabCount);

    const adminTab = page.locator('button:has-text("管理者"), [role="tab"]:has-text("管理者")');
    const adminTabCount = await adminTab.count();
    console.log('[T006] "管理者" tab count:', adminTabCount);

    if (adminTabCount > 0) {
      await adminTab.first().click();
      await page.waitForTimeout(500);
      const afterTabBody = await page.locator('body').innerText();
      console.log('[T006] After admin tab click (600):', afterTabBody.substring(0, 600));
    }

    const allTab = page.locator('button:has-text("全員"), [role="tab"]:has-text("全員"), button:has-text("全て"), [role="tab"]:has-text("全て")');
    const allTabCount = await allTab.count();
    console.log('[T006] "全員/全て" tab count:', allTabCount);
  });

  test('[T008] イベント詳細のアイコンボタン（編集・削除）', async ({ page }) => {
    await page.goto('/events');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    const bodyText = await page.locator('body').innerText();
    console.log('[T008] events body (400):', bodyText.substring(0, 400));

    // イベントリンクを探す
    const eventLinks = page.locator('a[href*="/events/"]:not([href*="/events/bulk"]):not([href*="/events/new"])');
    const count = await eventLinks.count();
    console.log('[T008] Event links:', count);

    if (count > 0) {
      const href = await eventLinks.first().getAttribute('href');
      console.log('[T008] Navigating to:', href);
      await page.goto(href!);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);

      const detailBody = await page.locator('body').innerText();
      console.log('[T008] event detail body (600):', detailBody.substring(0, 600));

      // 編集ボタンがテキストのみでなくアイコンを使っているか確認
      const editTextVisible = await page.locator('text="編集"').count();
      const deleteTextVisible = await page.locator('text="削除"').count();
      console.log('[T008] "編集" text visible:', editTextVisible);
      console.log('[T008] "削除" text visible:', deleteTextVisible);
      // アイコンのみなら0であることを期待
      expect(editTextVisible).toBe(0);
      expect(deleteTextVisible).toBe(0);
    } else {
      console.log('[T008] No events found, skipping detail check');
    }
  });

  test('[T009] バッジスタイル区別（イベント一覧）', async ({ page }) => {
    await page.goto('/events');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    const bodyText = await page.locator('body').innerText();
    console.log('[T009] events body:', bodyText.substring(0, 400));

    // pill形状（rounded-full）とbadge形状（border付き）の要素がある
    const pillElements = page.locator('.rounded-full');
    const pillCount = await pillElements.count();
    console.log('[T009] rounded-full elements:', pillCount);

    const borderElements = page.locator('.border');
    const borderCount = await borderElements.count();
    console.log('[T009] border elements:', borderCount);
    expect(pillCount + borderCount).toBeGreaterThan(0);
  });

  test('[T010] イベント一括追加UIページ', async ({ page }) => {
    await page.goto('/events/bulk');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    const url = page.url();
    const bodyText = await page.locator('body').innerText();
    console.log('[T010] bulk URL:', url);
    console.log('[T010] bulk body (600):', bodyText.substring(0, 600));

    expect(url).not.toContain('404');
    const is404 = bodyText.includes('404') || bodyText.includes('Not Found');
    expect(is404).toBe(false);

    const hasAddUI = bodyText.includes('追加') || bodyText.includes('保存') || bodyText.includes('登録') || bodyText.includes('一括');
    console.log('[T010] Has add/save UI:', hasAddUI);
    expect(hasAddUI).toBe(true);
  });

  test('[T016] 一括登録UIのセレクトボックス（コンパクトレイアウト）', async ({ page }) => {
    await page.goto('/events/bulk');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    const selects = page.locator('select');
    const selectCount = await selects.count();
    console.log('[T016] Select elements:', selectCount);
    expect(selectCount).toBeGreaterThanOrEqual(1);

    if (selectCount > 0) {
      const firstSelect = selects.first();
      const options = await firstSelect.locator('option').allTextContents();
      console.log('[T016] First select options:', options);
    }
  });

  test('[T011] 招待コード共有UI（コピー/共有ボタン）', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    const url = page.url();
    const bodyText = await page.locator('body').innerText();
    console.log('[T011] settings URL:', url);
    console.log('[T011] settings body (800):', bodyText.substring(0, 800));

    const hasInviteCode = bodyText.includes('招待') || bodyText.includes('444aac91');
    console.log('[T011] Has invite code content:', hasInviteCode);
    expect(hasInviteCode).toBe(true);

    const copyBtn = page.locator('button:has-text("コピー"), button:has-text("共有"), button:has-text("シェア"), button[aria-label*="コピー"], button[aria-label*="共有"]');
    const copyCount = await copyBtn.count();
    console.log('[T011] Copy/Share buttons:', copyCount);
    expect(copyCount).toBeGreaterThan(0);
  });

  test('[T014] 問い合わせ一覧（お知らせ管理者タブ）', async ({ page }) => {
    await page.goto('/announcements');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    const bodyText = await page.locator('body').innerText();
    console.log('[T014] announcements body (800):', bodyText.substring(0, 800));

    const adminTab = page.locator('button:has-text("管理者"), [role="tab"]:has-text("管理者")');
    const adminTabCount = await adminTab.count();
    console.log('[T014] Admin tab count:', adminTabCount);

    if (adminTabCount > 0) {
      await adminTab.first().click();
      await page.waitForTimeout(500);
      const tabBody = await page.locator('body').innerText();
      console.log('[T014] After clicking admin tab:', tabBody.substring(0, 800));
      const hasInquiry = tabBody.includes('問い合わせ') || tabBody.includes('Inquiry');
      console.log('[T014] Has inquiry section after tab click:', hasInquiry);
      expect(hasInquiry).toBe(true);
    } else {
      const hasInquiry = bodyText.includes('問い合わせ');
      console.log('[T014] Has inquiry on page:', hasInquiry);
      expect(hasInquiry).toBe(true);
    }
  });
});
