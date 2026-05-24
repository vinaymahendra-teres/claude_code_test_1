#!/usr/bin/env python3
# Bundle JSON data + JSX sources into a single self-contained HTML file
# so the prototype runs from file:// without a local HTTP server.

import base64
import json
import re
from pathlib import Path

ROOT = Path(__file__).parent
INDEX = ROOT / "index.html"
LOGO = ROOT / "logo.jpg"
OUT = ROOT / "tieredcake-standalone.html"

DATA_NAMES = ["customers", "orders", "recipes", "inventory", "finance", "marketing", "calendar"]

SCRIPT_ORDER = [
    "src/data.jsx",
    "src/icons.jsx",
    "src/ui.jsx",
    "src/modes.jsx",
    "src/timers.jsx",
    "src/screens/Kitchen.jsx",
    "src/screens/Home.jsx",
    "src/screens/Orders.jsx",
    "src/screens/NewOrder.jsx",
    "src/screens/Customers.jsx",
    "src/screens/Production.jsx",
    "src/screens/Recipes.jsx",
    "src/screens/Inventory.jsx",
    "src/screens/Marketing.jsx",
    "src/screens/Accounting.jsx",
    "src/screens/Reports.jsx",
    "src/screens/Reviews.jsx",
    "src/main.jsx",
]


def load_json(name: str):
    return json.loads((ROOT / "data" / f"{name}.json").read_text())


def patch_data_jsx(src: str) -> str:
    # Replace the fetch-based async loader with an immediate resolve.
    # The inlined window.__data has already been set in an earlier script block.
    new_loader = (
        "// Inlined build — data is pre-populated on window.__data.\n"
        "window.__dataReady = Promise.resolve(window.__data);\n"
    )
    # Match from `window.__dataReady = (async () => {` through the closing
    # `});` of the `.catch(err => { ... });` block. The IIFE invocation
    # pattern is `})()` (not `}())`), so we anchor on that.
    patched, count = re.subn(
        r"window\.__dataReady = \(async \(\) => \{.*?\}\)\(\)\.catch\(.*?\}\);\n",
        lambda _m: new_loader,
        src,
        count=1,
        flags=re.DOTALL,
    )
    if count == 0:
        raise RuntimeError(
            "patch_data_jsx: regex did not match data.jsx loader block — "
            "the fetch-based loader would survive into the standalone and "
            "overwrite the inlined window.__data with stale cached fetches."
        )
    return patched


def main():
    html = INDEX.read_text()

    # Inline the logo as a data URI so the standalone file stays self-contained.
    logo_data_uri = "data:image/jpeg;base64," + base64.b64encode(LOGO.read_bytes()).decode("ascii")
    html = html.replace("url('logo.jpg')", f"url('{logo_data_uri}')")

    # Build the inline data block.
    inline_data = {name: load_json(name) for name in DATA_NAMES}
    data_block = (
        "<script>\n"
        "window.__data = " + json.dumps(inline_data, ensure_ascii=False) + ";\n"
        "window.__logoUrl = " + json.dumps(logo_data_uri) + ";\n"
        "</script>\n"
    )

    # Build the inline script blocks in order.
    script_blocks = []
    for rel in SCRIPT_ORDER:
        src = (ROOT / rel).read_text()
        if rel == "src/data.jsx":
            src = patch_data_jsx(src)
        script_blocks.append(
            f'<script type="text/babel" data-presets="env,react" data-from="{rel}">\n{src}\n</script>'
        )

    # Strip the existing <!-- App scripts --> block and everything between it and </body>.
    # Use a lambda repl to avoid backslash-escape interpretation in the replacement string.
    new_scripts = data_block + "\n".join(script_blocks) + "\n"
    html = re.sub(
        r"<!-- App scripts -->.*?(?=</body>)",
        lambda _m: new_scripts,
        html,
        count=1,
        flags=re.DOTALL,
    )

    OUT.write_text(html)
    size_kb = len(html.encode("utf-8")) / 1024
    print(f"Wrote {OUT.relative_to(ROOT.parent)} ({size_kb:.1f} KB)")


if __name__ == "__main__":
    main()
