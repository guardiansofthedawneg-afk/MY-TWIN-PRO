import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTwinStore } from '../store/useTwinStore';

export default function Index() {
  const navigated = useRef(false);
  const hasHydrated = useTwinStore(s => s.hasHydrated);

  useEffect(() => {
    if (!hasHydrated || navigated.current) return;

    const run = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('mytwin-user');
        
        if (storedUserId) {
          await new Promise(r => setTimeout(r, 300));
          if (!navigated.current) {
            navigated.current = true;
            router.replace('/twin-mind');
          }
        } else {
          await new Promise(r => setTimeout(r, 300));
          if (!navigated.current) {
            navigated.current = true;
            router.replace('/splash');
          }
        }
      } catch (e) {
        console.error('Index error:', e);
        if (!navigated.current) {
          navigated.current = true;
          router.replace('/splash');
        }
      }
    };

    const timer = setTimeout(run, 500);
    return () => clearTimeout(timer);
  }, [hasHydrated]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0014' }}>
      <ActivityIndicator size="large" color="#7C3AED" />
      <Text style={{ color: '#A78BFA', marginTop: 16, fontSize: 14, textAlign: 'center', paddingHorizontal: 20 }}>
        جاري تهيئة الوعي...
      </Text>
    </View>
  );
}
