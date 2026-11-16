import React from "react";
import { renderToString } from "react-dom/server";
(globalThis as any).window = { location: { search: "?vue=spee", href: "http://x/?vue=spee" } };
import("../src/MariusIA").then(({ default: M }) => console.log("ia", renderToString(<M />).length));
