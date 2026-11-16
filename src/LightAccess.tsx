// Accès « AMO Light Équipe » (opérateur sous pacte, ex. Urbanis) : moins de fonctionnalités que l'AMO Full.
// Répartition Light / Full déduite de l'offre SPEE HDF (compte réseau) : le pilotage financier du projet reste au Full.
import React, { useState } from "react";
import { T, txt, Icon, Button, Tag, BlockWrapper, AlertBlock, th, td } from "./ds";

export const LIGHT_LOCKED = ["financement", "suivifin", "newsletter"];

const FEATURES: { f: string; light: boolean; note?: string }[] = [
  { f: "Fiche copropriété, Bilan initial, enquête sociale", light: true },
  { f: "Mission, jalons, documents, signatures, historique", light: true },
  { f: "Intervenants et messagerie", light: true },
  { f: "Parcours qualité Hauts-de-France et remontée au SPEE", light: true },
  { f: "Marius IA : lecture des documents déposés", light: true },
  { f: "Plan de financement global et individuel", light: false, note: "porté par le SPEE ou un compte Full" },
  { f: "Suivi financier : factures, certificats, appels de fonds, versements", light: false },
  { f: "Trésorerie et pilotage financier du projet", light: false },
  { f: "Newsletter aux copropriétaires", light: false },
];

export function LightBanner() {
  return (
    <div style={{ background: T.b50, borderBottom: `1px solid ${T.b200}`, padding: "8px 24px", display: "flex", alignItems: "center", gap: 12 }}>
      <Icon n="info" size={16} color={T.b500} />
      <span style={{ ...txt.bodyS, color: T.b500, flex: 1 }}>
        <b>Compte AMO Light Équipe · Urbanis.</b> Dossier sous pacte avec le SPEE Hauts-de-France : le parcours qualité est activé, vos jalons et pièces remontent au SPEE. Le pilotage financier est porté par un compte Full.
      </span>
      <Tag label="Light" status="Light" size="Medium" />
    </div>
  );
}

export function LockedTab({ label }: { label: string }) {
  return (
    <div style={{ padding: 32, maxWidth: 880, margin: "0 auto", display: "flex", flexDirection: "column", gap: 32 }}>
      <AlertBlock type="Neutral" size="Medium" title={`${label} : non inclus dans le compte Light`}>
        Dans un dossier sous pacte, le plan de financement, les factures, les appels de fonds et la trésorerie sont pilotés par le SPEE (compte Full et compte réseau). Vous voyez les jalons et les documents, sans gérer les flux financiers.
      </AlertBlock>
      <Comparatif />
    </div>
  );
}

export function Comparatif() {
  return (
    <BlockWrapper title="Votre accès comparé à un AMO Full" icon="scales">
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr><th style={th}>Fonctionnalité</th><th style={{ ...th, textAlign: "center" }}>Light (votre compte)</th><th style={{ ...th, textAlign: "center" }}>Full</th></tr></thead>
        <tbody>{FEATURES.map(x => (
          <tr key={x.f}>
            <td style={td}>{x.f}{x.note && <div style={txt.bodyXS}>{x.note}</div>}</td>
            <td style={{ ...td, textAlign: "center" }}>{x.light ? <Icon n="check-circle" size={20} color={T.g500} /> : <Icon n="lock-simple" size={20} color={T.n700} />}</td>
            <td style={{ ...td, textAlign: "center" }}><Icon n="check-circle" size={20} color={T.g500} /></td>
          </tr>))}</tbody>
      </table>
    </BlockWrapper>
  );
}

type Item = { label: string; done: boolean };
type Jalon = { id: number; titre: string; statut: "valide" | "a_transmettre" | "a_venir"; date?: string; items: Item[] };
export function ParcoursQualiteLight() {
  const [jalons, setJalons] = useState<Jalon[]>([
    { id: 1, titre: "Jalon 1 · Diagnostic", statut: "valide", date: "Validé par le SPEE le 14/04/2026", items: [
      { label: "Audit énergétique déposé", done: true }, { label: "Enquête sociale ≥ 80 % de réponses", done: true }, { label: "Plan de financement prévisionnel (SPEE)", done: true } ] },
    { id: 2, titre: "Jalon 2 · Programme", statut: "a_transmettre", items: [
      { label: "APD validé par le conseil syndical", done: true }, { label: "Devis RGE analysés", done: true }, { label: "PV d'AG de vote des travaux", done: true }, { label: "Attestations RGE des entreprises", done: false } ] },
    { id: 3, titre: "Jalon 3 · Réception", statut: "a_venir", items: [
      { label: "PV de réception", done: false }, { label: "Dossier de solde ANAH", done: false }, { label: "Plan de financement exécuté (SPEE)", done: false } ] },
  ]);
  const [toast, setToast] = useState<string | null>(null);
  const toggle = (jid: number, i: number) => setJalons(js => js.map(j => j.id !== jid ? j : { ...j, items: j.items.map((it, k) => k === i ? { ...it, done: !it.done } : it) }));
  const send = (jid: number) => {
    setJalons(js => js.map(j => j.id !== jid ? j : { ...j, statut: "valide", date: "Transmis au SPEE à l'instant · en attente de validation" }));
    setToast("Jalon transmis au SPEE Hauts-de-France"); setTimeout(() => setToast(null), 3500);
  };
  return (
    <div style={{ padding: 32, maxWidth: 1080, margin: "0 auto", display: "flex", flexDirection: "column", gap: 32 }}>
      {toast && <div style={{ position: "fixed", bottom: 96, right: 24, zIndex: 1200, background: T.g500, color: T.n50, padding: "12px 16px", borderRadius: 4, ...txt.bodyS, color: T.n50 } as any}>{toast}</div>}
      <div>
        <h2 style={{ ...txt.h3, margin: 0 }}>Parcours qualité Hauts-de-France</h2>
        <div style={{ ...txt.bodyM, color: T.n800, marginTop: 4 }}>Activé par le SPEE sur ce dossier. Chaque jalon complet se transmet au SPEE, qui le valide.</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {jalons.map(j => {
          const ok = j.items.filter(i => i.done).length; const complet = ok === j.items.length;
          return (
            <BlockWrapper key={j.id} title={j.titre} icon="seal-check"
              right={j.statut === "valide" ? <Tag label={j.date?.startsWith("Transmis") ? "Transmis" : "Validé"} status={j.date?.startsWith("Transmis") ? "Info" : "Success"} /> : j.statut === "a_transmettre" ? <Tag label="En cours" status="Warning" /> : <Tag label="À venir" status="Grey" />}
              footerRight={j.statut === "a_transmettre" ? <Button size="Small" aspect="Plain" icon="paper-plane-tilt" label="Transmettre au SPEE" disabled={!complet} onClick={() => send(j.id)} /> : undefined}>
              {j.items.map((it, i) => (
                <label key={it.label} style={{ display: "flex", alignItems: "center", gap: 8, cursor: j.statut === "a_transmettre" ? "pointer" : "default", ...txt.bodyS }}
                  onClick={() => j.statut === "a_transmettre" && toggle(j.id, i)}>
                  <Icon n={it.done ? "check-circle" : "circle-dashed"} size={16} color={it.done ? T.g500 : T.n700} />{it.label}
                </label>))}
              <span style={txt.bodyXS}>{j.date || `${ok} / ${j.items.length} éléments`}</span>
            </BlockWrapper>);
        })}
      </div>
      <Comparatif />
    </div>
  );
}
