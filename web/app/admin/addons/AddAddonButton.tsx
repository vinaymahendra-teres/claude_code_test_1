"use client";

import { useState } from "react";
import { Sheet } from "@/components/ui-client";
import { Icon } from "@/components/Icon";
import { AddonForm } from "./AddonForm";
import { createAddon } from "./actions";

type InventoryItem = { id: string; name: string; unit: string };

export function AddAddonButton({ inventory }: { inventory: InventoryItem[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Add addon"
        aria-label="Add addon"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 34,
          height: 34,
          background: "var(--caramel)",
          color: "var(--surface)",
          border: "1px solid var(--caramel-deep)",
          borderRadius: 999,
          cursor: "pointer",
        }}
      >
        <Icon.Plus size={20} />
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Add addon">
        <AddonForm
          inventory={inventory}
          onSubmit={async (input) => {
            await createAddon(input);
            setOpen(false);
          }}
          onCancel={() => setOpen(false)}
          submitLabel="Add to catalogue"
        />
      </Sheet>
    </>
  );
}
