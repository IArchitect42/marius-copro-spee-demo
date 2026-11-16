import React from "react";
import { renderToString } from "react-dom/server";
(async () => {
  for (const o of ["lacopro", "documents", "financement", "qualite"]) {
    (globalThis as any).window = { location: { search: `?vue=${process.env.V||"light"}&onglet=${o}`, href: `http://x/?vue=${process.env.V||"light"}&onglet=${o}` }, history: { replaceState() {} } };
    const { default: M } = await import("../src/MariusCopro");
    try { const h = renderToString(<M />); console.log(o, "ok", h.length, h.includes("génération des documents non incluse"), h.includes("lock-simple"), h.includes("Copropriétaires"), h.includes("Aides publiques")); } catch (e) { console.log(o, "ERR", (e as Error).message.slice(0, 200)); }
  }
})();
