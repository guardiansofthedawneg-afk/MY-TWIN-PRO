import React, { useEffect } from 'react';
import { LivingSpace } from '../src/renderers';
import { storeSyncBridge } from '../src/core/StoreSyncBridge';

/**
 * INDEX — مدخل التطبيق الوحيد
 * ==============================
 * لا AsyncStorage. لا ActivityIndicator. لا Splash.
 * يبدأ التطبيق مباشرة في LivingSpace.
 * هذا هو المنتج النهائي.
 */
export default function Index() {
  useEffect(() => {
    storeSyncBridge.activate();
    return () => storeSyncBridge.deactivate();
  }, []);

  return <LivingSpace />;
}
