import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import {
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAnalysis } from "@/context/AnalysisContext";
import { useColors } from "@/hooks/useColors";
import type { AnalysisResult } from "@/lib/embrapa";

function classColor(cls: string, colors: ReturnType<typeof useColors>): string {
  switch (cls) {
    case "muito baixo": return colors.destructive;
    case "baixo": return colors.warning;
    case "médio": return "#F1C40F";
    case "bom": return colors.success;
    case "alto": return colors.info;
    default: return colors.mutedForeground;
  }
}

function HistoryItem({
  item,
  onPress,
  onDelete,
}: {
  item: AnalysisResult;
  onPress: () => void;
  onDelete: () => void;
}) {
  const colors = useColors();
  const date = new Date(item.date);
  const dateStr = date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timeStr = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  const limingColor = item.liming.needsLiming ? colors.warning : colors.success;
  const limingText = item.liming.needsLiming
    ? `Calagem: ${item.liming.dose} t/ha`
    : "Sem necessidade de calagem";

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={styles.itemTop}>
        <View style={styles.itemTitleRow}>
          <Feather name="layers" size={16} color={colors.primary} />
          <Text style={[styles.itemTitle, { color: colors.foreground }]} numberOfLines={1}>
            {item.cropName}
          </Text>
        </View>
        <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="trash-2" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {!!item.fazenda && (
        <View style={styles.fazendaRow}>
          <Feather name="map-pin" size={12} color={colors.mutedForeground} />
          <Text style={[styles.fazendaText, { color: colors.mutedForeground }]} numberOfLines={1}>
            {item.fazenda}
          </Text>
        </View>
      )}

      <View style={styles.itemMeta}>
        <View style={[styles.badge, { backgroundColor: colors.muted }]}>
          <Text style={[styles.badgeText, { color: colors.mutedForeground }]}>
            {item.texture === "argilosa" ? "Argilosa" : item.texture === "media" ? "Média" : "Arenosa"}
          </Text>
        </View>
        <Text style={[styles.dateText, { color: colors.mutedForeground }]}>
          {dateStr} — {timeStr}
        </Text>
      </View>

      <View style={[styles.limingRow, { backgroundColor: `${limingColor}18` }]}>
        <Feather name={item.liming.needsLiming ? "alert-circle" : "check-circle"} size={14} color={limingColor} />
        <Text style={[styles.limingText, { color: limingColor }]}>{limingText}</Text>
      </View>

      <View style={styles.nutrientRow}>
        {item.interpretations.slice(0, 4).map((n) => (
          <View key={n.nutrient} style={styles.nutrientChip}>
            <View style={[styles.dot, { backgroundColor: n.color }]} />
            <Text style={[styles.nutrientLabel, { color: colors.mutedForeground }]}>
              {n.nutrient.split(" ")[0]}
            </Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}

export default function HistoryScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { analyses, deleteAnalysis } = useAnalysis();

  function confirmDelete(id: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert("Excluir análise", "Tem certeza que deseja excluir esta análise?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: () => deleteAnalysis(id),
      },
    ]);
  }

  const bottomPad = Platform.OS === "web" ? 34 : 0;

  return (
    <FlatList
      data={analyses}
      keyExtractor={(item) => item.id}
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.list,
        {
          paddingBottom: insets.bottom + bottomPad + 100,
          paddingTop: Platform.OS === "web" ? 12 : 8,
        },
      ]}
      scrollEnabled={!!analyses.length}
      renderItem={({ item }) => (
        <HistoryItem
          item={item}
          onPress={() => router.push({ pathname: "/results", params: { id: item.id } })}
          onDelete={() => confirmDelete(item.id)}
        />
      )}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Feather name="inbox" size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Nenhuma análise</Text>
          <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
            Preencha o formulário na aba Análise para gerar recomendações.
          </Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 16,
    gap: 10,
  },
  item: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  itemTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  itemMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  dateText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  limingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  limingText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  nutrientRow: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  fazendaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 4,
  },
  fazendaText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  nutrientChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  nutrientLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
  },
  emptySub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
});
