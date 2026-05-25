"use client";

import { useState } from "react";
import { Sheet } from "@/components/ui-client";
import { Icon } from "@/components/Icon";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { AddonForm } from "./AddonForm";
import { updateAddon, deleteAddon, type AddonRow } from "./actions";

type InventoryItem = { id: string; name: string; unit: string };

export function AddonRowActions({
  addon,
  inventory,
}: {
  addon: AddonRow;
  inventory: InventoryItem[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Actions for ${addon.name}`}
        title="Actions"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 28,
          height: 28,
          borderRadius: 999,
          background: "var(--surface-3)",
          color: "var(--ink-soft)",
          border: "none",
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        <Icon.More size={14} />
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title={addon.name}>
        <AddonForm
          initial={addon}
          inventory={inventory}
          onSubmit={async (input) => {
            await updateAddon(addon.id, input);
            setOpen(false);
          }}
          onCancel={() => setOpen(false)}
          submitLabel="Save changes"
        />
        <div style={{ paddingTop: 14, paddingBottom: 24, borderTop: "1px solid var(--line-soft)" }}>
          <ConfirmDelete
            label={addon.name}
            description="Removes this addon from the catalogue. Orders that already snapshot it stay intact (the addon name and price are recorded on the order itself)."
            confirmWord="DELETE"
            buttonLabel="Delete addon"
            onConfirm={async () => {
              await deleteAddon(addon.id);
              setOpen(false);
            }}
          />
        </div>
      </Sheet>
    </>
  );
}
