import { useState } from "react";
import { View, TextInput, Text } from "react-native";
import { router } from "expo-router";
import { login } from "@/src/services/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const onLogin = async () => {
    try {
      await login(email, password);
      router.replace("/(protected)/(tabs)");
    } catch (e: any) {
      setMsg(e?.message || "failed");
    }
  };

  return (
    <View style={{ padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: "600" }}>Login</Text>
      <TextInput
        placeholder="email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={{ borderWidth: 1, padding: 8 }}
      />
      <TextInput
        placeholder="password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ borderWidth: 1, padding: 8 }}
      />
      <Text onPress={onLogin} style={{ padding: 12, textAlign: "center", borderWidth: 1 }}>
        Login
      </Text>
      {!!msg && <Text style={{ color: "crimson" }}>{msg}</Text>}
    </View>
  );
}
