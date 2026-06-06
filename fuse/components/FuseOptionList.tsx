import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Option = {
  label: string;
  description?: string;
};

type Props = {
  title: string;
  subtitle?: string;
  options: Array<Option | string>;
  value: string | string[] | null | undefined;
  onChange: (value: any) => void;
  multiple?: boolean;
};

function normalizeOption(option: Option | string): Option {
  if (typeof option === "string") {
    return { label: option };
  }

  return option;
}

export default function FuseOptionList({
  title,
  subtitle,
  options,
  value,
  onChange,
  multiple = false,
}: Props) {
  const selectedValues = Array.isArray(value) ? value : [];

  const toggleValue = (nextLabel: string) => {
    if (!multiple) {
      onChange(nextLabel);
      return;
    }

    if (selectedValues.includes(nextLabel)) {
      onChange(selectedValues.filter((item) => item !== nextLabel));
      return;
    }

    onChange([...selectedValues, nextLabel]);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={options}
        keyExtractor={(item) => normalizeOption(item).label}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.heroCard}>
            <Text style={styles.eyebrow}>Profile Detail</Text>
            <Text style={styles.title}>{title}</Text>
            {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
        }
        renderItem={({ item }) => {
          const option = normalizeOption(item);
          const selected = multiple
            ? selectedValues.includes(option.label)
            : value === option.label;

          return (
            <TouchableOpacity
              style={[styles.optionCard, selected && styles.optionCardSelected]}
              activeOpacity={0.88}
              onPress={() => toggleValue(option.label)}
            >
              <View style={styles.optionCopy}>
                <Text style={styles.optionLabel}>{option.label}</Text>
                {!!option.description && (
                  <Text style={styles.optionDescription}>
                    {option.description}
                  </Text>
                )}
              </View>

              <View
                style={[
                  styles.checkBubble,
                  selected && styles.checkBubbleSelected,
                ]}
              >
                {selected ? (
                  <Ionicons name="checkmark" size={18} color="#ffffff" />
                ) : (
                  <Ionicons name="add" size={18} color="#9CA3AF" />
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  heroCard: {
    marginBottom: 14,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  eyebrow: {
    fontSize: 12,
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontFamily: "Poppins-SemiBold",
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    color: "#1a1a1a",
    fontFamily: "Poppins-Bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 21,
    fontFamily: "Poppins",
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  optionCardSelected: {
    borderColor: "#FBC9CF",
    backgroundColor: "#FFF8F8",
  },
  optionCopy: {
    flex: 1,
    paddingRight: 12,
  },
  optionLabel: {
    fontSize: 16,
    color: "#1a1a1a",
    fontFamily: "Poppins-SemiBold",
  },
  optionDescription: {
    marginTop: 4,
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 19,
    fontFamily: "Poppins",
  },
  checkBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  checkBubbleSelected: {
    backgroundColor: "#ff5864",
    borderColor: "#ff5864",
  },
});
