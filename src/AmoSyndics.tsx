// Vue AMO « Syndics » : les syndics avec qui l'AMO travaille et, pour chacun, les missions AMO Copro rattachées.
// Remplace l'entrée « Clients » (qui plantait). Données fictives.
import React, { useMemo, useState } from "react";
import { T, txt, Icon, Button, Tag, BlockWrapper, Input, Select, Segmented, th, td, Progress, downloadCSV, TagStatus } from "./ds";

const PHASES = ["0 · Identification", "1 · Diagnostic", "2 · Études", "3 · AG & dépôt", "4 · Montage financier", "5 · Chantier", "6 · Réception", "7 · Post-travaux"];
type Mission = { id: string; nom: string; ville: string; lots: number; phase: number; av: number; sante: "vert" | "orange" | "rouge" | "gris"; derniere: { date: string; quoi: string; qui: string }; prochaine: string; vauban?: boolean };
type Syndic = { id: string; nom: string; type: "Professionnel" | "Bénévole"; gestionnaire: string; tel: string; mail: string; ville: string; depuis: string; missions: Mission[] };

export const SYNDICS: Syndic[] = [
  { id: "lecomte", nom: "Cabinet Lecomte", type: "Professionnel", gestionnaire: "Bertrand Lecomte", tel: "03 20 54 67 88", mail: "contact@lecomte-syndic.fr", ville: "Lille", depuis: "2024", missions: [
    { id: "vauban", nom: "La Résidence Vauban", ville: "Lille", lots: 12, phase: 5, av: 68, sante: "vert", derniere: { date: "14/11/2026", quoi: "Facture THERMIS BTP transmise pour validation", qui: "AMO" }, prochaine: "Valider la facture THERMIS · 20/11", vauban: true },
    { id: "clairef", nom: "Résidence Clairfontaine", ville: "Marcq-en-Barœul", lots: 16, phase: 1, av: 18, sante: "orange", derniere: { date: "02/11/2026", quoi: "Relance du syndic : DPE collectif manquant", qui: "AMO" }, prochaine: "Recevoir le DPE collectif · 25/11" },
    { id: "orient", nom: "Résidence d'Orient", ville: "Lille", lots: 14, phase: 0, av: 5, sante: "gris", derniere: { date: "28/10/2026", quoi: "Pré-diagnostic planifié avec le conseil syndical", qui: "Syndic" }, prochaine: "Visite pré-diagnostic · 03/12" },
  ] },
  { id: "nordhab", nom: "Syndic Nord Habitat", type: "Professionnel", gestionnaire: "Sophie Vandamme", tel: "03 20 11 22 33", mail: "gestion@nordhabitat-syndic.fr", ville: "Lille", depuis: "2025", missions: [
    { id: "faidherbe", nom: "Les Terrasses Faidherbe", ville: "Lille", lots: 18, phase: 1, av: 25, sante: "orange", derniere: { date: "10/11/2026", quoi: "Audit énergétique : visite terrain réalisée", qui: "Auditeur" }, prochaine: "Rapport d'audit · 30/11" },
    { id: "jardin", nom: "Les Jardins de la Deûle", ville: "Lille", lots: 28, phase: 0, av: 8, sante: "gris", derniere: { date: "05/11/2026", quoi: "Étude d'opportunité envoyée au conseil syndical", qui: "AMO" }, prochaine: "Retour du conseil syndical · 22/11" },
  ] },
  { id: "immoserv", nom: "Immo Services", type: "Professionnel", gestionnaire: "Karim Benali", tel: "03 20 70 80 90", mail: "copro@immoservices.fr", ville: "Roubaix", depuis: "2025", missions: [
    { id: "parc", nom: "Résidence du Parc Barbieux", ville: "Roubaix", lots: 24, phase: 3, av: 45, sante: "vert", derniere: { date: "12/11/2026", quoi: "Convocation de l'AG de vote des travaux envoyée", qui: "Syndic" }, prochaine: "AG vote travaux · 09/12" },
    { id: "bellevue", nom: "Bellevue Saint-Maurice", ville: "Roubaix", lots: 9, phase: 0, av: 2, sante: "gris", derniere: { date: "20/10/2026", quoi: "Premier contact syndic", qui: "AMO" }, prochaine: "Rendez-vous de présentation · à fixer" },
  ] },
  { id: "dupont", nom: "Cabinet Dupont", type: "Professionnel", gestionnaire: "Hélène Dupont", tel: "03 27 45 12 98", mail: "syndic@cabinet-dupont.fr", ville: "Valenciennes", depuis: "2026", missions: [
    { id: "carnot", nom: "Immeuble Carnot", ville: "Lille", lots: 8, phase: 1, av: 12, sante: "rouge", derniere: { date: "21/09/2026", quoi: "Demande de DPE restée sans réponse", qui: "AMO" }, prochaine: "DPE à fournir · en retard de 8 semaines" },
    { id: "victor", nom: "Square Victor Hugo", ville: "Valenciennes", lots: 10, phase: 0, av: 3, sante: "gris", derniere: { date: "15/10/2026", quoi: "Premier contact syndic", qui: "AMO" }, prochaine: "Note de cadrage · 30/11" },
  ] },
  { id: "monier", nom: "Syndic bénévole Cité Monier", type: "Bénévole", gestionnaire: "Jean-Paul Delattre", tel: "06 12 34 56 78", mail: "cs.citemonier@example.fr", ville: "Lomme", depuis: "2026", missions: [
    { id: "monier", nom: "Cité Monier", ville: "Lomme", lots: 20, phase: 0, av: 4, sante: "gris", derniere: { date: "08/11/2026", quoi: "Prise de contact avec le syndic bénévole", qui: "AMO" }, prochaine: "Réunion d'information · 26/11" },
  ] },
];
const SANTE: Record<Mission["sante"], { s: TagStatus; l: string }> = { vert: { s: "Success", l: "Dans les temps" }, orange: { s: "Warning", l: "À surveiller" }, rouge: { s: "Error", l: "En retard" }, gris: { s: "Grey", l: "Démarrage" } };

export default function AmoSyndics({ onOpenDossier }: { onOpenDossier: () => void }) {
  const [sel, setSel] = useState("lecomte");
  const [q, setQ] = useState(""); const [type, setType] = useState<"all" | "Professionnel" | "Bénévole">("all");
  const [phase, setPhase] = useState("all");
  const list = SYNDICS.filter(s => (type === "all" || s.type === type) && (!q || (s.nom + s.gestionnaire + s.ville + s.missions.map(m => m.nom).join(" ")).toLowerCase().includes(q.toLowerCase())));
  const s = SYNDICS.find(x => x.id === sel)!;
  const missions = useMemo(() => s.missions.filter(m => phase === "all" || String(m.phase) === phase), [s, phase]);
  const tot = SYNDICS.reduce((a, x) => a + x.missions.length, 0);
  const exp = () => downloadCSV(`missions-${s.id}.csv`, [["Syndic", "Copropriété", "Ville", "Lots", "Phase", "Avancement %", "Santé", "Dernière action", "Date", "Par", "Prochaine étape"],
    ...s.missions.map(m => [s.nom, m.nom, m.ville, m.lots, PHASES[m.phase], m.av, SANTE[m.sante].l, m.derniere.quoi, m.derniere.date, m.derniere.qui, m.prochaine])]);
  return (
    <div style={{ flex: 1, overflowY: "auto", background: T.white }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 40px 64px", display: "flex", flexDirection: "column", gap: 32 }}>
        <div>
          <h1 style={{ ...txt.h3, margin: 0 }}>Syndics</h1>
          <div style={{ ...txt.bodyM, color: T.n800, marginTop: 4 }}>{SYNDICS.length} syndics · {tot} missions AMO Copro rattachées</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 32, alignItems: "start" }}>
          <BlockWrapper title="Mes syndics" icon="address-book">
            <Input value={q} onChange={setQ} placeholder="Syndic, gestionnaire, copropriété…" />
            <Segmented value={type} onChange={setType} options={[{ v: "all", label: "Tous" }, { v: "Professionnel", label: "Professionnels" }, { v: "Bénévole", label: "Bénévoles" }]} />
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
              {list.map(x => {
                const alerts = x.missions.filter(m => m.sante === "rouge" || m.sante === "orange").length; const on = x.id === sel;
                return (
                  <div key={x.id} onClick={() => setSel(x.id)} style={{ cursor: "pointer", borderRadius: 8, padding: 12, border: `1px solid ${on ? T.p500 : T.n300}`, background: on ? T.b50 : T.white, display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ ...txt.bodySB, flex: 1 }}>{x.nom}</span>
                      <Tag label={`${x.missions.length} mission${x.missions.length > 1 ? "s" : ""}`} status="Light" />
                    </div>
                    <span style={txt.bodyXS}>{x.type} · {x.gestionnaire} · {x.ville}</span>
                    {alerts > 0 && <span><Tag label={`${alerts} à surveiller`} status="Warning" icon="warning" /></span>}
                  </div>);
              })}
            </div>
          </BlockWrapper>

          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            <BlockWrapper title={s.nom} icon="buildings" right={<Tag label={s.type} status={s.type === "Professionnel" ? "Dark" : "Light"} size="Medium" />}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
                {[["Gestionnaire", s.gestionnaire], ["Téléphone", s.tel], ["E-mail", s.mail], ["Partenaire depuis", s.depuis]].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", flexDirection: "column", gap: 4 }}><span style={{ ...txt.bodyS, color: T.n800 }}>{k}</span><span style={{ ...txt.bodyS, fontWeight: 700 }}>{v}</span></div>))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
                {[["Missions AMO", String(s.missions.length)], ["Lots accompagnés", String(s.missions.reduce((a, m) => a + m.lots, 0))], ["En chantier", String(s.missions.filter(m => m.phase >= 5).length)], ["À surveiller", String(s.missions.filter(m => m.sante === "rouge" || m.sante === "orange").length)]].map(([k, v]) => (
                  <div key={k} style={{ background: T.n100, borderRadius: 8, padding: 12 }}><div style={{ ...txt.bodyXS }}>{k}</div><div style={{ ...txt.h4, marginTop: 4 }}>{v}</div></div>))}
              </div>
            </BlockWrapper>

            <BlockWrapper title="Missions AMO Copro rattachées" icon="folder-simple-star"
              right={<Select value={phase} onChange={setPhase} width={200} options={[{ v: "all", label: "Toutes les phases" }, ...PHASES.map((p, i) => ({ v: String(i), label: p }))]} />}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: T.n100, borderRadius: 8, padding: "8px 12px" }}>
                <span style={txt.bodyS}>{missions.length} missions · {missions.reduce((a, m) => a + m.lots, 0)} lots</span>
                <Button size="Tiny" aspect="Outline" icon="download-simple" label="Extraire (CSV)" onClick={exp} />
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>{["Copropriété", "Phase", "Avancement", "Dernière action", "Prochaine étape", ""].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
                <tbody>{missions.map(m => (
                  <tr key={m.id} style={{ background: m.vauban ? T.b50 : T.white }}>
                    <td style={td}><div style={{ fontWeight: 700 }}>{m.nom}</div><div style={txt.bodyXS}>{m.ville} · {m.lots} lots</div></td>
                    <td style={td}><Tag label={PHASES[m.phase]} status={m.phase >= 5 ? "Info" : m.phase >= 3 ? "Light" : "Grey"} /><div style={{ marginTop: 4 }}><Tag label={SANTE[m.sante].l} status={SANTE[m.sante].s} /></div></td>
                    <td style={td}><Progress pct={m.av} /></td>
                    <td style={{ ...td, maxWidth: 260 }}><div style={{ ...txt.bodyS, lineHeight: "20px" }}>{m.derniere.quoi}</div><div style={txt.bodyXS}>{m.derniere.date} · {m.derniere.qui}</div></td>
                    <td style={{ ...td, maxWidth: 220 }}><span style={{ ...txt.bodyS, lineHeight: "20px", color: m.sante === "rouge" ? T.r500 : T.p900 }}>{m.prochaine}</span></td>
                    <td style={{ ...td, whiteSpace: "nowrap" }}>{m.vauban ? <Button size="Tiny" aspect="Plain" label="Ouvrir le dossier" iconRight="arrow-right" onClick={onOpenDossier} /> : <Button size="Tiny" aspect="Outline" icon="envelope-simple" title="Écrire au syndic" />}</td>
                  </tr>))}</tbody>
              </table>
            </BlockWrapper>
          </div>
        </div>
      </div>
    </div>
  );
}
