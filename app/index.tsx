import { useEffect, useRef, useState } from 'react';
import { View, Text, ActivityIndicator, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useTwinStore } from '../store/useTwinStore';
import { apiGet } from '../lib/httpClient';

export default function Index() {
  const { userId } = useTwinStore();
  const navigated  = useRef(false);
  const [debugInfo, setDebugInfo] = useState('Loading...');

  useEffect(() => {
    const run = async () => {
      try {
        setDebugInfo('Store OK - userId: ' + (userId || 'none'));
        await new Promise(r => setTimeout(r, 100));

        if (userId) {
          setDebugInfo('Checking profile...');
          try {
            const profile = await apiGet(`/api/profile?user_id=${userId}`);
            setDebugInfo('Profile: ' + JSON.stringify(profile?.onboarded));
            await new Promise(r => setTimeout(r, 500));
            if (!navigated.current) {
              navigated.current = true;
              router.replace(profile?.onboarded ? '/twin-mind' : '/onboarding');
            }
          } catch (e: any) {
            setDebugInfo('Profile error: ' + e?.message);
            await new Promise(r => setTimeout(r, 500));
            if (!navigated.current) {
              navigated.current = true;
              router.replace('/splash');
            }
          }
        } else {
          setDebugInfo('No userId → splash');
          await new Promise(r => setTimeout(r, 500));
          if (!navigated.current) {
            navigated.current = true;
            router.replace('/splash');
          }
        }
      } catch (e: any) {
        setDebugInfo('CRASH: ' + e?.message + '\n' + (e?.stack || '').slice(0, 300));
      }
    };

    const t = setTimeout(run, 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#0A0014' }}
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}
    >
      <ActivityIndicator size="large" color="#7C3AED" />
      <Text style={{ color: '#A78BFA', marginTop: 20, textAlign: 'center', fontSize: 12, lineHeight: 20 }}>
        {debugInfo}
      </Text>
    </ScrollView>
  );
}
