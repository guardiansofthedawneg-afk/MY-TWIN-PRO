import React from 'react';
import { View, Text } from 'react-native';

export default function SideMenu({ onClose }: { onClose: () => void }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111' }}>
      <Text style={{ color: '#fff', fontSize: 20 }}>القائمة الجانبية تعمل</Text>
    </View>
  );
}
