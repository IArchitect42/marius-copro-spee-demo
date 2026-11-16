// Dépôt d'un document avec Marius IA (onglet Documents) : dépôt, lecture, champs extraits à vérifier, transcription.
// Lecture SIMULÉE pour la démo. Champs devis/facture alignés sur la base TDCM.
import React, { useRef, useState } from "react";
import { T, F, txt, Icon, Button, Tag, AlertBlock, Input, Select } from "./ds";

export type DocKind = "facture" | "devis" | "pv" | "audit" | "avis" | "anah" | "autre";
type Fld = { k: string; v: string; warn?: string; ok?: string; group?: string };
export type DepotResult = { name: string; type: string; by: string; montant?: string; kind: DocKind; fields: Fld[]; dest: string };

const KIND_LABEL: Record<DocKind, string> = { facture: "Facture artisan", devis: "Devis artisan", pv: "PV de réception", audit: "Audit énergétique", avis: "Avis d'imposition", anah: "Courrier ANAH", autre: "Autre document" };
const KIND_TYPE: Record<DocKind, string> = { facture: "Facture", devis: "Devis", pv: "PV", audit: "Audit", avis: "Justificatif", anah: "Décision", autre: "Administratif" };

export function guessKind(s: string): DocKind {
  const n = s.toLowerCase();
  if (n.includes("facture") || n.includes("situation")) return "facture";
  if (n.includes("devis")) return "devis";
  if (n.includes("pv") || n.includes("réception") || n.includes("reception")) return "pv";
  if (n.includes("audit") || n.includes("dpe")) return "audit";
  if (n.includes("avis") || n.includes("impo")) return "avis";
  if (n.includes("anah") || n.includes("solde")) return "anah";
  return "autre";
}

function extract(kind: DocKind, hint: string): { fields: Fld[]; by: string; montant?: string; name: string; dest: string; resume: string } {
  const h = hint.toLowerCase();
  const ent = h.includes("energo") || h.includes("énergo") ? { n: "ÉNERGO+", siret: "524 778 901 00033", mail: "chantiers@energoplus.fr", poste: "Pompe à chaleur air/eau collective", lot: "PAC air/eau" }
    : h.includes("ventil") ? { n: "VENTIL PRO", siret: "903 112 457 00014", mail: "contact@ventilpro.fr", poste: "VMC double flux collective", lot: "VMC double flux" }
    : h.includes("réseaux") || h.includes("reseaux") || h.includes("calori") ? { n: "RÉSEAUX THERM", siret: "781 004 552 00027", mail: "devis@reseauxtherm.fr", poste: "Calorifugeage des réseaux", lot: "Calorifugeage" }
    : { n: "THERMIS BTP", siret: "812 345 678 00021", mail: "contact@thermis-btp.fr", poste: "Isolation thermique par l'extérieur", lot: "ITE façades" };
  const proj = "24 rue Gambetta, 59000 Lille";
  switch (kind) {
    case "facture": return { by: ent.n, montant: "28 740 € TTC", name: `Facture solde ${ent.n} — 28 740 € TTC`, dest: `Suivi financier › lot ${ent.lot}`,
      resume: `Facture rapprochée du marché ${ent.n} (lot ${ent.lot}). Le certificat de paiement et l'appel de fonds peuvent être pré-remplis.`,
      fields: [
        { k: "Syndicat / maître d'ouvrage", v: "SDC Résidence Vauban" }, { k: "Adresse du projet", v: proj },
        { k: "Entreprise (raison sociale)", v: ent.n }, { k: "SIRET", v: ent.siret }, { k: "E-mail entreprise", v: ent.mail },
        { k: "Poste 1 · intitulé", v: ent.poste }, { k: "Poste 1 · description", v: "Solde du marché, après réception" },
        { k: "Montant HT", v: "27 241,71 €" }, { k: "Montant TTC", v: "28 740,00 €" },
        { k: "Cumul facturé / marché", v: "100 % (91 785 € TTC + avenant)", warn: "Réception du lot pas encore prononcée : PV de réception attendu avant paiement du solde" },
      ] };
    case "devis": return { by: ent.n, montant: "33 760 € TTC", name: `Devis ${ent.n} — ${ent.poste}`, dest: "Analyse des offres",
      resume: `Devis conforme au programme voté (poste ${ent.lot}). Qualification RGE valide.`,
      fields: [
        { k: "Ménage / maître d'ouvrage", v: "SDC Résidence Vauban" }, { k: "Adresse du projet", v: proj },
        { k: "Entreprise (raison sociale)", v: ent.n }, { k: "SIRET", v: ent.siret }, { k: "E-mail entreprise", v: ent.mail },
        { k: "Poste 1 · intitulé", v: ent.poste }, { k: "Poste 1 · description", v: "Fourniture et pose, 12 logements" },
        { k: "Montant HT", v: "32 000,00 €" }, { k: "Montant TTC", v: "33 760,00 €" },
        { k: "Qualification RGE", v: "Valide jusqu'au 31/03/2027" },
      ] };
    case "pv": return { by: "AMO Copro", name: `PV de réception — ${ent.lot} (${ent.n})`, dest: "Mission › Réception des travaux",
      resume: "Réception prononcée avec réserves : les réserves sont créées comme tâches de suivi pour l'entreprise.",
      fields: [
        { k: "Lot", v: ent.lot }, { k: "Entreprise", v: ent.n }, { k: "Date de réception", v: "12/06/2026" },
        { k: "Décision", v: "Réception avec réserves" }, { k: "Nombre de réserves", v: "3", warn: "3 réserves à lever sous 30 jours" },
        { k: "Signataires", v: "Président CS, syndic, MOE, entreprise" },
      ] };
    case "audit": return { by: "Nord Énergie Conseil", name: "Audit énergétique copropriété — rapport définitif", dest: "La Copro › Bilan initial · Projet › état initial et scénarios · Financement",
      resume: "Audit de copropriété reconnu : 3 scénarios, scénario 2 retenu (rénovation globale). Données transcrites dans la fiche, l'état initial, le programme de travaux et le plan de financement. Gain supérieur à 35 % : éligible à MaPrimeRénov' Copropriété.",
      fields: [
        { group: "Identification de l'audit", k: "Numéro de l'audit", v: "AUD-COPRO-2025-0417" },
        { group: "Identification de l'audit", k: "Date de réalisation de l'audit", v: "15/03/2025" },
        { group: "Identification de l'audit", k: "Nom de l'auditeur", v: "Nord Énergie Conseil · M. Carpentier" },
        { group: "Identification de l'audit", k: "Numéro SIRET de l'auditeur", v: "831 204 556 00018", ok: "SIRET actif · qualification RGE Études vérifiée" },
        { group: "Copropriété auditée", k: "Adresse de la copropriété auditée", v: "24 rue Gambetta" },
        { group: "Copropriété auditée", k: "Code postal", v: "59000" },
        { group: "Copropriété auditée", k: "Ville", v: "Lille" },
        { group: "Copropriété auditée", k: "Type de bien", v: "Immeuble collectif en copropriété · 12 lots d'habitation" },
        { group: "Copropriété auditée", k: "Année de construction", v: "1978", ok: "Cohérent avec le Bilan initial" },
        { group: "Copropriété auditée", k: "Syndicat de copropriétaires (maître d'ouvrage)", v: "SDC Résidence Vauban, représenté par le Cabinet Lecomte" },
        { group: "État initial", k: "Surface de référence avant travaux", v: "2 105 m²", warn: "Écart avec le Bilan initial (2 072 m² habitables) : préciser la surface de référence retenue" },
        { group: "État initial", k: "Classe de performance énergétique initiale", v: "E" },
        { group: "État initial", k: "Consommation primaire avant travaux", v: "245 kWhEP/m².an" },
        { group: "État initial", k: "Consommation finale avant travaux", v: "198 kWhEF/m².an" },
        { group: "État initial", k: "Émissions de GES avant travaux", v: "52 kgCO₂/m².an" },
        { group: "État initial", k: "Dépenses énergétiques estimées / an avant travaux", v: "38 600 €" },
        { group: "Scénario retenu", k: "Scénario de travaux retenu", v: "Scénario 2 sur 3 · rénovation globale" },
        { group: "Scénario retenu", k: "Classe de performance énergétique scénario retenu", v: "C", ok: "Saut de 2 classes : bonus sortie de passoire non applicable (E → C), MPR Copro 45 %" },
        { group: "Scénario retenu", k: "Consommation primaire après travaux", v: "118 kWhEP/m².an" },
        { group: "Scénario retenu", k: "Consommation finale après travaux", v: "92 kWhEF/m².an" },
        { group: "Scénario retenu", k: "Émissions de GES après travaux", v: "14 kgCO₂/m².an" },
        { group: "Scénario retenu", k: "Économie d'énergie par rapport à l'état initial", v: "52 %", ok: "≥ 35 % : condition MaPrimeRénov' Copropriété remplie" },
        { group: "Scénario retenu", k: "Surface de référence après travaux", v: "2 105 m²" },
        { group: "Scénario retenu", k: "Dépenses énergétiques estimées / an après travaux", v: "17 900 €" },
        { group: "Scénario retenu", k: "Coût TTC du scénario de travaux", v: "290 950 €", ok: "Identique au plan de financement du dossier" },
        { group: "Postes de travaux du scénario", k: "Poste 1 · Isolation thermique par l'extérieur", v: "Façades, PSE 14 cm, R = 3,7 · 91 785 € TTC" },
        { group: "Postes de travaux du scénario", k: "Poste 2 · Isolation des combles perdus", v: "Laine soufflée 32 cm, R = 7 · 45 365 € TTC" },
        { group: "Postes de travaux du scénario", k: "Poste 3 · Pompe à chaleur air/eau collective", v: "Remplacement chaudière gaz 1999 · 80 220 € TTC" },
        { group: "Postes de travaux du scénario", k: "Poste 4 · VMC double flux collective", v: "12 logements · 33 760 € TTC" },
        { group: "Postes de travaux du scénario", k: "Poste 5 · Calorifugeage des réseaux", v: "Réseau de chauffage en sous-sol · 11 605 € TTC" },
        { group: "Postes de travaux du scénario", k: "Poste 6 · Honoraires AMO et maîtrise d'œuvre", v: "28 215 € TTC" },
        { group: "Aides du scénario", k: "Aide nationale 1 · MaPrimeRénov' Copropriété", v: "131 128 €" },
        { group: "Aides du scénario", k: "Aide nationale 2 · Certificats d'économies d'énergie", v: "16 875 €" },
        { group: "Aides du scénario", k: "Aide locale 1 · Prime MEL rénovation performante", v: "12 000 € (1 000 € × 12 lots)" },
        { group: "Aides du scénario", k: "Aide nationale 3 · Bonus sortie de passoire", v: "29 139 €", warn: "Incohérent avec le saut de classe E → C : bonus non applicable, à faire confirmer par l'auditeur" },
      ] };
    case "avis": return { by: "Copropriétaire", name: "Avis d'imposition — lot 6 (Mme Duquesnoy)", dest: "La Copro › enquête sociale, lot 6",
      resume: "Catégorie de ressources déterminée : l'enquête sociale et le plan de financement individuel du lot 6 sont mis à jour.",
      fields: [
        { k: "Lot", v: "6 · Mme Duquesnoy" }, { k: "Revenu fiscal de référence", v: "17 920 €" }, { k: "Nombre de parts", v: "1" },
        { k: "Année des revenus", v: "2025" }, { k: "Catégorie de ressources", v: "Très modeste (TMO)", warn: "Catégorie auparavant « inconnue » : prime individuelle de 3 000 € à ajouter" },
      ] };
    case "anah": return { by: "ANAH", montant: "48 080 €", name: "Courrier ANAH — versement du solde MaPrimeRénov' Copropriété", dest: "Financement › aides collectives · Suivi financier › versements",
      resume: "Courrier de versement du solde reconnu et rapproché de la notification d'octroi. La trésorerie du projet et le RECAP sont mis à jour.",
      fields: [
        { group: "Identification", k: "Référence du dossier ANAH", v: "MPRC-59-2025-001842" },
        { group: "Identification", k: "Date du courrier", v: "15/07/2026" },
        { group: "Identification", k: "Bénéficiaire", v: "Syndicat des copropriétaires Résidence Vauban, représenté par le Cabinet Lecomte" },
        { group: "Identification", k: "Aide concernée", v: "MaPrimeRénov' Copropriété (45 %)", ok: "Correspond à la notification d'octroi du 20/11/2025" },
        { group: "Montants", k: "Montant octroyé", v: "160 267 €" },
        { group: "Montants", k: "Acomptes déjà versés", v: "112 187 € (2 acomptes, 70 %)" },
        { group: "Montants", k: "Montant du solde versé", v: "48 080 €" },
        { group: "Montants", k: "Cumul versé", v: "160 267 €", ok: "Cumul = montant octroyé : aide soldée" },
        { group: "Versement", k: "Date de versement", v: "18/07/2026" },
        { group: "Versement", k: "Compte destinataire", v: "Compte travaux du syndicat · FR76 •••• 4521" },
        { group: "Versement", k: "Condition du solde", v: "PV de réception et factures acquittées transmis", warn: "PV de réception de l'ITE pas encore déposé dans Marius : à rattacher au dossier" },
      ] };
    default: return { by: "AMO Copro", name: hint || "Document", dest: "Documents", resume: "Type non reconnu avec certitude : choisissez le type pour lancer l'extraction adaptée.", fields: [{ k: "Titre détecté", v: hint || "—" }] };
  }
}

const SAMPLES: { label: string; file: string }[] = [
  { label: "Audit énergétique copro (Nord Énergie Conseil)", file: "audit-energetique-copro-vauban.pdf" },
  { label: "Facture de solde THERMIS BTP", file: "facture-solde-thermis.pdf" },
  { label: "PV de réception ITE", file: "pv-reception-ite.pdf" },
  { label: "Devis VENTIL PRO", file: "devis-ventil-pro.pdf" },
  { label: "Avis d'imposition lot 6", file: "avis-imposition-lot6.pdf" },
];
const STEPS = ["Lecture du document", "Reconnaissance du type", "Extraction des champs", "Rapprochement avec le dossier"];

export default function DepotIA({ slot, phaseLabel, onClose, onValidate, autoFile, inline }: { slot?: string; phaseLabel?: string; onClose: () => void; onValidate: (r: DepotResult) => void; autoFile?: string; inline?: boolean }) {
  const [file, setFile] = useState<string | null>(null);
  const [step, setStep] = useState(-1);
  const [kind, setKind] = useState<DocKind>("autre");
  const [data, setData] = useState<ReturnType<typeof extract> | null>(null);
  const [drag, setDrag] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const start = (fname: string) => {
    setFile(fname); setStep(0);
    const k = guessKind(fname) !== "autre" ? guessKind(fname) : guessKind(slot || "");
    STEPS.forEach((_, i) => setTimeout(() => setStep(i + 1), 550 * (i + 1)));
    setTimeout(() => { setKind(k); setData(extract(k, `${slot || ""} ${fname}`)); }, 550 * STEPS.length + 100);
  };
  React.useEffect(() => { if (autoFile) start(autoFile); }, []);
  const reKind = (k: DocKind) => { setKind(k); setData(extract(k, `${slot || ""} ${file || ""}`)); };
  const setField = (i: number, v: string) => data && setData({ ...data, fields: data.fields.map((f, j) => j === i ? { ...f, v } : f) });
  const done = !!data;

  return (
    <div onClick={inline ? undefined : onClose} style={inline ? { padding: 16, background: T.p50, minHeight: "100vh", boxSizing: "border-box", display: "flex", justifyContent: "center", alignItems: "flex-start" } : { position: "fixed", inset: 0, background: "rgba(19,37,45,0.55)", zIndex: 1100, display: "flex", justifyContent: "center", alignItems: "flex-start", overflowY: "auto", padding: "40px 16px" }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 800, maxWidth: "100%", background: T.white, borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.25)", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "16px 16px 0 24px" }}>
          <div style={{ flex: 1 }}>
            <div style={{ ...txt.h4 }}>Déposer un document</div>
            <div style={{ ...txt.bodyS, color: T.n800, marginTop: 4 }}>{slot ? `${slot}${phaseLabel ? " · " + phaseLabel : ""}` : "Marius IA reconnaît le type et range le document dans la bonne phase"}</div>
          </div>
          <Tag label="Marius IA" status="AI" size="Medium" icon="sparkle" />
          <Button size="Small" aspect="Neutral" icon="x" title="Fermer" onClick={onClose} />
        </div>

        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          {step < 0 && (<>
            <div onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; f && start(f.name); }}
              style={{ background: drag ? T.b50 : T.p50, border: `1px dashed ${T.p500}`, borderRadius: 8, padding: "32px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, textAlign: "center" }}>
              <Icon n="upload-simple" size={32} color={T.p500} />
              <div style={{ ...txt.bodyM, fontWeight: 700 }}>Glissez votre document ici</div>
              <div style={{ ...txt.bodyS, color: T.n800 }}>PDF, image ou scan · Marius IA en extrait les données utiles au dossier</div>
              <input ref={ref} type="file" accept=".pdf,.png,.jpg,.jpeg" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; f && start(f.name); e.target.value = ""; }} />
              <Button size="Small" aspect="Outline" icon="paperclip" label="Choisir un fichier" onClick={() => ref.current?.click()} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ ...txt.bodyS, color: T.n800 }}>Pas de fichier sous la main ? Utilisez un exemple :</span>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{SAMPLES.map(s => <Button key={s.file} size="Tiny" aspect="Outline" icon="file-pdf" label={s.label} onClick={() => start(s.file)} />)}</div>
            </div>
          </>)}

          {step >= 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, background: T.n100, borderRadius: 8, padding: "12px 16px" }}>
              <Icon n="file-pdf" size={32} color={T.r500} />
              <div style={{ flex: 1 }}><div style={txt.bodySB}>{file}</div><div style={{ ...txt.bodyXS, marginTop: 4 }}>Déposé à l'instant</div></div>
              {done && <Select value={kind} onChange={v => reKind(v as DocKind)} width={220} options={(Object.keys(KIND_LABEL) as DocKind[]).map(k => ({ v: k, label: KIND_LABEL[k] }))} />}
            </div>
          )}

          {step >= 0 && !done && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 4px" }}>
              {STEPS.map((s, i) => (
                <div key={s} style={{ display: "flex", alignItems: "center", gap: 8, ...txt.bodyS, color: step > i ? T.g500 : step === i ? T.ai500 : T.n700 }}>
                  <Icon n={step > i ? "check-circle" : step === i ? "sparkle" : "circle-dashed"} size={16} color={step > i ? T.g500 : step === i ? T.ai500 : T.n700} />{s}{step === i && "…"}
                </div>))}
            </div>
          )}

          {done && data && (<>
            <AlertBlock type="AI" title={`${KIND_LABEL[kind]} reconnu · ${data.fields.length} champs extraits`}>
              {data.resume} Vérifiez les valeurs avant de valider : elles seront transcrites dans <b>{data.dest}</b>.
            </AlertBlock>
            {data.fields.some(f => f.warn || f.ok) && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Tag label={`${data.fields.length} champs extraits`} status="AI" size="Medium" icon="sparkle" />
                {data.fields.some(f => f.ok) && <Tag label={`${data.fields.filter(f => f.ok).length} contrôles de cohérence OK`} status="Success" size="Medium" icon="check-circle" />}
                {data.fields.some(f => f.warn) && <Tag label={`${data.fields.filter(f => f.warn).length} incohérence${data.fields.filter(f => f.warn).length > 1 ? "s" : ""} à vérifier`} status="Warning" size="Medium" icon="warning" />}
              </div>)}
            {Array.from(new Set(data.fields.map(f => f.group || ""))).map(g => (
              <div key={g} style={{ background: T.n200, borderRadius: 8, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                {g && <div style={{ ...txt.bodySB }}>{g}</div>}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  {data.fields.map((f, i) => (f.group || "") !== g ? null : (
                    <div key={f.k} style={{ gridColumn: f.warn || f.v.length > 34 ? "1 / -1" : undefined }}>
                      <Input label={f.k} value={f.v} onChange={v => setField(i, v)} status={f.warn ? "Warning" : f.ok ? "Valid" : "AI"} subtext={f.warn || f.ok || "Extrait par Marius IA"} />
                    </div>))}
                </div>
              </div>))}
          </>)}
        </div>

        <div style={{ borderTop: `1px solid ${T.n500}`, padding: "16px 24px", display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button size="Small" aspect="Outline" label="Annuler" onClick={onClose} />
          {done && data && <Button size="Small" aspect="Plain" icon="sparkle" label="Valider et transcrire" onClick={() => onValidate({ name: data.name, type: KIND_TYPE[kind], by: data.by, montant: data.montant, kind, fields: data.fields, dest: data.dest })} />}
        </div>
      </div>
    </div>
  );
}
