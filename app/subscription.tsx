/**
 * subscription.tsx – SoulSync MyTwin AI
 * شاشة باقات الوعي – expo-iap@4.2.8 + SDK 52
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Linking, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useTwinStore } from '../store/useTwinStore';
import { useTheme } from '../utils/theme';
import {
  Crown, Star, CheckCircle2, ArrowRight, Brain, Zap,
  Sparkles, MessageSquare, Search, Globe, GraduationCap,
  Code2, TrendingUp, Heart, Moon, PenLine, Home, Mic,
  Cloud, ImageIcon, Infinity, RefreshCw,
} from 'lucide-react-native';
import {
  initializeIAP,
  purchaseSubscription,
  restorePurchases,
} from '../lib/iapService';

const LANDING_PAGE_URL = 'https://sirmarket7-cloud.github.io/Soul-Sync/subscribe.html';
type TierId = 'free' | 'plus' | 'premium' | 'pro' | 'yearly';

interface Plan {
  id: TierId; name: string; price: string; period: string;
  billingNote: string; color: string; glowColor: string;
  tagline_ar: string; tagline_en: string;
  consciousnessLayers: number;
  popular?: boolean; highlight?: boolean;
  features: { icon: any; text_ar: string; text_en: string }[];
}

const PLANS: Plan[] = [
  // ... نفس البيانات ...
];

// 🛡️ تغيير اسم المتغير لتجنب conflict مع TypeScript generic T
const I18N = {
  ar: {
    title: 'باقات الوعي', current: 'مفعّلة حالياً',
    popular: 'الأكثر شيوعاً', bestValue: 'أفضل قيمة',
    subscribe: 'اشترك الآن', restore: 'استعادة الاشتراك السابق',
    manage: 'إدارة الاشتراك عبر المتجر',
    footer: 'جميع الأسعار بالدولار الأمريكي. يمكنك الإلغاء في أي وقت.',
    layers: 'طبقات الوعي',
    storeUnavailable: 'المتجر غير متاح. يمكنك الاشتراك من الموقع.',
    openWebsite: 'فتح الموقع', cancel: 'إلغاء',
    restoreSuccess: 'تم استعادة اشتراكك بنجاح!',
    restoreNone: 'لا توجد اشتراكات سابقة.',
    restoreFail: 'فشلت الاستعادة. حاول مجدداً.',
    purchaseSuccess: 'تم تفعيل الاشتراك بنجاح! 🎉',
  },
  en: {
    title: 'Consciousness Plans', current: 'Currently Active',
    popular: 'Most Popular', bestValue: 'Best Value',
    subscribe: 'Subscribe Now', restore: 'Restore Previous Purchase',
    manage: 'Manage via App Store',
    footer: 'All prices in USD. Cancel anytime.',
    layers: 'Consciousness Layers',
    storeUnavailable: 'Store unavailable. Subscribe via website.',
    openWebsite: 'Open Website', cancel: 'Cancel',
    restoreSuccess: 'Subscription restored successfully!',
    restoreNone: 'No previous purchases found.',
    restoreFail: 'Restore failed. Please try again.',
    purchaseSuccess: 'Subscription activated! 🎉',
  },
};

// ... باقي الكود كما هو مع تغيير T إلى I18N ...
