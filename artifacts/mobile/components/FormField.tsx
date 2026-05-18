import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";

interface TextFieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  unit?: string;
  placeholder?: string;
  keyboardType?: "numeric" | "default";
}

export function TextField({
  label,
  value,
  onChangeText,
  unit,
  placeholder = "0",
  keyboardType = "numeric",
}: TextFieldProps) {
  const colors = useColors();
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
      <View
        style={[
          styles.inputRow,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <TextInput
          style={[styles.input, { color: colors.foreground }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          keyboardType={keyboardType}
          returnKeyType="done"
        />
        {unit ? (
          <Text style={[styles.unit, { color: colors.mutedForeground }]}>{unit}</Text>
        ) : null}
      </View>
    </View>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onSelect: (v: string) => void;
}

export function SelectField({ label, value, options, onSelect }: SelectFieldProps) {
  const colors = useColors();
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
      <View style={styles.optionRow}>
        {options.map((opt) => {
          const selected = opt.value === value;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => onSelect(opt.value)}
              activeOpacity={0.75}
              style={[
                styles.optionBtn,
                {
                  backgroundColor: selected ? colors.primary : colors.card,
                  borderColor: selected ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.optionText,
                  { color: selected ? colors.primaryForeground : colors.foreground },
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
}

export function SectionHeader({ title, subtitle }: SectionHeaderProps) {
  const colors = useColors();
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.primary }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fieldWrap: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 13 : 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  unit: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginLeft: 8,
  },
  optionRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  optionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  optionText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  sectionHeader: {
    marginTop: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  sectionSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
});
