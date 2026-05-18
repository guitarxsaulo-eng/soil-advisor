export type TextureClass = "argilosa" | "media" | "arenosa";

export type CropType =
  | "soja"
  | "milho"
  | "feijao"
  | "pastagem"
  | "sorgo"
  | "arroz"
  | "trigo"
  | "algodao"
  | "outro";

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
  cropType: CropType;
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
  classification: NutrientClass | "n/a";
  recommendation: string;
  note?: string;
}

export interface AnalysisResult {
  id: string;
  date: string;
  cropName: string;
  cropType: CropType;
  texture: TextureClass;
  liming: LimingRecommendation;
  fertilization: FertilizationRec[];
  interpretations: NutrientInterpretation[];
  input: SoilInput;
}

export const CROP_OPTIONS: { label: string; value: CropType; targetV: number }[] = [
  { label: "Soja", value: "soja", targetV: 50 },
  { label: "Milho", value: "milho", targetV: 55 },
  { label: "Feijão", value: "feijao", targetV: 60 },
  { label: "Pastagem", value: "pastagem", targetV: 40 },
  { label: "Sorgo", value: "sorgo", targetV: 50 },
  { label: "Arroz", value: "arroz", targetV: 50 },
  { label: "Trigo", value: "trigo", targetV: 60 },
  { label: "Algodão", value: "algodao", targetV: 65 },
  { label: "Outra", value: "outro", targetV: 50 },
];

type DoseTable = Record<NutrientClass, string>;

interface CropNutrientTables {
  pArgilosa: DoseTable;
  pMedia: DoseTable;
  pArenosa: DoseTable;
  k: DoseTable;
  nitrogen?: { plantio: string; cobertura: string; note: string };
  limingNote?: string;
}

const CROP_TABLES: Record<CropType, CropNutrientTables> = {
  soja: {
    pArgilosa: {
      "muito baixo": "160-200 kg/ha de P₂O₅",
      baixo: "100-160 kg/ha de P₂O₅",
      médio: "60-100 kg/ha de P₂O₅",
      bom: "40-60 kg/ha de P₂O₅ (manutenção)",
      alto: "Manutenção: 30-40 kg/ha de P₂O₅",
    },
    pMedia: {
      "muito baixo": "110-140 kg/ha de P₂O₅",
      baixo: "70-110 kg/ha de P₂O₅",
      médio: "50-70 kg/ha de P₂O₅",
      bom: "30-50 kg/ha de P₂O₅ (manutenção)",
      alto: "Manutenção: 20-30 kg/ha de P₂O₅",
    },
    pArenosa: {
      "muito baixo": "70-100 kg/ha de P₂O₅",
      baixo: "50-70 kg/ha de P₂O₅",
      médio: "35-50 kg/ha de P₂O₅",
      bom: "20-35 kg/ha de P₂O₅ (manutenção)",
      alto: "Manutenção: 15-20 kg/ha de P₂O₅",
    },
    k: {
      "muito baixo": "100-130 kg/ha de K₂O",
      baixo: "70-100 kg/ha de K₂O",
      médio: "50-70 kg/ha de K₂O",
      bom: "40-60 kg/ha de K₂O (manutenção)",
      alto: "Manutenção: 30-40 kg/ha de K₂O",
    },
    nitrogen: {
      plantio: "Não necessário (FBN)",
      cobertura: "Não necessário (FBN)",
      note: "Utilizar inoculante com Bradyrhizobium japonicum. A fixação biológica supre a demanda de N da soja.",
    },
    limingNote: "V% alvo de 50-60%. Prefira calcário dolomítico para suprir Ca e Mg simultaneamente.",
  },

  milho: {
    pArgilosa: {
      "muito baixo": "120-160 kg/ha de P₂O₅",
      baixo: "80-120 kg/ha de P₂O₅",
      médio: "50-80 kg/ha de P₂O₅",
      bom: "30-50 kg/ha de P₂O₅ (manutenção)",
      alto: "Manutenção: 20-30 kg/ha de P₂O₅",
    },
    pMedia: {
      "muito baixo": "90-120 kg/ha de P₂O₅",
      baixo: "60-90 kg/ha de P₂O₅",
      médio: "40-60 kg/ha de P₂O₅",
      bom: "25-40 kg/ha de P₂O₅ (manutenção)",
      alto: "Manutenção: 15-25 kg/ha de P₂O₅",
    },
    pArenosa: {
      "muito baixo": "60-90 kg/ha de P₂O₅",
      baixo: "40-60 kg/ha de P₂O₅",
      médio: "30-45 kg/ha de P₂O₅",
      bom: "20-30 kg/ha de P₂O₅ (manutenção)",
      alto: "Manutenção: 10-20 kg/ha de P₂O₅",
    },
    k: {
      "muito baixo": "80-110 kg/ha de K₂O",
      baixo: "60-80 kg/ha de K₂O",
      médio: "40-60 kg/ha de K₂O",
      bom: "30-50 kg/ha de K₂O (manutenção)",
      alto: "Manutenção: 20-30 kg/ha de K₂O",
    },
    nitrogen: {
      plantio: "20-30 kg/ha de N",
      cobertura: "80-120 kg/ha de N (V4-V6)",
      note: "Total de 100-150 kg/ha de N para milho grão. Para silagem: 100-120 kg/ha. Parcelar para evitar perdas.",
    },
    limingNote: "V% alvo de 55-65%. Milho é sensível à acidez; Al³⁺ > 0,5 cmolc/dm³ causa toxidez radicular.",
  },

  feijao: {
    pArgilosa: {
      "muito baixo": "130-160 kg/ha de P₂O₅",
      baixo: "90-130 kg/ha de P₂O₅",
      médio: "60-90 kg/ha de P₂O₅",
      bom: "35-60 kg/ha de P₂O₅ (manutenção)",
      alto: "Manutenção: 25-35 kg/ha de P₂O₅",
    },
    pMedia: {
      "muito baixo": "90-120 kg/ha de P₂O₅",
      baixo: "60-90 kg/ha de P₂O₅",
      médio: "40-60 kg/ha de P₂O₅",
      bom: "25-40 kg/ha de P₂O₅ (manutenção)",
      alto: "Manutenção: 15-25 kg/ha de P₂O₅",
    },
    pArenosa: {
      "muito baixo": "60-90 kg/ha de P₂O₅",
      baixo: "40-60 kg/ha de P₂O₅",
      médio: "30-40 kg/ha de P₂O₅",
      bom: "20-30 kg/ha de P₂O₅ (manutenção)",
      alto: "Manutenção: 10-20 kg/ha de P₂O₅",
    },
    k: {
      "muito baixo": "80-100 kg/ha de K₂O",
      baixo: "60-80 kg/ha de K₂O",
      médio: "40-60 kg/ha de K₂O",
      bom: "30-45 kg/ha de K₂O (manutenção)",
      alto: "Manutenção: 20-30 kg/ha de K₂O",
    },
    nitrogen: {
      plantio: "20-30 kg/ha de N",
      cobertura: "30-50 kg/ha de N (V4)",
      note: "Inoculação com Rhizobium tropici recomendada. Total: 40-80 kg/ha de N. Reduzir N em solos com boa FBN.",
    },
    limingNote: "V% alvo de 60-70%. Feijão é sensível à acidez e à toxidez de Al e Mn.",
  },

  pastagem: {
    pArgilosa: {
      "muito baixo": "80-120 kg/ha de P₂O₅ (implantação)",
      baixo: "50-80 kg/ha de P₂O₅",
      médio: "30-50 kg/ha de P₂O₅",
      bom: "20-30 kg/ha de P₂O₅ (manutenção anual)",
      alto: "Manutenção: 15-20 kg/ha de P₂O₅",
    },
    pMedia: {
      "muito baixo": "60-90 kg/ha de P₂O₅ (implantação)",
      baixo: "40-60 kg/ha de P₂O₅",
      médio: "25-40 kg/ha de P₂O₅",
      bom: "15-25 kg/ha de P₂O₅ (manutenção anual)",
      alto: "Manutenção: 10-15 kg/ha de P₂O₅",
    },
    pArenosa: {
      "muito baixo": "40-60 kg/ha de P₂O₅ (implantação)",
      baixo: "25-40 kg/ha de P₂O₅",
      médio: "15-25 kg/ha de P₂O₅",
      bom: "10-15 kg/ha de P₂O₅ (manutenção anual)",
      alto: "Manutenção: 5-10 kg/ha de P₂O₅",
    },
    k: {
      "muito baixo": "60-80 kg/ha de K₂O (implantação)",
      baixo: "40-60 kg/ha de K₂O",
      médio: "30-45 kg/ha de K₂O",
      bom: "20-35 kg/ha de K₂O (manutenção anual)",
      alto: "Manutenção: 10-20 kg/ha de K₂O",
    },
    nitrogen: {
      plantio: "Sem N (implantação com leguminosa) ou 20-30 kg/ha",
      cobertura: "50-100 kg/ha de N/ano (parcelado em 2-3 vezes)",
      note: "Pastagens tropicais (Urochloa/Brachiaria) respondem bem a N em cobertura após chuvas. Parcelar para reduzir perdas por volatilização.",
    },
    limingNote: "V% alvo de 30-45%. Brachiaria tolera acidez moderada, mas responde à calagem até V=40-45%. Evitar supercalagem.",
  },

  sorgo: {
    pArgilosa: {
      "muito baixo": "100-130 kg/ha de P₂O₅",
      baixo: "70-100 kg/ha de P₂O₅",
      médio: "50-70 kg/ha de P₂O₅",
      bom: "30-50 kg/ha de P₂O₅ (manutenção)",
      alto: "Manutenção: 20-30 kg/ha de P₂O₅",
    },
    pMedia: {
      "muito baixo": "70-100 kg/ha de P₂O₅",
      baixo: "50-70 kg/ha de P₂O₅",
      médio: "35-50 kg/ha de P₂O₅",
      bom: "20-35 kg/ha de P₂O₅ (manutenção)",
      alto: "Manutenção: 15-20 kg/ha de P₂O₅",
    },
    pArenosa: {
      "muito baixo": "50-70 kg/ha de P₂O₅",
      baixo: "35-50 kg/ha de P₂O₅",
      médio: "25-35 kg/ha de P₂O₅",
      bom: "15-25 kg/ha de P₂O₅ (manutenção)",
      alto: "Manutenção: 10-15 kg/ha de P₂O₅",
    },
    k: {
      "muito baixo": "70-90 kg/ha de K₂O",
      baixo: "50-70 kg/ha de K₂O",
      médio: "35-50 kg/ha de K₂O",
      bom: "25-40 kg/ha de K₂O (manutenção)",
      alto: "Manutenção: 15-25 kg/ha de K₂O",
    },
    nitrogen: {
      plantio: "20-25 kg/ha de N",
      cobertura: "60-90 kg/ha de N (V4-V6)",
      note: "Total: 80-110 kg/ha de N para sorgo granífero. Para sorgo forrageiro: 90-120 kg/ha. Sorgo tolera mais acidez que milho.",
    },
    limingNote: "V% alvo de 45-55%. Sorgo é mais tolerante à acidez que milho, mas responde bem à calagem.",
  },

  arroz: {
    pArgilosa: {
      "muito baixo": "90-120 kg/ha de P₂O₅",
      baixo: "60-90 kg/ha de P₂O₅",
      médio: "40-60 kg/ha de P₂O₅",
      bom: "25-40 kg/ha de P₂O₅ (manutenção)",
      alto: "Manutenção: 15-25 kg/ha de P₂O₅",
    },
    pMedia: {
      "muito baixo": "70-90 kg/ha de P₂O₅",
      baixo: "50-70 kg/ha de P₂O₅",
      médio: "30-50 kg/ha de P₂O₅",
      bom: "20-30 kg/ha de P₂O₅ (manutenção)",
      alto: "Manutenção: 10-20 kg/ha de P₂O₅",
    },
    pArenosa: {
      "muito baixo": "50-70 kg/ha de P₂O₅",
      baixo: "35-50 kg/ha de P₂O₅",
      médio: "20-35 kg/ha de P₂O₅",
      bom: "15-20 kg/ha de P₂O₅ (manutenção)",
      alto: "Manutenção: 10-15 kg/ha de P₂O₅",
    },
    k: {
      "muito baixo": "70-90 kg/ha de K₂O",
      baixo: "50-70 kg/ha de K₂O",
      médio: "35-50 kg/ha de K₂O",
      bom: "20-35 kg/ha de K₂O (manutenção)",
      alto: "Manutenção: 15-20 kg/ha de K₂O",
    },
    nitrogen: {
      plantio: "15-20 kg/ha de N",
      cobertura: "50-70 kg/ha de N (perfilhamento)",
      note: "Total: 60-90 kg/ha de N para arroz de sequeiro. Aplicar cobertura no início do perfilhamento. Cultivares modernas respondem a doses mais elevadas.",
    },
    limingNote: "V% alvo de 45-55%. Arroz de sequeiro tolera solos ácidos, mas responde à calagem até pH 5,5-6,0.",
  },

  trigo: {
    pArgilosa: {
      "muito baixo": "120-150 kg/ha de P₂O₅",
      baixo: "80-120 kg/ha de P₂O₅",
      médio: "60-80 kg/ha de P₂O₅",
      bom: "40-60 kg/ha de P₂O₅ (manutenção)",
      alto: "Manutenção: 25-40 kg/ha de P₂O₅",
    },
    pMedia: {
      "muito baixo": "90-120 kg/ha de P₂O₅",
      baixo: "60-90 kg/ha de P₂O₅",
      médio: "40-60 kg/ha de P₂O₅",
      bom: "25-40 kg/ha de P₂O₅ (manutenção)",
      alto: "Manutenção: 15-25 kg/ha de P₂O₅",
    },
    pArenosa: {
      "muito baixo": "60-90 kg/ha de P₂O₅",
      baixo: "40-60 kg/ha de P₂O₅",
      médio: "30-40 kg/ha de P₂O₅",
      bom: "15-30 kg/ha de P₂O₅ (manutenção)",
      alto: "Manutenção: 10-15 kg/ha de P₂O₅",
    },
    k: {
      "muito baixo": "80-100 kg/ha de K₂O",
      baixo: "60-80 kg/ha de K₂O",
      médio: "40-60 kg/ha de K₂O",
      bom: "25-40 kg/ha de K₂O (manutenção)",
      alto: "Manutenção: 15-25 kg/ha de K₂O",
    },
    nitrogen: {
      plantio: "20-30 kg/ha de N",
      cobertura: "60-90 kg/ha de N (perfilhamento e elongação)",
      note: "Total: 80-120 kg/ha de N para trigo irrigado no Cerrado. Parcelar: 1/3 plantio + 1/3 perfilhamento + 1/3 elongação.",
    },
    limingNote: "V% alvo de 60-70%. Trigo é sensível à acidez e ao Al tóxico. pH ideal: 6,0-6,5.",
  },

  algodao: {
    pArgilosa: {
      "muito baixo": "150-200 kg/ha de P₂O₅",
      baixo: "100-150 kg/ha de P₂O₅",
      médio: "70-100 kg/ha de P₂O₅",
      bom: "45-70 kg/ha de P₂O₅ (manutenção)",
      alto: "Manutenção: 30-45 kg/ha de P₂O₅",
    },
    pMedia: {
      "muito baixo": "110-150 kg/ha de P₂O₅",
      baixo: "75-110 kg/ha de P₂O₅",
      médio: "50-75 kg/ha de P₂O₅",
      bom: "30-50 kg/ha de P₂O₅ (manutenção)",
      alto: "Manutenção: 20-30 kg/ha de P₂O₅",
    },
    pArenosa: {
      "muito baixo": "70-100 kg/ha de P₂O₅",
      baixo: "50-70 kg/ha de P₂O₅",
      médio: "35-50 kg/ha de P₂O₅",
      bom: "20-35 kg/ha de P₂O₅ (manutenção)",
      alto: "Manutenção: 15-20 kg/ha de P₂O₅",
    },
    k: {
      "muito baixo": "110-140 kg/ha de K₂O",
      baixo: "80-110 kg/ha de K₂O",
      médio: "60-80 kg/ha de K₂O",
      bom: "45-60 kg/ha de K₂O (manutenção)",
      alto: "Manutenção: 30-45 kg/ha de K₂O",
    },
    nitrogen: {
      plantio: "20-30 kg/ha de N",
      cobertura: "80-120 kg/ha de N (parcelado em 2-3 vezes até floração)",
      note: "Total: 100-150 kg/ha de N. Algodão tem alta demanda de K; parcelar K em solos arenosos. Atenção ao excesso de N que favorece crescimento vegetativo em detrimento da produção.",
    },
    limingNote: "V% alvo de 60-70%. Algodão exige solo bem corrigido. pH 6,0-7,0. Gesso agrícola recomendado para subsuperfície (≥ 20% de argila).",
  },

  outro: {
    pArgilosa: {
      "muito baixo": "150-200 kg/ha de P₂O₅",
      baixo: "100-150 kg/ha de P₂O₅",
      médio: "70-100 kg/ha de P₂O₅",
      bom: "40-70 kg/ha de P₂O₅ (manutenção)",
      alto: "Manutenção: 30-40 kg/ha de P₂O₅",
    },
    pMedia: {
      "muito baixo": "100-140 kg/ha de P₂O₅",
      baixo: "70-100 kg/ha de P₂O₅",
      médio: "50-70 kg/ha de P₂O₅",
      bom: "30-50 kg/ha de P₂O₅ (manutenção)",
      alto: "Manutenção: 20-30 kg/ha de P₂O₅",
    },
    pArenosa: {
      "muito baixo": "65-90 kg/ha de P₂O₅",
      baixo: "45-65 kg/ha de P₂O₅",
      médio: "30-45 kg/ha de P₂O₅",
      bom: "20-30 kg/ha de P₂O₅ (manutenção)",
      alto: "Manutenção: 12-20 kg/ha de P₂O₅",
    },
    k: {
      "muito baixo": "90-120 kg/ha de K₂O",
      baixo: "65-90 kg/ha de K₂O",
      médio: "45-65 kg/ha de K₂O",
      bom: "30-50 kg/ha de K₂O (manutenção)",
      alto: "Manutenção: 20-30 kg/ha de K₂O",
    },
  },
};

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

function pFertRec(cls: NutrientClass, texture: TextureClass, crop: CropType): FertilizationRec {
  const table = CROP_TABLES[crop];
  const doseTable =
    texture === "argilosa" ? table.pArgilosa : texture === "media" ? table.pMedia : table.pArenosa;
  const needsCorrection = cls === "muito baixo" || cls === "baixo";
  return {
    nutrient: "Fósforo (P)",
    classification: cls,
    recommendation: doseTable[cls],
    note: needsCorrection ? "Priorize fosfatagem corretiva no preparo do solo (aplicação a lanço e incorporação)." : undefined,
  };
}

function kFertRec(cls: NutrientClass, crop: CropType): FertilizationRec {
  const table = CROP_TABLES[crop];
  return {
    nutrient: "Potássio (K)",
    classification: cls,
    recommendation: table.k[cls],
    note: cls === "muito baixo" ? "Parcelar aplicação em 2-3 vezes para evitar salinidade e luxo consumo." : undefined,
  };
}

function nFertRec(crop: CropType): FertilizationRec | null {
  const nitrogen = CROP_TABLES[crop].nitrogen;
  if (!nitrogen) return null;
  return {
    nutrient: "Nitrogênio (N)",
    classification: "n/a",
    recommendation: `Plantio: ${nitrogen.plantio}\nCobertura: ${nitrogen.cobertura}`,
    note: nitrogen.note,
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
  return { nutrient: "Cálcio (Ca)", classification: cls, recommendation: recs[cls] };
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
  return { nutrient: "Magnésio (Mg)", classification: cls, recommendation: recs[cls] };
}

export function analyzeRec(input: SoilInput): Omit<AnalysisResult, "id" | "date"> {
  const crop = input.cropType ?? "outro";
  const ca = pn(input.ca);
  const mg = pn(input.mg);
  const kMg = pn(input.k) / 391;
  const hAl = pn(input.hAl);
  const sb = ca + mg + kMg;
  const ctc = sb + hAl;
  const currentV = ctc > 0 ? (sb / ctc) * 100 : 0;
  const targetV = pn(input.targetV) || CROP_OPTIONS.find((c) => c.value === crop)?.targetV || 50;
  const pResina = pn(input.pResina);
  const pRem = pn(input.pRemanescente);
  const k = pn(input.k);
  const s = pn(input.s);
  const mo = pn(input.mo);

  const needsLiming = currentV < targetV;
  const limeDose = needsLiming && ctc > 0 ? ((targetV - currentV) * ctc) / 10 : 0;

  const cropLimingNote = CROP_TABLES[crop].limingNote;
  const liming: LimingRecommendation = {
    currentV: Math.round(currentV * 10) / 10,
    targetV,
    ctc: Math.round(ctc * 100) / 100,
    sb: Math.round(sb * 100) / 100,
    needsLiming,
    dose: Math.round(limeDose * 10) / 10,
    note: !needsLiming
      ? `Saturação de bases adequada. Monitorar a cada 2-3 anos.${cropLimingNote ? " " + cropLimingNote : ""}`
      : limeDose > 6
      ? `Dose elevada: aplicar em duas vezes (antes e após a aração). Prefira calcário com PRNT ≥ 70%.${cropLimingNote ? " " + cropLimingNote : ""}`
      : `Incorporar o calcário com antecedência de 60-90 dias antes do plantio.${cropLimingNote ? " " + cropLimingNote : ""}`,
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

  const nRec = nFertRec(crop);
  const fertilization: FertilizationRec[] = [
    ...(nRec ? [nRec] : []),
    pFertRec(pClass, input.texture, crop),
    kFertRec(kClass, crop),
    caFertRec(caClass, needsLiming),
    mgFertRec(mgClass, needsLiming),
    sFertRec(sClass),
  ];

  const cropLabel = CROP_OPTIONS.find((c) => c.value === crop)?.label ?? "Outra";
  const displayName = input.cropName
    ? `${input.cropName} (${cropLabel})`
    : cropLabel;

  return {
    cropName: displayName,
    cropType: crop,
    texture: input.texture,
    liming,
    fertilization,
    interpretations,
    input,
  };
}
