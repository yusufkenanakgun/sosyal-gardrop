// apps/mobile/app/(protected)/_layout.tsx
import { Stack } from "expo-router";

export default function ProtectedLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* (tabs) grubu kendi layout’unu yönetir */}
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
