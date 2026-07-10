import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { authService } from '../src/services/authService';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email.trim()) return;
    setLoading(true);
    try {
      await authService.forgotPassword(email.trim());
      setSent(true);
    } catch (e: any) {
      Alert.alert('خطأ', e.message || 'فشل إرسال رابط الاستعادة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>استعادة كلمة المرور</Text>
      {!sent ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="البريد الإلكتروني"
            placeholderTextColor="#6B5B8A"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.btn} onPress={handleReset} disabled={loading}>
            <Text style={styles.btnText}>{loading ? 'جارٍ الإرسال...' : 'إرسال رابط الاستعادة'}</Text>
          </TouchableOpacity>
        </>
      ) : (
        <Text style={styles.successText}>تم إرسال رابط الاستعادة إلى بريدك الإلكتروني. تحقق من صندوق الوارد.</Text>
      )}
      <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
        <Text style={styles.backText}>← العودة</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0014', padding: 32 },
  title: { color: '#FFFFFF', fontSize: 24, fontWeight: '700', marginBottom: 24 },
  input: { width: '100%', backgroundColor: '#161122', borderRadius: 14, padding: 14, fontSize: 16, color: '#FFFFFF', borderWidth: 1, borderColor: '#2D1B4D', marginBottom: 16, textAlign: 'right' },
  btn: { width: '100%', backgroundColor: '#7C3AED', paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
  btnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  successText: { color: '#10B981', fontSize: 16, textAlign: 'center', lineHeight: 24 },
  backText: { color: '#6B5B8A', fontSize: 14 },
});
