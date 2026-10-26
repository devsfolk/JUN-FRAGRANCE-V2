"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/dashboard/ui/button";

type ImageUploaderProps = {
  value: string[];
  onChange: (urls: string[]) => void;
  kind: "categories" | "products" | "hero" | "seo" | "blog" | "logo";
  multiple: boolean;
};

const acceptedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const maxOriginalBytes = 5 * 1024 * 1024;
const bucket = "jf-media";


async function compressImage(file: File) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser could not prepare the image.");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => result ? resolve(result) : reject(new Error("This image could not be converted to WebP.")), "image/webp", 0.82);
  });
  if (blob.size > maxOriginalBytes) throw new Error("The compressed image is still over 5 MB. Choose a smaller image.");
  return blob;
}

export function ImageUploader({ value, onChange, kind, multiple }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError("");
    const supabase = createClient();
    const uploaded: string[] = [];
    try {
      for (const file of Array.from(files)) {
        if (!acceptedTypes.has(file.type)) throw new Error("Use a JPEG, PNG, WebP, or AVIF image.");
        if (file.size > maxOriginalBytes) throw new Error("Each original image must be 5 MB or smaller.");
        const blob = await compressImage(file);
        // TODO: Clean up uploaded files that are never saved in the form.
        const path = `${kind}/${crypto.randomUUID()}.webp`;
        const { error: uploadError } = await supabase.storage.from(bucket).upload(path, blob, { contentType: "image/webp", upsert: false });
        if (uploadError) throw new Error(uploadError.message || "Image upload failed.");
        uploaded.push(supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl);
        onChange(multiple ? [...value, ...uploaded] : uploaded);
        if (!multiple) break;
      }
      if (uploaded.length) {
        const next = multiple ? [...value, ...uploaded] : uploaded;
        onChange(next);

      }
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Image upload failed.";
      setError(message);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeImage(url: string) {
    onChange(value.filter((item) => item !== url));
  }
  function moveImage(index: number, offset: -1 | 1) {
    const target = index + offset;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="sr-only"
        multiple={multiple}
        onChange={(event) => void uploadFiles(event.target.files)}
        type="file"
      />
      <Button disabled={busy} onClick={() => inputRef.current?.click()} type="button" variant="secondary">
        {busy ? "Uploading..." : multiple ? "Add images" : value.length ? "Replace image" : "Choose image"}
      </Button>
      <p className="text-xs text-slate-500">JPEG, PNG, WebP, or AVIF. Max 5 MB per original. Images are resized and saved as WebP.</p>
      {error ? <p className="text-sm text-red-700" role="alert">{error}</p> : null}
      {value.length ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {value.map((url, index) => (
            <li className="min-w-0 rounded-lg border border-slate-200 p-2" key={`${url}-${index}`}>
              <div className={`relative ${kind === "logo" ? "h-20 w-44 bg-slate-900/10 p-2" : "aspect-square bg-slate-100"} overflow-hidden rounded-md`}>
                <Image
                  alt={index === 0 ? "Main image" : "Uploaded image"}
                  className={kind === "logo" ? "object-contain" : "object-cover"}
                  fill
                  sizes="(max-width: 640px) 45vw, 180px"
                  src={url}
                  unoptimized
                />
                {multiple && index === 0 ? <span className="absolute left-2 top-2 rounded bg-slate-950/80 px-2 py-1 text-xs text-white">Main</span> : null}
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {multiple ? <>
                  <Button aria-label="Move image left" className="px-3" disabled={busy || index === 0} onClick={() => moveImage(index, -1)} type="button" variant="secondary">Left</Button>
                  <Button aria-label="Move image right" className="px-3" disabled={busy || index === value.length - 1} onClick={() => moveImage(index, 1)} type="button" variant="secondary">Right</Button>
                </> : null}
                <Button className="px-3 text-red-700" disabled={busy} onClick={() => void removeImage(url)} type="button" variant="secondary">Remove</Button>
              </div>
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-slate-500">No image uploaded.</p>}
    </div>
  );
}