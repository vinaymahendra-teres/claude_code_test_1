"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Sheet, TextInput, Button } from "@/components/ui-client";
import { Icon } from "@/components/Icon";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import {
  uploadAttachment,
  updateAttachmentCaption,
  deleteAttachment,
  type Attachment,
  type AttachmentKind,
  type EntityType,
} from "@/lib/attachments-actions";

const MAX_DIMENSION = 1600;
const TARGET_TYPE = "image/jpeg";
const TARGET_QUALITY = 0.85;

export function AttachmentGrid({
  entityType,
  entityId,
  kind = "reference",
  initial,
  emptyHint,
}: {
  entityType: EntityType;
  entityId: string;
  kind?: AttachmentKind;
  initial: Attachment[];
  emptyHint?: string;
}) {
  const [items, setItems] = useState<Attachment[]>(initial);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewing, setViewing] = useState<Attachment | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setItems(initial);
  }, [initial]);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      for (const f of Array.from(files)) {
        const blob = await resizeToBlob(f);
        const form = new FormData();
        form.append(
          "file",
          new File([blob], f.name.replace(/\.\w+$/, ".jpg"), { type: TARGET_TYPE }),
        );
        const row = await uploadAttachment(entityType, entityId, kind, form);
        setItems((prev) => [...prev, row]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 8,
        }}
      >
        {items.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setViewing(a)}
            style={{
              aspectRatio: "1",
              border: "1px solid var(--line-soft)",
              borderRadius: 12,
              background: "var(--surface-2)",
              padding: 0,
              overflow: "hidden",
              cursor: "pointer",
              position: "relative",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={a.url}
              alt={a.caption ?? ""}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
              loading="lazy"
            />
            {a.caption && (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  padding: "4px 6px",
                  background:
                    "linear-gradient(to top, oklch(0.20 0.02 50 / 0.65), transparent)",
                  color: "oklch(0.98 0.01 70)",
                  fontSize: 10.5,
                  fontWeight: 600,
                  textAlign: "left",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {a.caption}
              </div>
            )}
          </button>
        ))}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          style={{
            aspectRatio: "1",
            border: "1.5px dashed var(--line)",
            borderRadius: 12,
            background: "var(--surface-2)",
            color: "var(--ink-soft)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            cursor: uploading ? "not-allowed" : "pointer",
            opacity: uploading ? 0.5 : 1,
            fontFamily: "inherit",
            padding: 6,
          }}
        >
          {uploading ? (
            <span style={{ fontSize: 11.5, fontWeight: 600 }}>Uploading…</span>
          ) : (
            <>
              <Icon.Plus size={20} />
              <span style={{ fontSize: 11, fontWeight: 600 }}>Add photo</span>
            </>
          )}
        </button>
      </div>

      {items.length === 0 && emptyHint && !uploading && (
        <div
          style={{
            marginTop: 8,
            fontSize: 11.5,
            color: "var(--muted)",
            lineHeight: 1.5,
          }}
        >
          {emptyHint}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: "none" }}
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error && (
        <div
          style={{
            marginTop: 8,
            padding: 10,
            background: "oklch(0.94 0.05 28)",
            border: "1px solid var(--danger)",
            borderRadius: "var(--r)",
            fontSize: 12.5,
            color: "var(--danger)",
          }}
        >
          {error}
        </div>
      )}

      <AttachmentViewer
        attachment={viewing}
        onClose={() => setViewing(null)}
        onUpdate={(next) => {
          setItems((prev) => prev.map((x) => (x.id === next.id ? next : x)));
        }}
        onDelete={(id) => {
          setItems((prev) => prev.filter((x) => x.id !== id));
          setViewing(null);
        }}
      />
    </>
  );
}

function AttachmentViewer({
  attachment,
  onClose,
  onUpdate,
  onDelete,
}: {
  attachment: Attachment | null;
  onClose: () => void;
  onUpdate: (a: Attachment) => void;
  onDelete: (id: string) => void;
}) {
  const [caption, setCaption] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setCaption(attachment?.caption ?? "");
    setError(null);
  }, [attachment]);

  if (!attachment) return null;

  const dirty = caption.trim() !== (attachment.caption ?? "").trim();

  function saveCaption() {
    if (!attachment) return;
    setError(null);
    startTransition(async () => {
      try {
        await updateAttachmentCaption(attachment.id, caption);
        onUpdate({ ...attachment, caption: caption.trim() || null });
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  }

  return (
    <Sheet open={!!attachment} onClose={onClose} title="Photo" snap="full">
      <div style={{ paddingBottom: 24 }}>
        <div
          style={{
            background: "var(--surface-3)",
            borderRadius: 12,
            overflow: "hidden",
            aspectRatio: "1",
            marginBottom: 14,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={attachment.url}
            alt={attachment.caption ?? ""}
            style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
          />
        </div>

        <div style={{ marginBottom: 8, fontSize: 12, color: "var(--muted)" }}>
          {attachment.size_bytes
            ? `${Math.round(attachment.size_bytes / 1024)} KB · `
            : ""}
          {attachment.mime ?? ""}
        </div>

        <TextInput
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Caption (optional)"
        />

        {error && (
          <div
            style={{
              marginTop: 10,
              padding: 10,
              background: "oklch(0.94 0.05 28)",
              border: "1px solid var(--danger)",
              borderRadius: "var(--r)",
              fontSize: 12.5,
              color: "var(--danger)",
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 14, marginBottom: 14 }}>
          <Button variant="secondary" size="lg" full onClick={onClose}>
            Close
          </Button>
          <Button
            variant="primary"
            size="lg"
            full
            onClick={saveCaption}
            disabled={isPending || !dirty}
          >
            {isPending ? "Saving…" : dirty ? "Save caption" : "No change"}
          </Button>
        </div>

        <div style={{ borderTop: "1px solid var(--line-soft)", paddingTop: 14 }}>
          <ConfirmDelete
            label="this photo"
            description="Removes the file from storage and unlinks it from the entity."
            confirmWord="DELETE"
            buttonLabel="Delete photo"
            onConfirm={async () => {
              await deleteAttachment(attachment.id);
              onDelete(attachment.id);
            }}
          />
        </div>
      </div>
    </Sheet>
  );
}

// Client-side downsize so uploads stay well under the Vercel function body
// limit (4.5 MB) and don't waste bandwidth on raw phone-camera JPEGs.
async function resizeToBlob(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are supported");
  }
  // SVGs and gifs: send as-is, no resize.
  if (file.type === "image/svg+xml" || file.type === "image/gif") {
    return file;
  }

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;

  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size < 2 * 1024 * 1024) {
    // Already small enough — return original to preserve EXIF / quality.
    return file;
  }

  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, w, h);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Resize failed"))),
      TARGET_TYPE,
      TARGET_QUALITY,
    );
  });
}
