import React from "react";
import { renderToString } from "react-dom/server";
const modes = ["amo", "spee", "financeur", "conseil", "syndic", "moe", "copro"];
(async () => {
  for (const v of modes) {
    (globalThis as any).window = { location: { search: `?vue=${v}`, href: `http://x/?vue=${v}` }, history: { replaceState() {} } };
    const { default: M } = await import("../src/MariusCopro");
    try { const h = renderToString(<M />); console.log(v, "ok", h.length); } catch (e) { console.log(v, "ERR", (e as Error).message.slice(0, 300)); }
  }
})();
