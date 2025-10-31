// apps/mobile/app/(auth)/_layout.tsx
import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* DİKKAT: name değerleri DOSYA ADI ile aynı olmalı */}
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
