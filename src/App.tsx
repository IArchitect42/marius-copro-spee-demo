import React, { useState } from "react";
import MariusCopro from "./MariusCopro";
import MariusIA from "./MariusIA";
import LightRename from "./LightRename";
import DepotIA from "./DepotIA";

// Mode « cadre » pour la présentation : la fenêtre de dépôt Marius IA seule, en pleine page (?cadre=facture|audit|pv|avis).
const CADRES: Record<string, { slot?: string; file: string }> = {
  facture: { slot: "Facture solde THERMIS BTP · Réalisation des travaux", file: "facture-solde-thermis.pdf" },
  audit: { file: "audit-energetique-copro-vauban.pdf" },
  pv: { slot: "PV réception ITE · Réalisation des travaux", file: "pv-reception-ite.pdf" },
  avis: { file: "avis-imposition-lot6.pdf" },
  anah: { file: "courrier-anah-versement-solde.pdf" },
};
function Cadre({ k }: { k: string }) {
  const c = CADRES[k] || CADRES.facture;
  const [n, setN] = useState(0);
  return <DepotIA key={n} inline slot={c.slot} autoFile={c.file} onClose={() => setN(x => x + 1)} onValidate={() => setN(x => x + 1)} />;
}
export default function App() {
  const cadre = new URLSearchParams(window.location.search).get("cadre");
  if (cadre) return <Cadre k={cadre} />;
  return (<><MariusCopro /><MariusIA /><LightRename /></>);
}
