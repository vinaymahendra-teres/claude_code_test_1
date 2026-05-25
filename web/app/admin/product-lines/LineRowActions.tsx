"use client";

import { useState } from "react";
import { Sheet } from "@/components/ui-client";
import { Icon } from "@/components/Icon";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { LineForm } from "./LineForm";
import { updateProductLine, deleteProductLine, type ProductLineRow } from "./actions";

export function LineRowActions({ row }: { row: ProductLineRow }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Actions for ${row.label}`}
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

      <Sheet open={open} onClose={() => setOpen(false)} title={row.label} snap="full">
        <LineForm
          initial={row}
          lockName
          onSubmit={async (input) => {
            await updateProductLine(row.id, input);
            setOpen(false);
          }}
          onCancel={() => setOpen(false)}
          submitLabel="Save changes"
        />
        <div style={{ paddingTop: 14, paddingBottom: 24, borderTop: "1px solid var(--line-soft)" }}>
          <ConfirmDelete
            label={row.label}
            description="Removes this product line from the catalogue. Orders that have already been created with it stay intact (the product_line value is just a label)."
            confirmWord="DELETE"
            buttonLabel="Delete line"
            onConfirm={async () => {
              await deleteProductLine(row.id);
              setOpen(false);
            }}
          />
        </div>
      </Sheet>
    </>
  );
}
