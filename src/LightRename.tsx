// Démo : en vue Urbanis (Light), le dossier de démonstration est présenté comme la « Résidence Les Tilleuls » (Roubaix).
// Remplacement de texte à l'affichage, pour éviter de dupliquer toutes les données du proto.
import { useEffect } from "react";
const PAIRS: [RegExp, string][] = [
  [/La Résidence Vauban/g, "La Résidence Les Tilleuls"], [/Résidence Vauban/g, "Résidence Les Tilleuls"],
  [/24 rue Gambetta, 59000 Lille/g, "8 rue de l'Épeule, 59100 Roubaix"], [/24 rue Gambetta/g, "8 rue de l'Épeule"], [/59000 Lille/g, "59100 Roubaix"],
];
const isLight = () => new URLSearchParams(window.location.search).get("vue") === "light";
function fix(root: Node) {
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let n: Node | null;
  while ((n = w.nextNode())) {
    const t = n.nodeValue || "";
    if (t.includes("Vauban") || t.includes("Gambetta") || t.includes("59000 Lille")) {
      let v = t; PAIRS.forEach(([r, s]) => { v = v.replace(r, s); }); if (v !== t) n.nodeValue = v;
    }
  }
}
export default function LightRename() {
  useEffect(() => {
    let was = isLight();
    // En quittant la vue Light, on recharge pour retrouver les textes d'origine (React ne réécrit pas un texte inchangé).
    const run = () => { const now = isLight(); if (was && !now) { window.location.reload(); return; } was = now; if (now) fix(document.body); };
    const obs = new MutationObserver(() => run());
    obs.observe(document.body, { childList: true, subtree: true, characterData: true });
    run();
    return () => obs.disconnect();
  }, []);
  return null;
}
