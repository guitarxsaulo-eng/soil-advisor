# AGROSSB

Mobile app for soil analysis data entry and fertilization/liming recommendations based on the Embrapa Cerrado bulletin.

## Run & Operate

- `pnpm --filter @workspace/mobile run dev` — run the Expo mobile app
- `pnpm --filter @workspace/mobile run typecheck` — typecheck the mobile app

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo (React Native) with Expo Router (file-based navigation)
- Storage: AsyncStorage for local analysis history
- PDF: expo-print + expo-sharing
- Fonts: Inter via expo-font

## Where things live

- `artifacts/mobile/lib/embrapa.ts` — core recommendation engine, SoilInput and AnalysisResult types
- `artifacts/mobile/lib/costCalc.ts` — fertilization cost estimation logic and PRODUCTS catalogue
- `artifacts/mobile/lib/generatePdf.ts` — PDF HTML template (recommendations + optional cost section)
- `artifacts/mobile/context/AnalysisContext.tsx` — analysis history via AsyncStorage
- `artifacts/mobile/app/(tabs)/index.tsx` — soil analysis entry form
- `artifacts/mobile/app/(tabs)/history.tsx` — saved analysis history list
- `artifacts/mobile/app/results.tsx` — recommendation results screen
- `artifacts/mobile/app/cost.tsx` — fertilization cost estimator screen

## Architecture decisions

- Contract-first: all agronomic logic lives in `lib/embrapa.ts`; screens are pure consumers.
- AsyncStorage key: `@solo_cerrado_analyses` (legacy key retained for backwards compatibility).
- PDF is generated client-side via expo-print (no server needed).
- CostLine[] is computed on-the-fly in cost.tsx and passed directly to the PDF generator — not persisted.
- `SoilInput.cropName` holds the talhão label; `safra` and `fazenda` are separate optional fields.

## Product

- Soil analysis form with 10 nutrient inputs (pH, MO, P Resina, P Mehlich, P-rem, K, Ca, Mg, H+Al, S)
- Crop selection (Soja, Milho, Feijão, Pastagem, Sorgo, Arroz, Trigo, Algodão, Outra) with auto V% target
- Fazenda, Talhão, and Safra identification fields for traceability
- Liming and fertilization recommendations per Embrapa Cerrado bulletin
- Analysis history saved locally, accessible from the Histórico tab
- PDF export (recommendations only, or with full cost breakdown)
- Fertilization cost estimator: product selector per nutrient, price input, area presets, total cost/ha

## User preferences

- App name: AGROSSB
- All agronomic content in Portuguese (pt-BR)

## Gotchas

- AsyncStorage key is `@solo_cerrado_analyses` — do not rename to avoid losing user data.
- `SoilInput.fazenda` and `SoilInput.safra` default to `""` — old saved analyses will have `undefined`; use `item.fazenda ?? ""` defensively.
- expo-print requires the HTML to be self-contained (no external JS, inline styles only for dynamic parts).
