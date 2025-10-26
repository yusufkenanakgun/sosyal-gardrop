import { SafeAreaView, Text } from 'react-native';

export default function ProfileScreen() {
  return (
    <SafeAreaView style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: '600' }}>Profile</Text>
      <Text>Public profile view (placeholder)</Text>
    </SafeAreaView>
  );
}
