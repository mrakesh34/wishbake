import { authManager } from '../services/AuthManager.js';

export class AuthModal {
  constructor(onSuccessCallback) {
    this.onSuccess = onSuccessCallback;
    this.modalEl = null;
    this.currentEmail = '';
    this.currentName = '';
    this.resendTimer = null;
    this.countdownSeconds = 60;
    this.devOtp = null;

    this.init();
  }

  init() {
    this.render();
    this.attachEvents();
  }

  render() {
    // Check if modal container already exists
    let modal = document.getElementById('auth-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'auth-modal';
      modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 hidden transition-opacity duration-300';
      document.body.appendChild(modal);
    }
    this.modalEl = modal;
    this.showStep1();
  }

  showStep1() {
    this.modalEl.innerHTML = `
      <div class="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-outline-variant relative transform transition-all scale-100 animate-fadeIn">
        <button id="close-auth-modal" class="absolute top-6 right-6 p-2 text-on-surface-variant hover:text-primary rounded-full hover:bg-surface-container transition-colors" aria-label="Close">
          <span class="material-symbols-outlined text-xl">close</span>
        </button>

        <div class="text-center mb-6">
          <div class="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-3">
            <span class="material-symbols-outlined text-3xl">cake</span>
          </div>
          <h3 class="font-display text-2xl font-bold text-on-surface">Welcome to WISHBAKE</h3>
          <p class="text-xs text-on-surface-variant mt-1">Sign in or register seamlessly via Mail-OTP verification</p>
        </div>

        <div id="auth-alert-box" class="hidden mb-4 p-3.5 rounded-2xl text-xs flex items-center gap-2"></div>

        <form id="send-otp-form" class="space-y-4">
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-on-surface mb-1.5">
              Full Name <span class="text-on-surface-variant font-normal normal-case">(Optional)</span>
            </label>
            <div class="relative">
              <span class="material-symbols-outlined absolute left-3.5 top-3 text-outline text-lg">person</span>
              <input 
                type="text" 
                id="auth-user-name" 
                value="${this.currentName}"
                placeholder="e.g. Priya Sharma" 
                class="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-surface-container-lowest" 
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-on-surface mb-1.5">
              Email Address <span class="text-primary">*</span>
            </label>
            <div class="relative">
              <span class="material-symbols-outlined absolute left-3.5 top-3 text-outline text-lg">mail</span>
              <input 
                type="email" 
                id="auth-user-email" 
                required 
                value="${this.currentEmail}"
                placeholder="priya@example.com" 
                class="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-surface-container-lowest" 
              />
            </div>
            <p class="text-[11px] text-on-surface-variant mt-1.5 flex items-center gap-1">
              <span class="material-symbols-outlined text-xs text-primary">verified_user</span>
              We will send a 6-digit secure code to your inbox
            </p>
          </div>

          <button 
            type="submit" 
            id="send-otp-btn" 
            class="w-full bg-primary text-white font-bold py-3.5 rounded-full hover:bg-primary/90 hover:shadow-lg transition-all flex items-center justify-center gap-2 mt-2"
          >
            <span>Send Verification Code</span>
            <span class="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </form>

        <div class="mt-6 pt-5 border-t border-outline-variant/40 grid grid-cols-3 gap-2 text-center text-[10px] text-on-surface-variant">
          <div class="p-2 rounded-xl bg-surface-container-low">
            <span class="material-symbols-outlined text-primary text-base block mb-0.5">lock</span>
            <span>Passwordless</span>
          </div>
          <div class="p-2 rounded-xl bg-surface-container-low">
            <span class="material-symbols-outlined text-primary text-base block mb-0.5">local_shipping</span>
            <span>Live Tracking</span>
          </div>
          <div class="p-2 rounded-xl bg-surface-container-low">
            <span class="material-symbols-outlined text-primary text-base block mb-0.5">bookmark_added</span>
            <span>Saved Details</span>
          </div>
        </div>
      </div>
    `;

    this.bindStep1Events();
  }

  showStep2() {
    this.modalEl.innerHTML = `
      <div class="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-outline-variant relative transform transition-all scale-100 animate-fadeIn">
        <button id="close-auth-modal" class="absolute top-6 right-6 p-2 text-on-surface-variant hover:text-primary rounded-full hover:bg-surface-container transition-colors" aria-label="Close">
          <span class="material-symbols-outlined text-xl">close</span>
        </button>

        <div class="text-center mb-6">
          <div class="w-14 h-14 bg-primary-container/30 text-primary rounded-2xl flex items-center justify-center mx-auto mb-3">
            <span class="material-symbols-outlined text-3xl">mark_email_read</span>
          </div>
          <h3 class="font-display text-2xl font-bold text-on-surface">Enter Passcode</h3>
          <p class="text-xs text-on-surface-variant mt-1">We sent a 6-digit verification code to</p>
          <div class="inline-flex items-center gap-1.5 bg-surface-container px-3 py-1 rounded-full text-xs font-bold text-primary mt-2">
            <span>${this.currentEmail}</span>
            <button id="change-email-btn" class="text-on-surface-variant hover:text-primary underline text-[11px] ml-1 font-normal">Change</button>
          </div>
        </div>

        <div id="auth-alert-box" class="hidden mb-4 p-3.5 rounded-2xl text-xs flex items-center gap-2"></div>

        ${this.devOtp ? `
          <div class="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs text-amber-900 animate-pulse">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-amber-700 text-sm">mark_email_unread</span>
              <span>Dev Preview OTP: <strong class="font-mono font-bold text-sm tracking-wider">${this.devOtp}</strong></span>
            </div>
            <button type="button" id="quick-fill-otp-btn" class="bg-amber-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg hover:bg-amber-800 transition-colors">
              Auto-Fill
            </button>
          </div>
        ` : ''}

        <form id="verify-otp-form" class="space-y-6">
          <div>
            <label class="block text-center text-xs font-bold uppercase tracking-wider text-on-surface mb-3">
              6-Digit Verification Code
            </label>
            
            <!-- 6 PIN Digit Input Boxes -->
            <div class="flex justify-center gap-2.5" id="otp-input-group">
              <input type="text" maxlength="1" pattern="[0-9]" inputmode="numeric" class="otp-digit w-12 h-14 text-center text-xl font-bold rounded-2xl border-2 border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-surface-container-lowest transition-all" data-index="0" autofocus />
              <input type="text" maxlength="1" pattern="[0-9]" inputmode="numeric" class="otp-digit w-12 h-14 text-center text-xl font-bold rounded-2xl border-2 border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-surface-container-lowest transition-all" data-index="1" />
              <input type="text" maxlength="1" pattern="[0-9]" inputmode="numeric" class="otp-digit w-12 h-14 text-center text-xl font-bold rounded-2xl border-2 border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-surface-container-lowest transition-all" data-index="2" />
              <input type="text" maxlength="1" pattern="[0-9]" inputmode="numeric" class="otp-digit w-12 h-14 text-center text-xl font-bold rounded-2xl border-2 border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-surface-container-lowest transition-all" data-index="3" />
              <input type="text" maxlength="1" pattern="[0-9]" inputmode="numeric" class="otp-digit w-12 h-14 text-center text-xl font-bold rounded-2xl border-2 border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-surface-container-lowest transition-all" data-index="4" />
              <input type="text" maxlength="1" pattern="[0-9]" inputmode="numeric" class="otp-digit w-12 h-14 text-center text-xl font-bold rounded-2xl border-2 border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-surface-container-lowest transition-all" data-index="5" />
            </div>
          </div>

          <div class="flex items-center justify-between text-xs text-on-surface-variant px-1">
            <span id="countdown-text" class="flex items-center gap-1">
              <span class="material-symbols-outlined text-xs">schedule</span>
              <span>Expires in <strong id="timer-seconds">60s</strong></span>
            </span>
            <button type="button" id="resend-otp-btn" class="text-primary font-bold hover:underline disabled:opacity-40 disabled:cursor-not-allowed" disabled>
              Resend Code
            </button>
          </div>

          <button 
            type="submit" 
            id="verify-otp-btn" 
            class="w-full bg-primary text-white font-bold py-3.5 rounded-full hover:bg-primary/90 hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <span>Verify & Continue</span>
            <span class="material-symbols-outlined text-sm">check_circle</span>
          </button>
        </form>
      </div>
    `;

    this.bindStep2Events();
    this.startCountdown(60);
  }

  showSuccess(userName) {
    this.modalEl.innerHTML = `
      <div class="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-outline-variant text-center space-y-4 transform transition-all scale-100 animate-fadeIn">
        <div class="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto scale-110 transition-transform">
          <span class="material-symbols-outlined text-4xl">verified</span>
        </div>
        <h3 class="font-display text-2xl font-bold text-on-surface">Authenticated!</h3>
        <p class="text-xs text-on-surface-variant">
          Welcome back, <strong class="text-primary">${userName || 'Connoisseur'}</strong>! Your account has been verified.
        </p>
        <div class="py-2">
          <div class="inline-flex items-center gap-2 text-xs text-on-surface-variant bg-surface-container px-4 py-2 rounded-full">
            <span class="material-symbols-outlined text-sm text-primary animate-spin">refresh</span>
            <span>Loading your bespoke experience...</span>
          </div>
        </div>
      </div>
    `;

    setTimeout(() => {
      this.close();
      if (this.onSuccess) this.onSuccess(authManager.getUser());
    }, 1200);
  }

  attachEvents() {
    this.modalEl.addEventListener('click', (e) => {
      if (e.target === this.modalEl) {
        this.close();
      }
    });
  }

  bindStep1Events() {
    const closeBtn = document.getElementById('close-auth-modal');
    if (closeBtn) closeBtn.addEventListener('click', () => this.close());

    const form = document.getElementById('send-otp-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const emailInput = document.getElementById('auth-user-email');
        const nameInput = document.getElementById('auth-user-name');
        const submitBtn = document.getElementById('send-otp-btn');

        this.currentEmail = emailInput.value.trim();
        this.currentName = nameInput ? nameInput.value.trim() : '';

        this.setLoading(submitBtn, true, 'Sending Code...');
        this.hideAlert();

        try {
          const res = await authManager.sendOtp(this.currentEmail, this.currentName);
          this.devOtp = res.dev_otp || null;
          this.showStep2();
        } catch (err) {
          this.showAlert(err.message || 'Failed to send verification code.', 'error');
          this.setLoading(submitBtn, false, 'Send Verification Code');
        }
      });
    }
  }

  bindStep2Events() {
    const closeBtn = document.getElementById('close-auth-modal');
    if (closeBtn) closeBtn.addEventListener('click', () => this.close());

    const changeEmailBtn = document.getElementById('change-email-btn');
    if (changeEmailBtn) {
      changeEmailBtn.addEventListener('click', () => {
        this.stopCountdown();
        this.showStep1();
      });
    }

    const quickFillBtn = document.getElementById('quick-fill-otp-btn');
    if (quickFillBtn && this.devOtp) {
      quickFillBtn.addEventListener('click', () => {
        this.fillOtp(this.devOtp);
      });
    }

    const resendBtn = document.getElementById('resend-otp-btn');
    if (resendBtn) {
      resendBtn.addEventListener('click', async () => {
        resendBtn.disabled = true;
        this.hideAlert();
        try {
          const res = await authManager.sendOtp(this.currentEmail, this.currentName);
          this.devOtp = res.dev_otp || null;
          this.showAlert('A new verification code has been dispatched to your email!', 'success');
          this.startCountdown(60);
          if (this.devOtp) {
            const devBadge = document.querySelector('#quick-fill-otp-btn strong');
            if (devBadge) devBadge.textContent = this.devOtp;
          }
        } catch (err) {
          this.showAlert(err.message || 'Failed to resend verification code.', 'error');
          resendBtn.disabled = false;
        }
      });
    }

    // Handle 6-box OTP digit focus, typing, backspace, paste
    const digits = document.querySelectorAll('.otp-digit');
    digits.forEach((input, index) => {
      input.addEventListener('input', (e) => {
        const val = e.target.value;
        if (val.length >= 1) {
          // Keep only first digit
          input.value = val.slice(0, 1);
          if (index < digits.length - 1) {
            digits[index + 1].focus();
          } else {
            // Auto submit if last digit filled
            this.checkAndSubmitOtp();
          }
        }
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace') {
          if (!input.value && index > 0) {
            digits[index - 1].focus();
            digits[index - 1].value = '';
          }
        } else if (e.key === 'ArrowLeft' && index > 0) {
          digits[index - 1].focus();
        } else if (e.key === 'ArrowRight' && index < digits.length - 1) {
          digits[index + 1].focus();
        }
      });

      input.addEventListener('paste', (e) => {
        e.preventDefault();
        const pasteData = (e.clipboardData || window.clipboardData).getData('text').trim();
        if (/^\d{6}$/.test(pasteData)) {
          this.fillOtp(pasteData);
          this.checkAndSubmitOtp();
        }
      });
    });

    const verifyForm = document.getElementById('verify-otp-form');
    if (verifyForm) {
      verifyForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.checkAndSubmitOtp();
      });
    }

    // Auto focus first digit
    if (digits.length > 0) {
      setTimeout(() => digits[0].focus(), 50);
    }
  }

  fillOtp(code) {
    const digits = document.querySelectorAll('.otp-digit');
    const chars = code.split('');
    digits.forEach((input, idx) => {
      input.value = chars[idx] || '';
    });
    if (digits[5]) digits[5].focus();
  }

  getEnteredOtp() {
    const digits = document.querySelectorAll('.otp-digit');
    let otp = '';
    digits.forEach(d => otp += d.value);
    return otp;
  }

  async checkAndSubmitOtp() {
    const otp = this.getEnteredOtp();
    if (otp.length !== 6) {
      this.showAlert('Please enter the full 6-digit verification code.', 'error');
      return;
    }

    const submitBtn = document.getElementById('verify-otp-btn');
    this.setLoading(submitBtn, true, 'Verifying Code...');
    this.hideAlert();

    try {
      const res = await authManager.verifyOtp(this.currentEmail, otp, this.currentName);
      this.stopCountdown();
      this.showSuccess(res.user.name);
    } catch (err) {
      this.showAlert(err.message || 'Invalid or expired verification code.', 'error');
      this.setLoading(submitBtn, false, 'Verify & Continue');
      // Shake inputs
      const group = document.getElementById('otp-input-group');
      if (group) {
        group.classList.add('animate-shake');
        setTimeout(() => group.classList.remove('animate-shake'), 600);
      }
    }
  }

  startCountdown(seconds = 60) {
    this.stopCountdown();
    this.countdownSeconds = seconds;
    const timerText = document.getElementById('timer-seconds');
    const resendBtn = document.getElementById('resend-otp-btn');

    if (resendBtn) resendBtn.disabled = true;

    this.resendTimer = setInterval(() => {
      this.countdownSeconds--;
      if (timerText) timerText.textContent = `${this.countdownSeconds}s`;

      if (this.countdownSeconds <= 0) {
        this.stopCountdown();
        if (timerText) timerText.textContent = 'Expired';
        if (resendBtn) resendBtn.disabled = false;
      }
    }, 1000);
  }

  stopCountdown() {
    if (this.resendTimer) {
      clearInterval(this.resendTimer);
      this.resendTimer = null;
    }
  }

  showAlert(message, type = 'error') {
    const box = document.getElementById('auth-alert-box');
    if (!box) return;

    box.className = type === 'error'
      ? 'mb-4 p-3.5 rounded-2xl text-xs flex items-center gap-2 bg-red-50 text-red-700 border border-red-200'
      : 'mb-4 p-3.5 rounded-2xl text-xs flex items-center gap-2 bg-green-50 text-green-700 border border-green-200';

    const icon = type === 'error' ? 'error' : 'check_circle';
    box.innerHTML = `
      <span class="material-symbols-outlined text-base flex-shrink-0">${icon}</span>
      <span>${message}</span>
    `;
    box.classList.remove('hidden');
  }

  hideAlert() {
    const box = document.getElementById('auth-alert-box');
    if (box) box.classList.add('hidden');
  }

  setLoading(btn, isLoading, text) {
    if (!btn) return;
    if (isLoading) {
      btn.disabled = true;
      btn.innerHTML = `
        <span class="material-symbols-outlined text-sm animate-spin">refresh</span>
        <span>${text}</span>
      `;
    } else {
      btn.disabled = false;
      btn.innerHTML = `
        <span>${text}</span>
        <span class="material-symbols-outlined text-sm">arrow_forward</span>
      `;
    }
  }

  open(email = '', name = '') {
    if (email) this.currentEmail = email;
    if (name) this.currentName = name;
    this.showStep1();
    this.modalEl.classList.remove('hidden');
  }

  close() {
    this.stopCountdown();
    this.modalEl.classList.add('hidden');
  }
}
