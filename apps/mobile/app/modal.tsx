// apps/mobile/app/modal.tsx
import { useRouter } from "expo-router";
import { View, Text, Pressable } from "react-native";

export default function ModalScreen() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, padding: 20, gap: 16, justifyContent: "center" }}>
      <Text style={{ fontSize: 20, fontWeight: "700" }}>Modal</Text>
      <Text>This is a modal screen.</Text>
      <Pressable onPress={() => router.back()} style={{ padding: 12, backgroundColor: "#eee", borderRadius: 8 }}>
        <Text>Close</Text>
      </Pressable>
    </View>
  );
}
