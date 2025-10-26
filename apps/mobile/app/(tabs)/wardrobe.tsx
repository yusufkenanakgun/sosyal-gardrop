import { SafeAreaView, Text } from 'react-native';

export default function WardrobeScreen() {
  return (
    <SafeAreaView style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: '600' }}>Wardrobe</Text>
      <Text>Your items will appear here</Text>
    </SafeAreaView>
  );
}
