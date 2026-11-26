import { apiUrl } from './api.js';
import { resolveApiError } from '../utils/ui.js';

const EXPLICIT_ENV_MODE = (import.meta.env.VITE_PAYMENT_MODE || '').trim().toLowerCase();
const DEFAULT_MODE = EXPLICIT_ENV_MODE === 'production' || EXPLICIT_ENV_MODE === 'live'
  ? 'production'
  : 'sandbox';

let sdkInstance = null;
let initializedMode = null;
let gatewayConfig = {
  configured: false,
  mode: DEFAULT_MODE,
  sdkUrl: '',
  sdkGlobal: '',
  loaded: false
};
let initPromise = null;
let scriptLoadPromise = null;

function loadCheckoutScript(scriptUrl) {
  if (!scriptUrl || typeof document === 'undefined') {
    return Promise.resolve(false);
  }
  if (scriptLoadPromise) return scriptLoadPromise;

  const existing = document.querySelector(`script[src="${scriptUrl}"]`);
  if (existing) {
    scriptLoadPromise = Promise.resolve(true);
    return scriptLoadPromise;
  }

  scriptLoadPromise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = scriptUrl;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
  return scriptLoadPromise;
}

function createSdkInstance(mode) {
  if (typeof window === 'undefined' || !gatewayConfig.sdkGlobal) {
    return null;
  }
  const ctor = window[gatewayConfig.sdkGlobal];
  if (typeof ctor !== 'function') {
    return null;
  }
  if (!sdkInstance || initializedMode !== mode) {
    sdkInstance = ctor({ mode });
    initializedMode = mode;
  }
  return sdkInstance;
}

/**
 * Fetch non-secret payment gateway metadata and initialize the checkout SDK once at app boot.
 */
export async function initPaymentGateway() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const res = await fetch(apiUrl('/api/payments/online/config'));
      if (res.ok) {
        const data = await res.json();
        const serverMode = data?.mode === 'production' ? 'production' : 'sandbox';
        gatewayConfig = {
          configured: Boolean(data?.configured),
          mode: EXPLICIT_ENV_MODE ? DEFAULT_MODE : serverMode,
          sdkUrl: data?.sdk_url || '',
          sdkGlobal: data?.sdk_global || '',
          loaded: true
        };
      }
    } catch {
      gatewayConfig = { ...gatewayConfig, loaded: true };
    }

    if (gatewayConfig.sdkUrl) {
      await loadCheckoutScript(gatewayConfig.sdkUrl);
      createSdkInstance(gatewayConfig.mode);
    }
    return gatewayConfig;
  })();

  return initPromise;
}

/**
 * Launch the online checkout modal and normalize the 3-state promise resolution.
 */
export async function launchOnlineCheckout(paymentSessionId, modeOverride = null) {
  if (!paymentSessionId) {
    return {
      outcome: 'error',
      message: 'Missing payment session from server. Please try again.'
    };
  }

  await initPaymentGateway();

  const targetMode = modeOverride === 'production' || modeOverride === 'sandbox'
    ? modeOverride
    : gatewayConfig.mode;

  const sdk = createSdkInstance(targetMode);
  if (!sdk) {
    return {
      outcome: 'error',
      message: 'Online checkout failed to load. Please refresh and try again.'
    };
  }

  try {
    const result = await sdk.checkout({
      paymentSessionId,
      redirectTarget: '_modal'
    });

    if (result?.error) {
      return {
        outcome: 'cancelled',
        message: 'Payment was not completed. Your items are still saved in your bag.'
      };
    }

    if (result?.redirect) {
      return { outcome: 'redirect' };
    }

    if (result?.paymentDetails) {
      return { outcome: 'verify' };
    }

    return { outcome: 'verify' };
  } catch {
    return {
      outcome: 'error',
      message: 'Could not open online checkout. Please check your connection and try again.'
    };
  }
}

export async function verifyOnlinePayment(orderId, authToken) {
  const headers = { 'Content-Type': 'application/json' };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const res = await fetch(apiUrl('/api/payments/online/verify'), {
    method: 'POST',
    headers,
    body: JSON.stringify({ order_id: orderId })
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(resolveApiError(data, 'Could not verify payment status with server.'));
  }
  return data;
}

export async function retryOnlinePayment(orderId, authToken) {
  const headers = { 'Content-Type': 'application/json' };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const res = await fetch(apiUrl(`/api/payments/online/retry/${encodeURIComponent(orderId)}`), {
    method: 'POST',
    headers
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(resolveApiError(data, 'Could not resume payment session for this order.'));
  }
  return data;
}
