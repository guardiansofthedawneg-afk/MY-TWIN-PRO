import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { authService } from '../src/services/authService';

export default function SessionRestore() {
  const [status, setStatus] = useState<'checking' | 'restoring' | 'no_session'>('checking');

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const result = await authService.checkSessionRestore();
      if (result.canRestore && result.token) {
        setStatus('restoring');
        setTimeout(() => router.replace('/'), 1500);
      } else {
        setStatus('no_session');
      }
    } catch (e) {
      setStatus('no_session');
    }
  };

  return (
    <View style={styles.container}>
      {status === 'checking' && (
        <>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.text}>جارٍ التحقق من الجلسة...</Text>
        </>
      )}
      {status === 'restoring' && (
        <>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={[styles.text, { color: '#10B981' }]}>تم العثور على جلستك. جارٍ الاستعادة...</Text>
        </>
      )}
      {status === 'no_session' && (
        <>
          <Text style={styles.text}>لا توجد جلسة نشطة</Text>
          <TouchableOpacity style={styles.btn} onPress={() => router.replace('/genesis')}>
            <Text style={styles.btnText}>بدء جلسة جديدة</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0014', padding: 32 },
  text: { color: '#A78BFA', fontSize: 16, marginTop: 16, textAlign: 'center' },
  btn: { marginTop: 24, backgroundColor: '#7C3AED', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 16 },
  btnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
});
