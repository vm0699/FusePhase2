import React from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardTypeOptions,
} from "react-native";

type Props = {
  title: string;
  subtitle?: string;
  placeholder: string;
  value: string | null | undefined;
  onChange: (value: string) => void;
  keyboardType?: KeyboardTypeOptions;
};

export default function FuseTextField({
  title,
  subtitle,
  placeholder,
  value,
  onChange,
  keyboardType = "default",
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>Profile Detail</Text>
        <Text style={styles.title}>{title}</Text>
        {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      <View style={styles.inputCard}>
        <Text style={styles.inputLabel}>Your Answer</Text>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          value={value || ""}
          onChangeText={onChange}
          autoCapitalize="words"
          keyboardType={keyboardType}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 24,
    backgroundColor: "transparent",
  },
  heroCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 22,
    marginBottom: 14,
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
  inputCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  inputLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontFamily: "Poppins-SemiBold",
    marginBottom: 10,
  },
  input: {
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#F3F4F6",
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 16,
    color: "#1a1a1a",
    backgroundColor: "#ffffff",
    fontFamily: "Poppins",
  },
});
