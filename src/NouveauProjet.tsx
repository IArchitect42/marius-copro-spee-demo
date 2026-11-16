// Vue AMO « Mes Missions Copro » : création d'un projet (mission AMO Copro), rattaché à un syndic ou à partir d'une adresse.
// Collecte réelle via les API publiques (moteur partagé useCoproCollect), puis popup de confirmation des champs,
// sur le modèle de TDCM : chaque champ est accepté, corrigé ou écarté avant intégration à la mission.
import React, { useEffect, useRef, useState } from "react";
import { T, F, txt, Icon, Button, Tag, AlertBlock, Input, Select, Segmented, Checkbox, th, td } from "./ds";
import { useCoproCollect, searchBan, SourceSteps, Field } from "./CreerCopro";
import { SYNDICS } from "./AmoSyndics";

export type NewMission = { id: string; nom: string; adresse: string; lots: number; phase: string; sousPhase: string; relances: number; echeance: string; sante: string; budget: string; dpe: string; syndic?: string; nbChamps?: number };

// Où chaque champ collecté atterrit dans la mission
const DEST: Record<string, string> = {
  "Adresse": "La Copro › Carte d'identité", "Identifiant BAN": "La Copro › Carte d'identité", "Code commune (INSEE)": "La Copro › Carte d'identité",
  "N° d'immatriculation": "La Copro › Carte d'identité", "Nom d'usage": "La Copro › Carte d'identité", "Lots (total)": "La Copro › Carte d'identité",
  "Lots d'habitation": "La Copro › Carte d'identité", "Lots de stationnement": "La Copro › Carte d'identité", "Règlement de copropriété": "La Copro › Carte d'identité",
  "Syndicat": "La Copro › Carte d'identité", "Programmes / quartiers": "La Copro › Carte d'identité",
  "Type de syndic": "Intervenants › Syndic", "Syndic (représentant légal)": "Intervenants › Syndic", "Mandat du syndic": "Intervenants › Syndic", "Fin du mandat du syndic": "Intervenants › Syndic", "Syndic · fiche entreprise": "Intervenants › Syndic",
  "Période de construction": "La Copro › Bilan initial", "Année de construction": "La Copro › Bilan initial", "Logements (bâtiment)": "La Copro › Bilan initial",
  "Niveaux": "La Copro › Bilan initial", "Hauteur moyenne": "La Copro › Bilan initial", "Emprise au sol": "La Copro › Bilan initial",
  "Matériau des murs": "La Copro › Bilan initial", "Matériau de toiture": "La Copro › Bilan initial", "Chauffage": "La Copro › Bilan initial",
  "Étiquette DPE dominante": "Projet › État initial", "DPE des logements": "Projet › État initial",
  "Parcelle cadastrale": "La Copro › Carte d'identité", "Contenance de la parcelle": "La Copro › Carte d'identité",
};
const GROUPS = ["La Copro › Carte d'identité", "La Copro › Bilan initial", "Projet › État initial", "Intervenants › Syndic"];
const SRC_LABEL: Record<string, string> = { BAN: "Adresse BAN", RNIC: "Registre copros", Cadastre: "Cadastre", BDNB: "BDNB", "DPE ADEME": "DPE ADEME", SIRENE: "SIRENE", Syndic: "Votre carnet" };
const EXEMPLES = [{ label: "37 rue Inkermann, Lille", q: "37 Rue Inkermann 59000 Lille" }, { label: "3 bd de Montebello, Lille", q: "3 Boulevard Montebello 59000 Lille" }];

type Row = Field & { id: number; keep: boolean; orig: string };

export default function NouveauProjet({ onClose, onCreate }: { onClose: () => void; onCreate: (m: NewMission) => void }) {
  const [rat, setRat] = useState<"syndic" | "adresse">("syndic");
  const [syndicId, setSyndicId] = useState(SYNDICS[0].id);
  const [q, setQ] = useState(""); const [sugg, setSugg] = useState<any[]>([]); const [picked, setPicked] = useState(false);
  const [confirm, setConfirm] = useState(false); const [rows, setRows] = useState<Row[]>([]);
  const [nom, setNom] = useState("");
  const tmr = useRef<any>(null);
  const C = useCoproCollect();
  const syndic = SYNDICS.find(s => s.id === syndicId)!;

  useEffect(() => {
    if (picked || q.length < 4) { setSugg([]); return; }
    clearTimeout(tmr.current);
    tmr.current = setTimeout(async () => { try { setSugg(await searchBan(q)); } catch { setSugg([]); } }, 300);
  }, [q, picked]);

  const go = (a: any) => { setPicked(true); setSugg([]); setQ(a.label); C.run(a); };
  const ex = async (x: string) => { const r = await searchBan(x); if (r[0]) go(r[0]); };

  const openConfirm = () => {
    const base: Field[] = [...C.fields];
    if (C.dpe && C.dpe.total) base.push({ k: "DPE des logements", v: `${C.dpe.total} DPE · ` + ["A", "B", "C", "D", "E", "F", "G"].filter(l => C.dpe!.rep[l]).map(l => `${l} ${C.dpe!.rep[l]}`).join(" · "), src: "DPE ADEME" as any });
    if (rat === "syndic") {
      const reg = base.find(f => f.k === "Syndic (représentant légal)");
      const diff = reg && reg.v !== "non connu" && !reg.v.toLowerCase().includes(syndic.nom.toLowerCase().split(" ").slice(-1)[0]);
      base.push({ k: "Syndic rattaché", v: `${syndic.nom} · ${syndic.gestionnaire}`, src: "Syndic" as any, warn: diff ? `Le registre indique « ${reg!.v} » : vérifier le mandat` : undefined });
    }
    const nomUsage = base.find(f => f.k === "Nom d'usage")?.v;
    setNom(nomUsage ? nomUsage.toLowerCase().replace(/(^|\s)\S/g, c => c.toUpperCase()) : `Copropriété ${C.adr?.label.split(" ").slice(0, 4).join(" ") || ""}`);
    setRows(base.map((f, i) => ({ ...f, id: i, keep: true, orig: f.v, dest: f.k === "Syndic rattaché" ? "Intervenants › Syndic" : DEST[f.k] || "La Copro › Carte d'identité" })));
    setConfirm(true);
  };
  const kept = rows.filter(r => r.keep).length;
  const create = () => {
    const g = (k: string) => rows.find(r => r.k === k && r.keep)?.v;
    onCreate({ id: "new-" + Date.now(), nom, adresse: C.adr?.label || q, lots: Number(g("Lots d'habitation") || g("Logements (bâtiment)") || 0), phase: "Phase 0", sousPhase: "Mission créée · à qualifier",
      relances: 0, echeance: "—", sante: "gris", budget: "—", dpe: (g("Étiquette DPE dominante") || "—") + "→ ?", syndic: rat === "syndic" ? syndic.nom : undefined, nbChamps: kept });
  };

  const overlay: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(19,37,45,0.55)", zIndex: 1100, display: "flex", justifyContent: "center", alignItems: "flex-start", overflowY: "auto", padding: "40px 16px" };
  const box = (w: number): React.CSSProperties => ({ width: w, maxWidth: "100%", background: T.white, borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.25)", display: "flex", flexDirection: "column" });

  if (confirm) return (
    <div style={overlay}>
      <div style={box(1140)}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "16px 16px 0 24px" }}>
          <div style={{ flex: 1 }}>
            <div style={txt.h4}>Champs collectés à confirmer</div>
            <div style={{ ...txt.bodyS, color: T.n800, marginTop: 4 }}>Cochez les champs à intégrer, corrigez si besoin. Les champs non cochés restent à saisir dans la mission.</div>
          </div>
          <Tag label="Marius IA" status="AI" size="Medium" icon="sparkle" />
          <Button size="Small" aspect="Neutral" icon="x" title="Fermer" onClick={onClose} />
        </div>
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-end" }}>
            <Input size="Medium" label="Nom de la mission" value={nom} onChange={setNom} width={420} />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingBottom: 8 }}>
              <Tag label={`${rows.length} champs`} status="Light" size="Medium" />
              <Tag label={`${rows.filter(r => r.warn).length} écarts`} status={rows.some(r => r.warn) ? "Warning" : "Success"} size="Medium" />
              <Tag label={`${new Set(rows.map(r => r.src)).size} sources`} status="Light" size="Medium" />
            </div>
          </div>
          {GROUPS.map(gp => {
            const rs = rows.filter(r => r.dest === gp); if (!rs.length) return null;
            const all = rs.every(r => r.keep);
            return (
              <div key={gp} style={{ border: `1px solid ${T.n600}`, borderRadius: 8, overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", background: T.n100 }}>
                  <Checkbox checked={all} onChange={v => setRows(x => x.map(r => r.dest === gp ? { ...r, keep: v } : r))} />
                  <span style={{ ...txt.bodySB, flex: 1 }}>{gp}</span><span style={txt.bodyXS}>{rs.filter(r => r.keep).length} / {rs.length}</span>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr>{["", "Champ", "Valeur proposée", "Source", "État"].map(h => <th key={h} style={{ ...th, background: T.white }}>{h}</th>)}</tr></thead>
                  <tbody>{rs.map(r => (
                    <tr key={r.id} style={{ opacity: r.keep ? 1 : 0.5 }}>
                      <td style={{ ...td, width: 32 }}><Checkbox checked={r.keep} onChange={v => setRows(x => x.map(y => y.id === r.id ? { ...y, keep: v } : y))} /></td>
                      <td style={{ ...td, width: "24%", color: T.n800 }}>{r.k}</td>
                      <td style={td}><Input value={r.v} onChange={v => setRows(x => x.map(y => y.id === r.id ? { ...y, v } : y))} status={r.warn ? "Warning" : r.v !== r.orig ? "Valid" : "AI"} subtext={r.warn || (r.v !== r.orig ? `Modifié (proposé : ${r.orig})` : undefined)} /></td>
                      <td style={{ ...td, width: 130 }}><Tag label={SRC_LABEL[r.src] || r.src} status="Light" /></td>
                      <td style={{ ...td, width: 120 }}>{r.warn ? <Tag label="Écart" status="Warning" icon="warning" /> : r.v !== r.orig ? <Tag label="Modifié" status="Info" /> : r.keep ? <Tag label="À intégrer" status="Success" /> : <Tag label="Écarté" status="Grey" />}</td>
                    </tr>))}</tbody>
                </table>
              </div>);
          })}
        </div>
        <div style={{ borderTop: `1px solid ${T.n500}`, padding: "16px 24px", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ ...txt.bodyS, flex: 1 }}>{kept} champs sur {rows.length} seront intégrés à la mission</span>
          <Button size="Small" aspect="Outline" label="Retour à la collecte" onClick={() => setConfirm(false)} />
          <Button size="Small" aspect="Plain" icon="check" label="Intégrer à la mission" onClick={create} disabled={!nom.trim()} />
        </div>
      </div>
    </div>
  );

  return (
    <div style={overlay}>
      <div style={box(880)}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "16px 16px 0 24px" }}>
          <div style={{ flex: 1 }}>
            <div style={txt.h4}>Nouveau projet de copropriété</div>
            <div style={{ ...txt.bodyS, color: T.n800, marginTop: 4 }}>Les données publiques remplissent la mission : vous n'avez plus qu'à confirmer.</div>
          </div>
          <Button size="Small" aspect="Neutral" icon="x" title="Fermer" onClick={onClose} />
        </div>
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={txt.bodySB}>1 · Rattachement</div>
            <Segmented value={rat} onChange={setRat} options={[{ v: "syndic", label: "À un syndic partenaire", icon: "address-book" }, { v: "adresse", label: "Sans syndic, à partir d'une adresse", icon: "map-pin" }]} />
            {rat === "syndic" && (
              <div style={{ display: "flex", gap: 16, alignItems: "flex-end" }}>
                <Select label="Syndic" value={syndicId} onChange={setSyndicId} width={320} options={SYNDICS.map(s => ({ v: s.id, label: `${s.nom} (${s.missions.length} missions)` }))} />
                <span style={{ ...txt.bodyS, color: T.n800, paddingBottom: 8 }}>{syndic.gestionnaire} · {syndic.tel} · {syndic.mail}</span>
              </div>)}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={txt.bodySB}>2 · Adresse de la copropriété</div>
            <div style={{ position: "relative" }}>
              <Input size="Medium" value={q} onChange={v => { setQ(v); setPicked(false); }} placeholder="Ex. : 37 rue Inkermann, Lille" subtext="Adresse vérifiée par la Base adresse nationale" />
              {sugg.length > 0 && (
                <div style={{ position: "absolute", top: 42, left: 0, right: 0, background: T.white, border: `1px solid ${T.n500}`, borderRadius: 4, zIndex: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.25)" }}>
                  {sugg.map(s => <div key={s.id} onClick={() => go(s)} style={{ padding: "8px 12px", cursor: "pointer", ...txt.bodyS }} onMouseEnter={e => (e.currentTarget.style.background = T.p50)} onMouseLeave={e => (e.currentTarget.style.background = T.white)}>{s.label}</div>)}
                </div>)}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ ...txt.bodyS, color: T.n800 }}>Exemples :</span>
              {EXEMPLES.map(x => <Button key={x.label} size="Tiny" aspect="Outline" label={x.label} onClick={() => ex(x.q)} />)}
            </div>
          </div>
          {C.steps.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={txt.bodySB}>3 · Collecte automatique</div>
              <SourceSteps steps={C.steps} />
              {C.cands.length > 0 && (
                <AlertBlock type="Warning" title="Plusieurs copropriétés immatriculées à proximité">
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 4 }}>
                    {C.cands.map((c: any) => <div key={c.numero_d_immatriculation} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ flex: 1 }}>{c.numero_d_immatriculation} · {c.adresse_de_reference} · {c.nombre_total_de_lots} lots · {Math.round(c.dist)} m</span>
                      <Button size="Tiny" aspect="Outline" label="Choisir" onClick={() => C.applyRnic(c)} /></div>)}
                  </div>
                </AlertBlock>)}
              {C.fields.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                  {(["BAN", "RNIC", "BDNB", "Cadastre", "DPE ADEME", "SIRENE"] as const).map(src => {
                    const n = src === "DPE ADEME" ? (C.dpe?.total ? 1 : 0) : C.fields.filter(f => f.src === src).length;
                    return (<div key={src} style={{ background: n ? T.ai50 : T.n100, borderRadius: 8, padding: 12, display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ ...txt.bodySB, color: n ? T.ai500 : T.n800 }}>{SRC_LABEL[src]}</span>
                      <span style={txt.bodyXS}>{src === "DPE ADEME" ? (C.dpe?.total ? `${C.dpe.total} DPE de logements` : "aucun DPE") : `${n} champ${n > 1 ? "s" : ""} pré-rempli${n > 1 ? "s" : ""}`}</span>
                    </div>);
                  })}
                </div>)}
            </div>)}
        </div>
        <div style={{ borderTop: `1px solid ${T.n500}`, padding: "16px 24px", display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button size="Small" aspect="Outline" label="Annuler" onClick={onClose} />
          <Button size="Small" aspect="Plain" icon="list-checks" label={C.done ? `Vérifier les ${C.fields.length + (C.dpe?.total ? 1 : 0) + (rat === "syndic" ? 1 : 0)} champs` : "Vérifier les champs"} disabled={!C.done || !C.fields.length} onClick={openConfirm} />
        </div>
      </div>
    </div>
  );
}
