import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { LivingSpace } from '../src/renderers';
import { runtime } from '../src/core/TwinRuntime';
import { storeSyncBridge } from '../src/core/StoreSyncBridge';
import { audioEngine } from '../src/core/AudioEngine';
import { livingIntelligence } from '../src/core/LivingIntelligence';
import { authService } from '../src/services/authService';
import { router } from 'expo-router';

export default function Index() {
  const [authChecked, setAuthChecked] = useState(false);
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [userId, setUserId] = useState('');

  useEffect(() => {
    const check = async () => {
      // التحقق من استعادة الجلسة أولاً
      const sessionRestore = await authService.checkSessionRestore();
      if (sessionRestore.canRestore && sessionRestore.user_id) {
        setUserLoggedIn(true);
        setUserId(sessionRestore.user_id);
        if (sessionRestore.lastSessionId) {
          await authService.saveLastSession(sessionRestore.lastSessionId);
        }
      } else {
        const authed = await authService.isAuthenticated();
        setUserLoggedIn(authed);
        if (authed) {
          const uid = await authService.getUserId();
          setUserId(uid || '');
        }
      }
      setAuthChecked(true);
    };
    check();
  }, []);

  useEffect(() => {
    if (!authChecked || !userLoggedIn) return;

    runtime.start();
    storeSyncBridge.activate();
    storeSyncBridge.syncNow();
    livingIntelligence.start(userId, 'ar');

    audioEngine.init().then(() => {
      audioEngine.startAmbience();
      audioEngine.bindEvents();
    });

    return () => {
      livingIntelligence.stop();
      audioEngine.unbindEvents();
      audioEngine.fadeAll();
      storeSyncBridge.deactivate();
      runtime.stop();
    };
  }, [authChecked, userLoggedIn, userId]);

  if (!authChecked) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={styles.text}>جارٍ التحميل...</Text>
      </View>
    );
  }

  if (!userLoggedIn) {
    router.replace('/genesis');
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={styles.text}>جارٍ التوجيه...</Text>
      </View>
    );
  }

  return <LivingSpace userId={userId} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0014' },
  text: { color: '#A78BFA', fontSize: 18, marginTop: 16 },
});
