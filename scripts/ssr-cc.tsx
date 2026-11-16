import React from "react";
import { renderToString } from "react-dom/server";
import C from "../src/CreerCopro";
console.log("creer", renderToString(<C />).length);
