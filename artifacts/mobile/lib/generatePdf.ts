import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import type { AnalysisResult, NutrientClass } from "./embrapa";
import type { CostLine } from "./costCalc";

export interface PdfCostData {
  costLines: CostLine[];
  totalPerHa: number;
  areaHa: number;
  totalArea: number;
}

function classLabel(cls: NutrientClass | "n/a"): string {
  if (cls === "n/a") return "—";
  return cls.charAt(0).toUpperCase() + cls.slice(1);
}

function classColor(cls: NutrientClass | "n/a"): string {
  switch (cls) {
    case "muito baixo": return "#C0392B";
    case "baixo": return "#E67E22";
    case "médio": return "#B7860B";
    case "bom": return "#27AE60";
    case "alto": return "#2980B9";
    default: return "#6B7B6B";
  }
}

function classBg(cls: NutrientClass | "n/a"): string {
  switch (cls) {
    case "muito baixo": return "#FDECEC";
    case "baixo": return "#FEF3E2";
    case "médio": return "#FEFCE2";
    case "bom": return "#E8F8EE";
    case "alto": return "#EAF4FD";
    default: return "#F0F0F0";
  }
}

function badge(cls: NutrientClass | "n/a"): string {
  return `<span style="display:inline-block;padding:2px 10px;border-radius:5px;font-size:11px;font-weight:700;background:${classBg(cls)};color:${classColor(cls)}">${classLabel(cls)}</span>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmtBRL(val: number): string {
  return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtNum(val: number, dec = 1): string {
  return val.toLocaleString("pt-BR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

function buildCostSection(cost: PdfCostData): string {
  const NUTRIENT_COLORS: Record<string, string> = {
    N: "#2980B9", P2O5: "#8E44AD", K2O: "#E67E22", S: "#F1C40F", lime: "#27AE60",
  };

  const activeLines = cost.costLines.filter((l) => !l.noNeed && l.dose);
  const paidLines = activeLines.filter((l) => l.costPerHa > 0);

  const detailRows = activeLines.map((l) => {
    const color = NUTRIENT_COLORS[l.nutrientKey] ?? "#6B7B6B";
    const isLime = l.nutrientKey === "lime";
    const doseStr = l.dose
      ? isLime
        ? `${fmtNum(l.dose.mid)} t/ha`
        : `${fmtNum(l.dose.low, 0)}–${fmtNum(l.dose.high, 0)} kg/ha`
      : "—";
    const bagUnit = isLime ? "t" : "sc";
    const bagsStr = l.bagsPerHa > 0 ? `${fmtNum(l.bagsPerHa)} ${bagUnit}/ha` : "—";
    const prodStr = l.productKgPerHa > 0 ? `${fmtNum(l.productKgPerHa, 0)} kg/ha` : "—";
    const costStr = l.costPerHa > 0 ? fmtBRL(l.costPerHa) : "—";

    return `<tr>
      <td style="padding:10px 12px;border-bottom:1px solid #F0EDE6">
        <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color};margin-right:8px;vertical-align:middle"></span>
        <strong style="font-size:13px">${escapeHtml(l.label)}</strong><br/>
        <span style="font-size:11px;color:#6B7B6B">${escapeHtml(l.product.name)} · ${l.product.contentPercent}%</span>
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #F0EDE6;text-align:center;font-size:12px;color:#6B7B6B">${doseStr}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #F0EDE6;text-align:center;font-size:12px">${prodStr}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #F0EDE6;text-align:center;font-size:12px">${bagsStr}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #F0EDE6;text-align:right;font-size:13px;font-weight:700;color:${l.costPerHa > 0 ? color : "#aaa"}">${costStr}</td>
    </tr>`;
  }).join("");

  const summaryRows = paidLines.map((l) =>
    `<tr>
      <td style="padding:7px 12px;border-bottom:1px solid rgba(255,255,255,0.1);font-size:13px;color:rgba(255,255,255,0.85)">${escapeHtml(l.label)}</td>
      <td style="padding:7px 12px;border-bottom:1px solid rgba(255,255,255,0.1);text-align:right;font-size:13px;font-weight:600;color:#fff">${fmtBRL(l.costPerHa)}/ha</td>
    </tr>`
  ).join("");

  const totalAreaBlock = cost.areaHa > 1 && cost.totalArea > 0
    ? `<div style="margin-top:16px;background:rgba(255,255,255,0.1);border-radius:10px;padding:14px;text-align:center">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:rgba(255,255,255,0.65);margin-bottom:4px">
          Total para ${fmtNum(cost.areaHa, 0)} ha
        </div>
        <div style="font-size:30px;font-weight:700;color:#fff">${fmtBRL(cost.totalArea)}</div>
      </div>`
    : "";

  const noPricesNote = paidLines.length === 0
    ? `<p style="color:rgba(255,255,255,0.55);font-size:13px;text-align:center;margin-top:8px">Nenhum preço informado — custo total não calculado.</p>`
    : "";

  return `
  <!-- Custo de Adubação -->
  <div style="background:#fff;border:1px solid #D9D3C7;border-radius:14px;padding:16px;margin-bottom:16px;overflow:hidden">
    <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#8B6914;margin-bottom:12px">
      💰 Custo de Adubação por Hectare
    </div>
    <table style="width:100%;border-collapse:collapse">
      <thead>
        <tr style="background:#F4F1EC">
          <th style="padding:8px 12px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:#6B7B6B;font-weight:600">Nutriente / Produto</th>
          <th style="padding:8px 12px;text-align:center;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:#6B7B6B;font-weight:600">Dose ativo</th>
          <th style="padding:8px 12px;text-align:center;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:#6B7B6B;font-weight:600">Produto/ha</th>
          <th style="padding:8px 12px;text-align:center;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:#6B7B6B;font-weight:600">Sacas/ha</th>
          <th style="padding:8px 12px;text-align:right;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:#6B7B6B;font-weight:600">Custo/ha</th>
        </tr>
      </thead>
      <tbody>${detailRows}</tbody>
    </table>
  </div>

  <!-- Resumo financeiro -->
  <div style="background:#8B6914;border-radius:14px;padding:18px;margin-bottom:16px">
    <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,0.65);margin-bottom:12px">
      Resumo Financeiro
    </div>
    <table style="width:100%;border-collapse:collapse">
      <tbody>${summaryRows}</tbody>
    </table>
    ${paidLines.length > 0 ? `
    <div style="border-top:1px solid rgba(255,255,255,0.2);margin-top:12px;padding-top:12px;display:flex;justify-content:space-between;align-items:center">
      <span style="font-size:15px;font-weight:600;color:#fff">Total por hectare</span>
      <span style="font-size:24px;font-weight:700;color:#fff">${fmtBRL(cost.totalPerHa)}</span>
    </div>` : ""}
    ${noPricesNote}
    ${totalAreaBlock}
  </div>`;
}

function buildHtml(result: AnalysisResult, cost?: PdfCostData): string {
  const date = new Date(result.date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const textureLabel =
    result.texture === "argilosa" ? "Argilosa" : result.texture === "media" ? "Média" : "Arenosa";
  const { liming } = result;
  const limingColor = liming.needsLiming ? "#E67E22" : "#27AE60";

  const interpretationRows = result.interpretations
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #E8E3DA">
          <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${item.color};margin-right:8px;vertical-align:middle"></span>
          ${escapeHtml(item.nutrient)}
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #E8E3DA;color:#6B7B6B;text-align:right">${item.value} ${escapeHtml(item.unit)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #E8E3DA;text-align:right">${badge(item.classification)}</td>
      </tr>`
    )
    .join("");

  const fertCards = result.fertilization
    .map((rec) => {
      const lines = rec.recommendation.split("\n").filter(Boolean);
      const recHtml =
        lines.length > 1
          ? lines
              .map((line) => {
                const idx = line.indexOf(": ");
                if (idx === -1) return `<p style="margin:4px 0;font-size:13px">${escapeHtml(line)}</p>`;
                const lbl = line.slice(0, idx);
                const val = line.slice(idx + 2);
                return `<div style="margin-top:6px;padding:8px 10px;background:#F4F1EC;border-radius:6px"><div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;color:#6B7B6B;margin-bottom:2px">${escapeHtml(lbl)}</div><div style="font-size:13px;font-weight:700;color:#1A2E1A">${escapeHtml(val)}</div></div>`;
              })
              .join("")
          : `<p style="margin:6px 0 0;font-size:13px;color:#1A2E1A;line-height:1.5">${escapeHtml(rec.recommendation)}</p>`;

      const noteHtml = rec.note
        ? `<div style="margin-top:8px;padding:8px 10px;background:#F5E6C0;border-radius:6px;font-size:11px;color:#8B6914;line-height:1.5">ℹ️ ${escapeHtml(rec.note)}</div>`
        : "";

      const clsBadge = rec.classification !== "n/a" ? badge(rec.classification) : "";

      return `
      <div style="background:#fff;border:1px solid #D9D3C7;border-radius:12px;padding:14px;margin-bottom:10px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
          <span style="font-size:15px;font-weight:700;color:#1A2E1A">${escapeHtml(rec.nutrient)}</span>
          ${clsBadge}
        </div>
        ${recHtml}
        ${noteHtml}
      </div>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Análise de Solo — ${escapeHtml(result.cropName)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Inter, -apple-system, sans-serif; background: #F4F1EC; color: #1A2E1A; font-size: 14px; }
    .page { max-width: 680px; margin: 0 auto; padding: 24px; }
  </style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div style="background:#2D6A4F;border-radius:16px;padding:24px;color:#fff;margin-bottom:16px">
    <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,0.65);margin-bottom:6px">
      Relatório de Análise de Solo · Embrapa Cerrado${cost ? " · Com Custo de Adubação" : ""}
    </div>
    ${result.fazenda ? `<div style="font-size:12px;color:rgba(255,255,255,0.65);margin-bottom:4px">📍 ${escapeHtml(result.fazenda)}</div>` : ""}
    <div style="font-size:24px;font-weight:700;margin-bottom:2px">${escapeHtml(result.cropName)}</div>
    <div style="font-size:12px;color:rgba(255,255,255,0.7);margin-bottom:18px">${date}${result.safra ? ` · Safra ${escapeHtml(result.safra)}` : ""} · Solo ${textureLabel}</div>

    <div style="display:flex;gap:24px;align-items:center;flex-wrap:wrap">
      <div style="text-align:center">
        <div style="font-size:28px;font-weight:700">${liming.currentV}%</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.65)">V% atual</div>
      </div>
      <div style="font-size:20px;color:rgba(255,255,255,0.45)">→</div>
      <div style="text-align:center">
        <div style="font-size:28px;font-weight:700">${liming.targetV}%</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.65)">V% alvo</div>
      </div>
      <div style="width:1px;height:40px;background:rgba(255,255,255,0.2)"></div>
      <div style="text-align:center">
        <div style="font-size:28px;font-weight:700">${liming.ctc}</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.65)">CTC cmolc/dm³</div>
      </div>
      <div style="text-align:center">
        <div style="font-size:28px;font-weight:700">${liming.sb}</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.65)">SB cmolc/dm³</div>
      </div>
      ${cost && cost.totalPerHa > 0 ? `
      <div style="width:1px;height:40px;background:rgba(255,255,255,0.2)"></div>
      <div style="text-align:center">
        <div style="font-size:20px;font-weight:700">${fmtBRL(cost.totalPerHa)}</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.65)">Custo/ha</div>
      </div>` : ""}
    </div>
  </div>

  <!-- Calagem -->
  <div style="background:#fff;border:1px solid #D9D3C7;border-radius:14px;padding:16px;margin-bottom:16px">
    <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#2D6A4F;margin-bottom:12px">
      📋 Calagem
    </div>
    <div style="padding:14px;border-radius:10px;border:1px solid ${limingColor}40;background:${limingColor}12">
      ${liming.needsLiming
        ? `<div style="font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:${limingColor};font-weight:600;margin-bottom:4px">Dose recomendada</div>
           <div style="font-size:26px;font-weight:700;color:${limingColor};margin-bottom:4px">${liming.dose} t/ha de calcário</div>
           <div style="font-size:11px;color:#6B7B6B">(PRNT = 100%. Ajustar: dose × 100 / PRNT real)</div>`
        : `<div style="font-size:16px;font-weight:700;color:${limingColor}">✓ Saturação de bases adequada — calagem não necessária</div>`
      }
      <div style="margin-top:10px;font-size:12px;color:#6B7B6B;line-height:1.6">${escapeHtml(liming.note)}</div>
    </div>
  </div>

  <!-- Interpretação dos teores -->
  <div style="background:#fff;border:1px solid #D9D3C7;border-radius:14px;padding:16px;margin-bottom:16px">
    <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#2D6A4F;margin-bottom:12px">
      📊 Interpretação dos Teores
    </div>
    <table style="width:100%;border-collapse:collapse">
      <thead>
        <tr style="background:#F4F1EC">
          <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#6B7B6B;font-weight:600">Nutriente</th>
          <th style="padding:8px 12px;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#6B7B6B;font-weight:600">Valor</th>
          <th style="padding:8px 12px;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#6B7B6B;font-weight:600">Classe</th>
        </tr>
      </thead>
      <tbody>${interpretationRows}</tbody>
    </table>
  </div>

  <!-- Recomendações de adubação -->
  <div style="margin-bottom:16px">
    <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#2D6A4F;margin-bottom:12px">
      🌱 Recomendações de Adubação
    </div>
    ${fertCards}
  </div>

  ${cost ? buildCostSection(cost) : ""}

  <!-- Dados de entrada -->
  <div style="background:#fff;border:1px solid #D9D3C7;border-radius:14px;padding:16px;margin-bottom:16px">
    <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#2D6A4F;margin-bottom:12px">
      🔬 Dados da Análise
    </div>
    <table style="width:100%;border-collapse:collapse">
      <tbody>
        ${[
          ["pH H₂O", result.input.ph || "—", ""],
          ["Matéria Orgânica", result.input.mo || "—", "g/dm³"],
          ["H+Al", result.input.hAl || "—", "cmolc/dm³"],
          ["Cálcio (Ca)", result.input.ca || "—", "cmolc/dm³"],
          ["Magnésio (Mg)", result.input.mg || "—", "cmolc/dm³"],
          ["Potássio (K)", result.input.k || "—", "mg/dm³"],
          ["P Resina", result.input.pResina || "—", "mg/dm³"],
          ["P Mehlich", result.input.pMehlich || "—", "mg/dm³"],
          ["P Remanescente", result.input.pRemanescente || "—", "mg/L"],
          ["Enxofre (S)", result.input.s || "—", "mg/dm³"],
        ]
          .map(
            ([label, val, unit]) =>
              `<tr>
                <td style="padding:7px 12px;border-bottom:1px solid #F0EDE6;font-size:12px;color:#6B7B6B">${label}</td>
                <td style="padding:7px 12px;border-bottom:1px solid #F0EDE6;font-size:13px;font-weight:600;text-align:right">${escapeHtml(val)} <span style="font-size:11px;font-weight:400;color:#6B7B6B">${escapeHtml(unit)}</span></td>
              </tr>`
          )
          .join("")}
      </tbody>
    </table>
  </div>

  ${result.notes ? `
  <!-- Observações -->
  <div style="background:#fff;border:1px solid #D9D3C7;border-radius:14px;padding:16px;margin-bottom:16px">
    <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#2D6A4F;margin-bottom:10px">
      📝 Observações
    </div>
    <p style="font-size:13px;color:#1A2E1A;line-height:1.7;white-space:pre-wrap">${escapeHtml(result.notes)}</p>
  </div>` : ""}

  <!-- Disclaimer -->
  <div style="background:#E8E3DA;border-radius:10px;padding:12px 14px;font-size:11px;color:#6B7B6B;line-height:1.6">
    📖 Recomendações baseadas no Boletim Técnico da Embrapa Cerrado. Consulte um Engenheiro Agrônomo habilitado para validação local, calibração por cultivar e condições específicas da lavoura. Gerado pelo app AGROSSB em ${date}.
  </div>

</div>
</body>
</html>`;
}

async function sharePdf(uri: string, cropName: string): Promise<void> {
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: `Análise de Solo — ${cropName}`,
      UTI: "com.adobe.pdf",
    });
  } else {
    await Print.printAsync({ uri });
  }
}

export async function exportResultAsPdf(result: AnalysisResult): Promise<void> {
  const html = buildHtml(result);
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  await sharePdf(uri, result.cropName);
}

export async function exportResultWithCostAsPdf(
  result: AnalysisResult,
  cost: PdfCostData
): Promise<void> {
  const html = buildHtml(result, cost);
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  await sharePdf(uri, result.cropName);
}
