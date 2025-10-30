// src/hooks/use-theme-color.ts
import { useColorScheme } from "react-native";

/**
 * Tema rengine basit erişim— şimdilik sabit palet.
 * İstersen ThemeContext veya Tamagui/NativeWind entegre edebilirsin.
 */
const PALETTE = {
  light: {
    background: "#ffffff",
    text: "#111111",
    tint: "#0a84ff"
  },
  dark: {
    background: "#0b0b0b",
    text: "#f5f5f5",
    tint: "#64a8ff"
  }
};

type Keys = keyof typeof PALETTE["light"];

export function useThemeColor(
  _props: Partial<Record<Keys, string>>,
  colorName: Keys
) {
  const scheme = useColorScheme() ?? "light";
  // props ile override etmeye açıksın (ileride genişlet)
  return (_props[colorName] as string) ?? (PALETTE as any)[scheme][colorName];
}
