"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, AlertCircle, CheckCircle, SkipForward, RefreshCw } from "lucide-react";

type EventType = {
  id: string;
  name: string;
  color: string;
  kind: string;
};

type ExistingEvent = {
  id: string;
  title: string;
  date: string;
  end_at: string | null;
  location: string | null;
  event_type: string;
  event_event_types: { event_types: EventType | null }[];
};

type ParsedRow = {
  rowIndex: number;
  title: string;
  date: string;
  end_at: string;
  location: string;
  memo: string;
  event_type: string;
  categories: string[];
};

type ParseError = {
  rowIndex: number;
  message: string;
};

type DuplicateItem = {
  parsed: ParsedRow;
  existing: ExistingEvent;
  action: "skip" | "overwrite";
};

type Step = "confirm" | "duplicates" | "importing" | "done";

type Props = {
  teamId: string;
  existingEvents: ExistingEvent[];
  onSuccess: () => void;
  onClose: () => void;
};

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    if (line.trim() === "") continue;
    const cols: string[] = [];
    let cur = "";
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuote) {
        if (ch === '"') {
          if (line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuote = false;
          }
        } else {
          cur += ch;
        }
      } else {
        if (ch === '"') {
          inQuote = true;
        } else if (ch === ",") {
          cols.push(cur);
          cur = "";
        } else {
          cur += ch;
        }
      }
    }
    cols.push(cur);
    rows.push(cols);
  }
  return rows;
}

function toJSTString(date: Date): string {
  const jst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  const y = jst.getUTCFullYear();
  const mo = String(jst.getUTCMonth() + 1).padStart(2, "0");
  const d = String(jst.getUTCDate()).padStart(2, "0");
  const h = String(jst.getUTCHours()).padStart(2, "0");
  const mi = String(jst.getUTCMinutes()).padStart(2, "0");
  return `${y}-${mo}-${d} ${h}:${mi}`;
}

function parseDatetime(s: string): Date | null {
  if (!s) return null;
  // YYYY-MM-DD HH:mm
  const m = s.trim().match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})$/);
  if (!m) return null;
  const [, y, mo, d, h, mi] = m;
  // treat as JST → subtract 9h for UTC
  const utc = new Date(
    Date.UTC(
      parseInt(y),
      parseInt(mo) - 1,
      parseInt(d),
      parseInt(h) - 9,
      parseInt(mi)
    )
  );
  if (isNaN(utc.getTime())) return null;
  return utc;
}


function translateDbError(message: string): string {
  if (message.includes("row-level security policy")) {
    return "このチームへの追加権限がありません（管理者権限が必要です）";
  }
  if (message.includes("null value in column")) {
    const match = message.match(/column "([^"]+)"/);
    const col = match?.[1];
    const colLabels: Record<string, string> = {
      title: "title（件名）",
      date: "date（開始日時）",
      team_id: "team_id",
      created_by: "作成者情報",
    };
    const label = col ? (colLabels[col] ?? `"${col}"`) : "必須項目";
    return `${label} が空です`;
  }
  if (message.includes("violates check constraint")) {
    return "許可されていない値が含まれています";
  }
  if (message.includes("violates foreign key constraint")) {
    return "存在しない値が参照されています";
  }
  return message;
}

export function ImportModal({ teamId, existingEvents, onSuccess, onClose }: Props) {
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("confirm");
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [parseErrors, setParseErrors] = useState<ParseError[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateItem[]>([]);
  const [newRows, setNewRows] = useState<ParsedRow[]>([]);
  const [importLog, setImportLog] = useState<string[]>([]);
  const [importError, setImportError] = useState<string>("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id ?? null);
    });
  }, [supabase]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      processCSV(text);
    };
    reader.readAsText(file, "UTF-8");
  }

  function processCSV(text: string) {
    const rows = parseCSV(text);
    if (rows.length < 2) {
      setParseErrors([{ rowIndex: 0, message: "データ行がありません" }]);
      setParsedRows([]);
      setStep("confirm");
      return;
    }

    const headers = rows[0].map((h) => h.trim().toLowerCase());
    const idx = (name: string) => headers.indexOf(name);

    const titleIdx = idx("title");
    const dateIdx = idx("date");
    const endAtIdx = idx("end_at");
    const locationIdx = idx("location");
    const memoIdx = idx("memo");
    const eventTypeIdx = idx("event_type");
    const categoriesIdx = idx("categories");

    const errors: ParseError[] = [];
    const parsed: ParsedRow[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const get = (colIdx: number) => (colIdx >= 0 ? (row[colIdx] ?? "").trim() : "");

      const title = get(titleIdx);
      const dateStr = get(dateIdx);

      if (titleIdx < 0) {
        errors.push({ rowIndex: i, message: "titleカラムが見つかりません" });
        continue;
      }
      if (!title) {
        errors.push({ rowIndex: i, message: "titleが空です" });
        continue;
      }
      if (dateIdx < 0 || !dateStr) {
        errors.push({ rowIndex: i, message: "dateが空です" });
        continue;
      }
      const dateObj = parseDatetime(dateStr);
      if (!dateObj) {
        errors.push({ rowIndex: i, message: `dateの形式が不正です: "${dateStr}"（YYYY-MM-DD HH:mm が必要）` });
        continue;
      }

      const endAtStr = get(endAtIdx);
      if (endAtStr) {
        const endObj = parseDatetime(endAtStr);
        if (!endObj) {
          errors.push({ rowIndex: i, message: `end_atの形式が不正です: "${endAtStr}"` });
          continue;
        }
      }

      const categoriesStr = get(categoriesIdx);
      const categories = categoriesStr
        ? categoriesStr.split("|").map((c) => c.trim()).filter(Boolean)
        : [];

      parsed.push({
        rowIndex: i,
        title,
        date: dateStr,
        end_at: endAtStr,
        location: get(locationIdx),
        memo: get(memoIdx),
        event_type: get(eventTypeIdx),
        categories,
      });
    }

    setParseErrors(errors);

    // duplicate detection: match on title + exact datetime (YYYY-MM-DD HH:mm in JST)
    const dups: DuplicateItem[] = [];
    const nonDups: ParsedRow[] = [];
    for (const row of parsed) {
      const match = existingEvents.find(
        (e) =>
          e.title === row.title &&
          toJSTString(new Date(e.date)) === row.date
      );
      if (match) {
        dups.push({ parsed: row, existing: match, action: "skip" });
      } else {
        nonDups.push(row);
      }
    }

    setParsedRows(parsed);
    setDuplicates(dups);
    setNewRows(nonDups);

    if (dups.length > 0) {
      setStep("duplicates");
    } else {
      setStep("confirm");
    }
  }

  function setAllActions(action: "skip" | "overwrite") {
    setDuplicates((prev) => prev.map((d) => ({ ...d, action })));
  }

  function setAction(rowIndex: number, action: "skip" | "overwrite") {
    setDuplicates((prev) =>
      prev.map((d) => (d.parsed.rowIndex === rowIndex ? { ...d, action } : d))
    );
  }

  async function resolveEventTypeId(name: string, kind: "type" | "category"): Promise<string | null> {
    if (!name) return null;
    const { data } = await supabase
      .from("event_types")
      .select("id")
      .eq("team_id", teamId)
      .eq("name", name)
      .eq("kind", kind)
      .single();
    return data?.id ?? null;
  }

  async function insertEvent(row: ParsedRow, userId: string): Promise<{ id: string | null; message: string | null }> {
    const dateISO = parseDatetime(row.date)?.toISOString() ?? null;
    const endISO = row.end_at ? parseDatetime(row.end_at)?.toISOString() : null;

    const { data, error } = await supabase
      .from("events")
      .insert({
        team_id: teamId,
        title: row.title,
        date: dateISO,
        end_at: endISO || null,
        location: row.location || null,
        memo: row.memo || null,
        event_type: row.event_type || null,
        created_by: userId,
      })
      .select("id")
      .single();

    if (error || !data) return { id: null, message: translateDbError(error?.message ?? "不明なエラー") };
    return { id: data.id, message: null };
  }

  async function upsertEventTypes(eventId: string, row: ParsedRow) {
    // delete existing junction rows first
    await supabase.from("event_event_types").delete().eq("event_id", eventId);

    const typeIds: string[] = [];

    if (row.event_type) {
      const id = await resolveEventTypeId(row.event_type, "type");
      if (id) typeIds.push(id);
    }

    for (const cat of row.categories) {
      const id = await resolveEventTypeId(cat, "category");
      if (id) typeIds.push(id);
    }

    if (typeIds.length > 0) {
      await supabase.from("event_event_types").insert(
        typeIds.map((event_type_id) => ({ event_id: eventId, event_type_id }))
      );
    }
  }

  async function handleImport() {
    if (!currentUserId) {
      setImportError("ログイン状態を確認できません。ページを再読み込みしてください。");
      return;
    }
    setStep("importing");
    const log: string[] = [];
    let hadError = false;

    // insert new rows
    for (const row of newRows) {
      const { id, message } = await insertEvent(row, currentUserId);
      if (!id) {
        log.push(`行${row.rowIndex}: 「${row.title}」の追加に失敗 — ${message}`);
        hadError = true;
        continue;
      }
      await upsertEventTypes(id, row);
      log.push(`行${row.rowIndex}: 「${row.title}」を追加しました`);
    }

    // handle duplicates
    for (const dup of duplicates) {
      if (dup.action === "skip") {
        log.push(`行${dup.parsed.rowIndex}: 「${dup.parsed.title}」をスキップしました`);
        continue;
      }
      // overwrite
      const dateISO = parseDatetime(dup.parsed.date)?.toISOString() ?? null;
      const endISO = dup.parsed.end_at
        ? parseDatetime(dup.parsed.end_at)?.toISOString()
        : null;

      const { error } = await supabase
        .from("events")
        .update({
          title: dup.parsed.title,
          date: dateISO,
          end_at: endISO || null,
          location: dup.parsed.location || null,
          memo: dup.parsed.memo || null,
          event_type: dup.parsed.event_type || null,
        })
        .eq("id", dup.existing.id);

      if (error) {
        log.push(`行${dup.parsed.rowIndex}: 「${dup.parsed.title}」の上書きに失敗 — ${translateDbError(error.message)}`);
        hadError = true;
        continue;
      }
      await upsertEventTypes(dup.existing.id, dup.parsed);
      log.push(`行${dup.parsed.rowIndex}: 「${dup.parsed.title}」を上書きしました`);
    }

    setImportLog(log);
    if (hadError) {
      setImportError("一部の行でエラーが発生しました");
    }
    setStep("done");
  }

  const addCount = newRows.length;
  const overwriteCount = duplicates.filter((d) => d.action === "overwrite").length;
  const skipCount = duplicates.filter((d) => d.action === "skip").length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">CSVインポート</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-4">
          {/* File picker always visible before import */}
          {step !== "importing" && step !== "done" && (
            <div className="mb-4">
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFile}
              />
              <button
                onClick={() => fileRef.current?.click()}
                className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-600 hover:bg-gray-100 w-full text-left"
              >
                CSVファイルを選択...
              </button>
              <p className="mt-1 text-xs text-gray-400">
                必須列: title, date（YYYY-MM-DD HH:mm）　任意: end_at, location, memo, event_type, categories（パイプ区切り）
              </p>
            </div>
          )}

          {/* Parse errors */}
          {parseErrors.length > 0 && step !== "done" && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <AlertCircle size={14} className="text-red-500" />
                <span className="text-xs font-medium text-red-700">
                  {parseErrors.length}件のエラー（該当行はスキップされます）
                </span>
              </div>
              <ul className="space-y-0.5">
                {parseErrors.map((e) => (
                  <li key={e.rowIndex} className="text-xs text-red-600">
                    行{e.rowIndex}: {e.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Duplicate resolution */}
          {step === "duplicates" && (
            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  重複イベント ({duplicates.length}件)
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAllActions("skip")}
                    className="flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
                  >
                    <SkipForward size={12} /> 全てスキップ
                  </button>
                  <button
                    onClick={() => setAllActions("overwrite")}
                    className="flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
                  >
                    <RefreshCw size={12} /> 全て上書き
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {duplicates.map((dup) => (
                  <div
                    key={dup.parsed.rowIndex}
                    className="rounded-lg border border-amber-200 bg-amber-50 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {dup.parsed.title}
                        </p>
                        <p className="text-xs text-gray-500">{dup.parsed.date}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <label className="flex items-center gap-1 text-xs cursor-pointer">
                          <input
                            type="radio"
                            name={`dup-${dup.parsed.rowIndex}`}
                            checked={dup.action === "skip"}
                            onChange={() => setAction(dup.parsed.rowIndex, "skip")}
                          />
                          スキップ
                        </label>
                        <label className="flex items-center gap-1 text-xs cursor-pointer">
                          <input
                            type="radio"
                            name={`dup-${dup.parsed.rowIndex}`}
                            checked={dup.action === "overwrite"}
                            onChange={() => setAction(dup.parsed.rowIndex, "overwrite")}
                          />
                          上書き
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Confirm summary (after parse, no dups OR after dup resolution) */}
          {step === "confirm" && parsedRows.length > 0 && (
            <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
              <p className="text-sm font-medium text-gray-700 mb-1">インポート内容</p>
              <ul className="text-sm text-gray-600 space-y-0.5">
                <li>新規追加: <span className="font-medium">{addCount}件</span></li>
                {duplicates.length > 0 && (
                  <>
                    <li>上書き: <span className="font-medium">{overwriteCount}件</span></li>
                    <li>スキップ: <span className="font-medium">{skipCount}件</span></li>
                  </>
                )}
                {parseErrors.length > 0 && (
                  <li className="text-red-600">エラー（スキップ）: {parseErrors.length}件</li>
                )}
              </ul>
            </div>
          )}

          {/* Importing state */}
          {step === "importing" && (
            <div className="py-6 text-center">
              <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              <p className="text-sm text-gray-600">インポート中...</p>
            </div>
          )}

          {/* Done state */}
          {step === "done" && (
            <div>
              <div className="mb-3 flex items-center gap-2">
                {importError ? (
                  <AlertCircle size={18} className="text-amber-500" />
                ) : (
                  <CheckCircle size={18} className="text-green-500" />
                )}
                <span className="text-sm font-medium text-gray-800">
                  {importError || "インポートが完了しました"}
                </span>
              </div>
              <div className="rounded-lg bg-gray-50 p-3 max-h-48 overflow-y-auto">
                {importLog.map((line, i) => (
                  <p key={i} className="text-xs text-gray-600">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4">
          {step === "done" ? (
            <button
              onClick={() => {
                onSuccess();
                onClose();
              }}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              閉じる
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                キャンセル
              </button>
              {step === "duplicates" && (
                <button
                  onClick={() => setStep("confirm")}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  次へ
                </button>
              )}
              {step === "confirm" && parsedRows.length > 0 && addCount + overwriteCount > 0 && (
                <button
                  onClick={handleImport}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  インポート実行 ({addCount + overwriteCount}件)
                </button>
              )}
              {step === "confirm" && parsedRows.length > 0 && addCount + overwriteCount === 0 && (
                <button
                  onClick={onClose}
                  className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-600"
                  disabled
                >
                  追加・上書きする行がありません
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
