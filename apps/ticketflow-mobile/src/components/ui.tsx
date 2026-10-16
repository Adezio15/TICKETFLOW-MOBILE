import type { PropsWithChildren } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
export const colors = {
  navy: "#102B50",
  blue: "#2563EB",
  sky: "#EAF2FF",
  bg: "#F5F7FC",
  text: "#172B49",
  muted: "#60728B",
  border: "#DFE6F0",
  green: "#12815C",
  red: "#BD3343",
};
export const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: {
    padding: 20,
    gap: 16,
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    paddingBottom: 40,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.navy,
    letterSpacing: -1,
  },
  subtitle: { fontSize: 15, color: colors.muted, lineHeight: 23 },
  section: { fontSize: 19, fontWeight: "700", color: colors.navy },
  card: {
    backgroundColor: "white",
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  text: { fontSize: 15, color: colors.text, lineHeight: 23 },
  small: { fontSize: 12, color: colors.muted, lineHeight: 19 },
  label: { color: colors.navy, fontWeight: "600", fontSize: 14 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    backgroundColor: "#FFF",
    fontSize: 16,
    color: colors.text,
    minHeight: 50,
  },
  button: {
    backgroundColor: colors.blue,
    padding: 15,
    borderRadius: 12,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  buttonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  badge: {
    backgroundColor: colors.sky,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 9,
    alignSelf: "flex-start",
  },
});
export function Page({ children }: PropsWithChildren) {
  return (
    <SafeAreaView edges={["left", "right", "bottom"]} style={styles.page}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export function Heading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}
export function Card({ children }: PropsWithChildren) {
  return <View style={styles.card}>{children}</View>;
}
export function Button({
  title,
  onPress,
  disabled,
  secondary,
  icon,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && { backgroundColor: colors.sky },
        { opacity: disabled ? 0.45 : pressed ? 0.75 : 1 },
      ]}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={19}
          color={secondary ? colors.blue : "white"}
        />
      )}
      <Text style={[styles.buttonText, secondary && { color: colors.blue }]}>
        {title}
      </Text>
    </Pressable>
  );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: 7 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#7D8DA3"
        {...props}
        style={[
          styles.input,
          props.multiline && { minHeight: 90, textAlignVertical: "top" },
          props.style,
        ]}
      />
    </View>
  );
}
export function Notice({
  children,
  error = false,
}: PropsWithChildren<{ error?: boolean }>) {
  return (
    <View
      style={{
        padding: 13,
        borderRadius: 12,
        backgroundColor: error ? "#FCEBED" : colors.sky,
      }}
    >
      <Text
        accessibilityRole={error ? "alert" : undefined}
        style={{
          color: error ? colors.red : colors.navy,
          fontSize: 13,
          lineHeight: 20,
        }}
      >
        {children}
      </Text>
    </View>
  );
}
export function Busy() {
  return (
    <ActivityIndicator
      size="large"
      color={colors.blue}
      accessibilityLabel="Carregando"
    />
  );
}
export function Chip({
  title,
  selected,
  onPress,
}: {
  title: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        padding: 10,
        borderRadius: 10,
        backgroundColor: selected ? colors.navy : "white",
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Text
        style={{ color: selected ? "white" : colors.navy, fontWeight: "600" }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export function LocalNotice() {
  return (
    <Notice>
      Dados locais: eventos e ingressos não são sincronizados entre aparelhos.
      Valide no aparelho que emitiu o ingresso.
    </Notice>
  );
}
