// Profil « SPEE Hauts-de-France (compte réseau) » : réponses aux besoins exprimés par le SPEE
// (besoins exprimés par l'équipe copro du SPEE lors des échanges et sur l'analyse des outils).
// Données fictives de démonstration.
import React, { useEffect, useMemo, useState } from "react";
import CreerCopro from "./CreerCopro";
import { DEMANDES_INIT, DemandesListe, DemandeFiche, Demande } from "./DemandeFiche";
import { T, F, txt, fmtE, Icon, Button, Tag, BlockWrapper, KeyValue, AlertBlock, Segmented, TabMenu, Input, Select, Checkbox, th, td, Progress, MenuEntry, downloadCSV, TagStatus } from "./ds";

type Page = "nouvelle" | "portefeuille" | "recap" | "qualification" | "financement" | "tresorerie" | "operateurs" | "reporting" | "coconstruction";

// ── Données fictives ───────────────────────────────────────────────────
function rng(seed: number) { return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
const VILLES: [string, string][] = [["Lille", "MEL"], ["Roubaix", "MEL"], ["Tourcoing", "MEL"], ["Villeneuve-d'Ascq", "MEL"], ["Lens", "Pas-de-Calais"], ["Arras", "Pas-de-Calais"], ["Calais", "Pas-de-Calais"], ["Boulogne-sur-Mer", "Pas-de-Calais"], ["Douai", "Nord"], ["Valenciennes", "Nord"], ["Dunkerque", "Nord"], ["Maubeuge", "Nord"], ["Amiens", "Somme"], ["Abbeville", "Somme"], ["Beauvais", "Oise"], ["Compiègne", "Oise"], ["Creil", "Oise"], ["Saint-Quentin", "Aisne"], ["Laon", "Aisne"]];
const NOMS = ["Les Tilleuls", "Le Beffroi", "Les Hortensias", "Le Parc", "Les Acacias", "Jean Jaurès", "Les Peupliers", "La Citadelle", "Le Belvédère", "Les Glycines", "Victor Hugo", "Le Square", "Les Marronniers", "La Roseraie", "Le Cèdre", "Les Charmilles", "Le Moulin", "Pasteur", "Les Iris", "La Colline"];
export const PHASES = ["0 · Identification", "1 · Diagnostic", "2 · Études", "3 · AG & dépôt", "4 · Montage financier", "5 · Chantier", "6 · Réception", "7 · Post-travaux"];
type Copro = { id: string; nom: string; ville: string; terr: string; lots: number; mode: "Full" | "Solo"; operateur: string; co: string; phase: number; avTravaux: number; avHono: number; budget: number; rac: number; dpe: string; alerte?: string; vauban?: boolean; light?: boolean };
const COS = ["Claire V.", "Mathieu P.", "Thomas R.", "Inès B.", "Karim L."];
export const COPROS: Copro[] = (() => {
  const r = rng(42); const out: Copro[] = [];
  out.push({ id: "C001", nom: "La Résidence Vauban", ville: "Lille", terr: "MEL", lots: 12, mode: "Full", operateur: "SPEE (MOD directe)", co: "Claire V.", phase: 5, avTravaux: 47, avHono: 63, budget: 290950, rac: 101808, dpe: "E → C", alerte: "Facture THERMIS à valider", vauban: true });
  for (let i = 2; i <= 80; i++) {
    const [ville, terr] = VILLES[Math.floor(r() * VILLES.length)];
    const solo = i % 2 === 0; const phase = Math.floor(r() * 8); const lots = 8 + Math.floor(r() * 60);
    const budget = Math.round(lots * (18000 + r() * 14000) / 100) * 100;
    const avT = phase < 5 ? 0 : phase === 5 ? Math.round(10 + r() * 80) : 100;
    const avH = Math.min(100, Math.round(phase * 12 + r() * 10));
    const alerts = ["Pièces enquête sociale manquantes", "Retard jalon qualité 2", "Appel de fonds en attente", "Éco-PTZ : dossier incomplet", "Besoin de trésorerie > 50 k€"];
    out.push({ id: `C${String(i).padStart(3, "0")}`, nom: `Résidence ${NOMS[i % NOMS.length]}${i > 20 ? " " + (Math.floor(i / 20) + 1) : ""}`, ville, terr, lots, mode: solo ? "Solo" : "Full",
      operateur: solo ? (r() < 0.55 ? "Urbanis" : "SOLIHA") : "SPEE (MOD directe)", co: solo ? "—" : COS[Math.floor(r() * COS.length)], phase, avTravaux: avT, avHono: avH,
      budget, rac: Math.round(budget * (0.25 + r() * 0.2)), dpe: ["F → C", "E → C", "G → D", "E → B", "F → D"][Math.floor(r() * 5)], alerte: r() < 0.22 ? alerts[Math.floor(r() * alerts.length)] : undefined });
  }
  Object.assign(out[1], { nom: "Résidence Les Tilleuls", ville: "Roubaix", terr: "MEL", lots: 12, budget: 290950, rac: 101808, mode: "Solo", operateur: "Urbanis", co: "—", phase: 5, avTravaux: 35, avHono: 58, dpe: "F → C", alerte: "Jalon qualité 2 à transmettre", light: true });
  return out;
})();

// ── Shell de la vue ───────────────────────────────────────────────────
export type Profile = { mode: string; ini: string; bg: string; label: string; sub: string };
export default function SpeeView({ profiles, onSwitch }: { profiles: Profile[]; onSwitch: (mode: string) => void }) {
  const [page, setPage] = useState<Page>(() => (new URLSearchParams(window.location.search).get("page") || "portefeuille") as Page);
  const [menu, setMenu] = useState(false);
  const [selCopro, setSelCopro] = useState("C001");
  const MENU: { section: string; items: { p: Page; label: string; icon: string; badge?: string }[] }[] = [
    { section: "MON RÉSEAU", items: [
      { p: "portefeuille", label: "Portefeuille", icon: "buildings" },
      { p: "nouvelle", label: "Nouvelle copro", icon: "plus-circle", badge: "API" },
      { p: "recap", label: "RECAP avancement", icon: "list-checks" },
      { p: "qualification", label: "Qualification", icon: "funnel" },
      { p: "financement", label: "Financement copros", icon: "piggy-bank" },
      { p: "tresorerie", label: "Trésorerie", icon: "vault" },
    ] },
    { section: "PILOTAGE", items: [
      { p: "operateurs", label: "Opérateurs & qualité", icon: "users-four" },
      { p: "reporting", label: "Reporting Région", icon: "chart-line" },
    ] },
    { section: "AVEC VOUS", items: [{ p: "coconstruction", label: "À co-construire", icon: "handshake", badge: "Atelier" }] },
  ];
  const go = (p: Page, copro?: string) => { if (copro) setSelCopro(copro); setPage(p); };
  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: F.body, background: T.white }}>
      <nav style={{ width: 280, flexShrink: 0, background: T.p50, borderRight: `1px solid ${T.n500}`, display: "flex", flexDirection: "column", overflowY: "auto" }}>
        <div style={{ height: 72, display: "flex", alignItems: "center", padding: "0 20px", borderBottom: `1px solid ${T.n500}`, background: T.white }}>
          <img src={`${import.meta.env.BASE_URL}assets/logo-name.svg`} alt="Marius" style={{ height: 36 }} />
        </div>
        <div style={{ padding: "16px 20px 4px", display: "flex", alignItems: "center", gap: 8 }}>
          <Tag label="Compte réseau" status="Dark" size="Medium" icon="share-network" />
        </div>
        {MENU.map(s => (
          <div key={s.section}>
            <div style={{ ...txt.menuSub, padding: "20px 0 8px 20px" }}>{s.section}</div>
            {s.items.map(it => <MenuEntry key={it.p} label={it.label} icon={it.icon} badge={it.badge} selected={page === it.p} onClick={() => setPage(it.p)} />)}
          </div>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ padding: 16, borderTop: `1px solid ${T.n500}`, position: "relative" }}>
          {menu && (
            <div style={{ position: "absolute", bottom: "calc(100% + 4px)", left: 12, width: 256, background: T.white, border: `1px solid ${T.n500}`, borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.25)", zIndex: 50, overflow: "hidden" }}>
              <div style={{ ...txt.bodyXS, padding: "8px 12px", textTransform: "uppercase", fontWeight: 700 }}>Basculer vers</div>
              {profiles.map(p => (
                <div key={p.mode} onClick={() => { setMenu(false); onSwitch(p.mode); }} style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 12px", cursor: "pointer", background: p.mode === "spee" ? T.b50 : T.white }}>
                  <span style={{ width: 30, height: 30, borderRadius: "50%", background: p.bg, color: T.white, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>{p.ini}</span>
                  <span><div style={{ ...txt.bodySB, fontSize: 12 }}>{p.label}</div><div style={{ ...txt.bodyXS }}>{p.sub}</div></span>
                </div>
              ))}
            </div>
          )}
          <div onClick={() => setMenu(!menu)} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <span style={{ width: 36, height: 36, borderRadius: "50%", background: T.p900, color: T.white, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12 }}>HDF</span>
            <span style={{ flex: 1 }}><div style={txt.bodySB}>SPEE Hauts-de-France</div><div style={txt.bodyXS}>Pôle copropriétés · Pass Copro</div></span>
            <Icon n="caret-up" size={16} color={T.p500} />
          </div>
        </div>
      </nav>
      <main style={{ flex: 1, overflowY: "auto", background: T.white }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 40px 64px", display: "flex", flexDirection: "column", gap: 32 }}>
          {page === "portefeuille" && <Portefeuille go={go} onOpenVauban={() => onSwitch("amo")} onOpenLight={() => onSwitch("light")} />}
          {page === "nouvelle" && <CreerCopro />}
          {page === "recap" && <Recap coproId={selCopro} setCopro={setSelCopro} />}
          {page === "qualification" && <Qualification go={go} />}
          {page === "financement" && <Financement />}
          {page === "tresorerie" && <Tresorerie />}
          {page === "operateurs" && <Operateurs />}
          {page === "reporting" && <Reporting />}
          {page === "coconstruction" && <CoConstruction />}
        </div>
      </main>
    </div>
  );
}

const PageTitle = ({ title, sub, right, demande }: { title: string; sub?: string; right?: React.ReactNode; demande?: string }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
    <div style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
      <div style={{ flex: 1 }}><h1 style={{ ...txt.h3, margin: 0 }}>{title}</h1>{sub && <div style={{ ...txt.bodyM, color: T.n800, marginTop: 4 }}>{sub}</div>}</div>{right}
    </div>
    {demande && <AlertBlock type="Neutral" title="Votre demande">{demande}</AlertBlock>}
  </div>
);
const Stat = ({ k, v, sub, tone }: { k: string; v: string; sub?: string; tone?: "warn" }) => (
  <div style={{ flex: 1, minWidth: 160, background: T.n50, border: `1px solid ${T.n600}`, borderRadius: 8, padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
    <span style={{ ...txt.bodyS, color: T.n800 }}>{k}</span>
    <span style={{ fontFamily: F.title, fontWeight: 700, fontSize: 24, lineHeight: "32px", color: tone === "warn" ? T.o500 : T.p900 }}>{v}</span>
    {sub && <span style={txt.bodyXS}>{sub}</span>}
  </div>
);
const phaseTag = (p: number): TagStatus => p >= 7 ? "Success" : p >= 5 ? "Info" : p >= 3 ? "Light" : "Grey";

// ── 1. Portefeuille ───────────────────────────────────────────────────
export function Portefeuille({ go, onOpenVauban, onOpenLight }: { go: (p: Page, c?: string) => void; onOpenVauban: () => void; onOpenLight?: () => void }) {
  const [q, setQ] = useState(""); const [mode, setMode] = useState<"all" | "Full" | "Solo">("all");
  const [terr, setTerr] = useState("all"); const [phase, setPhase] = useState("all"); const [alert, setAlert] = useState(false);
  const rows = COPROS.filter(c => (mode === "all" || c.mode === mode) && (terr === "all" || c.terr === terr) && (phase === "all" || String(c.phase) === phase) && (!alert || c.alerte)
    && (!q || (c.nom + c.ville + c.operateur + c.co).toLowerCase().includes(q.toLowerCase())));
  const terrs = Array.from(new Set(COPROS.map(c => c.terr)));
  const lots = COPROS.reduce((a, c) => a + c.lots, 0);
  const exp = () => downloadCSV("portefeuille-spee.csv", [["Réf", "Copropriété", "Ville", "Territoire", "Lots", "Mode", "Opérateur", "Chargé d'opération", "Phase", "Avancement travaux %", "Avancement honoraires %", "Budget TTC", "Reste à charge", "DPE", "Alerte"],
    ...rows.map(c => [c.id, c.nom, c.ville, c.terr, c.lots, c.mode, c.operateur, c.co, PHASES[c.phase], c.avTravaux, c.avHono, c.budget, c.rac, c.dpe, c.alerte || ""])]);
  return (<>
    <PageTitle title="Portefeuille copropriétés" sub="Vision agrégée des projets en MOD directe et sous pacte" right={<Button size="Small" aspect="Plain" icon="plus-circle" label="Nouvelle copropriété" onClick={() => go("nouvelle")} />} />
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
      <Stat k="Copropriétés actives" v="80" sub={`${lots.toLocaleString("fr-FR")} logements`} />
      <Stat k="MOD directe (Full)" v={String(COPROS.filter(c => c.mode === "Full").length)} sub="Équipes SPEE" />
      <Stat k="Sous pacte (Solo)" v={String(COPROS.filter(c => c.mode === "Solo").length)} sub="Urbanis · SOLIHA" />
      <Stat k="Chantiers en cours" v={String(COPROS.filter(c => c.phase === 5).length)} />
      <Stat k="Alertes" v={String(COPROS.filter(c => c.alerte).length)} tone="warn" sub="à traiter cette semaine" />
    </div>
    <BlockWrapper title="Copropriétés" icon="buildings" right={<Tag label={`${rows.length} affichées`} status="Light" size="Medium" />}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
        <Input label="Rechercher" value={q} onChange={setQ} placeholder="Nom, ville, opérateur, chargé d'opération…" width={300} />
        <Select label="Territoire" value={terr} onChange={setTerr} width={180} options={[{ v: "all", label: "Tous" }, ...terrs.map(t => ({ v: t, label: t }))]} />
        <Select label="Phase" value={phase} onChange={setPhase} width={200} options={[{ v: "all", label: "Toutes" }, ...PHASES.map((p, i) => ({ v: String(i), label: p }))]} />
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}><span style={txt.bodyS}>Mode</span>
          <div style={{ height: 32, display: "flex", alignItems: "center" }}><Segmented value={mode} onChange={setMode} options={[{ v: "all", label: "Tous" }, { v: "Full", label: "MOD directe" }, { v: "Solo", label: "Sous pacte" }]} /></div></div>
        <div style={{ height: 32, display: "flex", alignItems: "center" }}><Checkbox checked={alert} onChange={setAlert} label="Avec alerte" /></div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: T.n100, borderRadius: 8, padding: "8px 12px" }}>
        <span style={txt.bodyS}>{rows.length} copropriétés · {fmtE(rows.reduce((a, c) => a + c.budget, 0))} de travaux · {fmtE(rows.reduce((a, c) => a + c.rac, 0))} de reste à charge</span>
        <Button size="Tiny" aspect="Outline" icon="download-simple" label="Extraire (CSV)" onClick={exp} />
      </div>
      <div style={{ overflowX: "auto", maxHeight: 520, overflowY: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ position: "sticky", top: 0 }}><tr>{["Copropriété", "Mode", "Phase", "Avancement travaux", "Honoraires", "Reste à charge", "Alerte", ""].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>{rows.map(c => (
            <tr key={c.id} style={{ background: c.vauban || c.light ? T.b50 : T.white }}>
              <td style={td}><div style={{ fontWeight: 700 }}>{c.nom}</div><div style={txt.bodyXS}>{c.ville} · {c.lots} lots · DPE {c.dpe}</div></td>
              <td style={td}><Tag label={c.mode === "Full" ? "Full · MOD" : `Solo · ${c.operateur}`} status={c.mode === "Full" ? "Dark" : "Light"} /><div style={{ ...txt.bodyXS, marginTop: 4 }}>{c.co !== "—" ? `CO : ${c.co}` : ""}</div></td>
              <td style={td}><Tag label={PHASES[c.phase]} status={phaseTag(c.phase)} /></td>
              <td style={td}><Progress pct={c.avTravaux} /></td>
              <td style={td}><Progress pct={c.avHono} color={T.p300} /></td>
              <td style={{ ...td, whiteSpace: "nowrap" }}>{fmtE(c.rac)}</td>
              <td style={td}>{c.alerte ? <Tag label={c.alerte} status="Warning" icon="warning" /> : <span style={txt.bodyXS}>—</span>}</td>
              <td style={{ ...td, whiteSpace: "nowrap" }}>
                <span style={{ display: "inline-flex", gap: 4 }}>
                  <Button size="Tiny" aspect="Outline" icon="list-checks" title="RECAP avancement" onClick={() => go("recap", c.id)} />
                  {c.vauban && <Button size="Tiny" aspect="Plain" label="Ouvrir le dossier" iconRight="arrow-right" onClick={onOpenVauban} />}
                  {c.light && <Button size="Tiny" aspect="Outline" label="Vue Urbanis (Light)" iconRight="arrow-right" onClick={onOpenLight} />}
                </span>
              </td>
            </tr>))}</tbody>
        </table>
      </div>
    </BlockWrapper>
  </>);
}

// ── 2. RECAP avancement par lot (travaux + honoraires) ───────────────
type LotRecap = { lot: string; type: "Travaux" | "Honoraires"; titulaire: string; marche: number; avenants: number; facture: number; derniere?: string; ia?: boolean };
function recapFor(c: Copro): LotRecap[] {
  if (c.vauban) return [
    { lot: "ITE façades", type: "Travaux", titulaire: "THERMIS BTP", marche: 87000, avenants: 2400, facture: 53640, derniere: "Situation n°2 · 11/04", ia: true },
    { lot: "Isolation combles", type: "Travaux", titulaire: "ISOL'AIR", marche: 43000, avenants: 0, facture: 43000, derniere: "DGD · 02/04" },
    { lot: "PAC air/eau collective", type: "Travaux", titulaire: "ÉNERGO+", marche: 76000, avenants: 0, facture: 22800, derniere: "Acompte 30 % · 18/05", ia: true },
    { lot: "VMC double flux", type: "Travaux", titulaire: "VENTIL PRO", marche: 32000, avenants: 0, facture: 0 },
    { lot: "Calorifugeage réseaux", type: "Travaux", titulaire: "RÉSEAUX THERM", marche: 11000, avenants: 0, facture: 0 },
    { lot: "Honoraires AMO", type: "Honoraires", titulaire: "SPEE HDF", marche: 14000, avenants: 0, facture: 9800, derniere: "Phase 4 · 30/03" },
    { lot: "Honoraires maîtrise d'œuvre", type: "Honoraires", titulaire: "Atelier Tripode", marche: 12615, avenants: 0, facture: 6940, derniere: "DET 40 % · 15/04" },
    { lot: "Redevance Pass Copro", type: "Honoraires", titulaire: "SPEE HDF", marche: 3600, avenants: 0, facture: 1800, derniere: "Échéance 2/4 · 01/04" },
    { lot: "Diagnostics & BET", type: "Honoraires", titulaire: "Nord Énergie Conseil", marche: 6800, avenants: 0, facture: 6800, derniere: "Solde · 12/12" },
  ];
  const r = rng(c.lots * 97 + c.phase); const base = c.budget / 1.055;
  const parts: [string, number][] = [["ITE façades", 0.32], ["Menuiseries", 0.16], ["Chauffage collectif", 0.24], ["Ventilation", 0.1], ["Toiture-terrasse", 0.1]];
  const tav = c.avTravaux / 100;
  const out: LotRecap[] = parts.map(([l, w]) => { const m = Math.round(base * w * 0.92); const f = Math.min(1, Math.max(0, tav + (r() - 0.5) * 0.4)); return { lot: l, type: "Travaux" as const, titulaire: ["BATI NORD", "OPALE BTP", "ARTOIS ÉNERGIE", "PICARDIE CLIM", "FLANDRES TOITURES"][Math.floor(r() * 5)], marche: m, avenants: 0, facture: c.phase >= 5 ? Math.round(m * (c.phase > 5 ? 1 : f)) : 0 }; });
  const h = c.avHono / 100;
  out.push({ lot: "Honoraires AMO", type: "Honoraires", titulaire: c.mode === "Full" ? "SPEE HDF" : c.operateur, marche: Math.round(base * 0.05), avenants: 0, facture: Math.round(base * 0.05 * h) });
  out.push({ lot: "Honoraires maîtrise d'œuvre", type: "Honoraires", titulaire: "MOE", marche: Math.round(base * 0.045), avenants: 0, facture: Math.round(base * 0.045 * Math.max(0, h - 0.1)) });
  out.push({ lot: "Redevance Pass Copro", type: "Honoraires", titulaire: "SPEE HDF", marche: c.lots * 300, avenants: 0, facture: Math.round(c.lots * 300 * Math.min(1, h + 0.1)) });
  return out;
}
export function Recap({ coproId, setCopro }: { coproId: string; setCopro: (id: string) => void }) {
  const c = COPROS.find(x => x.id === coproId)!;
  const [vue, setVue] = useState<"all" | "Travaux" | "Honoraires">("all");
  const all = recapFor(c); const rows = all.filter(r => vue === "all" || r.type === vue);
  const sum = (rs: LotRecap[]) => { const m = rs.reduce((a, r) => a + r.marche + r.avenants, 0); const f = rs.reduce((a, r) => a + r.facture, 0); return { m, f, pct: m ? f / m * 100 : 0 }; };
  const tot = sum(rows), trav = sum(all.filter(r => r.type === "Travaux")), hon = sum(all.filter(r => r.type === "Honoraires"));
  const exp = () => downloadCSV(`recap-${c.id}.csv`, [["Lot", "Type", "Titulaire", "Marché HT", "Avenants HT", "Montant total HT", "Facturé HT", "% avancement", "Reste à facturer HT", "Dernière facture"],
    ...rows.map(r => [r.lot, r.type, r.titulaire, r.marche, r.avenants, r.marche + r.avenants, r.facture, Math.round(r.facture / (r.marche + r.avenants) * 100), r.marche + r.avenants - r.facture, r.derniere || ""])]);
  return (<>
    <PageTitle title="RECAP avancement" sub={`${c.nom} · ${c.ville} · ${c.lots} lots · ${c.mode === "Full" ? "MOD directe" : "Sous pacte " + c.operateur}`}
      right={<Select value={c.id} onChange={setCopro} width={320} options={COPROS.map(x => ({ v: x.id, label: `${x.nom} (${x.ville})` }))} />}
      demande="Un tableau RECAP en chapeau pour suivre l'avancement en pourcentage global et par lot, pour les travaux et tous les honoraires (onglet RECAP du fichier de suivi de facturation). La redevance Pass Copro est suivie comme un lot." />
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
      <Stat k="Avancement global" v={`${Math.round(sum(all).pct)} %`} sub={`${fmtE(sum(all).f)} facturés sur ${fmtE(sum(all).m)} HT`} />
      <Stat k="Travaux" v={`${Math.round(trav.pct)} %`} sub={`Reste ${fmtE(trav.m - trav.f)} HT`} />
      <Stat k="Honoraires" v={`${Math.round(hon.pct)} %`} sub={`Reste ${fmtE(hon.m - hon.f)} HT`} />
      <Stat k="Phase" v={PHASES[c.phase].split(" · ")[1]} sub={PHASES[c.phase].split(" · ")[0] === "5" ? "Chantier en cours" : ""} />
    </div>
    <BlockWrapper title="Avancement par lot" icon="list-checks" right={<Segmented value={vue} onChange={setVue} options={[{ v: "all", label: "Tout" }, { v: "Travaux", label: "Travaux" }, { v: "Honoraires", label: "Honoraires" }]} />}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: T.n100, borderRadius: 8, padding: "8px 12px" }}>
        <span style={txt.bodyS}>{rows.length} lots · {fmtE(tot.f)} facturés / {fmtE(tot.m)} HT · {Math.round(tot.pct)} %</span>
        <Button size="Tiny" aspect="Outline" icon="download-simple" label="Extraire (CSV)" onClick={exp} />
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr>{["Lot", "Titulaire", "Marché + avenants HT", "Facturé HT", "Avancement", "Reste à facturer", "Dernière facture"].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
        <tbody>{rows.map(r => { const m = r.marche + r.avenants; return (
          <tr key={r.lot}>
            <td style={td}><div style={{ fontWeight: 700 }}>{r.lot}</div><Tag label={r.type} status={r.type === "Travaux" ? "Info" : "Grey"} /></td>
            <td style={td}>{r.titulaire}</td>
            <td style={{ ...td, whiteSpace: "nowrap" }}>{fmtE(m)}{r.avenants > 0 && <div style={txt.bodyXS}>dont avenant {fmtE(r.avenants)}</div>}</td>
            <td style={{ ...td, whiteSpace: "nowrap" }}>{fmtE(r.facture)}</td>
            <td style={td}><Progress pct={m ? r.facture / m * 100 : 0} color={r.type === "Travaux" ? T.p500 : T.p300} /></td>
            <td style={{ ...td, whiteSpace: "nowrap" }}>{fmtE(m - r.facture)}</td>
            <td style={td}>{r.derniere || <span style={txt.bodyXS}>—</span>}{r.ia && <div style={{ marginTop: 4 }}><Tag label="Lue par Marius IA" status="AI" icon="sparkle" /></div>}</td>
          </tr>); })}
          <tr style={{ background: T.n100 }}><td style={{ ...td, fontWeight: 700 }} colSpan={2}>Total</td><td style={{ ...td, fontWeight: 700 }}>{fmtE(tot.m)}</td><td style={{ ...td, fontWeight: 700 }}>{fmtE(tot.f)}</td><td style={td}><Progress pct={tot.pct} /></td><td style={{ ...td, fontWeight: 700 }}>{fmtE(tot.m - tot.f)}</td><td style={td} /></tr>
        </tbody>
      </table>
    </BlockWrapper>
    {c.vauban && <AlertBlock type="AI" title="Marius IA · facture ÉNERGO+ lue automatiquement">
      Montant, poste « PAC air/eau », taux d'avancement (30 %) et SIRET extraits de la facture déposée par l'entreprise, puis rapprochés du marché. Le certificat de paiement et l'appel de fonds sont pré-remplis : le chargé d'opération contrôle et valide.
    </AlertBlock>}
  </>);
}

// ── 3. Qualification : demandes entrantes et fiche de demande (DemandeFiche.tsx) ──
let DEMANDES_STORE: Demande[] = DEMANDES_INIT.map(d => ({ ...d }));
export function Qualification({ go }: { go?: (p: Page, c?: string) => void }) {
  const [demandes, setDemandes] = useState<Demande[]>(DEMANDES_STORE);
  const [open, setOpen] = useState<string | null>(() => new URLSearchParams(window.location.search).get("demande"));
  useEffect(() => { DEMANDES_STORE = demandes; }, [demandes]);
  const d = demandes.find(x => x.id === open);
  if (d) return <DemandeFiche d={d} onBack={() => setOpen(null)} onDecide={p => {
    setDemandes(ds => ds.map(x => x.id === d.id ? { ...x, decision: p.decision, orientation: p.orientation, co: p.co } : x));
    if (p.decision.startsWith("Projet") && !COPROS.some(c => c.id === "N-" + d.id)) {
      const [, ville] = /\d{5} (.+)$/.exec(d.adresse) || [, "Lille"];
      COPROS.unshift({ id: "N-" + d.id, nom: d.nom, ville: ville as string, terr: "MEL", lots: p.lots || 0, mode: p.mode, operateur: p.mode === "Full" ? "SPEE (MOD directe)" : p.orientation, co: p.mode === "Full" ? p.co : "—",
        phase: 0, avTravaux: 0, avHono: 0, budget: 0, rac: 0, dpe: "—", alerte: "Nouveau projet issu d'une demande" });
    }
  }} />;
  return (<>
    <PageTitle title="Qualification des demandes" sub="Chaque demande vient d'un formulaire rempli par un syndicat de copropriétaires ou un syndic. Ouvrez la fiche pour la qualifier et créer le projet."
      demande="Remplacer le fichier SCORING QUALIFICATION et le tableau des commissions : qualifier les contacts (gestion, technique, projet), décider en commission, garder le projet au SPEE ou l'orienter vers un opérateur." />
    <DemandesListe demandes={demandes} onOpen={setOpen} />
  </>);
}

// ── 4. Financement : éco-PTZ automatique, aides locales, instruction ─
const LOTS_V = [
  { id: 1, t: 182, nom: "M. Vandenberghe", cat: "TMO" }, { id: 2, t: 168, nom: "Mme Leclercq", cat: "MO" }, { id: 3, t: 195, nom: "M. Descamps", cat: "SUP" },
  { id: 4, t: 155, nom: "Mme Delattre", cat: "MO" }, { id: 5, t: 210, nom: "M. Delannoy", cat: "INT" }, { id: 6, t: 140, nom: "Mme Duquesnoy", cat: "?" },
  { id: 7, t: 182, nom: "M. Maerten", cat: "TMO" }, { id: 8, t: 182, nom: "Mme Wattebled", cat: "?" }, { id: 9, t: 168, nom: "M. Dewaele", cat: "INT" },
  { id: 10, t: 195, nom: "Mme Defrance", cat: "MO" }, { id: 11, t: 155, nom: "M. Dewulf", cat: "?" }, { id: 12, t: 140, nom: "Mme Lefebvre", cat: "SUP" },
];
const TT = LOTS_V.reduce((a, l) => a + l.t, 0);
const RAC_COLL = 101808;
type LotFin = { finance: boolean; manuel: string; pieces: number; analyse: string };
export function Financement() {
  const [regle, setRegle] = useState({ tmo: 3000, mo: 1500, plafond: 30 });
  const [fin, setFin] = useState<Record<number, LotFin>>(() => Object.fromEntries(LOTS_V.map(l => [l.id, { finance: ["TMO", "MO", "INT"].includes(l.cat), manuel: "", pieces: l.cat === "?" ? 1 : l.id % 3 === 0 ? 4 : 6, analyse: l.id % 4 === 0 ? "Complément demandé" : l.cat === "?" ? "En attente de pièces" : "Favorable" }])));
  const upd = (id: number, p: Partial<LotFin>) => setFin(f => ({ ...f, [id]: { ...f[id], ...p } }));
  const rows = LOTS_V.map(l => {
    const qp = RAC_COLL * l.t / TT;
    const locale = Math.min(l.cat === "TMO" ? regle.tmo : l.cat === "MO" ? regle.mo : 0, qp * regle.plafond / 100);
    const ragElig = Math.max(0, qp - locale);
    const auto = Math.min(ragElig, 50000);
    const f = fin[l.id]; const ptz = !f.finance ? 0 : f.manuel !== "" ? Number(f.manuel) || 0 : auto;
    return { l, qp, locale, ragElig, auto, ptz, apport: Math.max(0, ragElig - ptz), f };
  });
  const totPtz = rows.reduce((a, r) => a + r.ptz, 0);
  const catTag = (c: string) => c === "?" ? <Tag label="Inconnu" status="Disabled" /> : <span style={{ background: (T as any)[c], borderRadius: 12, padding: "0 8px", fontSize: 10, lineHeight: "16px", fontWeight: 500, display: "inline-block" }}>{c}</span>;
  const exp = () => downloadCSV("financement-vauban.csv", [["Lot", "Copropriétaire", "Tantièmes", "Catégorie", "Quote-part RAC", "Aide locale (pré-calcul)", "RAC éligible éco-PTZ", "Éco-PTZ retenu", "Apport", "Pièces reçues", "Analyse CO"],
    ...rows.map(r => [r.l.id, r.l.nom, r.l.t, r.l.cat, Math.round(r.qp), Math.round(r.locale), Math.round(r.ragElig), Math.round(r.ptz), Math.round(r.apport), `${r.f.pieces}/6`, r.f.analyse])]);
  return (<>
    <PageTitle title="Financement par copropriétaire" sub="La Résidence Vauban · 12 lots · reste à charge collectif après aides : 101 808 €"
      demande="Calculs automatiques (éco-PTZ : reste à charge éligible, case à cocher si la quote-part est financée, saisie manuelle si le montant diffère) ; aides locales intégrées au calcul ; suivi de la réception des pièces et du résultat de l'analyse du chargé d'opération." />
    <AlertBlock type="Info" title="Pré-calcul à confirmer par le chargé d'opération">Les aides évoluent vite et comptent des cas d'exception : Marius pré-calcule à partir des règles ci-dessous, le chargé d'opération confirme ou corrige. Le SPEE garde la décision de financement et ses propres règles d'analyse (reste à vivre, risque).</AlertBlock>
    <BlockWrapper type="Edit" title="Règle d'aide locale (exemple paramétrable)" icon="map-pin">
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <Input label="Montant par lot, ménage très modeste (€)" type="number" value={regle.tmo} onChange={v => setRegle({ ...regle, tmo: Number(v) || 0 })} width={260} />
        <Input label="Montant par lot, ménage modeste (€)" type="number" value={regle.mo} onChange={v => setRegle({ ...regle, mo: Number(v) || 0 })} width={260} />
        <Input label="Plafond (% de la quote-part)" type="number" value={regle.plafond} onChange={v => setRegle({ ...regle, plafond: Number(v) || 0 })} width={200} subtext="Le calcul se met à jour tout de suite" />
      </div>
    </BlockWrapper>
    <BlockWrapper title="Plan de financement individuel" icon="users">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: T.n100, borderRadius: 8, padding: "8px 12px" }}>
        <span style={txt.bodyS}>Éco-PTZ retenus : {fmtE(totPtz)} · {rows.filter(r => r.f.finance).length} lots financés · {rows.filter(r => r.f.analyse === "Favorable").length} analyses favorables</span>
        <Button size="Tiny" aspect="Outline" icon="download-simple" label="Extraire (CSV)" onClick={exp} />
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr>{["Lot", "Quote-part", "Aide locale", "RAC éligible", "Financer ?", "Éco-PTZ", "Apport", "Pièces", "Analyse CO"].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
        <tbody>{rows.map(r => (
          <tr key={r.l.id}>
            <td style={td}><div style={{ fontWeight: 700 }}>Lot {r.l.id} · {r.l.nom}</div><div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 4 }}>{catTag(r.l.cat)}<span style={txt.bodyXS}>{r.l.t} tantièmes</span></div></td>
            <td style={{ ...td, whiteSpace: "nowrap" }}>{fmtE(r.qp)}</td>
            <td style={{ ...td, whiteSpace: "nowrap" }}>{r.locale ? fmtE(r.locale) : "—"}</td>
            <td style={{ ...td, whiteSpace: "nowrap" }}>{fmtE(r.ragElig)}</td>
            <td style={td}><Checkbox checked={r.f.finance} onChange={v => upd(r.l.id, { finance: v })} /></td>
            <td style={{ ...td, width: 150 }}>{r.f.finance ? <Input value={r.f.manuel !== "" ? r.f.manuel : Math.round(r.auto)} onChange={v => upd(r.l.id, { manuel: v })} type="number" status={r.f.manuel !== "" ? "Warning" : undefined} subtext={r.f.manuel !== "" ? "Saisie manuelle" : "Calcul auto"} /> : <span style={txt.bodyXS}>Non financé</span>}</td>
            <td style={{ ...td, whiteSpace: "nowrap" }}>{fmtE(r.apport)}</td>
            <td style={td}><Tag label={`${r.f.pieces} / 6`} status={r.f.pieces >= 6 ? "Success" : r.f.pieces >= 4 ? "Warning" : "Error"} icon="paperclip" /></td>
            <td style={td}><Select value={r.f.analyse} onChange={v => upd(r.l.id, { analyse: v })} width={170} options={["En attente de pièces", "En cours", "Complément demandé", "Favorable", "Défavorable"].map(v => ({ v, label: v }))} /></td>
          </tr>))}</tbody>
      </table>
    </BlockWrapper>
  </>);
}

// ── 5. Trésorerie portefeuille ───────────────────────────────────────
export function Tresorerie() {
  const mois = ["Déc. 26", "Janv. 27", "Févr. 27", "Mars 27", "Avr. 27", "Mai 27"];
  const r = rng(7);
  const data = mois.map(m => { const fact = Math.round(380000 + r() * 260000); const aides = Math.round(fact * (0.45 + r() * 0.3)); const af = Math.round(fact * (0.15 + r() * 0.1)); const ptz = Math.round(fact * (0.1 + r() * 0.1)); return { m, fact, aides, af, ptz, besoin: fact - aides - af - ptz }; });
  const [mode, setMode] = useState<"all" | "Full" | "Solo">("all");
  const k = mode === "all" ? 1 : mode === "Full" ? 0.58 : 0.42;
  return (<>
    <PageTitle title="Trésorerie du portefeuille" sub="Projection consolidée à 6 mois, alimentée par les factures, appels de fonds et aides de chaque dossier"
      right={<Segmented value={mode} onChange={setMode} options={[{ v: "all", label: "Tout" }, { v: "Full", label: "MOD directe" }, { v: "Solo", label: "Sous pacte" }]} />}
      demande="Vision agrégée de plusieurs copropriétés : besoins de trésorerie, aides attendues, prêts à décaisser, factures à payer, appels de fonds à recouvrer, projets à risque." />
    <BlockWrapper title="Projection mensuelle" icon="vault" footerRight={<Button size="Small" aspect="Outline" icon="download-simple" label="Extraire (CSV)" onClick={() => downloadCSV("tresorerie.csv", [["Mois", "Factures à payer", "Aides attendues", "Appels de fonds", "Éco-PTZ à décaisser", "Besoin net"], ...data.map(d => [d.m, d.fact * k, d.aides * k, d.af * k, d.ptz * k, d.besoin * k].map(x => typeof x === "number" ? Math.round(x) : x))])} />}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr>{["Mois", "Factures à payer", "Aides attendues", "Appels de fonds", "Éco-PTZ à décaisser", "Besoin net de préfinancement"].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
        <tbody>{data.map(d => (
          <tr key={d.m}><td style={{ ...td, fontWeight: 700 }}>{d.m}</td><td style={td}>{fmtE(d.fact * k)}</td><td style={td}>{fmtE(d.aides * k)}</td><td style={td}>{fmtE(d.af * k)}</td><td style={td}>{fmtE(d.ptz * k)}</td>
            <td style={td}><Tag label={fmtE(d.besoin * k)} status={d.besoin * k > 120000 ? "Warning" : "Light"} size="Medium" /></td></tr>))}</tbody>
      </table>
    </BlockWrapper>
    <BlockWrapper title="Projets à surveiller" icon="warning">
      {COPROS.filter(c => c.alerte && (mode === "all" || c.mode === mode)).slice(0, 6).map(c => (
        <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: `1px solid ${T.n300}` }}>
          <span style={{ ...txt.bodySB, flex: 1 }}>{c.nom} <span style={{ ...txt.bodyXS, fontWeight: 400 }}>{c.ville} · {c.mode === "Full" ? "MOD directe" : c.operateur}</span></span>
          <Tag label={c.alerte!} status="Warning" icon="warning" />
        </div>))}
    </BlockWrapper>
  </>);
}

// ── 6. Opérateurs & parcours qualité (Solo / Full) ───────────────────
export function Operateurs() {
  const ops = [
    { nom: "Équipe MOD directe SPEE", compte: "Full · équipe", membres: 5, dossiers: COPROS.filter(c => c.mode === "Full").length, conf: 96, last: "aujourd'hui" },
    { nom: "Urbanis", compte: "Solo · équipe opérateur", membres: 4, dossiers: COPROS.filter(c => c.operateur === "Urbanis").length, conf: 88, last: "hier" },
    { nom: "SOLIHA", compte: "Solo · équipe opérateur", membres: 3, dossiers: COPROS.filter(c => c.operateur === "SOLIHA").length, conf: 81, last: "il y a 3 jours" },
  ];
  const jalons = [
    { j: "Jalon 1 · Diagnostic", items: ["Audit énergétique déposé", "Enquête sociale ≥ 80 % de réponses", "Plan de financement prévisionnel"] },
    { j: "Jalon 2 · Programme", items: ["APD validé par le conseil syndical", "Devis RGE analysés", "Plans de financement individuels"] },
    { j: "Jalon 3 · Réception", items: ["PV de réception", "Dossier de solde ANAH", "Plan de financement exécuté"] },
  ];
  return (<>
    <PageTitle title="Opérateurs & parcours qualité" sub="Compte réseau SPEE : chacun garde son organisation, les données attendues sont standardisées et consolidées ici"
      demande="Gérer dans une même infrastructure les projets en MOD directe et ceux portés par Urbanis, SOLIHA ou d'autres opérateurs, avec des droits différenciés et une supervision régionale." />
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32 }}>
      {ops.map(o => (
        <BlockWrapper key={o.nom} title={o.nom} icon={o.compte.startsWith("Full") ? "crown" : "users-four"} right={<Tag label={o.compte.split(" · ")[0]} status={o.compte.startsWith("Full") ? "Dark" : "Light"} size="Medium" />}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <KeyValue k="Dossiers" v={o.dossiers} /><KeyValue k="Utilisateurs" v={o.membres} />
            <KeyValue k="Conformité jalons" v={`${o.conf} %`} warning={o.conf < 85} /><KeyValue k="Dernière remontée" v={o.last} />
          </div>
        </BlockWrapper>))}
    </div>
    <AlertBlock type="Info" title="Solo et Full, comment ça marche">
      <b>Full</b> : vos équipes en MOD directe pilotent tout le dossier dans Marius, y compris le financier. <b>Solo</b> : l'opérateur sous pacte travaille dans son propre espace et active le parcours qualité Hauts-de-France sur ses missions ; jalons, pièces et données financières remontent automatiquement au compte réseau.
    </AlertBlock>
    <BlockWrapper title="Parcours qualité Hauts-de-France" icon="seal-check" right={<Tag label="Paramétré pour le SPEE" status="Success" size="Medium" />}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {jalons.map(j => (
          <div key={j.j} style={{ background: T.white, border: `1px solid ${T.n300}`, borderRadius: 8, padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={txt.bodySB}>{j.j}</div>
            {j.items.map(i => <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", ...txt.bodyS }}><Icon n="check-circle" size={16} color={T.g500} />{i}</div>)}
          </div>))}
      </div>
      <span style={txt.bodyXS}>Le parcours peut embarquer un référentiel qualité externe (ex. Séraphin via FIDEO).</span>
    </BlockWrapper>
  </>);
}

// ── 7. Reporting Région ──────────────────────────────────────────────
export function Reporting() {
  const [terr, setTerr] = useState("all");
  const rows = COPROS.filter(c => terr === "all" || c.terr === terr);
  const lots = rows.reduce((a, c) => a + c.lots, 0); const trav = rows.reduce((a, c) => a + c.budget, 0);
  const byTerr = Array.from(new Set(COPROS.map(c => c.terr))).map(t => { const rs = COPROS.filter(c => c.terr === t); return { t, n: rs.length, lots: rs.reduce((a, c) => a + c.lots, 0), trav: rs.reduce((a, c) => a + c.budget, 0), chantier: rs.filter(c => c.phase >= 5).length }; });
  return (<>
    <PageTitle title="Reporting Région" sub="Indicateurs produits directement depuis les données des dossiers, sans retraitement"
      right={<Select value={terr} onChange={setTerr} width={200} options={[{ v: "all", label: "Tous territoires" }, ...byTerr.map(b => ({ v: b.t, label: b.t }))]} />}
      demande="Produire les indicateurs pour la Région et les tutelles sans retraitements manuels, avec filtres et extractions." />
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
      <Stat k="Copropriétés accompagnées" v={String(rows.length)} /><Stat k="Logements" v={lots.toLocaleString("fr-FR")} />
      <Stat k="Travaux engagés" v={fmtE(trav)} /><Stat k="Gain énergétique moyen" v="- 52 %" sub="sur les audits déposés" />
    </div>
    <BlockWrapper title="Par territoire" icon="globe" footerRight={<Button size="Small" aspect="Outline" icon="download-simple" label="Extraire (CSV)" onClick={() => downloadCSV("reporting-region.csv", [["Territoire", "Copropriétés", "Logements", "Travaux TTC", "En chantier ou plus"], ...byTerr.map(b => [b.t, b.n, b.lots, b.trav, b.chantier])])} />}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr>{["Territoire", "Copropriétés", "Logements", "Travaux TTC", "En chantier ou plus"].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
        <tbody>{byTerr.map(b => <tr key={b.t}><td style={{ ...td, fontWeight: 700 }}>{b.t}</td><td style={td}>{b.n}</td><td style={td}>{b.lots}</td><td style={td}>{fmtE(b.trav)}</td><td style={td}>{b.chantier}</td></tr>)}</tbody>
      </table>
    </BlockWrapper>
    <AlertBlock type="Warning" title="À définir avec vous">Indicateurs PAI SDFR et ESMA REE, format des exports attendus par la Région, fréquence de production.</AlertBlock>
  </>);
}

// ── 8. À co-construire (atelier de priorisation) ─────────────────────
const BACKLOG = [
  { id: "b1", t: "Tâches et demandes internes (tableau CO)", d: "Remplacer le tableau Chargé d'Opération par des tâches rattachées aux dossiers." },
  { id: "b2", t: "Instruction financière individuelle", d: "Pièces attendues, complétude, relances, transmission au SPEE et retour de décision (le SPEE garde ses règles)." },
  { id: "b3", t: "Suivi CEE", d: "Fiches, montants, pièces et statuts de valorisation, rattachés au plan de financement." },
  { id: "b4", t: "Retour des statuts de paiement et comptables", d: "Statut, date et référence de paiement renvoyés par le SPEE dans Marius." },
  { id: "b5", t: "Reprise des fichiers Excel existants", d: "BDD SUIVI COPRO, BDD PROJET, suivi facturation : migration pour éviter la double saisie." },
  { id: "b6", t: "Indicateurs PAI SDFR / ESMA REE", d: "Définir ensemble les indicateurs et les exports." },
  { id: "b7", t: "Marius IA sur vos documents", d: "Lecture automatique des audits, devis et factures pour pré-remplir les dossiers." },
  { id: "b8", t: "Interface opérateurs sous pacte", d: "Quelles données, à quel rythme, avec quels contrôles ?" },
];
type Prio = "" | "Indispensable" | "Utile" | "Plus tard";
export function CoConstruction() {
  const [votes, setVotes] = useState<Record<string, { p: Prio; note: string }>>(() => { try { return JSON.parse(localStorage.getItem("spee-backlog") || "{}"); } catch { return {}; } });
  const [extra, setExtra] = useState(""); const [items, setItems] = useState(() => { try { return JSON.parse(localStorage.getItem("spee-backlog-items") || "null") || BACKLOG; } catch { return BACKLOG; } });
  useEffect(() => { localStorage.setItem("spee-backlog", JSON.stringify(votes)); localStorage.setItem("spee-backlog-items", JSON.stringify(items)); }, [votes, items]);
  const set = (id: string, p: Partial<{ p: Prio; note: string }>) => setVotes(v => ({ ...v, [id]: { p: "", note: "", ...v[id], ...p } }));
  const order: Prio[] = ["Indispensable", "Utile", "Plus tard", ""];
  const sorted = useMemo(() => [...items].sort((a: any, b: any) => order.indexOf(votes[a.id]?.p || "") - order.indexOf(votes[b.id]?.p || "")), [items, votes]);
  return (<>
    <PageTitle title="À co-construire avec vous" sub="Ce qui n'est pas encore maquetté : on priorise ensemble, puis atelier → spécification → prototype → votre validation" />
    <BlockWrapper title="Pistes à prioriser" icon="handshake" footerRight={<Button size="Small" aspect="Outline" icon="download-simple" label="Extraire les priorités" onClick={() => downloadCSV("priorites-spee.csv", [["Sujet", "Description", "Priorité", "Commentaire"], ...sorted.map((i: any) => [i.t, i.d, votes[i.id]?.p || "", votes[i.id]?.note || ""])])} />}>
      {sorted.map((i: any) => (
        <div key={i.id} style={{ display: "grid", gridTemplateColumns: "1.3fr auto 1fr", gap: 16, alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${T.n300}` }}>
          <div><div style={txt.bodySB}>{i.t}</div><div style={{ ...txt.bodyS, color: T.n800, marginTop: 4, lineHeight: "20px" }}>{i.d}</div></div>
          <Segmented value={(votes[i.id]?.p || "") as Prio} onChange={p => set(i.id, { p })} options={[{ v: "Indispensable", label: "Indispensable" }, { v: "Utile", label: "Utile" }, { v: "Plus tard", label: "Plus tard" }]} />
          <Input value={votes[i.id]?.note || ""} onChange={note => set(i.id, { note })} placeholder="Commentaire de l'équipe" />
        </div>))}
    </BlockWrapper>
    <BlockWrapper type="Edit" title="Ajouter un besoin" icon="plus-circle" footerRight={<Button aspect="Plain" label="Ajouter" icon="plus" onClick={() => { if (extra.trim()) { setItems([...items, { id: "x" + Date.now(), t: extra.trim(), d: "Ajouté en séance" }]); setExtra(""); } }} />}>
      <Input label="Besoin exprimé" value={extra} onChange={setExtra} placeholder="Ex. : suivi des commissions d'attribution des aides locales" size="Medium" />
    </BlockWrapper>
  </>);
}
