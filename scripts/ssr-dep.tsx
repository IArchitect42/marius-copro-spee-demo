import React from "react";
import { renderToString } from "react-dom/server";
(globalThis as any).window = { location: { search: "?vue=amo&onglet=documents&depot=facture", href: "http://x/?vue=amo&onglet=documents&depot=facture" }, history: { replaceState() {} } };
import("../src/MariusCopro").then(({ default: M }) => { const h = renderToString(<M />); console.log("dep", h.length, h.includes("Déposer un document"), h.includes("Facture solde THERMIS BTP")); });
