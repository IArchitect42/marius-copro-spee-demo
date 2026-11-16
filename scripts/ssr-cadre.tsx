import React from "react";
import { renderToString } from "react-dom/server";
(globalThis as any).window = { location: { search: "?cadre=audit", href: "http://x/?cadre=audit" }, history: { replaceState() {} } };
import("../src/App").then(({ default: A }) => { const h = renderToString(<A />); console.log("cadre", h.length, h.includes("Déposer un document")); });
