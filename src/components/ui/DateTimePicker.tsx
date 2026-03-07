"use client";

const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));

const INPUT_CLASS =
  "rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

/**
 * value / onChange は "YYYY-MM-DDTHH:mm" 形式（datetime-local と同じ）
 */
export default function DateTimePicker({
  value,
  onChange,
  required,
  min,
}: {
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
  /** "YYYY-MM-DDTHH:mm" 形式。日付部分のみ min として使用 */
  min?: string;
}) {
  const [datePart, timePart] = value ? value.split("T") : ["", ""];
  const [hourStr, minuteStr] = (timePart || "00:00").split(":");
  const hour = hourStr || "00";
  // 既存データの分が5の倍数でない場合は最近傍に丸める
  const rawMin = parseInt(minuteStr || "0", 10);
  const minute = String(Math.round(rawMin / 5) * 5 === 60 ? 0 : Math.round(rawMin / 5) * 5).padStart(2, "0");

  const emit = (d: string, h: string, m: string) => {
    if (!d) { onChange(""); return; }
    onChange(`${d}T${h}:${m}`);
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="date"
        value={datePart}
        onChange={(e) => emit(e.target.value, hour, minute)}
        required={required}
        min={min ? min.split("T")[0] : undefined}
        className={`flex-1 ${INPUT_CLASS}`}
      />
      <select
        value={hour}
        onChange={(e) => emit(datePart, e.target.value, minute)}
        className={INPUT_CLASS}
      >
        {HOURS.map((h) => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>
      <span className="select-none text-sm text-gray-500">:</span>
      <select
        value={minute}
        onChange={(e) => emit(datePart, hour, e.target.value)}
        className={INPUT_CLASS}
      >
        {MINUTES.map((m) => {
          const s = String(m).padStart(2, "0");
          return <option key={s} value={s}>{s}</option>;
        })}
      </select>
    </div>
  );
}
