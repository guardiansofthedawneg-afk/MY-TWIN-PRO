import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { router } from 'expo-router';

export default function Index() {
  const [status, setStatus] = useState('جارٍ التحميل...');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        router.replace('/genesis');
      } catch (e: any) {
        setStatus('خطأ: ' + (e?.message || 'Unknown'));
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0014',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 18,
  },
});
