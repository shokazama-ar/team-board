import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// .env.local を読み込む（NEXT_PUBLIC_SUPABASE_URL 等を利用可能にする）
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    screenshot: 'only-on-failure',
  },
  outputDir: '/tmp/test-results',
});
