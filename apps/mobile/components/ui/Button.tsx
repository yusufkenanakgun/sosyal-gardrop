import { Pressable, Text } from "react-native";

export default function Button({
  title,
  onPress,
}: { title: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{ padding: 12, borderWidth: 1, borderRadius: 8 }}
    >
      <Text style={{ textAlign: "center" }}>{title}</Text>
    </Pressable>
  );
}
