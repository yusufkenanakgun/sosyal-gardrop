import { SafeAreaView, Text } from 'react-native';

export default function MessagesScreen() {
  return (
    <SafeAreaView style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: '600' }}>Messages</Text>
      <Text>Real-time chats (placeholder)</Text>
    </SafeAreaView>
  );
}
