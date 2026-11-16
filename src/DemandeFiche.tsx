// Qualification SPEE : demandes entrantes (formulaire rempli par un syndicat de copropriétaires ou un syndic)
// et fiche de demande, point de départ du projet. La fiche complète le formulaire par les API publiques
// (sans redemander ce que les API savent), propose un score, puis crée le projet : gardé au SPEE ou attribué à un opérateur.
import React, { useEffect, useState } from "react";
import { T, txt, Icon, Button, Tag, BlockWrapper, AlertBlock, Input, Select, Segmented, th, td, TagStatus } from "./ds";
import { useCoproCollect, searchBan, SourceSteps } from "./CreerCopro";
import { ScoringSPEE, computeSpee, useSpeeApi, SpeeInputs } from "./ScoringSPEE";

type Demandeur = { type: "Syndicat de copropriétaires" | "Syndic professionnel" | "Syndic bénévole"; nom: string; qualite: string; contact: string; mail: string };
type Form = { k: string; v: string; dup?: string }; // dup = champ également capté par API (libellé du champ API)
export type Demande = { id: string; ref: string; nom: string; adresse: string; recue: string; origine: string; demandeur: Demandeur; form: Form[]; docs: string[];
  impayes: number; fonds: number; csActifs: number; agPrevue: boolean; decision: string; orientation: string; co: string; spee: SpeeInputs };

export const DEMANDES_INIT: Demande[] = [
  { id: "D1", ref: "DEM-2026-0412", nom: "Résidence Inkermann", adresse: "37 Rue Inkermann 59000 Lille", recue: "04/11/2026", origine: "Formulaire en ligne · site du SPEE",
    demandeur: { type: "Syndicat de copropriétaires", nom: "Conseil syndical, M. Hennebelle (président)", qualite: "Président du conseil syndical", contact: "06 •• •• •• 41", mail: "cs.inkermann@example.fr" },
    form: [{ k: "Motivation", v: "Factures de chauffage en forte hausse, inconfort l'hiver, façades à ravaler" }, { k: "Travaux envisagés", v: "Isolation des façades, remplacement de la chaudière collective" },
      { k: "Nombre de lots (déclaré)", v: "22", dup: "Lots (total)" }, { k: "Prochaine AG", v: "Mars 2027" }, { k: "Syndic informé de la démarche", v: "Oui" }],
    docs: ["DPE collectif 2024", "Dernier PV d'AG", "Annexes comptables 2025"], impayes: 4, fonds: 9500, csActifs: 4, agPrevue: true, spee: { prochaineAGmois: 4, anciennete: "> 10 ans", pctPO: 75, nbCopro: 19, impayes: 4, impayesSrc: "Marius IA · annexes comptables 2025", charges: "Normal", fonds: "Normal", financeSrc: "Marius IA · annexes comptables 2025", participationAG: 62, nbPostes: null, gain: null, docSrc: "Marius IA · DPE collectif 2024", relation: "Bonne", implication: "Bonne", motivation: "Bonne", dpeOuAudit: true }, decision: "À présenter", orientation: "—", co: "—" },
  { id: "D2", ref: "DEM-2026-0418", nom: "Copropriété Montebello", adresse: "3 Boulevard Montebello 59000 Lille", recue: "06/11/2026", origine: "Formulaire en ligne · site du SPEE",
    demandeur: { type: "Syndic professionnel", nom: "Cabinet Delmotte Gestion (fictif)", qualite: "Gestionnaire, mandat depuis septembre 2026", contact: "03 •• •• •• 12", mail: "copro@delmotte-gestion.example" },
    form: [{ k: "Motivation", v: "Plan pluriannuel de travaux à établir, DPE collectif obligatoire, copropriété de grande taille" }, { k: "Travaux envisagés", v: "À définir avec l'audit" },
      { k: "Prochaine AG", v: "Juin 2027" }, { k: "Accompagnement souhaité", v: "Audit, PPPT et montage financier" }],
    docs: ["Règlement de copropriété", "Contrat de syndic"], impayes: 11, fonds: 64000, csActifs: 2, agPrevue: false, spee: { prochaineAGmois: 7, anciennete: "< 5 ans", pctPO: null, nbCopro: null, impayes: 11, impayesSrc: "Formulaire (déclaré)", charges: "", fonds: "", financeSrc: "", participationAG: null, nbPostes: null, gain: null, docSrc: "", relation: "", implication: "", motivation: "", dpeOuAudit: false }, decision: "À présenter", orientation: "—", co: "—" },
  { id: "D3", ref: "DEM-2026-0421", nom: "Résidence Foch", adresse: "16 Avenue Foch 59800 Lille", recue: "07/11/2026", origine: "Prescripteur · Maison de l'Habitat Durable",
    demandeur: { type: "Syndicat de copropriétaires", nom: "Conseil syndical, Mme Verhaeghe (présidente)", qualite: "Présidente du conseil syndical", contact: "06 •• •• •• 87", mail: "cs.foch@example.fr" },
    form: [{ k: "Motivation", v: "Toiture-terrasse fuyarde, souhait d'une rénovation globale" }, { k: "Travaux envisagés", v: "Toiture, isolation, menuiseries" },
      { k: "Année de construction (déclarée)", v: "1972", dup: "Année de construction" }, { k: "Prochaine AG", v: "Avril 2027" }, { k: "Syndic informé de la démarche", v: "Oui" }],
    docs: ["DTG 2023", "Devis toiture"], impayes: 6, fonds: 12000, csActifs: 3, agPrevue: true, spee: { prochaineAGmois: 5, anciennete: "> 5 ans", pctPO: 60, nbCopro: 20, impayes: 6, impayesSrc: "Formulaire (déclaré)", charges: "", fonds: "", financeSrc: "", participationAG: null, nbPostes: 4, gain: null, docSrc: "Marius IA · DTG 2023", relation: "Moyenne", implication: "Bonne", motivation: "Bonne", dpeOuAudit: true }, decision: "À présenter", orientation: "—", co: "—" },
  { id: "D4", ref: "DEM-2026-0430", nom: "Résidence du Peuple Belge", adresse: "80 Avenue du Peuple Belge 59800 Lille", recue: "10/11/2026", origine: "Formulaire en ligne · site du SPEE",
    demandeur: { type: "Syndic bénévole", nom: "M. Lambrecht, syndic bénévole", qualite: "Copropriétaire, syndic bénévole élu en AG", contact: "07 •• •• •• 05", mail: "syndic.peuplebelge@example.fr" },
    form: [{ k: "Motivation", v: "Copropriétaires âgés, logements froids, peu de moyens" }, { k: "Travaux envisagés", v: "Isolation et ventilation" }, { k: "Prochaine AG", v: "Non fixée" }],
    docs: [], impayes: 18, fonds: 0, csActifs: 1, agPrevue: false, spee: { prochaineAGmois: null, anciennete: "", pctPO: 85, nbCopro: 22, impayes: 18, impayesSrc: "Formulaire (déclaré)", charges: "", fonds: "", financeSrc: "", participationAG: 35, nbPostes: null, gain: null, docSrc: "", relation: "", implication: "", motivation: "", dpeOuAudit: false }, decision: "À présenter", orientation: "—", co: "—" },
];
export const COS = ["Claire V.", "Mathieu P.", "Thomas R.", "Inès B.", "Karim L."];

const CRITS = [
  { id: "dpe", label: "Étiquette E, F ou G", fam: "Technique", poids: 3 },
  { id: "audit", label: "Audit, DTG ou DPE collectif disponible", fam: "Technique", poids: 2 },
  { id: "impayes", label: "Taux d'impayés maîtrisé", fam: "Gestion", poids: 3 },
  { id: "fonds", label: "Fonds travaux alimenté", fam: "Gestion", poids: 1 },
  { id: "syndic", label: "Syndic mobilisé", fam: "Gestion", poids: 2 },
  { id: "cs", label: "Conseil syndical moteur", fam: "Projet", poids: 3 },
  { id: "ag", label: "Projet inscrit en AG", fam: "Projet", poids: 2 },
];
const tone = (s: number): TagStatus => s > 70 ? "Success" : s >= 30 ? "Warning" : "Error";
const decTag = (d: string): TagStatus => d.startsWith("Projet") ? "Success" : d === "Ajournée" ? "Warning" : "Grey";

// ── Liste des demandes ─────────────────────────────────────────────────
export function DemandesListe({ demandes, onOpen }: { demandes: Demande[]; onOpen: (id: string) => void }) {
  return (
    <BlockWrapper title="Demandes entrantes" icon="files" right={<Tag label={`${demandes.filter(d => d.decision === "À présenter").length} à qualifier`} status="Warning" size="Medium" />}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr>{["Demande", "Demandeur", "Origine", "Reçue le", "Statut", ""].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
        <tbody>{demandes.map(d => (
          <tr key={d.id} onClick={() => onOpen(d.id)} style={{ cursor: "pointer" }} onMouseEnter={e => (e.currentTarget.style.background = T.b50)} onMouseLeave={e => (e.currentTarget.style.background = T.white)}>
            <td style={td}><div style={{ fontWeight: 700 }}>{d.nom}</div><div style={txt.bodyXS}>{d.ref} · {d.adresse}</div></td>
            <td style={td}><Tag label={d.demandeur.type} status={d.demandeur.type === "Syndic professionnel" ? "Dark" : "Light"} /><div style={{ ...txt.bodyXS, marginTop: 4 }}>{d.demandeur.nom}</div></td>
            <td style={td}><span style={txt.bodyS}>{d.origine}</span></td>
            <td style={td}>{d.recue}</td>
            <td style={td}><Tag label={d.decision} status={decTag(d.decision)} />{d.orientation !== "—" && <div style={{ ...txt.bodyXS, marginTop: 4 }}>{d.orientation}</div>}</td>
            <td style={td}><Button size="Tiny" aspect="Outline" label="Ouvrir la fiche" iconRight="arrow-right" onClick={() => onOpen(d.id)} /></td>
          </tr>))}</tbody>
      </table>
    </BlockWrapper>
  );
}

// ── Fiche de demande ───────────────────────────────────────────────────
export function DemandeFiche({ d, onBack, onDecide }: { d: Demande; onBack: () => void; onDecide: (p: { decision: string; orientation: string; co: string; lots: number; mode: "Full" | "Solo" }) => void }) {
  const C = useCoproCollect();
  const [notes, setNotes] = useState<Record<string, number>>({});
  const [manual, setManual] = useState<Record<string, boolean>>({});
  const [si, setSi] = useState<SpeeInputs>(d.spee);
  const X = useSpeeApi(C.adr);
  const [dest, setDest] = useState<"spee" | "operateur">("spee");
  const [op, setOp] = useState("Urbanis"); const [autre, setAutre] = useState(""); const [co, setCo] = useState(COS[0]);
  const done = d.decision.startsWith("Projet");

  useEffect(() => { (async () => { try { const r = await searchBan(d.adresse); if (r[0]) C.run(r[0]); } catch { /* */ } })(); }, [d.id]);

  const api = (k: string) => C.fields.find(f => f.k === k)?.v;
  const dpeCls = api("Étiquette DPE dominante") || (C.dpe?.total ? Object.entries(C.dpe.rep).sort((a, b) => b[1] - a[1])[0]?.[0] : undefined);
  const auto: Record<string, { n: number; src: string }> = {
    dpe: { n: dpeCls ? (["E", "F", "G"].includes(dpeCls) ? 3 : dpeCls === "D" ? 2 : 1) : 0, src: dpeCls ? `API · étiquette ${dpeCls}` : "API · en attente" },
    audit: { n: d.docs.some(x => /audit|DTG/i.test(x)) ? 3 : d.docs.some(x => /DPE/i.test(x)) || (C.dpe?.total || 0) > 5 ? 2 : 0, src: d.docs.length ? "Pièces jointes" : (C.dpe?.total ? "API · DPE ADEME" : "Aucune pièce") },
    impayes: { n: d.impayes < 5 ? 3 : d.impayes < 10 ? 2 : d.impayes < 15 ? 1 : 0, src: `Formulaire · ${d.impayes} %` },
    fonds: { n: d.fonds > 20000 ? 3 : d.fonds > 0 ? 2 : 0, src: `Formulaire · ${d.fonds.toLocaleString("fr-FR")} €` },
    syndic: { n: d.demandeur.type === "Syndic professionnel" ? 3 : d.form.some(f => /Syndic informé/.test(f.k) && f.v === "Oui") ? 2 : d.demandeur.type === "Syndic bénévole" ? 2 : 1, src: d.demandeur.type === "Syndicat de copropriétaires" ? "Formulaire" : "Demandeur = syndic" },
    cs: { n: d.csActifs >= 3 ? 3 : d.csActifs >= 2 ? 2 : d.csActifs, src: `Formulaire · ${d.csActifs} membre${d.csActifs > 1 ? "s" : ""} actif${d.csActifs > 1 ? "s" : ""}` },
    ag: { n: d.agPrevue ? 2 : 0, src: `Formulaire · ${d.form.find(f => f.k === "Prochaine AG")?.v || "—"}` },
  };
  const inds = computeSpee(C.fields, C.dpe, X, si, d.demandeur.type);
  const score = inds.reduce((a, x) => a + (x.pts || 0), 0);
  const qpv = (C.fields.find(f => f.k === "Programmes / quartiers")?.v || "");
  const fragile = (si.impayes != null && si.impayes > 8) || /QPV|sauvegarde/i.test(qpv) ? [si.impayes != null && si.impayes > 8 ? `impayés à ${si.impayes} % (> 8 %)` : "", /QPV|sauvegarde/i.test(qpv) ? qpv : ""].filter(Boolean).join(" · ") + " : critère de fragilité de la grille SPEE (NPNRU ou impayés > 8 %)." : null;
  const lots = Number(api("Lots d'habitation") || api("Logements (bâtiment)") || d.form.find(f => f.dup === "Lots (total)")?.v || 0);
  const progs = api("Programmes / quartiers");
  const formOnly = d.form.filter(f => !f.dup);
  const dups = d.form.filter(f => f.dup);

  return (<>
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <Button size="Small" aspect="Outline" icon="arrow-left" label="Demandes" onClick={onBack} />
      <div style={{ flex: 1 }}>
        <h1 style={{ ...txt.h3, margin: 0 }}>{d.nom}</h1>
        <div style={{ ...txt.bodyM, color: T.n800, marginTop: 4 }}>{d.ref} · reçue le {d.recue} · {d.origine}</div>
      </div>
      <Tag label={`Score ${score} / 100`} status={tone(score)} size="Medium" />
      <Tag label={d.decision} status={decTag(d.decision)} size="Medium" />
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "start" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        <BlockWrapper title="Demandeur" icon="user-circle" right={<Tag label={d.demandeur.type} status={d.demandeur.type === "Syndic professionnel" ? "Dark" : "Light"} size="Medium" />}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[["Nom", d.demandeur.nom], ["Qualité", d.demandeur.qualite], ["Téléphone", d.demandeur.contact], ["E-mail", d.demandeur.mail]].map(([k, v]) => (
              <div key={k}><div style={{ ...txt.bodyS, color: T.n800 }}>{k}</div><div style={{ ...txt.bodyS, fontWeight: 700, marginTop: 4 }}>{v}</div></div>))}
          </div>
        </BlockWrapper>

        <BlockWrapper title="Renseigné par le demandeur" icon="note-pencil" right={<Tag label="Formulaire" status="Light" />}>
          <span style={txt.bodyXS}>Le formulaire ne demande que ce que les sources publiques ne savent pas : motivations, projet, gestion, calendrier.</span>
          <table style={{ width: "100%", borderCollapse: "collapse" }}><tbody>
            <tr><td style={{ ...td, color: T.n800, width: "40%" }}>Adresse</td><td style={{ ...td, fontWeight: 700 }}>{d.adresse}</td></tr>
            {formOnly.map(f => <tr key={f.k}><td style={{ ...td, color: T.n800 }}>{f.k}</td><td style={{ ...td, fontWeight: 700 }}>{f.v}</td></tr>)}
            <tr><td style={{ ...td, color: T.n800 }}>Taux d'impayés (déclaré)</td><td style={{ ...td, fontWeight: 700 }}>{d.impayes} %</td></tr>
            <tr><td style={{ ...td, color: T.n800 }}>Fonds travaux (déclaré)</td><td style={{ ...td, fontWeight: 700 }}>{d.fonds.toLocaleString("fr-FR")} €</td></tr>
            <tr><td style={{ ...td, color: T.n800 }}>Membres actifs du conseil syndical</td><td style={{ ...td, fontWeight: 700 }}>{d.csActifs}</td></tr>
            <tr><td style={{ ...td, color: T.n800 }}>Pièces jointes</td><td style={td}>{d.docs.length ? d.docs.map(x => <span key={x} style={{ marginRight: 4 }}><Tag label={x} status="Light" icon="paperclip" /></span>) : <span style={txt.bodyXS}>aucune</span>}</td></tr>
          </tbody></table>
        </BlockWrapper>

        {dups.length > 0 && (
          <BlockWrapper title="Doublons évités" icon="copy">
            <span style={txt.bodyXS}>Ces informations sont aussi connues des sources publiques : une seule valeur est gardée, la source officielle prime.</span>
            {dups.map(f => { const a = api(f.dup!); const same = a && a.replace(/\D/g, "") === f.v.replace(/\D/g, ""); return (
              <div key={f.k} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: `1px solid ${T.n300}` }}>
                <span style={{ ...txt.bodyS, flex: 1 }}>{f.k.replace(/ \(déclarée?\)/, "")}</span>
                <span style={txt.bodyS}>Déclaré : <b>{f.v}</b></span>
                <span style={txt.bodyS}>Source : <b>{a || "…"}</b></span>
                {a ? (same ? <Tag label="Concordant" status="Success" /> : <Tag label="Écart : valeur officielle retenue" status="Warning" icon="warning" />) : <Tag label="En attente" status="Grey" />}
              </div>); })}
          </BlockWrapper>)}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        <BlockWrapper title="Qualifié automatiquement" icon="sparkle" right={<Tag label="API publiques" status="AI" />}>
          <SourceSteps steps={C.steps} />
          {C.fields.length > 0 && (
            <table style={{ width: "100%", borderCollapse: "collapse" }}><tbody>
              {C.fields.filter(f => !["Identifiant BAN", "Code commune (INSEE)", "Adresse"].includes(f.k)).map((f, i) => (
                <tr key={i}><td style={{ ...td, color: T.n800, width: "40%" }}>{f.k}</td>
                  <td style={{ ...td, fontWeight: 700, color: f.warn ? T.o500 : T.p900 }}>{f.v}{f.warn && <div style={{ ...txt.bodyXS, color: T.o500, fontWeight: 400 }}>{f.warn}</div>}</td>
                  <td style={{ ...td, width: 110, textAlign: "right" }}><Tag label={f.src === "RNIC" ? "Registre" : f.src} status="Light" /></td></tr>))}
              {C.dpe && C.dpe.total > 0 && <tr><td style={{ ...td, color: T.n800 }}>DPE des logements</td><td style={{ ...td, fontWeight: 700 }}>{C.dpe.total} DPE · {["A", "B", "C", "D", "E", "F", "G"].filter(l => C.dpe!.rep[l]).map(l => `${l} ${C.dpe!.rep[l]}`).join(" · ")}</td><td style={{ ...td, textAlign: "right" }}><Tag label="DPE ADEME" status="Light" /></td></tr>}
            </tbody></table>)}
          {progs && progs !== "aucun" && <AlertBlock type="Info" title="Programme ou quartier prioritaire">{progs} : à prendre en compte pour la priorisation et les aides locales.</AlertBlock>}
        </BlockWrapper>

        <BlockWrapper type="Edit" title="Créer le projet" icon="rocket-launch"
          footerLeft={!done ? <Button size="Small" aspect="Outline" label="Ajourner" onClick={() => onDecide({ decision: "Ajournée", orientation: "—", co: "—", lots, mode: "Full" })} /> : undefined}
          footerRight={!done ? <Button size="Small" aspect="Plain" icon="rocket-launch" label="Créer le projet" disabled={dest === "operateur" && op === "Autre" && !autre.trim()}
            onClick={() => onDecide(dest === "spee" ? { decision: "Projet créé · SPEE", orientation: "SPEE (MOD directe)", co, lots, mode: "Full" } : { decision: "Projet créé · opérateur", orientation: op === "Autre" ? autre : op, co: "—", lots, mode: "Solo" })} /> : undefined}>
          {done ? <AlertBlock type="Success" title={d.decision}>Projet ouvert : {d.orientation}{d.co !== "—" ? ` · chargé d'opération ${d.co}` : ""}. Les données de la fiche (formulaire et API) alimentent la carte d'identité du dossier. Il apparaît dans le portefeuille.</AlertBlock> : (<>
            <Segmented value={dest} onChange={setDest} options={[{ v: "spee", label: "Garder au SPEE (MOD directe)", icon: "buildings" }, { v: "operateur", label: "Attribuer à un opérateur", icon: "users-four" }]} />
            {dest === "spee"
              ? <Select label="Chargé d'opération" value={co} onChange={setCo} options={COS.map(v => ({ v, label: v }))} />
              : <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
                  <Select label="Opérateur" value={op} onChange={setOp} width={220} options={["Urbanis", "SOLIHA", "Autre"].map(v => ({ v, label: v }))} />
                  {op === "Autre" && <Input label="Nom de l'opérateur" value={autre} onChange={setAutre} placeholder="Ex. : Citémétrie" />}
                </div>}
            <span style={txt.bodyXS}>{dest === "spee" ? "Compte Full : votre équipe pilote tout le dossier." : "L'opérateur reçoit le dossier dans son compte Light, avec le parcours qualité Hauts-de-France activé : jalons et pièces remontent au SPEE."}</span>
          </>)}
        </BlockWrapper>
      </div>
    </div>
    <ScoringSPEE inds={inds} fragile={fragile} nbCopro={si.nbCopro} onCo={(key, v) => setSi(x => ({ ...x, [key]: v }))} />
  </>);
}
