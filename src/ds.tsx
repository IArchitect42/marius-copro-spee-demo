// Mini-kit de démo qui reproduit les atomes THE DAM et quelques composants d'Ecrans Web App
// (skill ds-marius). Valeurs reprises telles quelles : couleurs, typo, Scale, rayons.
import React, { useState } from "react";

export const T = {
  n50: "#FBFBFB", n100: "#F2F3F4", n200: "#ECEEEE", n300: "#E4E6E7", n500: "#D6D9DB", n600: "#C3C5C7", n700: "#989A9B", n800: "#767778", n900: "#5A5B5C",
  p50: "#EAEEF0", p100: "#BECCD1", p200: "#9FB3BB", p300: "#73909C", p400: "#587A89", p500: "#2E596B", p600: "#2A5161", p700: "#213F4C", p900: "#13252D",
  s50: "#F3F9EC", s100: "#D9EBC4", s500: "#84BF40", s700: "#5E882D",
  r50: "#FBEAEA", r200: "#DA5252", r500: "#811D1D",
  o50: "#FEF2E6", o200: "#F7922B", o500: "#954C00",
  g50: "#EBF4EC", g200: "#5AA15D", g500: "#225725",
  b50: "#E6F3FA", b200: "#2D9CD9", b500: "#01537F",
  ai50: "#F7E6FF", ai200: "#BC2BFF", ai500: "#6A009C",
  TMO: "#C9E0F0", MO: "#F7EBB7", INT: "#C9C9E5", SUP: "#FAC9B4", white: "#FFFFFF",
};
export const F = { title: "Montserrat,sans-serif", body: "Inter,sans-serif" };
export const txt = {
  h3: { fontFamily: F.title, fontWeight: 700, fontSize: 24, lineHeight: "32px", color: T.p900 },
  h4: { fontFamily: F.title, fontWeight: 600, fontSize: 20, lineHeight: "24px", color: T.p900 },
  bodyM: { fontFamily: F.body, fontSize: 16, lineHeight: "24px", color: T.p900 },
  bodyS: { fontFamily: F.body, fontSize: 14, lineHeight: "16px", color: T.p900 },
  bodyXS: { fontFamily: F.body, fontSize: 10, lineHeight: "12px", color: T.n800 },
  bodySB: { fontFamily: F.body, fontSize: 14, lineHeight: "16px", fontWeight: 700, color: T.p900 },
  menuSub: { fontFamily: F.title, fontWeight: 600, fontSize: 16, lineHeight: "16px", color: T.n800 },
} as const;
export const fmtE = (n: number) => Math.round(n).toLocaleString("fr-FR") + " €";

export const Icon = ({ n, size = 24, color }: { n: string; size?: number; color?: string }) =>
  <i className={`ph-light ph-${n}`} style={{ fontSize: size, color, lineHeight: 1, display: "inline-block" }} />;

// ── Button (Tiny 24 / Small 32 / Medium 40) ───────────────────────────
type Aspect = "Plain" | "Outline" | "Positive" | "Negative" | "Neutral";
export function Button({ label, size = "Small", aspect = "Plain", icon, iconRight, onClick, disabled, title }:
  { label?: string; size?: "Tiny" | "Small" | "Medium"; aspect?: Aspect; icon?: string; iconRight?: string; onClick?: () => void; disabled?: boolean; title?: string }) {
  const [h, setH] = useState(false);
  const dim = { Tiny: { h: 24, p: 4, g: 2, i: 12, fs: 10, lh: "10px", fw: 500 }, Small: { h: 32, p: 8, g: 4, i: 16, fs: 14, lh: "20px", fw: 600 }, Medium: { h: 40, p: 8, g: 8, i: 24, fs: 16, lh: "24px", fw: 700 } }[size];
  const pal: Record<Aspect, { bg: string; c: string; b: string; hbg: string }> = {
    Plain: { bg: T.p500, c: T.n50, b: T.p500, hbg: T.p700 },
    Outline: { bg: T.white, c: T.p500, b: T.p500, hbg: T.p50 },
    Positive: { bg: T.g500, c: T.n50, b: T.g500, hbg: "#27632A" },
    Negative: { bg: T.r500, c: T.n50, b: T.r500, hbg: "#942121" },
    Neutral: { bg: T.n300, c: T.p900, b: T.n300, hbg: T.n500 },
  };
  const c = pal[aspect];
  const st = disabled ? { bg: T.n300, c: T.n800, b: T.n300 } : { bg: h ? c.hbg : c.bg, c: c.c, b: c.b };
  return (
    <button title={title} disabled={disabled} onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ height: dim.h, minWidth: dim.h, padding: `0 ${dim.p}px`, gap: dim.g, display: "inline-flex", alignItems: "center", justifyContent: "center",
        background: st.bg, color: st.c, border: `1px solid ${st.b}`, borderRadius: 4, cursor: disabled ? "default" : "pointer", boxSizing: "border-box", whiteSpace: "nowrap" }}>
      {icon && <Icon n={icon} size={dim.i} />}
      {label && <span style={{ fontFamily: F.title, fontSize: dim.fs, lineHeight: dim.lh, fontWeight: dim.fw, padding: "0 4px" }}>{label}</span>}
      {iconRight && <Icon n={iconRight} size={dim.i} />}
    </button>
  );
}

// ── Tag (Small 16 / Medium 24, radius 12) ─────────────────────────────
export type TagStatus = "Dark" | "Info" | "Success" | "Warning" | "Error" | "Grey" | "Light" | "AI" | "Disabled";
const TAGC: Record<TagStatus, { bg: string; c: string }> = {
  Dark: { bg: T.p900, c: T.n50 }, Info: { bg: T.b50, c: T.b500 }, Success: { bg: T.g50, c: T.g500 }, Warning: { bg: T.o50, c: T.o500 },
  Error: { bg: T.r50, c: T.r500 }, Grey: { bg: T.n300, c: T.p900 }, Light: { bg: T.p50, c: T.p500 }, AI: { bg: T.ai50, c: T.ai500 }, Disabled: { bg: T.n300, c: T.n800 },
};
export function Tag({ label, status = "Light", size = "Small", icon, outline }: { label: string; status?: TagStatus; size?: "Small" | "Medium"; icon?: string; outline?: boolean }) {
  const c = TAGC[status]; const sm = size === "Small";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: sm ? 4 : 8, height: sm ? 16 : 24, padding: `0 ${sm ? 8 : 12}px`, borderRadius: 12,
      background: outline ? T.white : c.bg, color: c.c, border: outline ? `1px solid ${c.c}` : "none", fontFamily: F.body, fontWeight: 500,
      fontSize: sm ? 10 : 12, lineHeight: sm ? "12px" : "14px", whiteSpace: "nowrap", boxSizing: "border-box" }}>
      {icon && <Icon n={icon} size={sm ? 12 : 16} />}{label}
    </span>
  );
}

// ── Block Wrapper (radius 8, Read Only neutral-50 / Edit neutral-200) ──
export function BlockWrapper({ title, icon, type = "ReadOnly", children, footerLeft, footerRight, right }:
  { title?: string; icon?: string; type?: "ReadOnly" | "Edit" | "DropOver"; children?: React.ReactNode; footerLeft?: React.ReactNode; footerRight?: React.ReactNode; right?: React.ReactNode }) {
  const st = type === "Edit" ? { background: T.n200, border: "none" } : type === "DropOver" ? { background: T.p50, border: `1px dashed ${T.p500}` } : { background: T.n50, border: `1px solid ${T.n600}` };
  return (
    <section style={{ ...st, borderRadius: 8, padding: "16px 0", display: "flex", flexDirection: "column", gap: 16, boxSizing: "border-box" }}>
      {title && <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 16px" }}>
        {icon && <Icon n={icon} size={24} color={T.p500} />}
        <div style={{ ...txt.h4, flex: 1 }}>{title}</div>{right}
      </div>}
      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: type === "Edit" ? 16 : 8 }}>{children}</div>
      {(footerLeft || footerRight) && <div style={{ borderTop: `1px solid ${T.n500}`, padding: "16px 16px 0", display: "flex", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex", gap: 8 }}>{footerLeft}</div><div style={{ display: "flex", gap: 8 }}>{footerRight}</div>
      </div>}
    </section>
  );
}

export const KeyValue = ({ k, v, warning }: { k: string; v: React.ReactNode; warning?: boolean }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    <span style={{ ...txt.bodyS, color: T.n800 }}>{k}</span>
    <span style={{ ...txt.bodyM, fontWeight: 700, color: warning ? T.o500 : T.p900 }}>{v}</span>
  </div>
);

// ── Alert Block (radius 4) ────────────────────────────────────────────
type AlertType = "Error" | "Warning" | "Success" | "Info" | "Neutral" | "AI";
const ALC: Record<AlertType, { bg: string; c: string; i: string }> = {
  Error: { bg: T.r50, c: T.r500, i: "warning-circle" }, Warning: { bg: T.o50, c: T.o500, i: "warning" }, Success: { bg: T.g50, c: T.g500, i: "check-circle" },
  Info: { bg: T.b50, c: T.b500, i: "info" }, Neutral: { bg: T.n200, c: T.p900, i: "info" }, AI: { bg: T.ai50, c: T.ai500, i: "sparkle" },
};
export function AlertBlock({ type = "Info", size = "Small", title, children, action }: { type?: AlertType; size?: "Small" | "Medium"; title?: string; children?: React.ReactNode; action?: React.ReactNode }) {
  const c = ALC[type];
  return (
    <div style={{ background: c.bg, borderRadius: 4, padding: size === "Medium" ? 16 : 12, display: "flex", gap: 12, color: c.c }}>
      <Icon n={c.i} size={size === "Medium" ? 32 : 24} color={c.c} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        {title && <div style={{ ...txt.bodySB, color: c.c }}>{title}</div>}
        <div style={{ ...txt.bodyS, color: c.c, lineHeight: "20px" }}>{children}</div>
        {action && <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>{action}</div>}
      </div>
    </div>
  );
}

// ── Segmented Control (24, radius 16 côté arrondi) ────────────────────
export function Segmented<V extends string>({ options, value, onChange }: { options: { v: V; label: string; icon?: string }[]; value: V; onChange: (v: V) => void }) {
  return (
    <div style={{ display: "inline-flex" }}>
      {options.map((o, i) => {
        const sel = o.v === value; const first = i === 0, last = i === options.length - 1;
        return (
          <button key={o.v} onClick={() => onChange(o.v)} style={{ height: 24, padding: "0 12px", display: "inline-flex", alignItems: "center", gap: 4, cursor: "pointer",
            background: sel ? T.p500 : T.n300, color: sel ? T.n50 : T.p900, border: "none", borderRight: !last && !sel ? `1px solid ${T.n500}` : "none",
            borderRadius: `${first ? 16 : 0}px ${last ? 16 : 0}px ${last ? 16 : 0}px ${first ? 16 : 0}px`, fontFamily: F.title, fontSize: 10, fontWeight: sel ? 600 : 500 }}>
            {o.icon && <Icon n={o.icon} size={12} />}{o.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Tab Menu V2 (Tab Element 32, Montserrat 14) ───────────────────────
export function TabMenu<V extends string>({ tabs, value, onChange }: { tabs: { v: V; label: string; icon?: string; badge?: number }[]; value: V; onChange: (v: V) => void }) {
  return (
    <div style={{ display: "flex", gap: 4, borderBottom: `1px solid ${T.n300}` }}>
      {tabs.map(t => {
        const sel = t.v === value;
        return (
          <button key={t.v} onClick={() => onChange(t.v)} style={{ height: 32, padding: "0 12px", display: "flex", alignItems: "center", gap: 8, background: "none", border: "none",
            borderBottom: `2px solid ${sel ? T.p500 : "transparent"}`, cursor: "pointer", fontFamily: F.title, fontSize: 14, lineHeight: "16px", fontWeight: sel ? 600 : 400, color: sel ? T.p500 : T.p600 }}>
            {t.icon && <Icon n={t.icon} size={16} />}{t.label}
            {t.badge != null && <span style={{ background: T.p500, color: T.n50, borderRadius: 8, padding: "0 6px", fontSize: 10, lineHeight: "16px", fontFamily: F.body }}>{t.badge}</span>}
          </button>
        );
      })}
    </div>
  );
}

// ── Formulaires (Input / Select Small 32, Medium 40) ──────────────────
const field = (size: "Small" | "Medium", shadowed: boolean, status?: "AI" | "Warning" | "Valid") => ({
  height: size === "Small" ? 32 : 40, borderRadius: 4, border: `1px solid ${status === "AI" ? T.ai200 : status === "Warning" ? T.o200 : status === "Valid" ? T.g200 : T.n500}`,
  background: T.white, boxShadow: shadowed ? "inset 0 1px 3px rgba(0,0,0,0.25)" : "none", padding: "0 8px", fontFamily: F.body, fontSize: 14, color: T.p900, boxSizing: "border-box" as const,
});
export function Input({ label, value, onChange, size = "Small", type = "text", subtext, status, width, placeholder }:
  { label?: string; value: string | number; onChange: (v: string) => void; size?: "Small" | "Medium"; type?: string; subtext?: string; status?: "AI" | "Warning" | "Valid"; width?: number | string; placeholder?: string }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4, width }}>
      {label && <span style={{ ...txt.bodyS, color: T.p900 }}>{label}</span>}
      <input type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} style={{ ...field(size, true, status), width: "100%" }} />
      {subtext && <span style={{ ...txt.bodyXS, color: status === "AI" ? T.ai500 : status === "Warning" ? T.o500 : status === "Valid" ? T.g500 : T.n800 }}>{subtext}</span>}
    </label>
  );
}
export function Select({ label, value, onChange, options, size = "Small", width }: { label?: string; value: string; onChange: (v: string) => void; options: { v: string; label: string }[]; size?: "Small" | "Medium"; width?: number | string }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4, width }}>
      {label && <span style={{ ...txt.bodyS, color: T.p900 }}>{label}</span>}
      <select value={value} onChange={e => onChange(e.target.value)} style={{ ...field(size, false), width: "100%", cursor: "pointer" }}>
        {options.map(o => <option key={o.v} value={o.v}>{o.label}</option>)}
      </select>
    </label>
  );
}
export function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer", ...txt.bodyS }}>
      <span onClick={() => onChange(!checked)} style={{ width: 16, height: 16, borderRadius: 2, border: `1px solid ${checked ? T.p500 : T.n700}`, background: checked ? T.p500 : T.white, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
        {checked && <i className="ph-bold ph-check" style={{ fontSize: 11, color: T.white }} />}
      </span>{label}
    </label>
  );
}

// ── Table simple (style page Tables de THE DAM) ───────────────────────
export const th: React.CSSProperties = { textAlign: "left", padding: "8px 12px", fontFamily: F.body, fontSize: 12, fontWeight: 600, color: T.n800, background: T.n100, borderBottom: `1px solid ${T.n300}`, whiteSpace: "nowrap" };
export const td: React.CSSProperties = { padding: "8px 12px", fontFamily: F.body, fontSize: 14, lineHeight: "16px", color: T.p900, borderBottom: `1px solid ${T.n300}`, verticalAlign: "middle" };

// ── Barre de progression (composition d'atomes) ──────────────────────
export const Progress = ({ pct, color = T.p500 }: { pct: number; color?: string }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 120 }}>
    <div style={{ flex: 1, height: 8, background: T.n300, borderRadius: 4, overflow: "hidden" }}>
      <div style={{ width: `${Math.max(0, Math.min(100, pct))}%`, height: "100%", background: color, borderRadius: 4 }} />
    </div>
    <span style={{ ...txt.bodyS, fontWeight: 700, width: 40, textAlign: "right" }}>{Math.round(pct)} %</span>
  </div>
);

// ── Side Menu (Menu Entry 40, sélection primary-500 radius 20) ───────
export function MenuEntry({ label, icon, selected, onClick, badge }: { label: string; icon: string; selected?: boolean; onClick?: () => void; badge?: string }) {
  const [h, setH] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{ height: 40, padding: "0 10px", display: "flex", alignItems: "stretch", cursor: "pointer" }}>
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, paddingLeft: 10, borderRadius: 20, background: selected ? T.p500 : h ? T.n50 : "transparent" }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: selected ? T.s500 : "transparent", flexShrink: 0 }} />
        <Icon n={icon} size={24} color={selected ? T.n50 : T.p600} />
        <span style={{ ...txt.bodyM, color: selected ? T.n50 : h ? T.p900 : T.p600, flex: 1 }}>{label}</span>
        {badge && <span style={{ marginRight: 10 }}><Tag label={badge} status={selected ? "Light" : "AI"} /></span>}
      </div>
    </div>
  );
}

// ── Export CSV (téléchargement réel) ──────────────────────────────────
export function downloadCSV(name: string, rows: (string | number)[][]) {
  const csv = "﻿" + rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  a.download = name; a.click();
}
