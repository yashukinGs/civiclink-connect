import { useEffect, useState } from "react";
import { FileText, ImageOff, X, ExternalLink, Loader2 } from "lucide-react";
import { getSignedFileUrl, isImageType, type Attachment } from "@/lib/issues";

function useSignedUrl(path: string | null) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setUrl(null);
    setFailed(false);
    if (!path) return;
    getSignedFileUrl(path).then((signed) => {
      if (!active) return;
      if (signed) setUrl(signed);
      else setFailed(true);
    });
    return () => {
      active = false;
    };
  }, [path]);

  return { url, failed };
}

function ImageThumb({
  attachment,
  onOpen,
}: {
  attachment: Attachment;
  onOpen: (url: string) => void;
}) {
  const { url, failed } = useSignedUrl(attachment.path);

  if (failed) {
    return (
      <div className="grid aspect-square place-items-center rounded-lg border border-border bg-secondary/40 text-muted-foreground">
        <ImageOff className="h-5 w-5" />
      </div>
    );
  }
  if (!url) {
    return <div className="aspect-square animate-pulse rounded-lg bg-secondary/40" />;
  }
  return (
    <button
      type="button"
      onClick={() => onOpen(url)}
      className="group relative aspect-square overflow-hidden rounded-lg border border-border"
      aria-label={`Open ${attachment.name}`}
    >
      <img
        src={url}
        alt={`Attachment for civic issue: ${attachment.name}`}
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
    </button>
  );
}

function PdfCard({ attachment }: { attachment: Attachment }) {
  const { url } = useSignedUrl(attachment.path);

  const open = () => {
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      type="button"
      onClick={open}
      disabled={!url}
      className="flex aspect-square flex-col items-center justify-center gap-2 rounded-lg border border-border bg-secondary/40 p-3 text-center transition-colors hover:border-primary/40 hover:bg-secondary/60 disabled:opacity-60"
      aria-label={`Open ${attachment.name}`}
    >
      {url ? (
        <FileText className="h-7 w-7 text-primary" />
      ) : (
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      )}
      <span className="line-clamp-2 break-all text-[11px] font-medium leading-tight">
        {attachment.name}
      </span>
      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <ExternalLink className="h-3 w-3" /> PDF
      </span>
    </button>
  );
}

export function AttachmentGallery({
  attachments,
  className = "",
}: {
  attachments: Attachment[];
  className?: string;
}) {
  const [lightbox, setLightbox] = useState<string | null>(null);

  if (!attachments.length) return null;

  return (
    <div className={className}>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {attachments.map((a) =>
          isImageType(a.type) || a.type === "image/*" ? (
            <ImageThumb key={a.path} attachment={a} onOpen={setLightbox} />
          ) : (
            <PdfCard key={a.path} attachment={a} />
          ),
        )}
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-background/90 p-4 backdrop-blur-sm"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-secondary text-foreground shadow transition-colors hover:bg-destructive hover:text-destructive-foreground"
            aria-label="Close preview"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={lightbox}
            alt="Attachment preview"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] max-w-full rounded-xl object-contain shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}
