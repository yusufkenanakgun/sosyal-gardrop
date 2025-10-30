import { Text, TextProps, useColorScheme } from "react-native";

/**
 * ThemedText – uygulama genelinde kullanılan metin bileşeni.
 * `type` prop'u ile farklı yazı stilleri seçilebilir.
 */
type ThemedTextProps = TextProps & {
  type?:
    | "default"
    | "title"
    | "subtitle"
    | "link"
    | "error"
    | "defaultSemiBold"; // eklendi
};

export function ThemedText({
  type = "default",
  style,
  ...rest
}: ThemedTextProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const baseStyle = {
    color: isDark ? "#FFFFFF" : "#000000",
  };

  const variants: Record<NonNullable<ThemedTextProps["type"]>, any> = {
    default: { fontSize: 16 },
    title: { fontSize: 24, fontWeight: "700" },
    subtitle: { fontSize: 18, opacity: 0.8 },
    link: { textDecorationLine: "underline", color: "#3B82F6" },
    error: { color: "#DC2626", fontWeight: "600" },
    defaultSemiBold: { fontSize: 16, fontWeight: "600" }, // eklendi
  };

  return (
    <Text style={[baseStyle, variants[type], style]} {...rest} />
  );
}
