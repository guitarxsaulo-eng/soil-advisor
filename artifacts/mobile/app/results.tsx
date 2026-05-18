import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAnalysis } from "@/context/AnalysisContext";
import { useColors } from "@/hooks/useColors";
import type { AnalysisResult, FertilizationRec, NutrientInterpretation } from "@/lib/embrapa";
import { exportResultAsPdf } from "@/lib/generatePdf";

function ClassBadge({ cls }: { cls: string }) {
  const colors = useColors();
  let bg = colors.muted;
  let fg = colors.mutedForeground;
  switch (cls) {
    case "muito baixo": bg = "#FDECEC"; fg = colors.destructive; break;
    case "baixo": bg = "#FEF3E2"; fg = colors.warning; break;
    case "médio": bg = "#FEFCE2"; fg = "#B7860B"; break;
    case "bom": bg = "#E8F8EE"; fg = colors.success; break;
    case "alto": bg = "#EAF4FD"; fg = colors.info; break;
  }
  const label = cls.charAt(0).toUpperCase() + cls.slice(1);
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: fg }]}>{label}</Text>
    </View>
  );
}

function NutrientRow({ item }: { item: NutrientInterpretation }) {
  const colors = useColors();
  return (
    <View style={[styles.nutrientRow, { borderBottomColor: colors.border }]}>
      <View style={styles.nutrientLeft}>
        <View style={[styles.dot, { backgroundColor: item.color }]} />
        <View>
          <Text style={[styles.nutrientName, { color: colors.foreground }]}>{item.nutrient}</Text>
          <Text style={[styles.nutrientValue, { color: colors.mutedForeground }]}>
            {item.value} {item.unit}
          </Text>
        </View>
      </View>
      <ClassBadge cls={item.classification} />
    </View>
  );
}

function FertCard({ rec }: { rec: FertilizationRec }) {
  const colors = useColors();
  const isNitrogen = rec.nutrient.includes("Nitrogênio");
  let icon: keyof typeof Feather.glyphMap = "droplet";
  if (isNitrogen) icon = "wind";
  else if (rec.nutrient.includes("Potássio")) icon = "zap";
  else if (rec.nutrient.includes("Cálcio")) icon = "shield";
  else if (rec.nutrient.includes("Magnésio")) icon = "star";
  else if (rec.nutrient.includes("Enxofre")) icon = "sun";

  const lines = rec.recommendation.split("\n").filter(Boolean);

  return (
    <View style={[styles.fertCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.fertHeader}>
        <View
          style={[
            styles.fertIconWrap,
            { backgroundColor: isNitrogen ? "#EAF4FD" : `${colors.primary}18` },
          ]}
        >
          <Feather name={icon} size={16} color={isNitrogen ? colors.info : colors.primary} />
        </View>
        <View style={styles.fertTitleWrap}>
          <Text style={[styles.fertNutrient, { color: colors.foreground }]}>{rec.nutrient}</Text>
          {rec.classification !== "n/a" && <ClassBadge cls={rec.classification} />}
        </View>
      </View>

      {lines.length > 1 ? (
        <View style={styles.nLines}>
          {lines.map((line, i) => {
            const [label, ...rest] = line.split(": ");
            const value = rest.join(": ");
            return (
              <View key={i} style={[styles.nLine, { borderColor: colors.border }]}>
                <Text style={[styles.nLineLabel, { color: colors.mutedForeground }]}>{label}</Text>
                <Text style={[styles.nLineValue, { color: colors.foreground }]}>{value}</Text>
              </View>
            );
          })}
        </View>
      ) : (
        <Text style={[styles.fertRec, { color: colors.foreground }]}>{rec.recommendation}</Text>
      )}

      {rec.note ? (
        <View style={[styles.noteRow, { backgroundColor: colors.earthLight ?? "#F5E6C0" }]}>
          <Feather name="info" size={13} color={colors.earth ?? "#8B6914"} />
          <Text style={[styles.noteText, { color: colors.earth ?? "#8B6914" }]}>{rec.note}</Text>
        </View>
      ) : null}
    </View>
  );
}

export default function ResultsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { analyses } = useAnalysis();
  const [exporting, setExporting] = useState(false);

  const result: AnalysisResult | undefined = useMemo(
    () => analyses.find((a) => a.id === id),
    [analyses, id]
  );

  async function handleExportPdf() {
    if (!result || exporting) return;
    setExporting(true);
    try {
      await exportResultAsPdf(result);
    } catch (e) {
      Alert.alert("Erro ao exportar", "Não foi possível gerar o PDF. Tente novamente.");
    } finally {
      setExporting(false);
    }
  }

  if (!result) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.mutedForeground }]}>
          Análise não encontrada.
        </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backLink, { color: colors.primary }]}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { liming, fertilization, interpretations, cropName, texture } = result;
  const limingColor = liming.needsLiming ? colors.warning : colors.success;
  const date = new Date(result.date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + bottomPad + 40 },
      ]}
    >
      <View style={[styles.headerCard, { backgroundColor: colors.primary }]}>
        {!!result.fazenda && (
          <View style={styles.headerFazendaRow}>
            <Feather name="map-pin" size={12} color="rgba(255,255,255,0.6)" />
            <Text style={[styles.headerFazenda, { color: "rgba(255,255,255,0.75)" }]} numberOfLines={1}>
              {result.fazenda}
            </Text>
          </View>
        )}
        <Text style={[styles.headerCrop, { color: colors.primaryForeground }]}>
          {cropName}
        </Text>
        <Text style={[styles.headerDate, { color: "rgba(255,255,255,0.7)" }]}>
          {date}{result.safra ? ` · Safra ${result.safra}` : ""} · {texture === "argilosa" ? "Argilosa" : texture === "media" ? "Média" : "Arenosa"}
        </Text>
        <View style={styles.vStats}>
          <View style={styles.vStat}>
            <Text style={[styles.vStatNum, { color: colors.primaryForeground }]}>
              {liming.currentV}%
            </Text>
            <Text style={[styles.vStatLabel, { color: "rgba(255,255,255,0.7)" }]}>V% atual</Text>
          </View>
          <Feather name="arrow-right" size={18} color="rgba(255,255,255,0.5)" />
          <View style={styles.vStat}>
            <Text style={[styles.vStatNum, { color: colors.primaryForeground }]}>
              {liming.targetV}%
            </Text>
            <Text style={[styles.vStatLabel, { color: "rgba(255,255,255,0.7)" }]}>V% alvo</Text>
          </View>
          <View style={[styles.vDivider, { backgroundColor: "rgba(255,255,255,0.2)" }]} />
          <View style={styles.vStat}>
            <Text style={[styles.vStatNum, { color: colors.primaryForeground }]}>
              {liming.ctc}
            </Text>
            <Text style={[styles.vStatLabel, { color: "rgba(255,255,255,0.7)" }]}>CTC cmolc/dm³</Text>
          </View>
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.sectionTitleRow}>
          <Feather name="layers" size={18} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Calagem</Text>
        </View>

        <View style={[styles.limingBox, { backgroundColor: `${limingColor}15`, borderColor: `${limingColor}40` }]}>
          <View style={styles.limingTop}>
            <Feather
              name={liming.needsLiming ? "alert-circle" : "check-circle"}
              size={22}
              color={limingColor}
            />
            {liming.needsLiming ? (
              <View>
                <Text style={[styles.limingDoseLabel, { color: limingColor }]}>
                  Dose recomendada
                </Text>
                <Text style={[styles.limingDose, { color: limingColor }]}>
                  {liming.dose} t/ha de calcário
                </Text>
                <Text style={[styles.limingPrnt, { color: colors.mutedForeground }]}>
                  (PRNT = 100%. Ajustar: dose × 100 / PRNT real)
                </Text>
              </View>
            ) : (
              <Text style={[styles.limingOk, { color: limingColor }]}>
                Saturação de bases adequada — calagem não necessária
              </Text>
            )}
          </View>
          <Text style={[styles.limingNote, { color: colors.mutedForeground }]}>
            {liming.note}
          </Text>
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.sectionTitleRow}>
          <Feather name="bar-chart-2" size={18} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Interpretação dos Teores
          </Text>
        </View>
        {interpretations.map((item) => (
          <NutrientRow key={item.nutrient} item={item} />
        ))}
      </View>

      <Text style={[styles.fertSectionLabel, { color: colors.primary }]}>
        RECOMENDAÇÕES DE ADUBAÇÃO
      </Text>
      {fertilization.map((rec) => (
        <FertCard key={rec.nutrient} rec={rec} />
      ))}

      <View style={[styles.disclaimer, { backgroundColor: colors.muted }]}>
        <Feather name="book-open" size={14} color={colors.mutedForeground} />
        <Text style={[styles.disclaimerText, { color: colors.mutedForeground }]}>
          Recomendações baseadas no Boletim Embrapa Cerrado. Consulte um engenheiro agrônomo para
          validação local e calibração por cultura.
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => router.push({ pathname: "/cost", params: { id: result.id } })}
        activeOpacity={0.85}
        style={[styles.costBtn, { backgroundColor: colors.earth ?? "#8B6914", borderColor: colors.earth ?? "#8B6914" }]}
      >
        <Feather name="dollar-sign" size={18} color="#fff" />
        <Text style={[styles.exportBtnText, { color: "#fff" }]}>
          Calcular Custo de Adubação
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleExportPdf}
        activeOpacity={0.85}
        disabled={exporting}
        style={[
          styles.exportBtn,
          { backgroundColor: exporting ? colors.muted : colors.primary },
        ]}
      >
        {exporting ? (
          <>
            <ActivityIndicator size="small" color={colors.primaryForeground} />
            <Text style={[styles.exportBtnText, { color: colors.primaryForeground }]}>
              Gerando PDF...
            </Text>
          </>
        ) : (
          <>
            <Feather name="file-text" size={18} color={colors.primaryForeground} />
            <Text style={[styles.exportBtnText, { color: colors.primaryForeground }]}>
              Exportar PDF
            </Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.back()}
        style={[styles.backBtn, { borderColor: colors.border }]}
        activeOpacity={0.75}
      >
        <Feather name="arrow-left" size={16} color={colors.primary} />
        <Text style={[styles.backBtnText, { color: colors.primary }]}>Nova Análise</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 12, paddingTop: 8 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  errorText: { fontSize: 16, fontFamily: "Inter_400Regular" },
  backLink: { fontSize: 16, fontFamily: "Inter_600SemiBold" },

  headerCard: {
    borderRadius: 16,
    padding: 20,
    gap: 4,
  },
  headerFazendaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 4,
  },
  headerFazenda: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  headerCrop: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  headerDate: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginBottom: 16,
  },
  vStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  vStat: {
    alignItems: "center",
    gap: 2,
  },
  vStatNum: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  vStatLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  vDivider: {
    width: 1,
    height: 32,
  },

  section: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },

  limingBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  limingTop: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  limingDoseLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  limingDose: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    marginTop: 2,
  },
  limingPrnt: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  limingOk: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    alignSelf: "center",
  },
  limingNote: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },

  nutrientRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  nutrientLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  nutrientName: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  nutrientValue: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },

  fertSectionLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    marginTop: 4,
    marginBottom: -4,
  },
  fertCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  fertHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  fertIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  fertTitleWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  fertNutrient: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  fertRec: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 21,
  },
  nLines: {
    gap: 6,
  },
  nLine: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    padding: 10,
    gap: 2,
  },
  nLineLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  nLineValue: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  noteRow: {
    flexDirection: "row",
    gap: 7,
    borderRadius: 8,
    padding: 10,
    alignItems: "flex-start",
  },
  noteText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    flex: 1,
    lineHeight: 18,
  },

  disclaimer: {
    borderRadius: 10,
    padding: 12,
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  disclaimerText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    flex: 1,
    lineHeight: 18,
  },
  costBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 14,
    paddingVertical: 16,
    borderWidth: 1,
  },
  exportBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 14,
    paddingVertical: 16,
  },
  exportBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
  },
  backBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
