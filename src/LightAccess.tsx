// Accès « AMO Light Équipe » (opérateur sous pacte, ex. Urbanis) : moins de fonctionnalités que l'AMO Full.
// Répartition Light / Full déduite de l'offre SPEE HDF (compte réseau) : le pilotage financier du projet reste au Full.
import React, { useState } from "react";
import { T, txt, Icon, Button, Tag, BlockWrapper, AlertBlock, th, td } from "./ds";

// Grille de Simon (Tarifs Marius Copropriété) : le Light sert à transmettre et vérifier des dossiers déjà constitués.
// Light : pas de génération des documents, pas d'enquête sociale, pas de plans de financement individuels ; signature via le parcours qualité.
export const LIGHT_LOCKED: string[] = [];
export const LIGHT = { on: false };

type Cell = "oui" | "non" | "pq";
const FEATURES: { f: string; reseau: Cell; light: Cell; full: Cell }[] = [
  { f: "Carte d'identité de la copropriété (registre national)", reseau: "oui", light: "oui", full: "oui" },
  { f: "Dépôt de documents et de données, état d'avancement", reseau: "oui", light: "oui", full: "oui" },
  { f: "Workflow du dossier : étapes, jalons, notes, notifications", reseau: "oui", light: "oui", full: "oui" },
  { f: "Traçabilité horodatée", reseau: "oui", light: "oui", full: "oui" },
  { f: "Import des copropriétaires et invitations", reseau: "non", light: "oui", full: "oui" },
  { f: "Plan de financement global", reseau: "oui", light: "oui", full: "oui" },
  { f: "Bilan initial de la copropriété", reseau: "non", light: "oui", full: "oui" },
  { f: "Messagerie", reseau: "oui", light: "oui", full: "oui" },
  { f: "Marius IA : assistant, conformité, extraction", reseau: "oui", light: "oui", full: "oui" },
  { f: "Signature électronique", reseau: "pq", light: "pq", full: "oui" },
  { f: "Plans de financement individuels", reseau: "non", light: "non", full: "oui" },
  { f: "Enquête sociale", reseau: "non", light: "non", full: "oui" },
  { f: "Génération des documents du dossier", reseau: "non", light: "non", full: "oui" },
];
const cell = (c: Cell) => c === "oui" ? <Icon n="check-circle" size={20} color={T.g500} /> : c === "pq" ? <Tag label="Via le parcours qualité" status="Info" /> : <Icon n="lock-simple" size={20} color={T.n700} />;

export function LockedFeature({ label, why }: { label: string; why?: string }) {
  return (
    <div style={{ padding: 32, maxWidth: 880, margin: "0 auto", display: "flex", flexDirection: "column", gap: 32 }}>
      <AlertBlock type="Neutral" size="Medium" title={`${label} : réservé au compte AMO Full`}>
        {why || "Le compte Light sert à transmettre et vérifier un dossier déjà constitué. Cette fonctionnalité fait partie de la constitution complète du dossier, incluse dans le compte AMO Full."}
      </AlertBlock>
      <Comparatif />
    </div>
  );
}

export function LightBanner() {
  return (
    <div style={{ background: T.b50, borderBottom: `1px solid ${T.b200}`, padding: "8px 24px", display: "flex", alignItems: "center", gap: 12 }}>
      <Icon n="info" size={16} color={T.b500} />
      <span style={{ ...txt.bodyS, color: T.b500, flex: 1 }}>
        <b>Compte AMO Light Équipe · Urbanis.</b> Transmission et vérification d'un dossier sous pacte avec le SPEE Hauts-de-France : parcours qualité rattaché, signature électronique fournie par ce parcours. Non inclus : génération des documents, enquête sociale, plans de financement individuels.
      </span>
      <Tag label="Light" status="Light" size="Medium" />
    </div>
  );
}

export function Comparatif() {
  return (
    <BlockWrapper title="Ce que chaque compte débloque" icon="scales">
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr><th style={th}>Fonctionnalité</th><th style={{ ...th, textAlign: "center" }}>Réseau</th><th style={{ ...th, textAlign: "center", background: T.b50 }}>AMO Light (vous)</th><th style={{ ...th, textAlign: "center" }}>AMO Full</th></tr></thead>
        <tbody>{FEATURES.map(x => (
          <tr key={x.f}>
            <td style={td}>{x.f}</td>
            <td style={{ ...td, textAlign: "center" }}>{cell(x.reseau)}</td>
            <td style={{ ...td, textAlign: "center", background: T.b50 }}>{cell(x.light)}</td>
            <td style={{ ...td, textAlign: "center" }}>{cell(x.full)}</td>
          </tr>))}</tbody>
      </table>
      <span style={txt.bodyXS}>Source : grille Tarifs Marius Copropriété. Les invités du dossier (syndic, copropriétaires, artisans) accèdent aux fonctionnalités de l'offre de l'AMO qui les invite.</span>
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
