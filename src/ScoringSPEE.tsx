// Grille de scoring du SPEE HDF (fichier « SCORING QUALIFICATION », 20 indicateurs, 100 points),
// alimentée par : API publiques (registre, BDNB, DPE ADEME, servitudes), formulaire du demandeur,
// documents lus par Marius IA (annexes comptables, PV d'AG, audit) et appréciation du chargé d'opération.
import React, { useEffect, useState } from "react";
import { T, txt, Icon, Tag, BlockWrapper, AlertBlock, Select, th, td, TagStatus } from "./ds";
import type { Field } from "./CreerCopro";

export type SpeeInputs = {
  prochaineAGmois: number | null;            // délai avant la prochaine AG (mois)
  anciennete: "" | "> 10 ans" | "> 5 ans" | "< 5 ans";
  pctPO: number | null; nbCopro: number | null;
  impayes: number | null; impayesSrc: string;
  charges: "" | "Elevé" | "Normal" | "Peu elevé"; fonds: "" | "Elevé" | "Normal" | "Peu elevé"; financeSrc: string;
  participationAG: number | null; nbPostes: number | null; gain: number | null; docSrc: string;
  relation: "" | "Bonne" | "Moyenne" | "A améliorer"; implication: "" | "Bonne" | "Moyenne" | "A améliorer"; motivation: "" | "Bonne" | "Moyenne" | "A améliorer";
  dpeOuAudit: boolean;
};
type Src = "API" | "Formulaire" | "Marius IA" | "CO" | "Manquant";
type Ind = { n: number; sec: string; label: string; max: number; val: string; pts: number | null; src: Src; srcDet: string; co?: keyof SpeeInputs; opts?: string[] };

const ENC = (s: string) => { try { return decodeURIComponent(escape(s)); } catch { return s; } };
const getJ = async (u: string) => { const r = await fetch(u); if (!r.ok) throw new Error(String(r.status)); return r.json(); };

// Données complémentaires API : isolation et énergie (DPE ADEME agrégés), servitudes patrimoniales (Géoplateforme)
export function useSpeeApi(adr: { id: string; lat: number; lon: number } | null) {
  const [x, setX] = useState<{ iso?: Record<string, Record<string, number>>; energie?: string; sup?: string[]; loading: boolean }>({ loading: false });
  useEffect(() => {
    if (!adr) return; let stop = false; setX({ loading: true });
    (async () => {
      const agg = async (field: string) => { try { const a = await getJ("https://data.ademe.fr/data-fair/api/v1/datasets/dpe03existant/values_agg?field=" + field + "&agg_size=8&qs=" + encodeURIComponent(`identifiant_ban:"${adr.id}"`)); const o: Record<string, number> = {}; a.aggs.forEach((g: any) => o[g.value] = g.total); return o; } catch { return {}; } };
      const [murs, pb, tt, cp, vent, en] = await Promise.all(["qualite_isolation_murs", "qualite_isolation_plancher_bas", "qualite_isolation_plancher_haut_toit_terrasse", "qualite_isolation_plancher_haut_comble_perdu", "type_ventilation", "type_energie_principale_chauffage"].map(agg));
      let sup: string[] = [];
      try {
        const w = await getJ("https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&OUTPUTFORMAT=application/json&COUNT=20&TYPENAMES=wfs_sup:assiette_sup_s&CQL_FILTER=" + encodeURIComponent(`INTERSECTS(the_geom,POINT(${adr.lat} ${adr.lon}))`));
        sup = w.features.filter((f: any) => /^ac(1|2|4)$/i.test(f.properties.suptype || "")).map((f: any) => `${String(f.properties.suptype).toUpperCase()} · ${ENC(f.properties.nomsuplitt || f.properties.nomass || "")}`);
      } catch { /* */ }
      const top = (o: Record<string, number>) => Object.entries(o).sort((a, b) => b[1] - a[1])[0]?.[0];
      if (!stop) setX({ loading: false, iso: { murs, pb, toit: { ...tt, ...cp }, vent }, energie: top(en), sup });
    })();
    return () => { stop = true; };
  }, [adr?.id]);
  return x;
}

const maj = (o?: Record<string, number>) => { if (!o) return null; const t = Object.values(o).reduce((a, b) => a + b, 0); if (!t) return null; const bad = Object.entries(o).filter(([k]) => /insuffisante|moyenne/i.test(k)).reduce((a, [, v]) => a + v, 0); return bad / t > 0.5; };
const ventNI = (o?: Record<string, number>) => { if (!o) return null; const t = Object.values(o).reduce((a, b) => a + b, 0); if (!t) return null; const nat = Object.entries(o).filter(([k]) => /naturelle|ouverture|avant 1982/i.test(k)).reduce((a, [, v]) => a + v, 0); return nat / t > 0.5; };

export function computeSpee(fields: Field[], dpe: { total: number; rep: Record<string, number> } | null, api: ReturnType<typeof useSpeeApi>, i: SpeeInputs, demandeurType: string): Ind[] {
  const f = (k: string) => fields.find(x => x.k === k)?.v;
  const has = fields.length > 0;
  const L: Ind[] = [];
  const add = (x: Ind) => L.push(x);
  const S1 = "Prise de contact et timing", S2 = "Focus gestion", S3 = "Profil de la copropriété", S4 = "Focus technique et thermique";
  // 1
  add({ n: 1, sec: S1, label: "Date de la prochaine AG", max: 1, val: i.prochaineAGmois == null ? "non fixée" : `dans ${i.prochaineAGmois} mois`, pts: i.prochaineAGmois == null ? null : i.prochaineAGmois <= 6 ? 1 : 0, src: i.prochaineAGmois == null ? "Manquant" : "Formulaire", srcDet: "Formulaire" });
  // 2
  const regType = String(f("Type de syndic") || "").toLowerCase();
  const typ = /professionnel/.test(regType) || demandeurType === "Syndic professionnel" ? "Professionnel" : /b.n.vole/.test(regType) || demandeurType === "Syndic bénévole" ? "Bénévole" : regType ? "Sans syndic / non connu" : "";
  add({ n: 2, sec: S2, label: "Type de syndic", max: 3, val: typ || "…", pts: typ ? (typ === "Professionnel" ? 3 : 0) : null, src: regType ? "API" : typ ? "Formulaire" : "Manquant", srcDet: regType ? `Registre : ${regType}` : "Demandeur" });
  add({ n: 3, sec: S2, label: "Ancienneté du syndic", max: 2, val: i.anciennete || "…", pts: i.anciennete ? (i.anciennete === "> 10 ans" ? 2 : i.anciennete === "> 5 ans" ? 1 : 0) : null, src: i.anciennete ? "Formulaire" : "Manquant", srcDet: "Formulaire (le registre ne date pas le début du mandat)" });
  const sc3 = (v: string, a: number, b: number, c: number) => v === "Bonne" ? a : v === "Moyenne" ? b : v === "A améliorer" ? c : null;
  add({ n: 4, sec: S2, label: "Relation conseil syndical / syndic", max: 2, val: i.relation || "à apprécier", pts: sc3(i.relation, 2, 1, 0), src: i.relation ? "CO" : "Manquant", srcDet: "Chargé d'opération, après entretien", co: "relation", opts: ["Bonne", "Moyenne", "A améliorer"] });
  add({ n: 5, sec: S2, label: "Implication du conseil syndical", max: 5, val: i.implication || "à apprécier", pts: sc3(i.implication, 5, 3, 1), src: i.implication ? "CO" : "Manquant", srcDet: "Chargé d'opération, après entretien", co: "implication", opts: ["Bonne", "Moyenne", "A améliorer"] });
  add({ n: 6, sec: S2, label: "Motivation pour le projet de rénovation", max: 7, val: i.motivation || "à apprécier", pts: sc3(i.motivation, 7, 5, 2), src: i.motivation ? "CO" : "Manquant", srcDet: "Chargé d'opération (le formulaire donne les motivations déclarées)", co: "motivation", opts: ["Bonne", "Moyenne", "A améliorer"] });
  add({ n: 7, sec: S2, label: "Taux d'impayés", max: 9, val: i.impayes == null ? "…" : `${i.impayes} %`, pts: i.impayes == null ? null : i.impayes < 8 ? 9 : i.impayes < 15 ? 5 : i.impayes < 25 ? 2 : 0, src: i.impayes == null ? "Manquant" : i.impayesSrc.startsWith("Marius") ? "Marius IA" : "Formulaire", srcDet: i.impayesSrc });
  const lvl = (v: string, a: number, b: number, c: number) => v === "Elevé" ? a : v === "Normal" ? b : v === "Peu elevé" ? c : null;
  add({ n: 8, sec: S2, label: "Montant des charges trimestrielles", max: 5, val: i.charges || "…", pts: lvl(i.charges, 5, 3, 1), src: i.charges ? "Marius IA" : "Manquant", srcDet: i.charges ? i.financeSrc : "Annexes comptables à déposer" });
  add({ n: 9, sec: S2, label: "Fonds de travaux ALUR", max: 3, val: i.fonds || "…", pts: lvl(i.fonds, 3, 2, 1), src: i.fonds ? "Marius IA" : "Manquant", srcDet: i.fonds ? i.financeSrc : "Annexes comptables à déposer" });
  add({ n: 10, sec: S2, label: "Taux de participation aux AG", max: 7, val: i.participationAG == null ? "…" : `${i.participationAG} %`, pts: i.participationAG == null ? null : i.participationAG > 50 ? 7 : i.participationAG > 30 ? 3 : 0, src: i.participationAG == null ? "Manquant" : "Marius IA", srcDet: i.participationAG == null ? "PV d'AG à déposer" : "Marius IA · dernier PV d'AG" });
  // Profil
  const lotsH = Number(f("Lots d'habitation") || 0) || Number(f("Logements (bâtiment)") || 0) || null;
  add({ n: 11, sec: S3, label: "Nombre de lots d'habitation", max: 7, val: lotsH == null ? (has ? "…" : "en cours") : String(lotsH), pts: lotsH == null ? null : lotsH > 100 ? 7 : lotsH > 50 ? 5 : lotsH > 20 ? 3 : 0, src: lotsH == null ? "Manquant" : "API", srcDet: f("Lots d'habitation") ? "Registre des copropriétés" : "BDNB" });
  add({ n: 12, sec: S3, label: "Part de propriétaires occupants", max: 2, val: i.pctPO == null ? "…" : `${i.pctPO} %`, pts: i.pctPO == null ? null : i.pctPO > 70 ? 2 : i.pctPO > 50 ? 1 : 0, src: i.pctPO == null ? "Manquant" : "Formulaire", srcDet: "Formulaire (fichiers fonciers : accès public à ouvrir)" });
  const an = Number(f("Année de construction")) || null; const per = f("Période de construction");
  const yr = an || (per ? (/avant 1949/.test(per) ? 1940 : Number((/(\d{4})/.exec(per) || [])[1]) || null) : null);
  add({ n: 13, sec: S3, label: "Date de construction", max: 2, val: an ? String(an) : per || "…", pts: yr == null ? null : yr < 1980 ? 2 : yr < 2000 ? 1 : 0, src: yr == null ? "Manquant" : "API", srcDet: an ? "BDNB" : "Registre des copropriétés" });
  const supOk = api.sup !== undefined;
  add({ n: 14, sec: S3, label: "Contrainte architecturale", max: 7, val: !supOk ? "en cours" : api.sup!.length ? `Oui · ${api.sup![0]}${api.sup!.length > 1 ? ` (+${api.sup!.length - 1})` : ""}` : "Non", pts: !supOk ? null : api.sup!.length ? 3 : 7, src: supOk ? "API" : "Manquant", srcDet: "Servitudes patrimoniales (Géoplateforme) : abords de monuments historiques, sites patrimoniaux" });
  // Technique et thermique
  add({ n: 15, sec: S4, label: "DPE collectif ou audit énergétique disponible", max: 5, val: i.dpeOuAudit ? "Oui" : "Non", pts: i.dpeOuAudit ? 5 : 3, src: i.dpeOuAudit ? "Marius IA" : "Formulaire", srcDet: i.dpeOuAudit ? i.docSrc : "Aucune pièce jointe" });
  const dom = f("Étiquette DPE dominante") || (dpe?.total ? Object.entries(dpe.rep).sort((a, b) => b[1] - a[1])[0]?.[0] : undefined);
  add({ n: 16, sec: S4, label: "Étiquette avant travaux", max: 7, val: dom ? `${dom}${dpe?.total ? ` (${dpe.total} DPE de logements)` : ""}` : "…", pts: dom ? (["F", "G"].includes(dom) ? 7 : ["D", "E"].includes(dom) ? 5 : 0) : null, src: dom ? "API" : "Manquant", srcDet: f("Étiquette DPE dominante") ? "BDNB" : "DPE ADEME" });
  add({ n: 17, sec: S4, label: "Gain énergétique estimé", max: 7, val: i.gain == null ? "…" : `${i.gain} %`, pts: i.gain == null ? null : i.gain > 45 ? 7 : i.gain > 40 ? 5 : i.gain > 35 ? 3 : 0, src: i.gain == null ? "Manquant" : "Marius IA", srcDet: i.gain == null ? "Audit énergétique à déposer" : "Marius IA · audit" });
  const ni = [maj(api.iso?.murs), maj(api.iso?.toit), ventNI(api.iso?.vent), maj(api.iso?.pb)];
  const known = ni.filter(x => x !== null).length; const nbNI = ni.filter(x => x === true).length;
  const det = ["Façades", "Toiture", "Ventilation", "Planchers bas"].map((n, k) => `${n} ${ni[k] === null ? "?" : ni[k] ? "NI" : "OK"}`).join(" · ");
  add({ n: 18, sec: S4, label: "État des lieux : postes non isolés", max: 7, val: api.loading || !api.iso ? "en cours" : known ? `${nbNI} non isolé${nbNI > 1 ? "s" : ""} · ${det}` : "…", pts: !known ? null : nbNI >= 4 ? 7 : nbNI === 3 ? 5 : nbNI === 2 ? 3 : 0, src: known ? "API" : "Manquant", srcDet: "DPE ADEME des logements (qualité d'isolation, ventilation)" });
  const en = String(api.energie || f("Chauffage") || "");
  const e19 = /fioul/i.test(en) ? ["Fioul", 5] : /gaz/i.test(en) ? ["Gaz", 4] : /lec/i.test(en) ? ["Électricité", 3] : /r.seau|urbain/i.test(en) ? ["Chauffage urbain", 2] : null;
  add({ n: 19, sec: S4, label: "Énergie de chauffage", max: 5, val: e19 ? String(e19[0]) : en || "…", pts: e19 ? Number(e19[1]) : null, src: e19 ? "API" : "Manquant", srcDet: api.energie ? "DPE ADEME (énergie majoritaire)" : "BDNB" });
  add({ n: 20, sec: S4, label: "Projet de travaux : nombre de postes", max: 7, val: i.nbPostes == null ? "…" : `${i.nbPostes} postes`, pts: i.nbPostes == null ? null : i.nbPostes >= 5 ? 7 : i.nbPostes === 4 ? 5 : i.nbPostes === 3 ? 3 : 0, src: i.nbPostes == null ? "Manquant" : "Marius IA", srcDet: i.nbPostes == null ? "Audit ou DTG à déposer" : i.docSrc });
  return L;
}

const SRC_TAG: Record<Src, { s: TagStatus; l: string }> = { API: { s: "AI", l: "API" }, Formulaire: { s: "Light", l: "Formulaire" }, "Marius IA": { s: "AI", l: "Marius IA" }, CO: { s: "Info", l: "Chargé d'op." }, Manquant: { s: "Warning", l: "À compléter" } };

export function ScoringSPEE({ inds, onCo, fragile, nbCopro }: { inds: Ind[]; onCo: (k: keyof SpeeInputs, v: string) => void; fragile: string | null; nbCopro: number | null }) {
  const total = inds.reduce((a, x) => a + (x.pts || 0), 0);
  const possible = inds.reduce((a, x) => a + x.max, 0);
  const manq = inds.filter(x => x.pts == null);
  const enjeu = manq.reduce((a, x) => a + x.max, 0);
  const color = total > 70 ? T.g500 : total >= 30 ? T.o500 : T.r500;
  const label = total > 70 ? "Vert" : total >= 30 ? "Orange" : "Rouge";
  const secs = Array.from(new Set(inds.map(x => x.sec)));
  const bySrc = (s: Src) => inds.filter(x => x.src === s).length;
  return (
    <BlockWrapper title="Scoring SPEE Hauts-de-France" icon="gauge" right={<Tag label="Grille du SPEE · 20 indicateurs" status="Light" size="Medium" />}>
      <div style={{ display: "flex", gap: 16, alignItems: "stretch", flexWrap: "wrap" }}>
        <div style={{ minWidth: 160, background: T.n100, borderRadius: 8, padding: 16, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <span style={{ fontFamily: "Montserrat,sans-serif", fontWeight: 700, fontSize: 36, lineHeight: "40px", color }}>{total}</span>
          <span style={txt.bodyXS}>sur {possible} points</span>
          <Tag label={label} status={total > 70 ? "Success" : total >= 30 ? "Warning" : "Error"} size="Medium" />
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, justifyContent: "center" }}>
          <div style={{ height: 12, background: T.n300, borderRadius: 6, position: "relative", overflow: "hidden" }}>
            <div style={{ width: `${total}%`, height: "100%", background: color }} />
            <div style={{ position: "absolute", left: `${total}%`, top: 0, width: `${enjeu}%`, height: "100%", background: `repeating-linear-gradient(45deg, ${T.n500}, ${T.n500} 4px, ${T.n300} 4px, ${T.n300} 8px)` }} />
          </div>
          <span style={txt.bodyXS}>Seuils du SPEE : rouge &lt; 30 · orange 30 à 70 · vert &gt; 70. Hachuré : {enjeu} points encore en jeu ({manq.length} indicateurs à compléter).</span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Tag label={`${bySrc("API")} par API`} status="AI" /><Tag label={`${bySrc("Marius IA")} par Marius IA`} status="AI" /><Tag label={`${bySrc("Formulaire")} par le formulaire`} status="Light" /><Tag label={`${bySrc("CO")} par le chargé d'opération`} status="Info" />{manq.length > 0 && <Tag label={`${manq.length} à compléter`} status="Warning" />}
          </div>
        </div>
      </div>
      {fragile && <AlertBlock type="Warning" title="Copropriété fragile">{fragile}</AlertBlock>}
      {secs.map(sec => (
        <div key={sec} style={{ border: `1px solid ${T.n300}`, borderRadius: 8, overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: T.n100 }}>
            <span style={txt.bodySB}>{sec}</span>
            <span style={txt.bodyS}>{inds.filter(x => x.sec === sec).reduce((a, x) => a + (x.pts || 0), 0)} / {inds.filter(x => x.sec === sec).reduce((a, x) => a + x.max, 0)}</span>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}><tbody>
            {inds.filter(x => x.sec === sec).map(x => (
              <tr key={x.n}>
                <td style={{ ...td, width: 28, color: T.n800 }}>{x.n}</td>
                <td style={{ ...td, width: "34%" }}>{x.label}<div style={txt.bodyXS}>{x.srcDet}</div></td>
                <td style={td}>{x.co ? <Select value={String(x.val).startsWith("à ") ? "" : x.val} onChange={v => onCo(x.co!, v)} options={[{ v: "", label: "À apprécier…" }, ...x.opts!.map(o => ({ v: o, label: o }))]} /> : <span style={{ ...txt.bodyS, fontWeight: 700, color: x.pts == null ? T.o500 : T.p900 }}>{x.val}</span>}</td>
                <td style={{ ...td, width: 110 }}><Tag label={SRC_TAG[x.src].l} status={SRC_TAG[x.src].s} /></td>
                <td style={{ ...td, width: 64, textAlign: "right", fontWeight: 700 }}>{x.pts == null ? "–" : x.pts} <span style={{ ...txt.bodyXS }}>/ {x.max}</span></td>
              </tr>))}
          </tbody></table>
        </div>))}
      {manq.length > 0 && (
        <AlertBlock type="Neutral" title="Pour compléter le scoring">
          {manq.map(x => <div key={x.n}>• {x.n}. {x.label} : {x.srcDet}</div>)}
        </AlertBlock>)}
      {nbCopro != null && <span style={txt.bodyXS}>Coût Pass Copro estimé (grille SPEE : 1 500 € × nombre de copropriétaires) : {(1500 * nbCopro).toLocaleString("fr-FR")} €.</span>}
    </BlockWrapper>
  );
}
