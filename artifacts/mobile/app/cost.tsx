import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAnalysis } from "@/context/AnalysisContext";
import { useColors } from "@/hooks/useColors";
import {
  computeCosts,
  extractNutrientLines,
  PRODUCTS,
  totalCostPerHa,
} from "@/lib/costCalc";
import type { NutrientKey } from "@/lib/costCalc";

const NUTRIENT_ICONS: Record<NutrientKey, keyof typeof import("@expo/vector-icons").Feather.glyphMap> = {
  N: "wind",
  P2O5: "droplet",
  K2O: "zap",
  S: "sun",
  lime: "layers",
};

const NUTRIENT_COLORS: Record<NutrientKey, string> = {
  N: "#2980B9",
  P2O5: "#8E44AD",
  K2O: "#E67E22",
  S: "#F1C40F",
  lime: "#27AE60",
};

const AREA_PRESETS = [1, 5, 10, 50, 100, 500];

function fmtBRL(val: number): string {
  return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtNum(val: number, decimals = 1): string {
  return val.toLocaleString("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export default function CostScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { analyses } = useAnalysis();

  const result = useMemo(() => analyses.find((a) => a.id === id), [analyses, id]);
  const nutrientLines = useMemo(
    () => (result ? extractNutrientLines(result) : []),
    [result]
  );

  const defaultProducts = useMemo(() => {
    const defaults: Partial<Record<NutrientKey, string>> = {};
    for (const key of Object.keys(PRODUCTS) as NutrientKey[]) {
      defaults[key] = PRODUCTS[key][0].id;
    }
    return defaults as Record<NutrientKey, string>;
  }, []);

  const [selectedProducts, setSelectedProducts] = useState<Record<NutrientKey, string>>(defaultProducts);
  const [prices, setPrices] = useState<Record<NutrientKey, string>>({
    N: "",
    P2O5: "",
    K2O: "",
    S: "",
    lime: "",
  });
  const [area, setArea] = useState("1");
  const [areaPreset, setAreaPreset] = useState(1);

  const costLines = useMemo(
    () => computeCosts(nutrientLines, selectedProducts, prices),
    [nutrientLines, selectedProducts, prices]
  );

  const totalPerHa = useMemo(() => totalCostPerHa(costLines), [costLines]);
  const areaNum = parseFloat(area.replace(",", ".")) || 1;
  const totalArea = totalPerHa * areaNum;

  function selectArea(a: number) {
    setAreaPreset(a);
    setArea(String(a));
  }

  if (!result) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.empty, { color: colors.mutedForeground }]}>
          Análise não encontrada.
        </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.link, { color: colors.primary }]}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const bottomPad = Platform.OS === "web" ? 34 : 0;

  return (
    <KeyboardAwareScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + bottomPad + 80 },
      ]}
      keyboardShouldPersistTaps="handled"
      bottomOffset={20}
    >
      {/* Header */}
      <View style={[styles.headerCard, { backgroundColor: colors.primary }]}>
        <Feather name="dollar-sign" size={20} color={colors.primaryForeground} />
        <Text style={[styles.headerTitle, { color: colors.primaryForeground }]}>
          Custo de Adubação
        </Text>
        <Text style={[styles.headerSub, { color: "rgba(255,255,255,0.7)" }]}>
          {result.cropName}
        </Text>
        <Text style={[styles.headerNote, { color: "rgba(255,255,255,0.55)" }]}>
          Selecione os produtos e informe o preço por saca (60 kg) ou por tonelada para calcário.
        </Text>
      </View>

      {/* Nutrient cards */}
      {nutrientLines.map((line) => {
        const products = PRODUCTS[line.nutrientKey];
        const selectedId = selectedProducts[line.nutrientKey];
        const accentColor = NUTRIENT_COLORS[line.nutrientKey];
        const icon = NUTRIENT_ICONS[line.nutrientKey];
        const costLine = costLines.find((c) => c.nutrientKey === line.nutrientKey);
        const isLime = line.nutrientKey === "lime";
        const bagUnit = isLime ? "tonelada" : "saca 60 kg";

        return (
          <View
            key={line.nutrientKey}
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            {/* Card header */}
            <View style={styles.cardHeader}>
              <View style={[styles.iconWrap, { backgroundColor: `${accentColor}18` }]}>
                <Feather name={icon} size={16} color={accentColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                  {line.label}
                </Text>
                {line.noNeed ? (
                  <Text style={[styles.noNeedText, { color: colors.success }]}>
                    Não necessário
                  </Text>
                ) : line.dose ? (
                  <Text style={[styles.doseText, { color: colors.mutedForeground }]}>
                    {isLime
                      ? `${fmtNum(line.dose.low)} t/ha`
                      : `${fmtNum(line.dose.low, 0)}–${fmtNum(line.dose.high, 0)} kg/ha de ${line.nutrientKey === "P2O5" ? "P₂O₅" : line.nutrientKey === "K2O" ? "K₂O" : line.nutrientKey}`}
                  </Text>
                ) : (
                  <Text style={[styles.noNeedText, { color: colors.mutedForeground }]}>
                    —
                  </Text>
                )}
              </View>
              {costLine && costLine.costPerHa > 0 && (
                <View style={[styles.costBadge, { backgroundColor: `${accentColor}15` }]}>
                  <Text style={[styles.costBadgeText, { color: accentColor }]}>
                    {fmtBRL(costLine.costPerHa)}/ha
                  </Text>
                </View>
              )}
            </View>

            {!line.noNeed && (
              <>
                {/* Product selector */}
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                  PRODUTO
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.productScroll}
                  contentContainerStyle={styles.productScrollContent}
                >
                  {products.map((prod) => {
                    const sel = prod.id === selectedId;
                    return (
                      <TouchableOpacity
                        key={prod.id}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setSelectedProducts((p) => ({ ...p, [line.nutrientKey]: prod.id }));
                        }}
                        activeOpacity={0.75}
                        style={[
                          styles.productBtn,
                          {
                            backgroundColor: sel ? accentColor : colors.muted,
                            borderColor: sel ? accentColor : colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.productBtnName,
                            { color: sel ? "#fff" : colors.foreground },
                          ]}
                        >
                          {prod.name}
                        </Text>
                        <Text
                          style={[
                            styles.productBtnContent,
                            { color: sel ? "rgba(255,255,255,0.75)" : colors.mutedForeground },
                          ]}
                        >
                          {prod.contentPercent}% {isLime ? "PRNT" : line.nutrientKey === "P2O5" ? "P₂O₅" : line.nutrientKey === "K2O" ? "K₂O" : line.nutrientKey}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Price input */}
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                  PREÇO POR {bagUnit.toUpperCase()}
                </Text>
                <View
                  style={[
                    styles.priceRow,
                    { backgroundColor: colors.muted, borderColor: colors.border },
                  ]}
                >
                  <Text style={[styles.currencySymbol, { color: colors.mutedForeground }]}>
                    R$
                  </Text>
                  <TextInput
                    style={[styles.priceInput, { color: colors.foreground }]}
                    value={prices[line.nutrientKey]}
                    onChangeText={(v) => setPrices((p) => ({ ...p, [line.nutrientKey]: v }))}
                    placeholder="0,00"
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="numeric"
                    returnKeyType="done"
                  />
                </View>

                {/* Output */}
                {costLine && line.dose && (
                  <View
                    style={[styles.outputRow, { backgroundColor: `${accentColor}08`, borderColor: `${accentColor}25` }]}
                  >
                    <View style={styles.outputItem}>
                      <Text style={[styles.outputLabel, { color: colors.mutedForeground }]}>
                        Produto
                      </Text>
                      <Text style={[styles.outputValue, { color: colors.foreground }]}>
                        {fmtNum(costLine.productKgPerHa, 0)} kg/ha
                      </Text>
                    </View>
                    <View style={[styles.outputDivider, { backgroundColor: colors.border }]} />
                    <View style={styles.outputItem}>
                      <Text style={[styles.outputLabel, { color: colors.mutedForeground }]}>
                        {isLime ? "Toneladas/ha" : "Sacas/ha"}
                      </Text>
                      <Text style={[styles.outputValue, { color: colors.foreground }]}>
                        {fmtNum(isLime ? costLine.bagsPerHa : costLine.bagsPerHa)}
                      </Text>
                    </View>
                    <View style={[styles.outputDivider, { backgroundColor: colors.border }]} />
                    <View style={styles.outputItem}>
                      <Text style={[styles.outputLabel, { color: colors.mutedForeground }]}>
                        Custo/ha
                      </Text>
                      <Text style={[styles.outputValue, { color: accentColor, fontFamily: "Inter_700Bold" }]}>
                        {costLine.costPerHa > 0 ? fmtBRL(costLine.costPerHa) : "—"}
                      </Text>
                    </View>
                  </View>
                )}
              </>
            )}
          </View>
        );
      })}

      {/* Area selector */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>ÁREA DE APLICAÇÃO</Text>
        <View style={styles.presetRow}>
          {AREA_PRESETS.map((a) => {
            const sel = areaPreset === a;
            return (
              <TouchableOpacity
                key={a}
                onPress={() => selectArea(a)}
                activeOpacity={0.75}
                style={[
                  styles.presetBtn,
                  {
                    backgroundColor: sel ? colors.primary : colors.muted,
                    borderColor: sel ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.presetText,
                    { color: sel ? colors.primaryForeground : colors.foreground },
                  ]}
                >
                  {a} ha
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={[styles.priceRow, { backgroundColor: colors.muted, borderColor: colors.border, marginTop: 8 }]}>
          <TextInput
            style={[styles.priceInput, { color: colors.foreground, flex: 1 }]}
            value={area}
            onChangeText={(v) => { setArea(v); setAreaPreset(0); }}
            placeholder="Área em hectares"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="numeric"
            returnKeyType="done"
          />
          <Text style={[styles.currencySymbol, { color: colors.mutedForeground }]}>ha</Text>
        </View>
      </View>

      {/* Summary */}
      <View style={[styles.summaryCard, { backgroundColor: colors.primary }]}>
        <Text style={[styles.summaryTitle, { color: "rgba(255,255,255,0.7)" }]}>
          RESUMO DE CUSTOS
        </Text>

        {costLines
          .filter((l) => l.costPerHa > 0)
          .map((l) => (
            <View key={l.nutrientKey} style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: "rgba(255,255,255,0.8)" }]}>
                {l.label}
              </Text>
              <Text style={[styles.summaryValue, { color: colors.primaryForeground }]}>
                {fmtBRL(l.costPerHa)}/ha
              </Text>
            </View>
          ))}

        <View style={[styles.summaryDivider, { backgroundColor: "rgba(255,255,255,0.2)" }]} />

        <View style={styles.summaryRow}>
          <Text style={[styles.summaryTotalLabel, { color: colors.primaryForeground }]}>
            Total por hectare
          </Text>
          <Text style={[styles.summaryTotal, { color: colors.primaryForeground }]}>
            {totalPerHa > 0 ? fmtBRL(totalPerHa) : "—"}
          </Text>
        </View>

        {areaNum > 1 && totalArea > 0 && (
          <View
            style={[styles.totalAreaCard, { backgroundColor: "rgba(255,255,255,0.12)" }]}
          >
            <Text style={[styles.totalAreaLabel, { color: "rgba(255,255,255,0.7)" }]}>
              Total para {fmtNum(areaNum, 0)} ha
            </Text>
            <Text style={[styles.totalAreaValue, { color: colors.primaryForeground }]}>
              {fmtBRL(totalArea)}
            </Text>
          </View>
        )}

        {totalPerHa === 0 && (
          <Text style={[styles.summaryEmpty, { color: "rgba(255,255,255,0.55)" }]}>
            Informe os preços dos produtos para calcular o custo total.
          </Text>
        )}
      </View>

      <TouchableOpacity
        onPress={() => router.back()}
        style={[styles.backBtn, { borderColor: colors.border }]}
        activeOpacity={0.75}
      >
        <Feather name="arrow-left" size={16} color={colors.primary} />
        <Text style={[styles.backBtnText, { color: colors.primary }]}>Voltar às Recomendações</Text>
      </TouchableOpacity>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 12, paddingTop: 8 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  empty: { fontSize: 16, fontFamily: "Inter_400Regular" },
  link: { fontSize: 16, fontFamily: "Inter_600SemiBold" },

  headerCard: {
    borderRadius: 16,
    padding: 20,
    gap: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    marginTop: 6,
  },
  headerSub: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  headerNote: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
    marginTop: 4,
  },

  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 20,
  },
  doseText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  noNeedText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
  },
  costBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  costBadgeText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },

  fieldLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  productScroll: { marginHorizontal: -14 },
  productScrollContent: { paddingHorizontal: 14, gap: 8 },
  productBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 2,
    alignItems: "center",
  },
  productBtnName: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    whiteSpace: "nowrap",
  } as any,
  productBtnContent: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },

  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 13 : 10,
    gap: 6,
  },
  currencySymbol: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  priceInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },

  outputRow: {
    flexDirection: "row",
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    gap: 0,
  },
  outputItem: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },
  outputDivider: {
    width: 1,
    marginVertical: 2,
  },
  outputLabel: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  outputValue: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },

  sectionTitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  presetRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  presetBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  presetText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },

  summaryCard: {
    borderRadius: 16,
    padding: 18,
    gap: 10,
  },
  summaryTitle: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryLabel: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  summaryDivider: {
    height: 1,
    marginVertical: 4,
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  summaryTotal: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  totalAreaCard: {
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  totalAreaLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  totalAreaValue: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  summaryEmpty: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
    marginTop: 4,
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
