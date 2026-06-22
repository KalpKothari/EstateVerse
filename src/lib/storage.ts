import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Resolve a stored image reference to a displayable URL.
 * - Full http(s) URLs are returned as-is.
 * - Otherwise treated as a storage path under `bucket` and signed for 1 hour.
 */
export function useImageUrl(pathOrUrl: string | null | undefined, bucket = "property-images") {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!pathOrUrl) {
      setUrl(null);
      return;
    }
    if (/^https?:\/\//i.test(pathOrUrl)) {
      setUrl(pathOrUrl);
      return;
    }
    supabase.storage
      .from(bucket)
      .createSignedUrl(pathOrUrl, 60 * 60)
      .then(({ data }) => {
        if (!cancelled) setUrl(data?.signedUrl ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [pathOrUrl, bucket]);

  return url;
}

export async function uploadPropertyImage(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("property-images").upload(path, file, {
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;
  return path;
}

export async function uploadVerificationDoc(userId: string, file: File, label: string): Promise<string> {
  const ext = file.name.split(".").pop() || "pdf";
  const path = `${userId}/${label}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("verification-docs").upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (error) throw error;
  return path;
}
