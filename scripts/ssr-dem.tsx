import React from "react";
import { renderToString } from "react-dom/server";
(globalThis as any).window = { location: { search: "?vue=spee&page=qualification&demande=D1", href: "x" }, history: { replaceState() {} } };
(async () => {
  const S = await import("../src/SpeeReseau");
  console.log("fiche", renderToString(<S.Qualification />).length);
  (globalThis as any).window.location.search = "?vue=spee&page=qualification";
  console.log("liste", renderToString(<S.Qualification />).length);
})();
