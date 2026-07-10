import { useEffect, useState } from "react";
import { Image as ImageIcon } from "lucide-react";
import { getSignedImageUrl } from "@/lib/issues";

export function IssueImage({
  path,
  alt,
  className = "",
}: {
  path: string | null;
  alt: string;
  className?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    if (!path) {
      setUrl(null);
      return;
    }
    getSignedImageUrl(path).then((signed) => {
      if (active) {
        if (signed) setUrl(signed);
        else setFailed(true);
      }
    });
    return () => {
      active = false;
    };
  }, [path]);

  if (!path || failed) {
    return (
      <div
        className={`grid place-items-center rounded-lg border border-border bg-secondary/40 text-muted-foreground ${className}`}
      >
        <ImageIcon className="h-5 w-5" />
      </div>
    );
  }

  if (!url) {
    return <div className={`animate-pulse rounded-lg bg-secondary/40 ${className}`} />;
  }

  return (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`rounded-lg object-cover ${className}`}
    />
  );
}
