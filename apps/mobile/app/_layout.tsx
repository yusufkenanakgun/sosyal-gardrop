// apps/mobile/app/_layout.tsx
import { Stack } from "expo-router";
import { Platform } from "react-native";

if (Platform.OS === "web") {
  const origWarn = console.warn.bind(console);
  console.warn = (...args: any[]) => {
    const msg = String(args[0] ?? "");
    // Sadece pointerEvents uyarısını sustur
    if (msg.includes("props.pointerEvents is deprecated")) return;
    origWarn(...args);
  };
}

export default function RootLayout() {
  return (
    <Stack initialRouteName="(protected)">
      {/* Root seviyede index beklemiyoruz artık */}
      <Stack.Screen name="modal" options={{ presentation: "modal", title: "Modal" }} />
      <Stack.Screen name="+not-found" options={{ title: "Not Found" }} />
    </Stack>
  );
}
