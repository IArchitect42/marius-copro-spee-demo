import React from "react";
import { renderToString } from "react-dom/server";
(async () => {
  for (const o of ["lacopro", "qualite", "financement", "suivifin"]) {
    (globalThis as any).window = { location: { search: `?vue=light&onglet=${o}`, href: `http://x/?vue=light&onglet=${o}` }, history: { replaceState() {} } };
    const { default: M } = await import("../src/MariusCopro");
    try { const h = renderToString(<M />); console.log(o, "ok", h.length, h.includes("Les Tilleuls"), h.includes("Light")); } catch (e) { console.log(o, "ERR", (e as Error).message.slice(0, 200)); }
  }
})();
