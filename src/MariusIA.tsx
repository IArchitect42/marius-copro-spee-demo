// Marius IA : assistant de démonstration (bouton fixe en bas à droite, sur toutes les vues).
// Réponses et lecture de documents SIMULÉES (pas de modèle IA branché) : scénarios écrits pour la démo.
// Champs extraits des devis et factures alignés sur la base TDCM « Données issues des devis et factures artisans ».
import React, { useEffect, useRef, useState } from "react";
import { T, F, txt, Icon, Button, Tag, fmtE } from "./ds";

type Field = { k: string; v: string; warn?: boolean };
type Msg = { id: number; from: "me" | "ia"; text?: string; file?: { name: string; size: number }; fields?: Field[]; title?: string; actions?: string[]; chips?: string[] };

const params = () => new URLSearchParams(window.location.search);
const ctx = () => { const p = params(); return { vue: p.get("vue") || "amo", page: p.get("page") || "", onglet: p.get("onglet") || "" }; };

const SUGG: Record<string, string[]> = {
  light: ["Où en est le jalon 2 ?", "Quelles pièces manquent pour le SPEE ?", "Qui n'a pas répondu à l'enquête sociale ?"],
  spee: ["Quelles copros ont une alerte ?", "Besoin de trésorerie le mois prochain ?", "Où en est la Résidence Vauban ?", "Prépare le reporting Région"],
  amo: ["Où en est le dossier ?", "Quel est le reste à charge ?", "Qui n'a pas répondu à l'enquête sociale ?", "Prépare l'appel de fonds n°3"],
  syndic: ["Quelles factures dois-je valider ?", "Prochaine AG ?", "Montant du prochain appel de fonds ?"],
  conseil: ["Résume la prochaine AG", "Où en sont les travaux ?", "Quel est le reste à charge de la copro ?"],
  copro: ["Combien vais-je payer ?", "Ai-je droit à l'éco-PTZ ?", "Quand se terminent les travaux ?"],
  moe: ["Quels ordres de service sont en attente ?", "Prochaine réunion de chantier ?"],
  financeur: ["Demandes à instruire ?", "Encours sur la Résidence Vauban ?"],
};

function answer(q: string, vue: string): Msg {
  const s = q.toLowerCase(); const id = Date.now();
  const has = (...w: string[]) => w.some(x => s.includes(x));
  if (has("jalon", "pièces manquent", "pieces manquent")) return { id, from: "ia", text: "Jalon 2 · Programme : 3 éléments sur 4. Il manque les attestations RGE des entreprises. Dès qu'elles sont déposées, vous pourrez transmettre le jalon au SPEE.", actions: ["Ouvrir le parcours qualité"] };
  if (has("alerte")) return { id, from: "ia", text: "18 copropriétés ont une alerte ouverte. Les plus urgentes :\n• Résidence Vauban (Lille) : facture THERMIS BTP à valider\n• 4 dossiers : pièces de l'enquête sociale manquantes\n• 3 dossiers : retard sur le jalon qualité 2\nJe peux filtrer le portefeuille sur ces dossiers.", actions: ["Filtrer le portefeuille", "Exporter la liste"] };
  if (has("trésorerie", "tresorerie", "mois prochain")) return { id, from: "ia", text: "Projection de janvier 2027, tout le portefeuille :\n• factures à payer : environ 520 000 €\n• aides attendues : environ 310 000 €\n• appels de fonds : environ 105 000 €\nBesoin net de préfinancement : environ 60 000 €, porté surtout par 3 chantiers en MOD directe.", actions: ["Voir la trésorerie"] };
  if (has("reporting", "région", "region")) return { id, from: "ia", text: "Je prépare l'export Région : 80 copropriétés, logements, travaux engagés et avancement par territoire. Les indicateurs PAI SDFR et ESMA REE restent à définir avec vous : je les laisse en colonnes vides.", actions: ["Télécharger le brouillon (CSV)"] };
  if (has("reste à charge", "reste a charge", "rac")) return { id, from: "ia", text: `Résidence Vauban : travaux ${fmtE(290950)} TTC, aides collectives ${fmtE(189142)} (MaPrimeRénov' Copro, bonus passoire, CEE via le SPEE, prime MEL). Reste à charge collectif : ${fmtE(101808)}, réparti par tantièmes, avant aides individuelles et éco-PTZ.` };
  if (has("combien vais-je", "payer", "mon financement")) return { id, from: "ia", text: "Lot 1 (182 tantièmes) : votre quote-part est d'environ 8 940 €. Avec la prime individuelle de 3 000 € (ménage très modeste), il reste environ 5 940 €, finançables par un éco-PTZ sur 15 ans, soit environ 33 € par mois. Ces montants sont à confirmer par votre accompagnateur." };
  if (has("éco-ptz", "eco-ptz", "ecoptz", "ptz")) return { id, from: "ia", text: "Éco-PTZ : jusqu'à 50 000 € par logement pour une rénovation globale. Sur la Résidence Vauban, 9 lots sur 12 demandent à financer leur quote-part ; 3 dossiers attendent encore des pièces. Le calcul se fait automatiquement à partir du reste à charge éligible, avec saisie manuelle possible.", actions: ["Ouvrir le financement par lot"] };
  if (has("enquête", "enquete", "répondu", "repondu")) return { id, from: "ia", text: "Enquête sociale : 9 réponses sur 12. En attente : Mme Duquesnoy (lot 6, relancée), Mme Wattebled (lot 8, logement vacant), M. Dewulf (lot 11, relancé). Je peux préparer une relance personnalisée.", actions: ["Préparer la relance"] };
  if (has("appel de fonds")) return { id, from: "ia", text: "Appel de fonds n°3 préparé à partir des factures validées : situation n°2 de THERMIS BTP (ITE, 60 %) et acompte d'ÉNERGO+ (PAC, 30 %). Montant à appeler : 18 420 €, ventilé par tantièmes. Il reste à le relire et à l'envoyer au syndic.", actions: ["Voir le brouillon", "Envoyer au syndic"] };
  if (has("facture") && has("valider")) return { id, from: "ia", text: "1 facture à valider : THERMIS BTP, situation n°2, ITE façades, 60 % d'avancement, 26 100 € HT. Elle est conforme au marché, avenant de 2 400 € inclus.", actions: ["Ouvrir la facture"] };
  if (has("ag")) return { id, from: "ia", text: "Prochaine AG : 25 juin, ordre du jour en préparation. Résolutions prévues : point d'avancement du chantier (phase 5), approbation de l'appel de fonds n°3, information sur le planning de réception." };
  if (has("où en est", "ou en est", "avancement", "travaux", "termin")) return { id, from: "ia", text: "Résidence Vauban, phase 5 (chantier) :\n• combles : réceptionnés\n• ITE façades : 60 %\n• PAC : démarrée, acompte de 30 % payé\n• VMC et calorifugeage : à venir\nAvancement global facturé : 47 % des travaux, 63 % des honoraires. Fin prévue : mai 2026.", actions: ["Ouvrir le RECAP"] };
  if (has("demande", "instruire")) return { id, from: "ia", text: "3 demandes de financement à instruire, dont 1 avec une pièce manquante (état de la trésorerie du syndicat)." };
  if (has("ordre de service", "os ", "réunion de chantier", "reunion")) return { id, from: "ia", text: "Ordres de service : VMC double flux (VENTIL PRO) et calorifugeage (RÉSEAUX THERM) restent à émettre. Prochaine réunion de chantier : mardi 14 avril, 18 h." };
  return { id, from: "ia", text: vue === "spee"
    ? "Je peux répondre sur votre portefeuille, l'avancement d'un dossier, la trésorerie ou le reporting, et lire un document que vous déposez (devis, facture, audit, avis d'imposition)."
    : "Je peux répondre sur ce dossier (avancement, financement, enquête sociale, AG, factures) et lire un document que vous déposez (devis, facture, audit énergétique, avis d'imposition).", chips: SUGG[vue] || SUGG.amo };
}

function readDoc(file: File): Msg {
  const n = file.name.toLowerCase(); const id = Date.now() + 1;
  const ttl = (t: string) => `${t} · ${file.name}`;
  if (n.includes("facture") || n.includes("situation")) return { id, from: "ia", title: ttl("Facture artisan"), fields: [
    { k: "Entreprise (raison sociale)", v: "THERMIS BTP" }, { k: "SIRET", v: "812 345 678 00021" }, { k: "E-mail entreprise", v: "contact@thermis-btp.fr" },
    { k: "Adresse du projet", v: "24 rue Gambetta, 59000 Lille" }, { k: "Poste 1 · intitulé", v: "Isolation thermique par l'extérieur" },
    { k: "Poste 1 · description", v: "Situation n°3, façades Est et Sud" }, { k: "Montant HT", v: "17 400,00 €" }, { k: "Montant TTC", v: "18 357,00 €" },
    { k: "Avancement déclaré", v: "80 % (marché : 60 % au dernier PV)", warn: true } ],
    text: "Rattachée au lot « ITE façades » du marché THERMIS BTP. Point d'attention : l'avancement déclaré dépasse le dernier PV de chantier.", actions: ["Rattacher au lot ITE", "Générer le certificat de paiement", "Demander un PV à jour"] };
  if (n.includes("devis")) return { id, from: "ia", title: ttl("Devis artisan"), fields: [
    { k: "Entreprise (raison sociale)", v: "VENTIL PRO" }, { k: "SIRET", v: "903 112 457 00014" }, { k: "Qualification", v: "RGE QualiPAC / Ventilation, valide jusqu'au 03/2027" },
    { k: "Adresse du projet", v: "24 rue Gambetta, 59000 Lille" }, { k: "Poste 1 · intitulé", v: "VMC double flux collective" },
    { k: "Poste 1 · description", v: "Centrale double flux, gaines en combles, 12 logements" }, { k: "Montant HT", v: "32 000,00 €" }, { k: "Montant TTC", v: "33 760,00 € (TVA 5,5 %)" } ],
    text: "Le devis est cohérent avec le programme de travaux voté (poste VMC). Je peux l'ajouter à l'analyse des offres.", actions: ["Ajouter à l'analyse des offres", "Comparer aux autres devis"] };
  if (n.includes("audit") || n.includes("dpe") || n.includes("dtg")) return { id, from: "ia", title: ttl("Audit énergétique"), fields: [
    { k: "Étiquette avant travaux", v: "E · 245 kWhEP/m².an" }, { k: "Étiquette après scénario retenu", v: "C · 118 kWhEP/m².an" }, { k: "Gain énergétique", v: "− 52 %" },
    { k: "Émissions GES", v: "52 → 14 kgCO₂/m².an" }, { k: "Scénarios", v: "3 (dont 1 rénovation globale)" }, { k: "Bureau d'études", v: "Nord Énergie Conseil" } ],
    text: "Données transcrites dans la fiche copropriété (onglet Projet). Le gain dépasse 35 % : éligible à MaPrimeRénov' Copropriété.", actions: ["Mettre à jour la fiche", "Voir l'onglet Projet"] };
  if (n.includes("impot") || n.includes("impôt") || n.includes("avis") || n.includes("revenu")) return { id, from: "ia", title: ttl("Avis d'imposition"), fields: [
    { k: "Revenu fiscal de référence", v: "21 480 €" }, { k: "Nombre de parts", v: "1,5" }, { k: "Personnes au foyer", v: "2" }, { k: "Année des revenus", v: "2025" },
    { k: "Catégorie de ressources", v: "Très modeste (TMO)" } ],
    text: "Catégorie déterminée selon les plafonds ANAH (hors Île-de-France). La donnée alimente l'enquête sociale et le plan de financement individuel.", actions: ["Rattacher au lot", "Mettre à jour l'enquête sociale"] };
  return { id, from: "ia", title: ttl("Document reçu"), fields: [{ k: "Type", v: file.type || "inconnu" }, { k: "Taille", v: `${Math.max(1, Math.round(file.size / 1024))} Ko` }],
    text: "Je n'ai pas reconnu le type de document. S'agit-il d'un devis, d'une facture, d'un audit énergétique ou d'un avis d'imposition ?", chips: ["C'est un devis", "C'est une facture", "C'est un audit"] };
}

export default function MariusIA() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [q, setQ] = useState(""); const [busy, setBusy] = useState<string | null>(null); const [drag, setDrag] = useState(false);
  const endRef = useRef<HTMLDivElement>(null); const fileRef = useRef<HTMLInputElement>(null);
  const { vue } = ctx();
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);
  useEffect(() => {
    if (open && msgs.length === 0) setMsgs([{ id: 1, from: "ia", text: vue === "spee" ? "Bonjour, je suis Marius IA. Posez-moi une question sur votre portefeuille ou déposez un document : je le lis et je pré-remplis le dossier." : "Bonjour, je suis Marius IA. Posez-moi une question sur la Résidence Vauban ou déposez un document : je le lis et je pré-remplis le dossier.", chips: SUGG[vue] || SUGG.amo }]);
  }, [open]);
  const ask = (text: string) => {
    if (!text.trim() || busy) return;
    const fake = /^c'est un (devis|facture|audit)/i.exec(text);
    setMsgs(m => [...m, { id: Date.now(), from: "me", text }]); setQ(""); setBusy("Marius IA rédige sa réponse");
    setTimeout(() => { setMsgs(m => [...m, fake ? readDoc(new File([""], `${fake[1].toLowerCase()}.pdf`)) : answer(text, vue)]); setBusy(null); }, 900);
  };
  const upload = (f?: File | null) => {
    if (!f || busy) return;
    setMsgs(m => [...m, { id: Date.now(), from: "me", file: { name: f.name, size: f.size } }]); setBusy("Marius IA lit le document");
    setTimeout(() => { setMsgs(m => [...m, readDoc(f)]); setBusy(null); }, 1800);
  };
  return (
    <>
      {!open && (
        <button onClick={() => setOpen(true)} title="Marius IA" style={{ position: "fixed", right: 24, bottom: 24, zIndex: 1000, height: 56, padding: "0 20px 0 16px", borderRadius: 28, border: "none", cursor: "pointer",
          background: T.ai500, color: T.n50, display: "flex", alignItems: "center", gap: 8, boxShadow: "0 2px 1px rgba(0,0,0,0.25)", fontFamily: F.title, fontWeight: 700, fontSize: 16 }}>
          <Icon n="sparkle" size={24} />Marius IA
        </button>
      )}
      {open && (
        <div onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={e => { e.preventDefault(); setDrag(false); upload(e.dataTransfer.files?.[0]); }}
          style={{ position: "fixed", right: 24, bottom: 24, zIndex: 1000, width: 420, height: "min(640px, calc(100vh - 48px))", background: T.white, border: `1px solid ${T.n600}`, borderRadius: 8,
            boxShadow: "0 1px 3px rgba(0,0,0,0.25)", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: F.body }}>
          <div style={{ height: 56, display: "flex", alignItems: "center", gap: 8, padding: "0 8px 0 16px", background: T.ai50, borderBottom: `1px solid ${T.n300}` }}>
            <Icon n="sparkle" size={24} color={T.ai500} />
            <span style={{ ...txt.h4, fontSize: 16, color: T.ai500, flex: 1 }}>Marius IA</span>
            <Tag label="Démo" status="AI" />
            <Button size="Small" aspect="Neutral" icon="trash" title="Effacer la conversation" onClick={() => setMsgs([])} />
            <Button size="Small" aspect="Neutral" icon="x" title="Fermer" onClick={() => setOpen(false)} />
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12, background: drag ? T.p50 : T.white, outline: drag ? `1px dashed ${T.p500}` : "none", outlineOffset: -8 }}>
            {msgs.map(m => m.from === "me" ? (
              <div key={m.id} style={{ alignSelf: "flex-end", maxWidth: "85%", background: T.p500, borderRadius: 8, padding: "8px 12px", ...txt.bodyS, color: T.n50, lineHeight: "20px" } as any}>
                {m.file ? <span style={{ display: "flex", alignItems: "center", gap: 8 }}><Icon n="file-pdf" size={24} color={T.n50} /><span><b>{m.file.name}</b><br /><span style={{ fontSize: 10 }}>{Math.max(1, Math.round(m.file.size / 1024))} Ko</span></span></span> : m.text}
              </div>
            ) : (
              <div key={m.id} style={{ alignSelf: "flex-start", maxWidth: "92%", display: "flex", flexDirection: "column", gap: 8 }}>
                {m.title && <div style={{ background: T.ai50, borderRadius: 4, padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Icon n="file-magnifying-glass" size={16} color={T.ai500} /><span style={{ ...txt.bodySB, color: T.ai500 }}>{m.title}</span></div>
                  {m.fields?.map(f => (
                    <div key={f.k} style={{ display: "flex", justifyContent: "space-between", gap: 12, borderTop: `1px solid ${T.n300}`, paddingTop: 4 }}>
                      <span style={{ ...txt.bodyXS, fontSize: 12, lineHeight: "16px", color: T.n800 }}>{f.k}</span>
                      <span style={{ ...txt.bodyS, fontWeight: 700, textAlign: "right", color: f.warn ? T.o500 : T.p900 }}>{f.v}</span>
                    </div>))}
                  <span style={{ ...txt.bodyXS }}>Données extraites à vérifier avant validation.</span>
                </div>}
                {m.text && <div style={{ background: T.n100, borderRadius: 8, padding: "8px 12px", ...txt.bodyS, lineHeight: "20px", whiteSpace: "pre-line" }}>{m.text}</div>}
                {m.actions && <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{m.actions.map((a, i) => <Button key={a} size="Tiny" aspect={i === 0 ? "Plain" : "Outline"} label={a} onClick={() => setMsgs(ms => [...ms, { id: Date.now(), from: "ia", text: `Démo : « ${a} » sera branché sur le dossier dans Marius.` }])} />)}</div>}
                {m.chips && <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{m.chips.map(c => <button key={c} onClick={() => ask(c)} style={{ height: 24, padding: "0 12px", borderRadius: 12, border: `1px solid ${T.ai500}`, background: T.white, color: T.ai500, fontFamily: F.body, fontSize: 12, cursor: "pointer" }}>{c}</button>)}</div>}
              </div>
            ))}
            {busy && <div style={{ ...txt.bodyS, color: T.ai500, display: "flex", alignItems: "center", gap: 8 }}><Icon n="sparkle" size={16} color={T.ai500} />{busy}…</div>}
            <div ref={endRef} />
          </div>
          <div style={{ borderTop: `1px solid ${T.n300}`, padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.txt,.doc,.docx" style={{ display: "none" }} onChange={e => { upload(e.target.files?.[0]); e.target.value = ""; }} />
              <Button size="Medium" aspect="Outline" icon="paperclip" title="Déposer un document" onClick={() => fileRef.current?.click()} />
              <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => { if (e.key === "Enter") ask(q); }} placeholder="Posez votre question…"
                style={{ flex: 1, height: 40, borderRadius: 4, border: `1px solid ${T.ai200}`, boxShadow: "inset 0 1px 3px rgba(0,0,0,0.25)", padding: "0 12px", fontFamily: F.body, fontSize: 14 }} />
              <Button size="Medium" aspect="Plain" icon="paper-plane-tilt" title="Envoyer" onClick={() => ask(q)} disabled={!q.trim()} />
            </div>
            <span style={{ ...txt.bodyXS }}>Glissez un devis, une facture, un audit ou un avis d'imposition dans la fenêtre. Réponses simulées pour la démo.</span>
          </div>
        </div>
      )}
    </>
  );
}
