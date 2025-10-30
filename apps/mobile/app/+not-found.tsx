// apps/mobile/app/+not-found.tsx
import { Link } from "expo-router";
import { View, Text } from "react-native";

export default function NotFoundScreen() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: "600" }}>Oops! Page not found.</Text>
      <Link href="/" style={{ fontSize: 16, textDecorationLine: "underline" }}>
        Go to Home
      </Link>
    </View>
  );
}
