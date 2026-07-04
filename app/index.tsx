import { useEffect, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';

export default function Index() {
  const navigated = useRef(false);

  useEffect(() => {
    if (navigated.current) return;
    const timer = setTimeout(async () => {
      if (navigated.current) return;
      try {
        const { useTwinStore } = require('../store/useTwinStore');
        const { userId }       = useTwinStore.getState();
        navigated.current      = true;
        if (userId) {
          const { apiGet } = require('../lib/httpClient');
          const controller  = new AbortController();
          const timeout     = setTimeout(() => controller.abort(), 5000);
          try {
            const profile = await apiGet(`/api/profile?user_id=${userId}`);
            clearTimeout(timeout);
            router.replace(profile?.onboarded ? '/twin-mind' : '/onboarding');
          } catch {
            clearTimeout(timeout);
            router.replace('/splash');
          }
        } else {
          router.replace('/splash');
        }
      } catch {
        navigated.current = true;
        router.replace('/splash');
      }
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0014', justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#7C3AED" />
    </View>
  );
}
