"use client";

import { useState } from "react";
import { Sheet } from "@/components/ui-client";
import { Icon } from "@/components/Icon";
import { LineForm } from "./LineForm";
import { createProductLine } from "./actions";

export function AddLineButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Add product line"
        aria-label="Add product line"
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

      <Sheet open={open} onClose={() => setOpen(false)} title="Add product line" snap="full">
        <LineForm
          onSubmit={async (input) => {
            await createProductLine(input);
            setOpen(false);
          }}
          onCancel={() => setOpen(false)}
          submitLabel="Add line"
        />
      </Sheet>
    </>
  );
}
