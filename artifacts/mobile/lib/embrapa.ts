export type TextureClass = "argilosa" | "media" | "arenosa";

export interface SoilInput {
  ph: string;
  mo: string;
  pResina: string;
  pMehlich: string;
  pRemanescente: string;
  k: string;
  ca: string;
  mg: string;
  hAl: string;
  s: string;
  texture: TextureClass;
  targetV: string;
  cropName: string;
}

export type NutrientClass = "muito baixo" | "baixo" | "médio" | "bom" | "alto";

export interface NutrientInterpretation {
  nutrient: string;
  unit: string;
  value: number;
  classification: NutrientClass;
  color: string;
}

export interface LimingRecommendation {
  currentV: number;
  targetV: number;
  ctc: number;
  sb: number;
  needsLiming: boolean;
  dose: number;
  note: string;
}

export interface FertilizationRec {
  nutrient: string;
  classification: NutrientClass;
  recommendation: string;
  dose?: string;
  note?: string;
}

export interface AnalysisResult {
  id: string;
  date: string;
  cropName: string;
  texture: TextureClass;
  liming: LimingRecommendation;
  fertilization: FertilizationRec[];
  interpretations: NutrientInterpretation[];
  input: SoilInput;
}

function classColor(cls: NutrientClass): string {
  switch (cls) {
    case "muito baixo": return "#C0392B";
    case "baixo": return "#E67E22";
    case "médio": return "#F1C40F";
    case "bom": return "#27AE60";
    case "alto": return "#2980B9";
  }
}

function pn(v: string): number {
  return parseFloat(v.replace(",", ".")) || 0;
}

function classifyP(pResina: number, pRem: number): NutrientClass {
  let critical = 12;
  if (pRem > 45) critical = 8;
  else if (pRem >= 30) critical = 12;
  else if (pRem >= 15) critical = 18;
  else critical = 25;

  const ratio = pResina / critical;
  if (ratio < 0.25) return "muito baixo";
  if (ratio < 0.75) return "baixo";
  if (ratio < 1.25) return "médio";
  if (ratio < 1.75) return "bom";
  return "alto";
}

function classifyK(k: number, ctc: number): NutrientClass {
  let thresholds = [40, 70, 120, 180];
  if (ctc < 4) thresholds = [30, 50, 80, 120];
  else if (ctc <= 8) thresholds = [40, 70, 120, 180];
  else thresholds = [50, 90, 150, 220];

  if (k < thresholds[0]) return "muito baixo";
  if (k < thresholds[1]) return "baixo";
  if (k < thresholds[2]) return "médio";
  if (k < thresholds[3]) return "bom";
  return "alto";
}

function classifyCa(ca: number): NutrientClass {
  if (ca < 0.5) return "muito baixo";
  if (ca < 1.5) return "baixo";
  if (ca < 4.0) return "médio";
  if (ca < 7.0) return "bom";
  return "alto";
}

function classifyMg(mg: number): NutrientClass {
  if (mg < 0.3) return "muito baixo";
  if (mg < 0.8) return "baixo";
  if (mg < 2.0) return "médio";
  if (mg < 3.5) return "bom";
  return "alto";
}

function classifyS(s: number): NutrientClass {
  if (s < 5) return "muito baixo";
  if (s < 10) return "baixo";
  if (s < 20) return "médio";
  if (s < 40) return "bom";
  return "alto";
}

function classifyMO(mo: number): NutrientClass {
  if (mo < 10) return "muito baixo";
  if (mo < 20) return "baixo";
  if (mo < 30) return "médio";
  if (mo < 45) return "bom";
  return "alto";
}

function pFertRec(cls: NutrientClass, texture: TextureClass): FertilizationRec {
  const recs: Record<NutrientClass, Record<TextureClass, string>> = {
    "muito baixo": {
      argilosa: "180-200 kg/ha de P₂O₅",
      media: "120-150 kg/ha de P₂O₅",
      arenosa: "80-100 kg/ha de P₂O₅",
    },
    baixo: {
      argilosa: "120-160 kg/ha de P₂O₅",
      media: "80-120 kg/ha de P₂O₅",
      arenosa: "60-80 kg/ha de P₂O₅",
    },
    médio: {
      argilosa: "80-120 kg/ha de P₂O₅",
      media: "60-90 kg/ha de P₂O₅",
      arenosa: "40-60 kg/ha de P₂O₅",
    },
    bom: {
      argilosa: "40-80 kg/ha de P₂O₅ (manutenção)",
      media: "30-60 kg/ha de P₂O₅ (manutenção)",
      arenosa: "20-40 kg/ha de P₂O₅ (manutenção)",
    },
    alto: {
      argilosa: "Manutenção: 30-50 kg/ha de P₂O₅",
      media: "Manutenção: 20-40 kg/ha de P₂O₅",
      arenosa: "Manutenção: 15-30 kg/ha de P₂O₅",
    },
  };
  return {
    nutrient: "Fósforo (P)",
    classification: cls,
    recommendation: recs[cls][texture],
    note: cls === "muito baixo" || cls === "baixo"
      ? "Priorize fosfatagem corretiva no preparo do solo."
      : undefined,
  };
}

function kFertRec(cls: NutrientClass): FertilizationRec {
  const recs: Record<NutrientClass, string> = {
    "muito baixo": "120-150 kg/ha de K₂O",
    baixo: "80-120 kg/ha de K₂O",
    médio: "60-100 kg/ha de K₂O",
    bom: "40-70 kg/ha de K₂O (manutenção)",
    alto: "Manutenção: 30-50 kg/ha de K₂O",
  };
  return {
    nutrient: "Potássio (K)",
    classification: cls,
    recommendation: recs[cls],
    note: cls === "muito baixo" ? "Parcelar aplicação em 2-3 vezes para evitar salinidade." : undefined,
  };
}

function sFertRec(cls: NutrientClass): FertilizationRec {
  const recs: Record<NutrientClass, string> = {
    "muito baixo": "Aplicar 30-50 kg/ha de S (gesso agrícola: 150-250 kg/ha)",
    baixo: "Aplicar 20-30 kg/ha de S (gesso agrícola: 100-150 kg/ha)",
    médio: "Aplicar 15-20 kg/ha de S",
    bom: "Não necessário (monitorar)",
    alto: "Não necessário",
  };
  return {
    nutrient: "Enxofre (S)",
    classification: cls,
    recommendation: recs[cls],
    note: cls === "muito baixo" || cls === "baixo"
      ? "Gesso agrícola também melhora o ambiente radicular em subsuperfície."
      : undefined,
  };
}

function caFertRec(cls: NutrientClass, needsLiming: boolean): FertilizationRec {
  if (needsLiming) {
    return {
      nutrient: "Cálcio (Ca)",
      classification: cls,
      recommendation: "Correção via calagem (calcário calcítico ou dolomítico)",
      note: "A calagem já supre a necessidade de Ca.",
    };
  }
  const recs: Record<NutrientClass, string> = {
    "muito baixo": "Aplicar calcário calcítico ou gesso agrícola (100-200 kg/ha)",
    baixo: "Aplicar calcário calcítico ou gesso agrícola",
    médio: "Adequado — monitorar",
    bom: "Adequado",
    alto: "Adequado — sem necessidade de adubação",
  };
  return {
    nutrient: "Cálcio (Ca)",
    classification: cls,
    recommendation: recs[cls],
  };
}

function mgFertRec(cls: NutrientClass, needsLiming: boolean): FertilizationRec {
  if (needsLiming) {
    return {
      nutrient: "Magnésio (Mg)",
      classification: cls,
      recommendation: "Correção via calagem com calcário dolomítico",
      note: "Prefira calcário dolomítico (MgO ≥ 5%).",
    };
  }
  const recs: Record<NutrientClass, string> = {
    "muito baixo": "Aplicar sulfato de magnésio (30-50 kg/ha de Mg)",
    baixo: "Aplicar sulfato de magnésio (15-30 kg/ha de Mg)",
    médio: "Adequado — monitorar",
    bom: "Adequado",
    alto: "Adequado",
  };
  return {
    nutrient: "Magnésio (Mg)",
    classification: cls,
    recommendation: recs[cls],
  };
}

export function analyzeRec(input: SoilInput): Omit<AnalysisResult, "id" | "date"> {
  const ca = pn(input.ca);
  const mg = pn(input.mg);
  const kMg = pn(input.k) / 391;
  const hAl = pn(input.hAl);
  const sb = ca + mg + kMg;
  const ctc = sb + hAl;
  const currentV = ctc > 0 ? (sb / ctc) * 100 : 0;
  const targetV = pn(input.targetV) || 50;
  const pResina = pn(input.pResina);
  const pRem = pn(input.pRemanescente);
  const k = pn(input.k);
  const s = pn(input.s);
  const mo = pn(input.mo);

  const needsLiming = currentV < targetV;
  const limeDose = needsLiming && ctc > 0
    ? ((targetV - currentV) * ctc) / 10
    : 0;

  const liming: LimingRecommendation = {
    currentV: Math.round(currentV * 10) / 10,
    targetV,
    ctc: Math.round(ctc * 100) / 100,
    sb: Math.round(sb * 100) / 100,
    needsLiming,
    dose: Math.round(limeDose * 10) / 10,
    note: !needsLiming
      ? "Saturação de bases adequada. Monitorar a cada 2-3 anos."
      : limeDose > 6
      ? "Dose elevada: aplicar em duas vezes (antes e após a aração). Prefira calcário com PRNT ≥ 70%."
      : "Incorporar o calcário com antecedência de 60-90 dias antes do plantio.",
  };

  const pClass = classifyP(pResina, pRem);
  const kClass = classifyK(k, ctc);
  const caClass = classifyCa(ca);
  const mgClass = classifyMg(mg);
  const sClass = classifyS(s);
  const moClass = classifyMO(mo);

  const interpretations: NutrientInterpretation[] = [
    { nutrient: "Fósforo Resina", unit: "mg/dm³", value: pResina, classification: pClass, color: classColor(pClass) },
    { nutrient: "Potássio", unit: "mg/dm³", value: k, classification: kClass, color: classColor(kClass) },
    { nutrient: "Cálcio", unit: "cmolc/dm³", value: ca, classification: caClass, color: classColor(caClass) },
    { nutrient: "Magnésio", unit: "cmolc/dm³", value: mg, classification: mgClass, color: classColor(mgClass) },
    { nutrient: "Enxofre", unit: "mg/dm³", value: s, classification: sClass, color: classColor(sClass) },
    { nutrient: "Matéria Orgânica", unit: "g/dm³", value: mo, classification: moClass, color: classColor(moClass) },
  ];

  const fertilization: FertilizationRec[] = [
    pFertRec(pClass, input.texture),
    kFertRec(kClass),
    caFertRec(caClass, needsLiming),
    mgFertRec(mgClass, needsLiming),
    sFertRec(sClass),
  ];

  return {
    cropName: input.cropName || "Cultura não especificada",
    texture: input.texture,
    liming,
    fertilization,
    interpretations,
    input,
  };
}
