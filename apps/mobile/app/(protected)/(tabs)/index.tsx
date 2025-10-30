import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import Button from "@/components/ui/Button";
import { authFetch, logout } from "@/src/services/auth";
import { router } from "expo-router";

export default function Home() {
  const [me, setMe] = useState<any>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await authFetch("/auth/me");
        if (r.status === 401) {
          router.replace("/login"); // 401 ise direkt login’e
          return;
        }
        if (r.ok) {
          setMe(await r.json());
        } else {
          const t = await r.text();
          setErr(t || `HTTP ${r.status}`);
        }
      } catch (e: any) {
        setErr(e?.message || "network error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={{ padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: "600" }}>Home</Text>
      <Text selectable>
        {me ? JSON.stringify(me, null, 2) : err || "No data"}
      </Text>

      <Button
        title="Logout"
        onPress={async () => {
          await logout();
          router.replace("/login");
        }}
      />
    </View>
  );
}
