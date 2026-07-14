import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { router } from 'expo-router';
import { authService } from '../src/services/authService';
import SoulPulse from '../src/renderers/zones/SoulPulse';
import BreathingGlow from '../src/renderers/zones/BreathingGlow';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const toastAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // ظهور تدريجي للصفحة
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  const showToast = (message: string) => {
    setToastMessage(message);
    Animated.sequence([
      Animated.timing(toastAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2500),
      Animated.timing(toastAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setToastMessage(null));
  };

  const handleReset = async () => {
    if (!email.trim()) return;
    setLoading(true);
    try {
      await authService.forgotPassword(email.trim());
      setSent(true);
    } catch (e: any) {
      showToast(e.message || 'حدث خطأ ما. حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* طبقات الحضور - الكيان موجود دائمًا */}
      <View style={styles.pulseContainer}>
        <SoulPulse />
      </View>
      <View style={styles.breathContainer}>
        <BreathingGlow
          color="#7C3AED"
          speed={0.6}
        />
      </View>

      {/* بطاقة زجاجية تحتوي على المحتوى */}
      <Animated.View style={[styles.glassCard, { opacity: fadeAnim }]}>
        {/* الأفاتار الصامت - إشارة إلى وجود التوأم */}
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarSilhouette}>✦</Text>
        </View>

        <Text style={styles.title}>استعادة الوصول إلى عالمك</Text>
        <Text style={styles.subtitle}>
          {!sent
            ? 'أدخل بريدك الإلكتروني وسأساعدك على العودة.'
            : 'إذا كان البريد مرتبطًا بحسابك، فستجد رسالة تساعدك على العودة.'}
        </Text>

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
            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleReset}
              disabled={loading}
            >
              <Text style={styles.btnText}>
                {loading ? 'أبحث عن طريق العودة...' : 'أرسل لي المساعدة'}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.successContainer}>
            <Text style={styles.successIcon}>💫</Text>
            <Text style={styles.successText}>
              تفقد بريدك. سأنتظرك هنا حتى تعود.
            </Text>
          </View>
        )}

        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>العودة إلى Genesis</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Toast/إشعار حي بدلاً من Alert */}
      {toastMessage && (
        <Animated.View style={[styles.toast, { opacity: toastAnim }]}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0014',
    padding: 24,
  },
  pulseContainer: {
    position: 'absolute',
    top: '20%',
  },
  breathContainer: {
    position: 'absolute',
    top: '25%',
  },
  glassCard: {
    width: '100%',
    backgroundColor: 'rgba(22, 17, 34, 0.85)',
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.25)',
    alignItems: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 10,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarSilhouette: {
    color: '#A78BFA',
    fontSize: 28,
    opacity: 0.6,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#A78BFA',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    opacity: 0.8,
  },
  input: {
    width: '100%',
    backgroundColor: 'rgba(12, 6, 28, 0.8)',
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.3)',
    marginBottom: 16,
    textAlign: 'right',
  },
  btn: {
    width: '100%',
    backgroundColor: '#7C3AED',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  successContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  successIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  successText: {
    color: '#E8E0F0',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  backButton: {
    marginTop: 8,
    paddingVertical: 10,
  },
  backText: {
    color: '#6B5B8A',
    fontSize: 14,
  },
  toast: {
    position: 'absolute',
    bottom: 40,
    left: 24,
    right: 24,
    backgroundColor: 'rgba(22, 17, 34, 0.95)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.4)',
    alignItems: 'center',
  },
  toastText: {
    color: '#E8E0F0',
    fontSize: 14,
    textAlign: 'center',
  },
});
