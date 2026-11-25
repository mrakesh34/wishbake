const HTML_ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

/**
 * Escape arbitrary text for safe HTML template interpolation.
 */
export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => HTML_ESCAPE_MAP[ch]);
}

/**
 * Format an INR amount consistently without stray floating-point decimals.
 */
export function formatINR(amount) {
  const rounded = Math.round(Number(amount || 0));
  return `₹${rounded.toLocaleString('en-IN')}`;
}

/**
 * Extract a readable message from FastAPI JSON error responses (string or 422 error array).
 */
export function resolveApiError(data, fallback = 'Something went wrong. Please try again.') {
  if (!data) return fallback;
  if (typeof data.detail === 'string' && data.detail.trim()) return data.detail;
  if (Array.isArray(data.detail) && data.detail.length > 0) {
    const first = data.detail[0];
    const msg = typeof first === 'string' ? first : (first?.msg || '');
    if (msg) return msg.replace(/^Value error,\s*/i, '');
  }
  if (typeof data.message === 'string' && data.message.trim()) return data.message;
  return fallback;
}

/**
 * Show a non-blocking toast notification.
 */
export function showToast(message, type = 'info', duration = 3600) {
  let region = document.getElementById('wb-toast-region');
  if (!region) {
    region = document.createElement('div');
    region.id = 'wb-toast-region';
    region.className = 'wb-toast-region';
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'false');
    document.body.appendChild(region);
  }

  const iconMap = {
    success: 'check_circle',
    error: 'error',
    warning: 'warning',
    info: 'info'
  };

  const toast = document.createElement('div');
  toast.className = `wb-toast wb-toast--${type}`;
  toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
  toast.innerHTML = `
    <span class="material-symbols-outlined wb-toast__icon" aria-hidden="true">${iconMap[type] || 'info'}</span>
    <span class="wb-toast__message">${escapeHtml(message)}</span>
    <button type="button" class="wb-toast__close" aria-label="Dismiss notification">
      <span class="material-symbols-outlined" aria-hidden="true">close</span>
    </button>
  `;

  const remove = () => {
    toast.classList.add('is-leaving');
    setTimeout(() => toast.remove(), 220);
  };

  toast.querySelector('.wb-toast__close')?.addEventListener('click', remove);
  region.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('is-visible'));

  if (duration > 0) {
    setTimeout(remove, duration);
  }
}
