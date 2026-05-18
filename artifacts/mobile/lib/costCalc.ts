import type { AnalysisResult, FertilizationRec } from "./embrapa";

export type NutrientKey = "N" | "P2O5" | "K2O" | "S" | "lime";

export interface Product {
  id: string;
  name: string;
  nutrientKey: NutrientKey;
  contentPercent: number;
  bagKg: number;
  note?: string;
}

export const PRODUCTS: Record<NutrientKey, Product[]> = {
  N: [
    { id: "ureia", name: "Ureia", nutrientKey: "N", contentPercent: 45, bagKg: 60 },
    { id: "sulfamonio_n", name: "Sulfato de Amônio", nutrientKey: "N", contentPercent: 21, bagKg: 60 },
    { id: "nitrocal", name: "Nitrato de Cálcio", nutrientKey: "N", contentPercent: 15.5, bagKg: 60 },
    { id: "map_n", name: "MAP (fonte N)", nutrientKey: "N", contentPercent: 11, bagKg: 60, note: "Usar MAP também como fonte de P" },
    { id: "nitrobor", name: "Nitrato de Amônio", nutrientKey: "N", contentPercent: 33, bagKg: 60 },
  ],
  P2O5: [
    { id: "stp", name: "Superfosfato Triplo (STP)", nutrientKey: "P2O5", contentPercent: 45, bagKg: 60 },
    { id: "map_p", name: "MAP", nutrientKey: "P2O5", contentPercent: 52, bagKg: 60 },
    { id: "dap", name: "DAP", nutrientKey: "P2O5", contentPercent: 46, bagKg: 60 },
    { id: "ssp", name: "Superfosfato Simples (SSP)", nutrientKey: "P2O5", contentPercent: 18, bagKg: 60 },
    { id: "fosfnatreativo", name: "Fosfato Natural Reativo", nutrientKey: "P2O5", contentPercent: 28, bagKg: 60 },
  ],
  K2O: [
    { id: "kcl", name: "Cloreto de Potássio (KCl)", nutrientKey: "K2O", contentPercent: 60, bagKg: 60 },
    { id: "ks", name: "Sulfato de Potássio", nutrientKey: "K2O", contentPercent: 50, bagKg: 60, note: "Também fornece ~17% S" },
    { id: "k_mag", name: "Patenkali (K-Mag)", nutrientKey: "K2O", contentPercent: 30, bagKg: 60 },
  ],
  S: [
    { id: "gesso", name: "Gesso Agrícola", nutrientKey: "S", contentPercent: 15, bagKg: 60 },
    { id: "sulfamonio_s", name: "Sulfato de Amônio", nutrientKey: "S", contentPercent: 24, bagKg: 60 },
    { id: "ks_s", name: "Sulfato de Potássio", nutrientKey: "S", contentPercent: 17, bagKg: 60 },
    { id: "yoorin", name: "Yoorin Master (termofosfato)", nutrientKey: "S", contentPercent: 5, bagKg: 60 },
  ],
  lime: [
    { id: "calc_dol_80", name: "Calcário Dolomítico (PRNT 80%)", nutrientKey: "lime", contentPercent: 80, bagKg: 1000 },
    { id: "calc_dol_90", name: "Calcário Dolomítico (PRNT 90%)", nutrientKey: "lime", contentPercent: 90, bagKg: 1000 },
    { id: "calc_calc_80", name: "Calcário Calcítico (PRNT 80%)", nutrientKey: "lime", contentPercent: 80, bagKg: 1000 },
    { id: "calc_calc_90", name: "Calcário Calcítico (PRNT 90%)", nutrientKey: "lime", contentPercent: 90, bagKg: 1000 },
  ],
};

export interface DoseRange {
  low: number;
  high: number;
  mid: number;
}

function extractNumbers(text: string): number[] {
  const matches = text.match(/\d+(?:[.,]\d+)?/g) ?? [];
  return matches.map((m) => parseFloat(m.replace(",", ".")));
}

function parseSingleLine(line: string): DoseRange | null {
  if (/não necessário|adequado|manutenção sem|correção via/i.test(line)) return null;
  const nums = extractNumbers(line);
  if (nums.length === 0) return null;
  const low = nums[0];
  const high = nums[1] ?? low;
  return { low, high, mid: (low + high) / 2 };
}

export function parseDose(rec: FertilizationRec): DoseRange | null {
  const lines = rec.recommendation.split("\n").filter(Boolean);

  if (lines.length > 1) {
    let totalLow = 0, totalHigh = 0, found = false;
    for (const line of lines) {
      const d = parseSingleLine(line);
      if (d) { totalLow += d.low; totalHigh += d.high; found = true; }
    }
    if (!found) return null;
    return { low: totalLow, high: totalHigh, mid: (totalLow + totalHigh) / 2 };
  }

  return parseSingleLine(rec.recommendation);
}

export interface NutrientLine {
  nutrientKey: NutrientKey;
  label: string;
  dose: DoseRange | null;
  noNeed: boolean;
}

export function extractNutrientLines(result: AnalysisResult): NutrientLine[] {
  const lines: NutrientLine[] = [];

  if (result.liming.needsLiming) {
    lines.push({
      nutrientKey: "lime",
      label: "Calcário",
      dose: {
        low: result.liming.dose,
        high: result.liming.dose,
        mid: result.liming.dose,
      },
      noNeed: false,
    });
  }

  for (const rec of result.fertilization) {
    let key: NutrientKey | null = null;
    if (rec.nutrient.includes("Nitrogênio")) key = "N";
    else if (rec.nutrient.includes("Fósforo")) key = "P2O5";
    else if (rec.nutrient.includes("Potássio")) key = "K2O";
    else if (rec.nutrient.includes("Enxofre")) key = "S";

    if (!key) continue;

    const text = rec.recommendation;
    const noNeed =
      /não necessário|adequado/i.test(text) &&
      !/aplicar|parcelar|gesso|recomend/i.test(text);

    const dose = noNeed ? null : parseDose(rec);

    lines.push({ nutrientKey: key, label: rec.nutrient, dose, noNeed });
  }

  return lines;
}

export interface CostLine {
  nutrientKey: NutrientKey;
  label: string;
  dose: DoseRange | null;
  noNeed: boolean;
  product: Product;
  pricePerBag: number;
  productKgPerHa: number;
  bagsPerHa: number;
  costPerHa: number;
}

export function computeCosts(
  lines: NutrientLine[],
  selectedProducts: Record<NutrientKey, string>,
  pricesPerBag: Record<NutrientKey, string>
): CostLine[] {
  return lines.map((line) => {
    const products = PRODUCTS[line.nutrientKey];
    const prodId = selectedProducts[line.nutrientKey] ?? products[0].id;
    const product = products.find((p) => p.id === prodId) ?? products[0];
    const pricePerBag = parseFloat(pricesPerBag[line.nutrientKey]?.replace(",", ".") ?? "0") || 0;

    if (line.noNeed || !line.dose) {
      return {
        ...line,
        product,
        pricePerBag,
        productKgPerHa: 0,
        bagsPerHa: 0,
        costPerHa: 0,
      };
    }

    const activeKgPerHa = line.dose.mid;
    let productKgPerHa: number;

    if (line.nutrientKey === "lime") {
      const adjustedDose = activeKgPerHa * (100 / product.contentPercent);
      productKgPerHa = adjustedDose;
    } else {
      productKgPerHa = activeKgPerHa / (product.contentPercent / 100);
    }

    const bagsPerHa = productKgPerHa / product.bagKg;
    const costPerHa = bagsPerHa * pricePerBag;

    return { ...line, product, pricePerBag, productKgPerHa, bagsPerHa, costPerHa };
  });
}

export function totalCostPerHa(costLines: CostLine[]): number {
  return costLines.reduce((sum, l) => sum + l.costPerHa, 0);
}
