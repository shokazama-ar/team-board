"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Camera, Loader2, ZoomIn, ZoomOut, Check } from "lucide-react";
import Image from "next/image";

type Props = {
  currentUrl: string | null;
  bucket: "avatars" | "team-icons";
  folderPath: string;
  size?: number;
  fallbackText?: string;
  onUploaded: (url: string) => void;
};

const CROP_SIZE = 260;

export function AvatarUpload({ currentUrl, bucket, folderPath, size = 80, fallbackText, onUploaded }: Props) {
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl);

  // Crop modal state
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [imgNaturalSize, setImgNaturalSize] = useState({ w: 1, h: 1 });
  const [fitZoom, setFitZoom] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  // Drag state (using refs to avoid re-renders during drag)
  const dragging = useRef(false);
  const dragStart = useRef<{ mx: number; my: number; px: number; py: number } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropSrc(URL.createObjectURL(file));
    setZoom(1);
    setPos({ x: 0, y: 0 });
    e.target.value = "";
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
    setImgNaturalSize({ w, h });
    // zoom=1 means the shortest side exactly fills the crop circle
    setFitZoom(CROP_SIZE / Math.min(w, h));
    setZoom(1);
    setPos({ x: 0, y: 0 });
  };

  // Actual display scale
  const scale = fitZoom * zoom;

  const handlePointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    dragStart.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging.current || !dragStart.current) return;
    setPos({
      x: dragStart.current.px + (e.clientX - dragStart.current.mx),
      y: dragStart.current.py + (e.clientY - dragStart.current.my),
    });
  };

  const handlePointerUp = () => {
    dragging.current = false;
    dragStart.current = null;
  };

  const handleConfirm = async () => {
    if (!cropSrc || !canvasRef.current) return;
    setUploading(true);

    const canvas = canvasRef.current;
    const OUTPUT = 400;
    canvas.width = OUTPUT;
    canvas.height = OUTPUT;
    const ctx = canvas.getContext("2d");
    if (!ctx) { setUploading(false); return; }

    const img = new window.Image();
    img.src = cropSrc;
    await new Promise<void>((resolve) => { img.onload = () => resolve(); });

    // Map crop circle area back to source image coordinates
    const srcX = imgNaturalSize.w / 2 - (CROP_SIZE / 2 + pos.x) / scale;
    const srcY = imgNaturalSize.h / 2 - (CROP_SIZE / 2 + pos.y) / scale;
    const srcSize = CROP_SIZE / scale;

    ctx.beginPath();
    ctx.arc(OUTPUT / 2, OUTPUT / 2, OUTPUT / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, OUTPUT, OUTPUT);

    canvas.toBlob(async (blob) => {
      if (!blob) { setUploading(false); return; }

      const filePath = `${folderPath}/avatar.png`;
      const file = new File([blob], "avatar.png", { type: "image/png" });
      const { error } = await supabase.storage.from(bucket).upload(filePath, file, { upsert: true });

      if (error) {
        console.error(error);
        setUploading(false);
        return;
      }

      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
      const url = data.publicUrl + `?t=${Date.now()}`;
      setPreviewUrl(url);
      onUploaded(data.publicUrl);
      URL.revokeObjectURL(cropSrc);
      setCropSrc(null);
      setUploading(false);
    }, "image/png");
  };

  const handleCancel = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  };

  return (
    <>
      <div className="relative" style={{ width: size, height: size }}>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="group relative block overflow-hidden rounded-full border-2 border-gray-200 bg-gray-100 hover:border-blue-400"
          style={{ width: size, height: size }}
          disabled={uploading}
          aria-label="画像をアップロード"
        >
          {previewUrl ? (
            <Image src={previewUrl} alt="アイコン" fill className="object-cover" unoptimized />
          ) : (
            <span
              className="flex items-center justify-center w-full h-full bg-gray-200 font-medium text-gray-500"
              style={{ fontSize: size * 0.4 }}
            >
              {fallbackText ? fallbackText.charAt(0) : "?"}
            </span>
          )}
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            {uploading ? (
              <Loader2 size={size * 0.3} className="animate-spin text-white" />
            ) : (
              <Camera size={size * 0.3} className="text-white" strokeWidth={1.5} />
            )}
          </span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Crop confirmation modal */}
      {cropSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <p className="mb-1 text-sm font-semibold text-gray-800">画像を調整</p>
            <p className="mb-4 text-xs text-gray-400">ドラッグで位置・スライダーでサイズを調整</p>

            {/* Crop circle */}
            <div
              className="relative mx-auto overflow-hidden rounded-full border-4 border-blue-500 cursor-grab active:cursor-grabbing select-none touch-none"
              style={{ width: CROP_SIZE, height: CROP_SIZE }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cropSrc}
                alt=""
                onLoad={handleImageLoad}
                draggable={false}
                style={{
                  position: "absolute",
                  maxWidth: "none",
                  width: imgNaturalSize.w * scale,
                  height: imgNaturalSize.h * scale,
                  left: "50%",
                  top: "50%",
                  transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`,
                  userSelect: "none",
                  pointerEvents: "none",
                }}
              />
            </div>

            {/* Zoom slider */}
            <div className="mt-4 flex items-center gap-3">
              <ZoomOut size={16} className="shrink-0 text-gray-400" />
              <input
                type="range"
                min={1}
                max={4}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 accent-blue-600"
              />
              <ZoomIn size={16} className="shrink-0 text-gray-400" />
            </div>

            {/* Actions */}
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={handleCancel}
                disabled={uploading}
                className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={uploading}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Check size={14} strokeWidth={2} />
                )}
                {uploading ? "アップロード中..." : "この画像を使う"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden canvas for crop rendering */}
      <canvas ref={canvasRef} className="hidden" />
    </>
  );
}
