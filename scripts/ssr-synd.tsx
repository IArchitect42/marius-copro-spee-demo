import React from "react";
import { renderToString } from "react-dom/server";
import S from "../src/AmoSyndics";
console.log("syndics", renderToString(<S onOpenDossier={() => {}} />).length);
