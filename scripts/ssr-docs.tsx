import React from "react";
import { renderToString } from "react-dom/server";
(globalThis as any).window = { location: { search: "?vue=amo&onglet=documents", href: "http://x/?vue=amo&onglet=documents" }, history: { replaceState() {} } };
(async () => {
  const { default: M } = await import("../src/MariusCopro");
  const h = renderToString(<M />); console.log("docs", h.length, h.includes("Déposer un document"));
  const { default: D } = await import("../src/DepotIA");
  console.log("depot", renderToString(<D slot="PV réception ITE" onClose={() => {}} onValidate={() => {}} />).length);
})();
