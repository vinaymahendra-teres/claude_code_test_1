"use client";

// Minimal IndexedDB-backed FIFO queue for mutations the operator submitted
// while offline. Each entry carries an action name + JSON payload + a
// monotonic timestamp; consumers register replay handlers by name.
//
// Why IndexedDB and not localStorage: receipts/invoices may attach photos
// or non-trivial payloads, and localStorage caps at ~5 MB and is sync.
// The store is auto-created on first open; the schema is a single object
// store "queue" keyed by a numeric autoincrement.

const DB_NAME = "tieredcake-offline";
const DB_VERSION = 1;
const STORE = "queue";

export type QueueEntry = {
  id?: number;
  action: string;
  payload: unknown;
  createdAt: number;
  attempts: number;
  lastError?: string;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function enqueue(action: string, payload: unknown): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).add({
      action,
      payload,
      createdAt: Date.now(),
      attempts: 0,
    } satisfies QueueEntry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  notify();
}

export async function listQueue(): Promise<QueueEntry[]> {
  if (typeof indexedDB === "undefined") return [];
  const db = await openDb();
  return await new Promise<QueueEntry[]>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result as QueueEntry[]);
    req.onerror = () => reject(req.error);
  });
}

async function removeEntry(id: number): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function updateEntry(entry: QueueEntry): Promise<void> {
  if (entry.id == null) return;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Replay handlers — consumers register by action name. The handler is the
// real server action; replay just invokes it with the stored payload.
type Handler = (payload: unknown) => Promise<unknown>;
const handlers: Map<string, Handler> = new Map();

export function registerHandler(action: string, fn: Handler): void {
  handlers.set(action, fn);
}

// Drains the queue, invoking the registered handler for each entry. Stops
// at the first persistent failure (we don't reorder or skip). On success,
// the entry is removed; on failure the attempt count + error is recorded
// and we bail so a transient outage doesn't burn through every queued
// action with retries.
export async function flush(): Promise<{ drained: number; failed: number }> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { drained: 0, failed: 0 };
  }
  const entries = await listQueue();
  let drained = 0;
  let failed = 0;
  for (const entry of entries) {
    const handler = handlers.get(entry.action);
    if (!handler) {
      // Unknown action — keep it; the registering page may not have
      // mounted yet on this navigation.
      continue;
    }
    try {
      await handler(entry.payload);
      if (entry.id != null) await removeEntry(entry.id);
      drained += 1;
    } catch (e) {
      failed += 1;
      await updateEntry({
        ...entry,
        attempts: (entry.attempts ?? 0) + 1,
        lastError: e instanceof Error ? e.message : String(e),
      });
      // Bail on first failure so a flaky link doesn't pound the server.
      break;
    }
  }
  notify();
  return { drained, failed };
}

// Tiny pub/sub so UI counters refresh after enqueue / flush without
// re-polling IndexedDB on a timer.
type Listener = () => void;
const listeners = new Set<Listener>();
function notify() {
  listeners.forEach((l) => l());
}
export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
