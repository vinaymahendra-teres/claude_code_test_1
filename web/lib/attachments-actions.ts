"use server";

// All photo/image CRUD goes through these server actions. Uploads use the
// service-role key so the publishable key never needs storage-write scope.

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { requireAuth, requireRole } from "@/lib/auth-helpers";

const BUCKET = "attachments";

export type EntityType = "order" | "recipe" | "customer" | "event" | "review";
export type AttachmentKind =
  | "reference"
  | "gallery"
  | "flyer"
  | "delivered"
  | "avatar"
  | "other";

export type Attachment = {
  id: string;
  entity_type: EntityType;
  entity_id: string;
  storage_path: string;
  kind: AttachmentKind;
  caption: string | null;
  mime: string | null;
  size_bytes: number | null;
  sort_order: number;
  created_at: string;
  url: string; // public URL, computed
};

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Service-role env not set");
  return createSupabaseClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function publicUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return `${base}/storage/v1/object/public/${BUCKET}/${path}`;
}

function pathInvalidationsFor(entityType: EntityType, entityId: string): string[] {
  switch (entityType) {
    case "order":
      return [`/orders/${entityId}`, "/orders", "/"];
    case "recipe":
      return [`/recipes/${entityId}`, "/recipes"];
    case "customer":
      return [`/customers/${entityId}`, "/customers"];
    case "event":
      return ["/calendar"];
    case "review":
      return ["/reviews"];
  }
}

export async function listAttachments(
  entityType: EntityType,
  entityId: string,
): Promise<Attachment[]> {
  await requireAuth();
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);
  const { data, error } = await supabase
    .from("attachments")
    .select("*")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("sort_order")
    .order("created_at");
  if (error) throw new Error(`Failed to list attachments: ${error.message}`);
  return (data ?? []).map((r) => ({
    ...(r as Omit<Attachment, "url">),
    url: publicUrl(r.storage_path),
  }));
}

export async function uploadAttachment(
  entityType: EntityType,
  entityId: string,
  kind: AttachmentKind,
  formData: FormData,
): Promise<Attachment> {
  await requireAuth();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("No file provided");
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("File too large (max 10 MB)");
  }
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are supported");
  }

  const caption = String(formData.get("caption") ?? "");

  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const id = `att-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const storagePath = `${entityType}/${entityId}/${id}.${ext || "jpg"}`;

  const admin = adminClient();
  const arrayBuffer = await file.arrayBuffer();
  const { error: upErr } = await admin.storage
    .from(BUCKET)
    .upload(storagePath, arrayBuffer, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false,
    });
  if (upErr) throw new Error(`Upload failed: ${upErr.message}`);

  const { data: row, error: insErr } = await admin
    .from("attachments")
    .insert({
      id,
      entity_type: entityType,
      entity_id: entityId,
      storage_path: storagePath,
      kind,
      caption: caption.trim() || null,
      mime: file.type,
      size_bytes: file.size,
      sort_order: Date.now(), // append at end; reorder via separate action
    })
    .select("*")
    .single();
  if (insErr || !row) {
    // Rollback storage on metadata failure
    await admin.storage.from(BUCKET).remove([storagePath]);
    throw new Error(`Failed to record attachment: ${insErr?.message ?? "unknown"}`);
  }

  for (const p of pathInvalidationsFor(entityType, entityId)) revalidatePath(p);

  return {
    ...(row as Omit<Attachment, "url">),
    url: publicUrl(storagePath),
  };
}

export async function updateAttachmentCaption(id: string, caption: string) {
  await requireAuth();
  const admin = adminClient();
  const { data: row } = await admin
    .from("attachments")
    .select("entity_type, entity_id")
    .eq("id", id)
    .maybeSingle();
  const { error } = await admin
    .from("attachments")
    .update({ caption: caption.trim() || null })
    .eq("id", id);
  if (error) throw new Error(`Failed to update caption: ${error.message}`);
  if (row) {
    for (const p of pathInvalidationsFor(
      row.entity_type as EntityType,
      row.entity_id as string,
    )) {
      revalidatePath(p);
    }
  }
}

export async function deleteAttachment(id: string) {
  await requireRole("admin");
  const admin = adminClient();

  // Read first so we know which storage object to remove and which paths to
  // invalidate after the row goes.
  const { data: row, error: readErr } = await admin
    .from("attachments")
    .select("entity_type, entity_id, storage_path")
    .eq("id", id)
    .maybeSingle();
  if (readErr || !row) throw new Error("Attachment not found");

  const { error: delObj } = await admin.storage.from(BUCKET).remove([row.storage_path]);
  if (delObj) throw new Error(`Failed to delete file: ${delObj.message}`);

  const { error: delRow } = await admin.from("attachments").delete().eq("id", id);
  if (delRow) throw new Error(`Failed to delete row: ${delRow.message}`);

  for (const p of pathInvalidationsFor(
    row.entity_type as EntityType,
    row.entity_id as string,
  )) {
    revalidatePath(p);
  }
}

// Pass IDs in the order you want them stored.
export async function reorderAttachments(ids: string[]) {
  await requireAuth();
  if (ids.length === 0) return;
  const admin = adminClient();

  const { data: rows } = await admin
    .from("attachments")
    .select("id, entity_type, entity_id")
    .in("id", ids);
  if (!rows || rows.length === 0) return;

  // Bulk-update sort_order to the index in the supplied list.
  for (let i = 0; i < ids.length; i++) {
    await admin.from("attachments").update({ sort_order: i * 100 }).eq("id", ids[i]);
  }

  const seen = new Set<string>();
  for (const r of rows) {
    const key = `${r.entity_type}|${r.entity_id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    for (const p of pathInvalidationsFor(r.entity_type as EntityType, r.entity_id as string)) {
      revalidatePath(p);
    }
  }
}
