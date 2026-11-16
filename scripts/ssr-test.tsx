import React from "react";
import { renderToString } from "react-dom/server";
import SpeeView, * as S from "../src/SpeeReseau";
const pages: [string, React.ReactElement][] = [
  ["shell", <SpeeView profiles={[]} onSwitch={() => {}} />],
  ["recap", <S.Recap coproId="C001" setCopro={() => {}} />], ["recap2", <S.Recap coproId="C010" setCopro={() => {}} />],
  ["qualif", <S.Qualification />], ["fin", <S.Financement />], ["treso", <S.Tresorerie />], ["ops", <S.Operateurs />], ["rep", <S.Reporting />], ["co", <S.CoConstruction />],
];
for (const [n, el] of pages) { try { const h = renderToString(el); console.log(n, "ok", h.length); } catch (e) { console.log(n, "ERR", (e as Error).message); } }
