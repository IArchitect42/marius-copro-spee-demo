// « Nouvelle copropriété » : création de la carte d'identité à partir de l'adresse ou du n° d'immatriculation,
// avec de VRAIS appels aux API publiques (sans clé) : Géoplateforme/BAN, Registre national des copropriétés (data.gouv),
// cadastre (WFS Géoplateforme), BDNB, DPE ADEME, Recherche d'entreprises.
import React, { useEffect, useRef, useState } from "react";
import { T, txt, Icon, Button, Tag, BlockWrapper, AlertBlock, Input, Segmented, th, td } from "./ds";

const RNIC = "https://tabular-api.data.gouv.fr/api/resources/cc062fa7-4a80-449c-ab73-d2856b455ec9/data/";
const getJ = async (u: string, n = 2): Promise<any> => {
  try { const r = await fetch(u); if (!r.ok) throw new Error(`${r.status}`); return await r.json(); }
  catch (e) { if (n > 0) { await new Promise(res => setTimeout(res, 600)); return getJ(u, n - 1); } throw e; }
};
const qs = (o: Record<string, string | number>) => Object.entries(o).map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join("&");

type Adr = { label: string; id: string; citycode: string; lat: number; lon: number };
type Src = "BAN" | "RNIC" | "Cadastre" | "BDNB" | "DPE ADEME" | "SIRENE";
type Field = { k: string; v: string; src: Src; warn?: string };
type Step = { src: Src; label: string; state: "wait" | "run" | "ok" | "none" | "err"; info?: string };
const PER: Record<string, string> = { AVANT_1949: "avant 1949", DE_1949_A_1960: "1949 – 1960", DE_1961_A_1974: "1961 – 1974", DE_1975_A_1993: "1975 – 1993", DE_1994_A_2000: "1994 – 2000", DE_2001_A_2010: "2001 – 2010", A_COMPTER_DE_2011: "depuis 2011", NON_CONNUE: "non connue" };
const SRC_TAG: Record<Src, string> = { BAN: "Adresse BAN", RNIC: "Registre copros", Cadastre: "Cadastre", BDNB: "BDNB", "DPE ADEME": "DPE ADEME", SIRENE: "SIRENE" };

const EXEMPLES = [{ label: "37 rue Inkermann, Lille", q: "37 Rue Inkermann 59000 Lille" }, { label: "3 bd de Montebello, Lille (817 lots)", q: "3 Boulevard Montebello 59000 Lille" }, { label: "N° AB5691118", immat: "AB5691118" }];

export default function CreerCopro() {
  const [mode, setMode] = useState<"adresse" | "immat">("adresse");
  const [q, setQ] = useState(""); const [sugg, setSugg] = useState<Adr[]>([]); const [immat, setImmat] = useState("");
  const [steps, setSteps] = useState<Step[]>([]); const [fields, setFields] = useState<Field[]>([]);
  const [cands, setCands] = useState<any[]>([]); const [dpe, setDpe] = useState<{ total: number; rep: Record<string, number> } | null>(null);
  const [adr, setAdr] = useState<Adr | null>(null); const [done, setDone] = useState(false); const [created, setCreated] = useState(false);
  const tmr = useRef<any>(null);

  useEffect(() => {
    if (mode !== "adresse" || q.length < 4 || adr?.label === q) { setSugg([]); return; }
    clearTimeout(tmr.current);
    tmr.current = setTimeout(async () => {
      try {
        const g = await getJ("https://data.geopf.fr/geocodage/search?index=address&autocomplete=1&limit=5&q=" + encodeURIComponent(q));
        setSugg(g.features.map((f: any) => ({ label: f.properties.label, id: f.properties.id, citycode: f.properties.citycode, lon: f.geometry.coordinates[0], lat: f.geometry.coordinates[1] })));
      } catch { setSugg([]); }
    }, 300);
  }, [q, mode]);

  const setStep = (src: Src, p: Partial<Step>) => setSteps(ss => ss.map(s => s.src === src ? { ...s, ...p } : s));
  const add = (f: Field[]) => setFields(fs => [...fs, ...f]);

  async function run(a: Adr | null, immatNo?: string) {
    setDone(false); setCreated(false); setFields([]); setCands([]); setDpe(null); setSugg([]);
    setSteps((["BAN", "BDNB", "RNIC", "Cadastre", "DPE ADEME", "SIRENE"] as Src[]).map(src => ({ src, label: SRC_TAG[src], state: "wait" })));
    let rn: any = null;
    try {
      // 0. Par n° d'immatriculation : registre puis adresse
      if (!a && immatNo) {
        setStep("RNIC", { state: "run" });
        const r = await getJ(RNIC + "?" + qs({ numero_d_immatriculation__exact: immatNo.trim().toUpperCase(), page_size: 1 }));
        rn = r.data?.[0];
        if (!rn) { setStep("RNIC", { state: "none", info: "numéro introuvable" }); setStep("BAN", { state: "none" }); setDone(true); return; }
        setStep("BAN", { state: "run" });
        const g = await getJ(`https://data.geopf.fr/geocodage/reverse?index=address&limit=1&lon=${rn.long}&lat=${rn.lat}`);
        const f = g.features?.[0];
        a = f ? { label: f.properties.label, id: f.properties.id, citycode: f.properties.citycode, lon: f.geometry.coordinates[0], lat: f.geometry.coordinates[1] } : null;
      }
      if (!a) { setStep("BAN", { state: "err", info: "adresse introuvable" }); setDone(true); return; }
      setAdr(a); setQ(a.label);
      setStep("BAN", { state: "ok", info: a.id });
      add([{ k: "Adresse", v: a.label, src: "BAN" }, { k: "Identifiant BAN", v: a.id, src: "BAN" }, { k: "Code commune (INSEE)", v: a.citycode, src: "BAN" }]);

      // 1. BDNB (bâtiment, lien vers le registre)
      setStep("BDNB", { state: "run" });
      let bd: any = null;
      try {
        const b = await getJ("https://api.bdnb.io/v1/bdnb/donnees/batiment_groupe_complet/adresse?cle_interop_adr=eq." + encodeURIComponent(a.id) + "&select=annee_construction,nb_log,nb_niveau,hauteur_mean,mat_mur_txt,mat_toit_txt,type_energie_chauffage,type_installation_chauffage,classe_bilan_dpe,nb_log_rnc,numero_immat_principal,surface_emprise_sol&limit=1");
        bd = b?.[0];
      } catch { /* */ }
      if (bd) {
        setStep("BDNB", { state: "ok", info: bd.numero_immat_principal ? `lien registre ${bd.numero_immat_principal}` : "bâtiment trouvé" });
        const ind = (v: any) => v && v !== "INDETERMINE" ? String(v).toLowerCase() : null;
        add([
          ...(bd.annee_construction ? [{ k: "Année de construction", v: String(bd.annee_construction), src: "BDNB" as Src }] : []),
          ...(bd.nb_log ? [{ k: "Logements (bâtiment)", v: String(bd.nb_log), src: "BDNB" as Src }] : []),
          ...(bd.nb_niveau ? [{ k: "Niveaux", v: String(bd.nb_niveau), src: "BDNB" as Src }] : []),
          ...(bd.hauteur_mean ? [{ k: "Hauteur moyenne", v: `${bd.hauteur_mean} m`, src: "BDNB" as Src }] : []),
          ...(bd.surface_emprise_sol ? [{ k: "Emprise au sol", v: `${Math.round(bd.surface_emprise_sol)} m²`, src: "BDNB" as Src }] : []),
          ...(ind(bd.mat_mur_txt) ? [{ k: "Matériau des murs", v: ind(bd.mat_mur_txt)!, src: "BDNB" as Src }] : []),
          ...(ind(bd.mat_toit_txt) ? [{ k: "Matériau de toiture", v: ind(bd.mat_toit_txt)!, src: "BDNB" as Src }] : []),
          ...(bd.type_energie_chauffage ? [{ k: "Chauffage", v: [bd.type_installation_chauffage, bd.type_energie_chauffage].filter(Boolean).join(" · "), src: "BDNB" as Src }] : []),
          ...(bd.classe_bilan_dpe ? [{ k: "Étiquette DPE dominante", v: bd.classe_bilan_dpe, src: "BDNB" as Src }] : []),
        ]);
      } else setStep("BDNB", { state: "none", info: "aucun bâtiment rapproché" });

      // 2. Registre national des copropriétés
      setStep("RNIC", { state: "run" });
      if (!rn && bd?.numero_immat_principal) {
        const r = await getJ(RNIC + "?" + qs({ numero_d_immatriculation__exact: bd.numero_immat_principal, page_size: 1 }));
        rn = r.data?.[0] || null;
      }
      if (!rn) {
        const d = 0.0008;
        const r = await getJ(RNIC + "?" + qs({ lat__greater: a.lat - d, lat__less: a.lat + d, long__greater: a.lon - d * 1.5, long__less: a.lon + d * 1.5, page_size: 20 }));
        const list = (r.data || []).map((x: any) => ({ ...x, dist: Math.hypot((x.lat - a!.lat) * 111000, (x.long - a!.lon) * 71000) })).sort((x: any, y: any) => x.dist - y.dist);
        if (list.length && list[0].dist < 25) rn = list[0]; else if (list.length) { setCands(list.slice(0, 6)); setStep("RNIC", { state: "none", info: `${list.length} copros à proximité, à choisir` }); }
        else setStep("RNIC", { state: "none", info: "aucune copro immatriculée ici" });
      }
      if (rn) applyRnic(rn, bd);

      // 3. Cadastre
      setStep("Cadastre", { state: "run" });
      try {
        const w = await getJ("https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&OUTPUTFORMAT=application/json&COUNT=5&TYPENAMES=CADASTRALPARCELS.PARCELLAIRE_EXPRESS:parcelle&PROPERTYNAME=section,numero,contenance,idu&CQL_FILTER=" + encodeURIComponent(`INTERSECTS(geom,POINT(${a.lat} ${a.lon}))`));
        const p = w.features?.[0]?.properties;
        if (p) {
          setStep("Cadastre", { state: "ok", info: p.idu });
          const regRef = rn?.reference_cadastrale_1 ? String(rn.reference_cadastrale_1).toUpperCase() : null;
          add([{ k: "Parcelle cadastrale", v: `${p.section} ${p.numero} (${p.idu})`, src: "Cadastre", warn: regRef && regRef !== String(p.idu).toUpperCase() ? `Le registre indique ${regRef}` : undefined },
               { k: "Contenance de la parcelle", v: `${Number(p.contenance).toLocaleString("fr-FR")} m²`, src: "Cadastre" }]);
        } else setStep("Cadastre", { state: "none" });
      } catch { setStep("Cadastre", { state: "err", info: "service indisponible" }); }

      // 4. DPE ADEME des logements
      setStep("DPE ADEME", { state: "run" });
      try {
        const dp = await getJ("https://data.ademe.fr/data-fair/api/v1/datasets/dpe03existant/values_agg?" + qs({ field: "etiquette_dpe", qs: `identifiant_ban:"${a.id}"`, agg_size: 7 }));
        const rep: Record<string, number> = {}; (dp.aggs || []).forEach((x: any) => { rep[x.value] = x.total; });
        const total = dp.total || Object.values(rep).reduce((s, n) => s + n, 0);
        setDpe({ total, rep }); setStep("DPE ADEME", { state: total ? "ok" : "none", info: `${total} DPE de logements` });
      } catch { setStep("DPE ADEME", { state: "err", info: "service indisponible" }); }
    } catch (e: any) {
      setSteps(ss => ss.map(s => s.state === "run" ? { ...s, state: "err", info: "erreur réseau" } : s));
    }
    setDone(true);
  }

  async function applyRnic(rn: any, bd?: any) {
    setCands([]);
    setStep("RNIC", { state: "ok", info: rn.numero_d_immatriculation });
    const per = PER[rn.periode_de_construction] || rn.periode_de_construction;
    const yr = bd?.annee_construction; let warnPer: string | undefined;
    const m = /(\d{4})_A_(\d{4})/.exec(rn.periode_de_construction || "");
    if (yr && m && (yr < +m[1] || yr > +m[2])) warnPer = `La BDNB indique ${yr} : à vérifier`;
    add([
      { k: "N° d'immatriculation", v: rn.numero_d_immatriculation, src: "RNIC" },
      ...(rn.nom_d_usage_de_la_copropriete ? [{ k: "Nom d'usage", v: rn.nom_d_usage_de_la_copropriete, src: "RNIC" as Src }] : []),
      { k: "Lots (total)", v: String(rn.nombre_total_de_lots ?? "—"), src: "RNIC" },
      { k: "Lots d'habitation", v: String(rn.nombre_de_lots_a_usage_d_habitation ?? "—"), src: "RNIC", warn: bd?.nb_log && rn.nombre_de_lots_a_usage_d_habitation && Math.abs(bd.nb_log - rn.nombre_de_lots_a_usage_d_habitation) > 2 ? `La BDNB compte ${bd.nb_log} logements` : undefined },
      { k: "Lots de stationnement", v: String(rn.nombre_de_lots_de_stationnement ?? "—"), src: "RNIC" },
      { k: "Période de construction", v: per || "—", src: "RNIC", warn: warnPer },
      ...(rn.date_du_reglement_de_copropriete ? [{ k: "Règlement de copropriété", v: String(rn.date_du_reglement_de_copropriete), src: "RNIC" as Src }] : []),
      { k: "Syndicat", v: rn.syndicat_principal_ou_syndicat_secondaire || "—", src: "RNIC" },
      { k: "Type de syndic", v: String(rn.type_de_syndic_benevole_professionnel_non_connu || "—").replace(/_/g, " ").toLowerCase(), src: "RNIC" },
      { k: "Syndic (représentant légal)", v: rn.raison_sociale_du_representant_legal || "non connu", src: "RNIC" },
      ...(rn.mandat_en_cours_dans_la_copropriete ? [{ k: "Mandat du syndic", v: String(rn.mandat_en_cours_dans_la_copropriete), src: "RNIC" as Src, warn: /pas de mandat/i.test(String(rn.mandat_en_cours_dans_la_copropriete)) ? "Pas de mandat en cours : copropriété potentiellement sans syndic" : undefined }] : []),
      ...(rn.date_de_fin_du_dernier_mandat ? [{ k: "Fin du mandat du syndic", v: String(rn.date_de_fin_du_dernier_mandat), src: "RNIC" as Src }] : []),
      { k: "Programmes / quartiers", v: [rn.nom_qp_2024 && `QPV ${rn.nom_qp_2024}`, rn.copro_dans_acv && "Action cœur de ville", rn.copro_dans_pvd && "Petites villes de demain", rn.copro_dans_pdp && "Plan de sauvegarde", rn.copro_aidee && "Copro aidée"].filter(Boolean).join(" · ") || "aucun", src: "RNIC" },
    ]);
    // 5. SIRENE du syndic
    const siret = String(rn.siret_du_representant_legal || "").replace(/\D/g, "");
    if (siret.length >= 9) {
      setStep("SIRENE", { state: "run" });
      try {
        const e = await getJ("https://recherche-entreprises.api.gouv.fr/search?per_page=1&q=" + siret);
        const r = e.results?.[0];
        if (r) { setStep("SIRENE", { state: "ok", info: r.siren }); add([{ k: "Syndic · fiche entreprise", v: `${r.nom_complet} · ${r.siege?.adresse || ""}${r.etat_administratif === "C" ? " · cessée" : ""}`, src: "SIRENE", warn: r.etat_administratif === "C" ? "Entreprise cessée" : undefined }]); }
        else setStep("SIRENE", { state: "none" });
      } catch { setStep("SIRENE", { state: "err" }); }
    } else setStep("SIRENE", { state: "none", info: "pas de SIRET au registre" });
  }

  const ic = (s: Step["state"]) => s === "ok" ? ["check-circle", T.g500] : s === "run" ? ["sparkle", T.ai500] : s === "none" ? ["minus-circle", T.o500] : s === "err" ? ["warning-circle", T.r500] : ["circle-dashed", T.n700];
  const warns = fields.filter(f => f.warn).length;
  const DPE_C: Record<string, string> = { A: "#009C6D", B: "#52B153", C: "#A5CC74", D: "#F4E70F", E: "#F0B40F", F: "#EB8235", G: "#D7221F" };

  return (<>
    <div>
      <h1 style={{ ...txt.h3, margin: 0 }}>Nouvelle copropriété</h1>
      <div style={{ ...txt.bodyM, color: T.n800, marginTop: 4 }}>La carte d'identité se remplit à partir des sources publiques, sans saisie. Appels réels, données publiques.</div>
    </div>
    <BlockWrapper type="Edit" title="Retrouver la copropriété" icon="magnifying-glass"
      right={<Segmented value={mode} onChange={m => { setMode(m); setSugg([]); }} options={[{ v: "adresse", label: "Par adresse" }, { v: "immat", label: "Par n° d'immatriculation" }]} />}>
      {mode === "adresse" ? (
        <div style={{ position: "relative" }}>
          <Input size="Medium" label="Adresse de la copropriété" value={q} onChange={v => { setQ(v); setAdr(null); }} placeholder="Ex. : 37 rue Inkermann, Lille" subtext="Adresse vérifiée par la Base adresse nationale" />
          {sugg.length > 0 && (
            <div style={{ position: "absolute", top: 66, left: 0, right: 0, background: T.white, border: `1px solid ${T.n500}`, borderRadius: 4, zIndex: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.25)" }}>
              {sugg.map(s => <div key={s.id} onClick={() => { setSugg([]); run(s); }} style={{ padding: "8px 12px", cursor: "pointer", ...txt.bodyS }} onMouseEnter={e => (e.currentTarget.style.background = T.p50)} onMouseLeave={e => (e.currentTarget.style.background = T.white)}>{s.label}</div>)}
            </div>)}
        </div>
      ) : (
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <Input size="Medium" label="N° d'immatriculation au registre" value={immat} onChange={setImmat} placeholder="Ex. : AB5691118" width={320} />
          <Button size="Medium" aspect="Plain" label="Rechercher" icon="magnifying-glass" onClick={() => immat.trim() && run(null, immat)} />
        </div>
      )}
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ ...txt.bodyS, color: T.n800 }}>Exemples :</span>
        {EXEMPLES.map(x => <Button key={x.label} size="Tiny" aspect="Outline" label={x.label} onClick={async () => {
          if (x.immat) { setMode("immat"); setImmat(x.immat); run(null, x.immat); }
          else { setMode("adresse"); try { const g = await getJ("https://data.geopf.fr/geocodage/search?index=address&limit=1&q=" + encodeURIComponent(x.q!)); const f = g.features[0]; run({ label: f.properties.label, id: f.properties.id, citycode: f.properties.citycode, lon: f.geometry.coordinates[0], lat: f.geometry.coordinates[1] }); } catch { /* */ } }
        }} />)}
      </div>
    </BlockWrapper>

    {steps.length > 0 && (
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {steps.map(s => { const [i, c] = ic(s.state); return (
          <div key={s.src} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, background: T.n100, ...txt.bodyS }}>
            <Icon n={i} size={16} color={c} /><b>{s.label}</b>{s.info && <span style={{ ...txt.bodyXS }}>{s.info}</span>}
          </div>); })}
      </div>
    )}

    {cands.length > 0 && (
      <BlockWrapper title="Plusieurs copropriétés immatriculées à proximité" icon="map-pin">
        <span style={txt.bodyS}>Aucune ne correspond exactement à l'adresse. Choisissez la bonne :</span>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>{["Immatriculation", "Adresse de référence", "Lots", "Distance", ""].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>{cands.map(c => <tr key={c.numero_d_immatriculation}><td style={td}>{c.numero_d_immatriculation}</td><td style={td}>{c.adresse_de_reference}</td><td style={td}>{c.nombre_total_de_lots}</td><td style={td}>{Math.round(c.dist)} m</td>
            <td style={td}><Button size="Tiny" aspect="Outline" label="Choisir" onClick={() => applyRnic(c)} /></td></tr>)}</tbody>
        </table>
      </BlockWrapper>
    )}

    {fields.length > 0 && (
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 32, alignItems: "start" }}>
        <BlockWrapper title="Carte d'identité pré-remplie" icon="identification-card"
          right={<Tag label={`${fields.length} champs · ${new Set(fields.map(f => f.src)).size} sources`} status="Success" size="Medium" />}
          footerRight={done ? <Button size="Small" aspect="Plain" icon="check" label={created ? "Dossier créé" : "Créer le dossier"} disabled={created} onClick={() => setCreated(true)} /> : undefined}>
          {warns > 0 && <AlertBlock type="Warning" title={`${warns} écart${warns > 1 ? "s" : ""} entre sources`}>Les valeurs signalées en orange diffèrent d'une base à l'autre : à confirmer avec le syndic ou lors de la visite.</AlertBlock>}
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>{fields.map((f, i) => (
              <tr key={i}>
                <td style={{ ...td, color: T.n800, width: "38%" }}>{f.k}</td>
                <td style={{ ...td, fontWeight: 700, color: f.warn ? T.o500 : T.p900 }}>{f.v}{f.warn && <div style={{ ...txt.bodyXS, color: T.o500, fontWeight: 400, marginTop: 2 }}>{f.warn}</div>}</td>
                <td style={{ ...td, textAlign: "right", width: 130 }}><Tag label={SRC_TAG[f.src]} status="Light" /></td>
              </tr>))}</tbody>
          </table>
          {created && <AlertBlock type="Success">Dossier créé (démo) : la carte d'identité, le Bilan initial et le double DPE sont pré-remplis. Le syndic peut être invité.</AlertBlock>}
        </BlockWrapper>
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {dpe && dpe.total > 0 && (
            <BlockWrapper title="DPE des logements" icon="lightning" right={<Tag label="DPE ADEME" status="Light" />}>
              <span style={txt.bodyS}>{dpe.total} DPE déposés à cette adresse</span>
              {["A", "B", "C", "D", "E", "F", "G"].map(l => { const n = dpe.rep[l] || 0; const pct = dpe.total ? n / dpe.total * 100 : 0; return (
                <div key={l} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 24, height: 24, borderRadius: 4, background: DPE_C[l], color: l === "D" || l === "C" ? T.p900 : T.white, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12 }}>{l}</span>
                  <div style={{ flex: 1, height: 8, background: T.n300, borderRadius: 4 }}><div style={{ width: `${pct}%`, height: "100%", background: DPE_C[l], borderRadius: 4 }} /></div>
                  <span style={{ ...txt.bodyS, width: 64, textAlign: "right" }}>{n} · {Math.round(pct)} %</span>
                </div>); })}
              <span style={txt.bodyXS}>Base de l'état initial « logement » du double DPE. Les DPE sont rattachés par l'identifiant d'adresse.</span>
            </BlockWrapper>)}
          <AlertBlock type="Info" title="Sources">Base adresse nationale · Registre national d'immatriculation des copropriétés (data.gouv, mise à jour trimestrielle) · Cadastre (Géoplateforme IGN) · BDNB (CSTB) · DPE (ADEME) · Recherche d'entreprises (SIRENE).</AlertBlock>
        </div>
      </div>
    )}
  </>);
}
