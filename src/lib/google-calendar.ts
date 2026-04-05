// Google Calendar API との通信ロジック（fetch API を直接使用）

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_BASE = "https://www.googleapis.com/calendar/v3";

export type GoogleCalendarEvent = {
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
};

export type GoogleCalendarListEntry = {
  id: string;
  summary: string;
  primary?: boolean;
  accessRole?: string;
};

/** リフレッシュトークンを使ってアクセストークンを取得 */
export async function getAccessToken(refreshToken: string): Promise<string> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`アクセストークン取得失敗: ${body}`);
  }

  const data = await res.json();
  return data.access_token as string;
}

/** 新しいGoogleカレンダーを作成し、作成されたカレンダーIDを返す */
export async function createCalendar(
  accessToken: string,
  summary: string
): Promise<string> {
  const res = await fetch(`${GOOGLE_CALENDAR_BASE}/calendars`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ summary }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`カレンダー作成失敗: ${body}`);
  }

  const data = await res.json();
  return data.id as string;
}

/** カレンダー一覧を取得 */
export async function listCalendars(
  accessToken: string
): Promise<GoogleCalendarListEntry[]> {
  const res = await fetch(`${GOOGLE_CALENDAR_BASE}/users/me/calendarList`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`カレンダー一覧取得失敗: ${res.status}`);
  }

  const data = await res.json();
  return (data.items ?? []) as GoogleCalendarListEntry[];
}

/** Googleカレンダーにイベントを作成し、作成されたイベントのIDを返す */
export async function createGoogleEvent(
  accessToken: string,
  calendarId: string,
  event: GoogleCalendarEvent
): Promise<string> {
  const res = await fetch(
    `${GOOGLE_CALENDAR_BASE}/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`イベント作成失敗: ${body}`);
  }

  const data = await res.json();
  return data.id as string;
}

/** Googleカレンダーのイベントを更新 */
export async function updateGoogleEvent(
  accessToken: string,
  calendarId: string,
  googleEventId: string,
  event: GoogleCalendarEvent
): Promise<void> {
  const res = await fetch(
    `${GOOGLE_CALENDAR_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(googleEventId)}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`イベント更新失敗: ${body}`);
  }
}

/** カレンダーを一般公開（iCal購読可能レベル）に設定 */
export async function setCalendarPublic(
  accessToken: string,
  calendarId: string
): Promise<void> {
  const res = await fetch(
    `${GOOGLE_CALENDAR_BASE}/calendars/${encodeURIComponent(calendarId)}/acl`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role: "reader", scope: { type: "default" } }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`カレンダー公開設定失敗: ${body}`);
  }
}

/** Googleカレンダーのイベントを削除 */
export async function deleteGoogleEvent(
  accessToken: string,
  calendarId: string,
  googleEventId: string
): Promise<void> {
  const res = await fetch(
    `${GOOGLE_CALENDAR_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(googleEventId)}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  // 404はすでに削除済みとみなして無視する
  if (!res.ok && res.status !== 404) {
    throw new Error(`イベント削除失敗: ${res.status}`);
  }
}

/** TeamBoardイベントをGoogleカレンダーイベント形式に変換 */
export function toGoogleCalendarEvent(event: {
  title: string;
  date: string;
  end_at: string | null;
  location: string | null;
  memo: string | null;
}): GoogleCalendarEvent {
  const startDt = new Date(event.date);
  // end_at がない場合は1時間後をデフォルトとする
  const endDt = event.end_at
    ? new Date(event.end_at)
    : new Date(startDt.getTime() + 60 * 60 * 1000);

  return {
    summary: event.title,
    ...(event.location ? { location: event.location } : {}),
    ...(event.memo ? { description: event.memo } : {}),
    start: { dateTime: startDt.toISOString(), timeZone: "Asia/Tokyo" },
    end: { dateTime: endDt.toISOString(), timeZone: "Asia/Tokyo" },
  };
}
