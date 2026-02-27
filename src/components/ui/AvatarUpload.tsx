"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Camera, Loader2 } from "lucide-react";
import Image from "next/image";

type Props = {
  currentUrl: string | null;
  bucket: "avatars" | "team-icons";
  // path within the bucket, e.g. "{userId}" or "{teamId}"
  folderPath: string;
  size?: number;
  onUploaded: (url: string) => void;
};

export function AvatarUpload({ currentUrl, bucket, folderPath, size = 80, onUploaded }: Props) {
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    const ext = file.name.split(".").pop() ?? "jpg";
    const filePath = `${folderPath}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error(uploadError);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    const url = data.publicUrl + `?t=${Date.now()}`;
    setPreviewUrl(url);
    onUploaded(data.publicUrl);
    setUploading(false);

    // Reset input so the same file can be re-uploaded if needed
    e.target.value = "";
  };

  return (
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
          <Image
            src={previewUrl}
            alt="アイコン"
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <span
            className="flex items-center justify-center w-full h-full text-gray-400"
            style={{ fontSize: size * 0.4 }}
          >
            ?
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
  );
}
