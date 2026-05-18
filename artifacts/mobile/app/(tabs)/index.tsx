import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SelectField, SectionHeader, TextField } from "@/components/FormField";
import { useAnalysis } from "@/context/AnalysisContext";
import { useColors } from "@/hooks/useColors";
import { analyzeRec, CROP_OPTIONS } from "@/lib/embrapa";
import type { CropType, SoilInput, TextureClass } from "@/lib/embrapa";

const TEXTURE_OPTIONS = [
  { label: "Argilosa", value: "argilosa" },
  { label: "Média", value: "media" },
  { label: "Arenosa", value: "arenosa" },
];

const DEFAULT_INPUT: SoilInput = {
  ph: "",
  mo: "",
  pResina: "",
  pMehlich: "",
  pRemanescente: "",
  k: "",
  ca: "",
  mg: "",
  hAl: "",
  s: "",
  texture: "media",
  targetV: "50",
  cropType: "soja",
  cropName: "",
  fazenda: "",
  safra: "",
};

export default function AnalysisScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { saveAnalysis } = useAnalysis();
  const [input, setInput] = useState<SoilInput>(DEFAULT_INPUT);

  function set(field: keyof SoilInput) {
    return (v: string) => setInput((prev) => ({ ...prev, [field]: v }));
  }

  function selectCrop(cropType: CropType) {
    const found = CROP_OPTIONS.find((c) => c.value === cropType);
    setInput((prev) => ({
      ...prev,
      cropType,
      targetV: found ? String(found.targetV) : prev.targetV,
    }));
  }

  function validate(): string | null {
    const required: (keyof SoilInput)[] = ["ca", "mg", "hAl", "k"];
    const labels: Partial<Record<keyof SoilInput, string>> = {
      ca: "Cálcio (Ca)",
      mg: "Magnésio (Mg)",
      hAl: "H+Al",
      k: "Potássio (K)",
    };
    for (const f of required) {
      if (!input[f]) return `Preencha o campo obrigatório: ${labels[f] ?? f}`;
    }
    return null;
  }

  async function handleAnalyze() {
    const err = validate();
    if (err) {
      Alert.alert("Dados incompletos", err);
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const partial = analyzeRec(input);
    const saved = await saveAnalysis(partial);
    router.push({ pathname: "/results", params: { id: saved.id } });
  }

  const bottomPad = Platform.OS === "web" ? 34 : 0;

  return (
    <KeyboardAwareScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingBottom: insets.bottom + bottomPad + 100,
          paddingTop: Platform.OS === "web" ? 12 : 8,
        },
      ]}
      keyboardShouldPersistTaps="handled"
      bottomOffset={20}
    >
      <View style={[styles.heroInner, { backgroundColor: colors.primary }]}>
        <Feather name="activity" size={24} color={colors.primaryForeground} />
        <Text style={[styles.heroTitle, { color: colors.primaryForeground }]}>
          AGROSSB
        </Text>
        <Text style={[styles.heroSub, { color: "rgba(255,255,255,0.75)" }]}>
          Análise de Solo · Embrapa Cerrado
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <SectionHeader title="Cultura" subtitle="Define as doses e o V% alvo automaticamente" />

        <Text style={[styles.cropLabel, { color: colors.mutedForeground }]}>
          SELECIONE A CULTURA
        </Text>
        <View style={styles.cropGrid}>
          {CROP_OPTIONS.map((opt) => {
            const selected = input.cropType === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                onPress={() => selectCrop(opt.value)}
                activeOpacity={0.75}
                style={[
                  styles.cropBtn,
                  {
                    backgroundColor: selected ? colors.primary : colors.card,
                    borderColor: selected ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.cropBtnText,
                    { color: selected ? colors.primaryForeground : colors.foreground },
                  ]}
                >
                  {opt.label}
                </Text>
                {selected && (
                  <Text style={[styles.cropVTarget, { color: "rgba(255,255,255,0.75)" }]}>
                    V% {opt.targetV}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.divider} />

        <TextField
          label="Fazenda / Propriedade (opcional)"
          value={input.fazenda}
          onChangeText={set("fazenda")}
          placeholder="Ex: Fazenda Boa Esperança"
          keyboardType="default"
        />
        <TextField
          label="Identificação / Talhão (opcional)"
          value={input.cropName}
          onChangeText={set("cropName")}
          placeholder="Ex: Talhão 3"
          keyboardType="default"
        />
        <TextField
          label="Safra (opcional)"
          value={input.safra}
          onChangeText={set("safra")}
          placeholder="Ex: 24/25 ou 2025"
          keyboardType="default"
        />
        <SelectField
          label="Textura do solo"
          value={input.texture}
          options={TEXTURE_OPTIONS}
          onSelect={(v) => setInput((p) => ({ ...p, texture: v as TextureClass }))}
        />
        <TextField
          label="Saturação de bases alvo (V%)"
          value={input.targetV}
          onChangeText={set("targetV")}
          unit="%"
          placeholder="50"
        />
        <View style={[styles.vHint, { backgroundColor: colors.muted }]}>
          <Feather name="info" size={13} color={colors.mutedForeground} />
          <Text style={[styles.vHintText, { color: colors.mutedForeground }]}>
            V% alvo é definido automaticamente pela cultura selecionada. Ajuste se necessário.
          </Text>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <SectionHeader
          title="Acidez e Matéria Orgânica"
          subtitle="* = obrigatório para calagem"
        />
        <TextField label="pH (H₂O)" value={input.ph} onChangeText={set("ph")} placeholder="5.5" />
        <TextField
          label="Matéria Orgânica"
          value={input.mo}
          onChangeText={set("mo")}
          unit="g/dm³"
        />
        <TextField
          label="H+Al *"
          value={input.hAl}
          onChangeText={set("hAl")}
          unit="cmolc/dm³"
        />
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <SectionHeader title="Macronutrientes" subtitle="* = campos obrigatórios" />
        <TextField
          label="Cálcio (Ca) *"
          value={input.ca}
          onChangeText={set("ca")}
          unit="cmolc/dm³"
        />
        <TextField
          label="Magnésio (Mg) *"
          value={input.mg}
          onChangeText={set("mg")}
          unit="cmolc/dm³"
        />
        <TextField
          label="Potássio (K) *"
          value={input.k}
          onChangeText={set("k")}
          unit="mg/dm³"
        />
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <SectionHeader
          title="Fósforo"
          subtitle="Use P Resina para melhores resultados no Cerrado"
        />
        <TextField
          label="P Resina"
          value={input.pResina}
          onChangeText={set("pResina")}
          unit="mg/dm³"
        />
        <TextField
          label="P Mehlich"
          value={input.pMehlich}
          onChangeText={set("pMehlich")}
          unit="mg/dm³"
        />
        <TextField
          label="P Remanescente (P-rem)"
          value={input.pRemanescente}
          onChangeText={set("pRemanescente")}
          unit="mg/L"
        />
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <SectionHeader title="Enxofre" />
        <TextField
          label="Enxofre (S-SO₄)"
          value={input.s}
          onChangeText={set("s")}
          unit="mg/dm³"
        />
      </View>

      <TouchableOpacity
        onPress={handleAnalyze}
        activeOpacity={0.85}
        style={[styles.analyzeBtn, { backgroundColor: colors.primary }]}
      >
        <Feather name="bar-chart-2" size={20} color={colors.primaryForeground} />
        <Text style={[styles.analyzeBtnText, { color: colors.primaryForeground }]}>
          Gerar Recomendações
        </Text>
      </TouchableOpacity>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 12 },
  heroInner: {
    borderRadius: 16,
    padding: 20,
    gap: 6,
  },
  heroTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    marginTop: 4,
  },
  heroSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  card: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
  },
  cropLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cropGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  cropBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    gap: 2,
  },
  cropBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  cropVTarget: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.06)",
    marginVertical: 12,
  },
  vHint: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
  },
  vHintText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    flex: 1,
    lineHeight: 18,
  },
  analyzeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 14,
    paddingVertical: 18,
    marginTop: 4,
  },
  analyzeBtnText: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
});
