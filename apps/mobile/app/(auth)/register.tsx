import { useState } from "react";
import { View, TextInput, Text } from "react-native";
import Button from "@/components/ui/Button";
import { register } from "@/src/services/auth";
import { router } from "expo-router";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const onReg = async () => {
    try {
      await register(email, password);
      setMsg("ok");
      router.replace("../index");
    } catch (e: any) {
      setMsg(e.message || "failed");
    }
  };

  return (
    <View style={{ padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: "600" }}>Register</Text>
      <TextInput placeholder="email" value={email} onChangeText={setEmail} style={{ borderWidth: 1, padding: 8 }} />
      <TextInput placeholder="password" value={password} onChangeText={setPassword} secureTextEntry style={{ borderWidth: 1, padding: 8 }} />
      <Button title="Create account" onPress={onReg} />
      <Text>{msg}</Text>
    </View>
  );
}
