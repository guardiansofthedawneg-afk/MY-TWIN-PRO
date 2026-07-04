import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, ActivityIndicator } from 'react-native';

export default function RootLayout() {
  const [status, setStatus] = useState('starting');
  const [error,  setError]  = useState('');

  useEffect(() => {
    try {
      setStatus('loading store...');
      const { useTwinStore } = require('../store/useTwinStore');
      const state = useTwinStore.getState();
      setStatus('store OK - theme: ' + state.theme);

      setTimeout(() => setStatus('READY'), 500);
    } catch(e: any) {
      setError(String(e?.message || e).slice(0, 200));
    }
  }, []);

  if (error) {
    return (
      <View style={{ flex:1, backgroundColor:'#0A0014', justifyContent:'center', padding:20 }}>
        <Text style={{ color:'#EF4444', fontSize:12 }}>❌ {error}</Text>
      </View>
    );
  }

  if (status !== 'READY') {
    return (
      <View style={{ flex:1, backgroundColor:'#0A0014', justifyContent:'center', alignItems:'center' }}>
        <ActivityIndicator color="#7C3AED" />
        <Text style={{ color:'#A78BFA', marginTop:12, fontSize:12 }}>{status}</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="splash" />
        <Stack.Screen name="login" />
        <Stack.Screen name="twin-mind" />
        <Stack.Screen name="chat" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="museum" />
        <Stack.Screen name="memories" />
        <Stack.Screen name="relationship" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="subscription" />
        <Stack.Screen name="referral" />
        <Stack.Screen name="features/index" />
        <Stack.Screen name="features/study-mode" />
        <Stack.Screen name="features/code-lab" />
        <Stack.Screen name="features/business-analyzer" />
        <Stack.Screen name="features/life-coach" />
        <Stack.Screen name="features/image-creator" />
        <Stack.Screen name="features/dreams" />
        <Stack.Screen name="features/content-creator" />
        <Stack.Screen name="features/smart-home" />
        <Stack.Screen name="features/task-manager" />
      </Stack>
    </SafeAreaProvider>
  );
}
