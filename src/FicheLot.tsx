// Fiche lot (SPEE) : identité du lot et du copropriétaire (PO / PB / SCI), deux clés de tantièmes, travaux privatifs,
// financement du lot, puis instruction financière : pièces (listes PO-PB et SCI du SPEE), fiche sociale et financière,
// scoring financier (règles du fichier « Scoring financier » du SPEE), analyse des relevés, commission d'intervention.
import React, { useMemo, useState } from "react";
import { T, txt, Icon, Button, Tag, BlockWrapper, AlertBlock, Input, Select, Segmented, Checkbox, th, td, fmtE, TagStatus } from "./ds";

export type Statut = "PO" | "PB" | "SCI";
type Priv = { poste: string; ttc: number };
export type LotData = {
  id: number; nom: string; cat: string; tGen: number; tLog: number; type: string; bat: string; entree: string; etage: string; surface: number;
  statut: Statut; occupants: number; composition: string; age: string; situation: string; tel: string; mail: string;
  pb?: { loyerHC: number; charges: number; loue: boolean };
  sci?: { raison: string; gerant: string; siren: string };
  privatifs: Priv[]; financement: "Éco-PTZ" | "Autofinancement" | "Mixte";
  revenus: { salaires: number; primes: number; allocations: number; pensions: number; autres: number };
  charges: { logement: number; assurances: number; energie3m: number; copro3m: number; eau: number; telecom: number };
  credits: number; impots: number; rfr: number; valeurBien: number; crd: number; ecoEnergie: number;
};

const SEUIL = 23000;
const PIECES: Record<"PO/PB" | "SCI", string[]> = {
  "PO/PB": ["Avis d'impôt sur le revenu", "3 fiches de paie, pensions ou attestations CAF", "3 relevés bancaires", "Échéancier du crédit immobilier", "Échéancier des crédits à la consommation", "Factures d'énergie ou justificatif de domicile", "Livret de famille (si CAF)"],
  SCI: ["Avis d'impôt du ou des gérants", "CNI du ou des gérants", "3 relevés bancaires du ou des gérants", "Extrait K-bis de moins de 3 mois", "Liasses fiscales des 3 derniers exercices", "Titre de propriété"],
};
const RELEVES = ["Complétude des relevés de compte", "Cohérence des relevés avec le scoring", "Ressources identifiées pour le ou les emprunteurs", "Recensement des dépenses récurrentes hors énergie", "Identification des dépenses énergétiques", "Commissions d'intervention (sur 3 relevés)", "Dynamique du solde (début du relevé 1 → fin du relevé 3)", "Régularité des revenus constatés"];

// Règles du fichier « Scoring financier » du SPEE
export function scoringFinancier(x: { rfr: number; capital: number; mensuPtz: number; mensuCredits: number; impots: number; nb: number; rav: number; eco: number; crd: number; valeur: number }) {
  const ravMoinsM = x.rav - x.mensuPtz;
  const ravMoinsMEco = ravMoinsM + x.eco;
  const limite = x.nb < 4 ? 600 + 220 * (x.nb - 1) : 600 + 220 * 3 + 100 * (x.nb - 4);
  const marge = x.rav - limite;
  const ltv = x.valeur ? (x.crd + x.capital) / x.valeur : 0;
  const ecoCouvre = x.eco >= x.mensuPtz;
  let couleur: "VERT" | "ORANGE" | "ROUGE"; let niveau: number;
  if (ecoCouvre) { if (ravMoinsM >= limite) { couleur = "VERT"; niveau = 1; } else if (ravMoinsMEco >= limite) { couleur = ltv <= 0.8 ? "VERT" : "ORANGE"; niveau = ltv <= 0.8 ? 2 : 3; } else { couleur = "ORANGE"; niveau = 4; } }
  else { if (ravMoinsM >= limite) { couleur = "VERT"; niveau = 5; } else if (ravMoinsMEco >= limite) { couleur = ltv <= 0.8 ? "VERT" : "ORANGE"; niveau = ltv <= 0.8 ? 6 : 7; } else { couleur = "ROUGE"; niveau = 8; } }
  const capacite = x.rfr / 12 - x.mensuCredits - x.impots - (x.nb < 4 ? 700 + 210 * (x.nb - 1) : 700 + 210 * 3 + 100 * (x.nb - 4));
  return { ravMoinsM, ravMoinsMEco, limite, marge, ltv, couleur, niveau, capacite };
}

const Row = ({ k, v, warn }: { k: string; v: React.ReactNode; warn?: boolean }) => (
  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "6px 0", borderBottom: `1px solid ${T.n300}` }}>
    <span style={{ ...txt.bodyS, color: T.n800 }}>{k}</span><span style={{ ...txt.bodyS, fontWeight: 700, color: warn ? T.o500 : T.p900, textAlign: "right" }}>{v}</span>
  </div>);
const Step = ({ n, titre, etat, children }: { n: number; titre: string; etat: "ok" | "cours" | "attente"; children: React.ReactNode }) => (
  <div style={{ display: "flex", gap: 12 }}>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <span style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, background: etat === "ok" ? T.g500 : etat === "cours" ? T.p500 : T.n300, color: etat === "attente" ? T.n800 : T.white }}>{etat === "ok" ? <Icon n="check" size={16} /> : n}</span>
      <span style={{ flex: 1, width: 2, background: T.n300, marginTop: 4 }} />
    </div>
    <div style={{ flex: 1, paddingBottom: 24, display: "flex", flexDirection: "column", gap: 8 }}><div style={txt.bodySB}>{titre}</div>{children}</div>
  </div>);

export default function FicheLot({ lot: init, qpColl, aideIndiv, aideLocale, onBack, onDecision }: { lot: LotData; qpColl: number; aideIndiv: number; aideLocale: number; onBack: () => void; onDecision: (avis: string) => void }) {
  const [l, setL] = useState<LotData>(init);
  const [recu, setRecu] = useState<Record<string, boolean>>(() => { const list = PIECES[init.statut === "SCI" ? "SCI" : "PO/PB"]; return Object.fromEntries(list.map((p, i) => [p, init.id % 2 === 1 ? i < list.length - 1 : i < 3])); });
  const [rel, setRel] = useState<Record<string, "" | "OK" | "Alerte">>({});
  const [com, setCom] = useState({ date: "02/12/2026", participants: "Lucie D. (resp. pôle), Alice M., chargé d'opération", analyse: "", avis: "" as "" | "FAVORABLE" | "DEFAVORABLE", conditions: "" });
  const [forcer, setForcer] = useState(false);
  const set = (p: Partial<LotData>) => setL(x => ({ ...x, ...p }));

  const privTot = l.privatifs.reduce((a, p) => a + p.ttc, 0);
  const frais = Math.round((qpColl + privTot) * 0.035);
  const qpTot = qpColl + privTot + frais;
  const aides = aideIndiv + aideLocale;
  const rac = Math.max(0, qpTot - aides);
  const capital = l.financement === "Autofinancement" ? 0 : l.financement === "Mixte" ? Math.round(rac / 2) : Math.min(rac, 50000);
  const mensuPtz = Math.round(capital / 240);
  const requise = rac >= SEUIL || forcer;
  const revM = Object.values(l.revenus).reduce((a, b) => a + b, 0);
  const chM = l.charges.logement + l.charges.assurances + l.charges.energie3m / 3 + l.charges.copro3m / 3 + l.charges.eau + l.charges.telecom;
  const rav = Math.round(revM - chM - l.credits - l.impots / 12);
  const endettement = revM ? (l.credits + mensuPtz) / revM : 0;
  const effortEnergie = revM ? (l.charges.energie3m / 3) / revM : 0;
  const sf = scoringFinancier({ rfr: l.rfr, capital, mensuPtz, mensuCredits: l.credits, impots: l.impots / 12, nb: l.occupants, rav, eco: l.ecoEnergie, crd: l.crd, valeur: l.valeurBien });
  const liste = PIECES[l.statut === "SCI" ? "SCI" : "PO/PB"];
  const nbRecu = liste.filter(p => recu[p]).length; const complet = nbRecu === liste.length;
  const relFait = RELEVES.every(r => rel[r]);
  const coul: Record<string, TagStatus> = { VERT: "Success", ORANGE: "Warning", ROUGE: "Error" };

  return (<>
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <Button size="Small" aspect="Outline" icon="arrow-left" label="Financement copros" onClick={onBack} />
      <div style={{ flex: 1 }}>
        <h1 style={{ ...txt.h3, margin: 0 }}>Lot {l.id} · {l.statut === "SCI" && l.sci ? l.sci.raison : l.nom}</h1>
        <div style={{ ...txt.bodyM, color: T.n800, marginTop: 4 }}>La Résidence Vauban · {l.type} · bâtiment {l.bat}, entrée {l.entree}, {l.etage}</div>
      </div>
      <Tag label={l.statut === "PO" ? "Propriétaire occupant" : l.statut === "PB" ? "Propriétaire bailleur" : "SCI"} status="Dark" size="Medium" />
      {l.cat !== "?" && <Tag label={`Ressources ${l.cat}`} status="Light" size="Medium" />}
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.25fr", gap: 32, alignItems: "start" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        <BlockWrapper title="Lot et copropriétaire" icon="identification-card">
          <Segmented value={l.statut} onChange={v => set({ statut: v })} options={[{ v: "PO", label: "Propriétaire occupant" }, { v: "PB", label: "Bailleur" }, { v: "SCI", label: "SCI" }]} />
          <Row k="Tantièmes généraux" v={`${l.tGen} / 2 072`} />
          <Row k="Tantièmes logement (clé chauffage)" v={`${l.tLog} / 1 000`} />
          <Row k="Surface habitable" v={`${l.surface} m²`} />
          {l.statut === "SCI" && l.sci ? (<>
            <Row k="SCI" v={l.sci.raison} /><Row k="SIREN" v={l.sci.siren} /><Row k="Gérant" v={l.sci.gerant} />
          </>) : (<>
            <Row k="Copropriétaire" v={l.nom} /><Row k="Situation" v={l.situation} /><Row k="Tranche d'âge" v={l.age} />
          </>)}
          {l.statut !== "PO" && l.pb && (<>
            <Row k="Logement loué" v={l.pb.loue ? "Oui" : "Non (vacant)"} warn={!l.pb.loue} />
            <Row k="Loyer hors charges" v={fmtE(l.pb.loyerHC) + " / mois"} /><Row k="Charges locatives" v={fmtE(l.pb.charges) + " / mois"} />
          </>)}
          {l.statut === "PO" && <Row k="Occupants" v={`${l.occupants} · ${l.composition}`} />}
          <Row k="Contact" v={`${l.tel} · ${l.mail}`} />
        </BlockWrapper>

        <BlockWrapper title="Travaux privatifs souhaités" icon="house-line" right={<Tag label={fmtE(privTot)} status="Light" />}>
          {l.privatifs.length === 0 ? <span style={txt.bodyS}>Aucun (questionnaire technique reçu).</span> :
            l.privatifs.map(p => <Row key={p.poste} k={p.poste} v={fmtE(p.ttc) + " TTC"} />)}
          <span style={txt.bodyXS}>Issus du questionnaire technique. Ils s'ajoutent à la quote-part des travaux collectifs.</span>
        </BlockWrapper>

        <BlockWrapper title="Financement du lot" icon="piggy-bank">
          <Row k="Quote-part travaux collectifs (tantièmes généraux)" v={fmtE(qpColl)} />
          <Row k="Travaux privatifs" v={fmtE(privTot)} />
          <Row k="Frais annexes (3,5 %)" v={fmtE(frais)} />
          <Row k="Quote-part totale travaux + frais" v={fmtE(qpTot)} />
          <Row k="Aides individuelles + aide locale" v={"− " + fmtE(aides)} />
          <Row k="Reste à charge" v={fmtE(rac)} warn={rac >= SEUIL} />
          <Select label="Mode de financement choisi" value={l.financement} onChange={v => set({ financement: v as any })} options={["Éco-PTZ", "Mixte", "Autofinancement"].map(v => ({ v, label: v }))} />
          {capital > 0 && <Row k="Éco-PTZ (20 ans, 0 %)" v={`${fmtE(capital)} · ${fmtE(mensuPtz)} / mois`} />}
          {rac >= SEUIL ? <AlertBlock type="Warning" title={`Reste à charge ≥ ${SEUIL.toLocaleString("fr-FR")} € : analyse financière obligatoire`}>Règle du SPEE (base projet). Au-delà de 50 000 € et 70 000 € de quote-part, des contrôles renforcés s'appliquent.</AlertBlock>
            : <AlertBlock type="Info" title="Analyse financière non requise">Reste à charge sous le seuil de {SEUIL.toLocaleString("fr-FR")} €. <span style={{ textDecoration: "underline", cursor: "pointer" }} onClick={() => setForcer(!forcer)}>{forcer ? "Annuler l'analyse" : "Lancer quand même l'analyse"}</span></AlertBlock>}
        </BlockWrapper>
      </div>

      <BlockWrapper title="Instruction financière" icon="scales" right={<Tag label={requise ? (com.avis ? `Commission : ${com.avis.toLowerCase()}` : "En cours") : "Non requise"} status={com.avis === "FAVORABLE" ? "Success" : com.avis === "DEFAVORABLE" ? "Error" : requise ? "Warning" : "Grey"} size="Medium" />}>
        {!requise ? <span style={txt.bodyS}>Le reste à charge de ce lot ne déclenche pas d'analyse financière.</span> : (<>
          <AlertBlock type="Neutral">Marius porte le dossier et les calculs reprennent les règles du fichier « Scoring financier » du SPEE. La décision reste celle de la commission du SPEE.</AlertBlock>

          <Step n={1} titre={`Pièces du dossier · liste ${l.statut === "SCI" ? "SCI" : "PO / PB"} (${nbRecu} / ${liste.length})`} etat={complet ? "ok" : "cours"}>
            {liste.map(p => (
              <div key={p} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Checkbox checked={!!recu[p]} onChange={v => setRecu(r => ({ ...r, [p]: v }))} />
                <span style={{ ...txt.bodyS, flex: 1, color: recu[p] ? T.p900 : T.o500 }}>{p}</span>
                {recu[p] ? (/impôt/i.test(p) ? <Tag label={`Lu par Marius IA · RFR ${fmtE(l.rfr)}`} status="AI" icon="sparkle" /> : <Tag label="Reçue" status="Success" />) : <Button size="Tiny" aspect="Outline" label="Relancer" icon="envelope-simple" />}
              </div>))}
          </Step>

          <Step n={2} titre="Fiche sociale et financière" etat={complet ? "ok" : "attente"}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <Input label="Salaires (€/mois)" type="number" value={l.revenus.salaires} onChange={v => set({ revenus: { ...l.revenus, salaires: +v || 0 } })} />
              <Input label="Pensions (€/mois)" type="number" value={l.revenus.pensions} onChange={v => set({ revenus: { ...l.revenus, pensions: +v || 0 } })} />
              <Input label="Allocations (€/mois)" type="number" value={l.revenus.allocations} onChange={v => set({ revenus: { ...l.revenus, allocations: +v || 0 } })} />
              <Input label="Crédits en cours (€/mois)" type="number" value={l.credits} onChange={v => set({ credits: +v || 0 })} />
              <Input label="Énergie, 3 derniers mois (€)" type="number" value={l.charges.energie3m} onChange={v => set({ charges: { ...l.charges, energie3m: +v || 0 } })} />
              <Input label="Charges de copro trimestrielles (€)" type="number" value={l.charges.copro3m} onChange={v => set({ charges: { ...l.charges, copro3m: +v || 0 } })} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {[["Revenus mensuels", fmtE(revM)], ["Reste à vivre", fmtE(rav) + " / mois"], ["Taux d'endettement", Math.round(endettement * 100) + " %"], ["Effort énergétique", Math.round(effortEnergie * 100) + " %"], ["Charges fixes", fmtE(chM) + " / mois"], ["Personnes au foyer", String(l.occupants)]].map(([k, v]) => (
                <div key={k} style={{ background: T.n100, borderRadius: 8, padding: 8 }}><div style={txt.bodyXS}>{k}</div><div style={{ ...txt.bodySB, marginTop: 4 }}>{v}</div></div>))}
            </div>
          </Step>

          <Step n={3} titre="Scoring financier (règles SPEE)" etat={complet ? "ok" : "attente"}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <Tag label={sf.couleur} status={coul[sf.couleur]} size="Medium" /><span style={txt.bodySB}>Niveau de risque {sf.niveau}</span>
            </div>
            <Row k="Reste à vivre − mensualité éco-PTZ" v={fmtE(sf.ravMoinsM) + " / mois"} />
            <Row k="… en comptant les économies d'énergie" v={`${fmtE(sf.ravMoinsMEco)} / mois (économies ${fmtE(l.ecoEnergie)})`} />
            <Row k={`Limite de reste à vivre (${l.occupants} pers.)`} v={fmtE(sf.limite) + " / mois"} />
            <Row k="Marge" v={fmtE(sf.marge) + " / mois"} warn={sf.marge < 0} />
            <Row k="LTV (capital restant dû + éco-PTZ) / valeur du bien" v={Math.round(sf.ltv * 100) + " %"} warn={sf.ltv > 0.8} />
            <Row k="Capacité de remboursement" v={fmtE(sf.capacite) + " / mois"} warn={sf.capacite < mensuPtz} />
          </Step>

          <Step n={4} titre="Analyse des relevés de compte" etat={relFait ? "ok" : complet ? "cours" : "attente"}>
            {RELEVES.map(r => (
              <div key={r} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ ...txt.bodyS, flex: 1 }}>{r}</span>
                <Segmented value={(rel[r] || "") as any} onChange={v => setRel(x => ({ ...x, [r]: v }))} options={[{ v: "OK", label: "OK" }, { v: "Alerte", label: "Alerte" }]} />
              </div>))}
          </Step>

          <Step n={5} titre="Commission d'intervention" etat={com.avis ? "ok" : relFait ? "cours" : "attente"}>
            <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 8 }}>
              <Input label="Date" value={com.date} onChange={v => setCom({ ...com, date: v })} />
              <Input label="Participants" value={com.participants} onChange={v => setCom({ ...com, participants: v })} />
            </div>
            <Input label="Analyse" value={com.analyse} onChange={v => setCom({ ...com, analyse: v })} placeholder={`Ex. : ${sf.couleur.toLowerCase()}, niveau ${sf.niveau}, marge ${fmtE(sf.marge)}, budget maîtrisé`} />
            <Input label="Conditions éventuelles" value={com.conditions} onChange={v => setCom({ ...com, conditions: v })} placeholder="Ex. : caution, ajustement du montant, différé" />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Button size="Small" aspect={com.avis === "DEFAVORABLE" ? "Negative" : "Outline"} label="Avis défavorable" onClick={() => { setCom({ ...com, avis: "DEFAVORABLE" }); onDecision("Défavorable"); }} />
              <Button size="Small" aspect={com.avis === "FAVORABLE" ? "Positive" : "Plain"} icon="check" label="Avis favorable" onClick={() => { setCom({ ...com, avis: "FAVORABLE" }); onDecision("Favorable"); }} />
            </div>
            {com.avis && <AlertBlock type={com.avis === "FAVORABLE" ? "Success" : "Error"} title={`Avis ${com.avis.toLowerCase()} · commission du ${com.date}`}>Décision tracée et transmise : plan de financement du lot {com.avis === "FAVORABLE" ? `confirmé (éco-PTZ ${fmtE(capital)})` : "à revoir (autofinancement ou autre solution)"}. Rapport de commission généré.</AlertBlock>}
          </Step>
        </>)}
      </BlockWrapper>
    </div>
  </>);
}
