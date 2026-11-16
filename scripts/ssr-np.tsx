import React from "react";
import { renderToString } from "react-dom/server";
import N from "../src/NouveauProjet";
console.log("np", renderToString(<N onClose={() => {}} onCreate={() => {}} />).length);
