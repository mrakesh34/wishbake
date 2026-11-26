import { authManager } from '../services/AuthManager.js';
import { escapeHtml, showToast } from '../utils/ui.js';

export class AuthModal {
  constructor(onSuccessCallback) {
    this.onSuccess = onSuccessCallback;
    this.mode = 'login';
    this.pendingSignup = null;
    this.resendCooldown = 0;
    this.cooldownTimer = null;
    this.init();
  }

  init() {
    this.modalEl = document.getElementById('auth-modal');
    if (!this.modalEl) {
      this.modalEl = document.createElement('div');
      this.modalEl.id = 'auth-modal';
      this.modalEl.className = 'wb-modal-overlay is-hidden';
      this.modalEl.setAttribute('role', 'dialog');
      this.modalEl.setAttribute('aria-modal', 'true');
      this.modalEl.setAttribute('aria-labelledby', 'auth-modal-title');
      document.body.appendChild(this.modalEl);
    }

    this.modalEl.addEventListener('click', (e) => {
      if (e.target === this.modalEl) this.close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.modalEl.classList.contains('is-hidden')) {
        this.close();
      }
    });

    this.render();
    this.modalEl.classList.add('is-hidden');
  }

  clearCooldownTimer() {
    if (this.cooldownTimer) {
      clearInterval(this.cooldownTimer);
      this.cooldownTimer = null;
    }
  }

  startResendCooldown(seconds = 60) {
    this.clearCooldownTimer();
    this.resendCooldown = Math.max(0, Math.ceil(Number(seconds) || 0));
    this.updateResendButtonState();
    if (this.resendCooldown <= 0) return;

    this.cooldownTimer = setInterval(() => {
      this.resendCooldown = Math.max(0, this.resendCooldown - 1);
      this.updateResendButtonState();
      if (this.resendCooldown <= 0) {
        this.clearCooldownTimer();
      }
    }, 1000);
  }

  updateResendButtonState() {
    const resendBtn = this.modalEl?.querySelector('#auth-resend-otp');
    if (!resendBtn) return;
    if (this.resendCooldown > 0) {
      resendBtn.disabled = true;
      resendBtn.textContent = `Resend code in ${this.resendCooldown}s`;
    } else {
      resendBtn.disabled = false;
      resendBtn.textContent = 'Resend code';
    }
  }

  render() {
    this.clearCooldownTimer();

    if (this.mode === 'verify-otp' && this.pendingSignup) {
      this.renderVerifyOtpView();
      return;
    }

    const signup = this.mode === 'signup';
    const prefillName = signup ? (this.pendingSignup?.name || '') : '';
    const prefillEmail = this.pendingSignup?.email || '';

    this.modalEl.innerHTML = `
      <div class="wb-modal wb-modal--compact wb-auth-modal">
        <button id="close-auth-modal" class="wb-icon-close wb-modal__close" type="button" aria-label="Close sign in">
          <span class="material-symbols-outlined" aria-hidden="true">close</span>
        </button>

        <p class="wb-eyebrow">WISHBAKE Account</p>
        <h2 id="auth-modal-title">${signup ? 'Create your account' : 'Welcome back'}</h2>
        <p class="wb-auth-modal__sub">${
          signup
            ? 'We’ll send a 6-digit verification code to confirm your email before activating your account.'
            : 'Your saved bag, order history, and Bhubaneswar delivery details stay synced with your account.'
        }</p>

        <div id="auth-alert-box" class="wb-inline-notice is-error is-hidden" role="alert"></div>

        <form id="password-auth-form" class="wb-form">
          ${signup ? `
            <div class="wb-field">
              <label for="auth-name">Full Name</label>
              <input id="auth-name" required minlength="2" maxlength="120" autocomplete="name" value="${escapeHtml(prefillName)}" placeholder="e.g. Priya Mohanty" />
            </div>
          ` : ''}

          <div class="wb-field">
            <label for="auth-email">Email Address</label>
            <input id="auth-email" required type="email" autocomplete="email" value="${escapeHtml(prefillEmail)}" placeholder="priya@example.com" />
          </div>

          <div class="wb-field">
            <label for="auth-password">Password <span class="wb-label-opt">(min 8 characters)</span></label>
            <input id="auth-password" required type="password" minlength="8" maxlength="128" autocomplete="${signup ? 'new-password' : 'current-password'}" placeholder="••••••••" />
          </div>

          <button id="auth-submit" type="submit" class="wb-button wb-button--primary wb-button--full">
            ${signup ? 'Send verification code' : 'Sign in'}
          </button>
        </form>

        <p class="wb-auth-modal__switch">
          ${signup ? 'Already registered?' : 'New to WISHBAKE?'}
          <button id="auth-toggle" type="button">${signup ? 'Sign in' : 'Create an account'}</button>
        </p>
      </div>
    `;

    this.modalEl.querySelector('#close-auth-modal').onclick = () => this.close();
    this.modalEl.querySelector('#auth-toggle').onclick = () => {
      this.mode = signup ? 'login' : 'signup';
      this.render();
    };

    this.modalEl.querySelector('#password-auth-form').onsubmit = async (event) => {
      event.preventDefault();
      const button = this.modalEl.querySelector('#auth-submit');
      const alertBox = this.modalEl.querySelector('#auth-alert-box');
      alertBox.classList.add('is-hidden');

      button.disabled = true;
      button.textContent = signup ? 'Sending code…' : 'Please wait…';

      const credentials = {
        email: this.modalEl.querySelector('#auth-email').value.trim(),
        password: this.modalEl.querySelector('#auth-password').value
      };
      if (signup) {
        credentials.name = this.modalEl.querySelector('#auth-name').value.trim();
      }

      try {
        if (signup) {
          const result = await authManager.requestSignupOtp(credentials);
          this.pendingSignup = {
            name: credentials.name,
            email: result.email || credentials.email.toLowerCase(),
            password: credentials.password
          };
          this.mode = 'verify-otp';
          this.resendCooldown = Number(result.resend_cooldown_seconds || 60);
          this.render();
          this.startResendCooldown(this.resendCooldown);
        } else {
          await authManager.login(credentials);
          this.pendingSignup = null;
          this.close();
          const user = authManager.getUser();
          showToast('Signed in successfully.', 'success');
          if (this.onSuccess) this.onSuccess(user);
        }
      } catch (error) {
        alertBox.textContent = error.message;
        alertBox.classList.remove('is-hidden');
        button.disabled = false;
        button.textContent = signup ? 'Send verification code' : 'Sign in';
      }
    };
  }

  renderVerifyOtpView() {
    const emailSafe = escapeHtml(this.pendingSignup?.email || '');

    this.modalEl.innerHTML = `
      <div class="wb-modal wb-modal--compact wb-auth-modal">
        <button id="close-auth-modal" class="wb-icon-close wb-modal__close" type="button" aria-label="Close verification">
          <span class="material-symbols-outlined" aria-hidden="true">close</span>
        </button>

        <p class="wb-eyebrow">Email Verification</p>
        <h2 id="auth-modal-title">Enter 6-digit code</h2>
        <p class="wb-auth-modal__sub">
          We sent a verification code to <strong>${emailSafe}</strong>. It expires in 10 minutes.
        </p>

        <div id="auth-alert-box" class="wb-inline-notice is-error is-hidden" role="alert"></div>
        <div id="auth-status-box" class="wb-inline-notice is-success is-hidden" role="status"></div>

        <form id="otp-verify-form" class="wb-form">
          <div class="wb-field">
            <label for="auth-otp-code">Verification Code</label>
            <input
              id="auth-otp-code"
              class="wb-otp-input"
              required
              type="text"
              inputmode="numeric"
              pattern="[0-9]{6}"
              minlength="6"
              maxlength="6"
              autocomplete="one-time-code"
              placeholder="000000"
            />
          </div>

          <button id="auth-verify-submit" type="submit" class="wb-button wb-button--primary wb-button--full">
            Verify &amp; create account
          </button>
        </form>

        <div class="wb-auth-otp-actions">
          <button id="auth-resend-otp" type="button" class="wb-auth-link-btn">Resend code</button>
          <button id="auth-edit-signup" type="button" class="wb-auth-link-btn">Edit sign-up details</button>
        </div>
      </div>
    `;

    this.modalEl.querySelector('#close-auth-modal').onclick = () => this.close();

    const otpInput = this.modalEl.querySelector('#auth-otp-code');
    otpInput?.focus();
    otpInput?.addEventListener('input', () => {
      otpInput.value = otpInput.value.replace(/\D+/g, '').slice(0, 6);
    });

    this.modalEl.querySelector('#auth-edit-signup').onclick = () => {
      this.mode = 'signup';
      this.render();
    };

    this.modalEl.querySelector('#auth-resend-otp').onclick = async () => {
      const alertBox = this.modalEl.querySelector('#auth-alert-box');
      const statusBox = this.modalEl.querySelector('#auth-status-box');
      const resendBtn = this.modalEl.querySelector('#auth-resend-otp');
      alertBox.classList.add('is-hidden');
      statusBox.classList.add('is-hidden');
      resendBtn.disabled = true;
      resendBtn.textContent = 'Sending…';

      try {
        const result = await authManager.resendSignupOtp(this.pendingSignup.email);
        this.resendCooldown = Number(result.resend_cooldown_seconds || 60);
        statusBox.textContent = `A new verification code was sent to ${this.pendingSignup.email}.`;
        statusBox.classList.remove('is-hidden');
        this.startResendCooldown(this.resendCooldown);
      } catch (error) {
        alertBox.textContent = error.message;
        alertBox.classList.remove('is-hidden');
        this.updateResendButtonState();
      }
    };

    this.modalEl.querySelector('#otp-verify-form').onsubmit = async (event) => {
      event.preventDefault();
      const button = this.modalEl.querySelector('#auth-verify-submit');
      const alertBox = this.modalEl.querySelector('#auth-alert-box');
      const statusBox = this.modalEl.querySelector('#auth-status-box');
      alertBox.classList.add('is-hidden');
      statusBox.classList.add('is-hidden');

      const otp = (otpInput?.value || '').replace(/\D+/g, '');
      if (otp.length !== 6) {
        alertBox.textContent = 'Enter the 6-digit verification code from your email.';
        alertBox.classList.remove('is-hidden');
        otpInput?.focus();
        return;
      }

      button.disabled = true;
      button.textContent = 'Verifying…';

      try {
        await authManager.verifySignupOtp({
          email: this.pendingSignup.email,
          otp
        });
        this.pendingSignup = null;
        this.close();
        const user = authManager.getUser();
        showToast(`Welcome to WISHBAKE, ${user?.name || 'friend'}!`, 'success');
        if (this.onSuccess) this.onSuccess(user);
      } catch (error) {
        alertBox.textContent = error.message;
        alertBox.classList.remove('is-hidden');
        button.disabled = false;
        button.textContent = 'Verify & create account';
        otpInput?.select();
      }
    };

    this.updateResendButtonState();
  }

  open() {
    this.mode = 'login';
    this.pendingSignup = null;
    this.resendCooldown = 0;
    this.render();
    this.modalEl.classList.remove('is-hidden');
  }

  close() {
    this.clearCooldownTimer();
    this.modalEl.classList.add('is-hidden');
  }
}
