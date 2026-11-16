# Marius Copro — démo SPEE Hauts-de-France

Prototype de démonstration (données fictives) dérivé du proto Dust « Marius Copro Dossier ».
- `src/MariusCopro.tsx` : proto d'origine, couleurs, rayons et polices alignés sur THE DAM (script `scripts/ds_align.py`).
- `src/ds.tsx` : mini-kit reprenant les atomes THE DAM (Button, Tag, Block Wrapper, Alert Block, Segmented Control, Tab, Input, Select…).
- `src/SpeeReseau.tsx` : profil « SPEE Hauts-de-France (compte réseau) », qui répond aux besoins exprimés par le SPEE.

Accès direct à un profil : `?vue=spee|amo|financeur|conseil|syndic|moe|copro`.
Ce n'est pas une maquette de référence pour l'app Marius (maquettes : Alex).

```
npm install && npm run dev
```
