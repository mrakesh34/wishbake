import { authManager } from '../services/AuthManager.js';

export class AuthModal {
  constructor(onSuccessCallback) { this.onSuccess = onSuccessCallback; this.mode = 'login'; this.init(); }
  init() {
    this.modalEl = document.getElementById('auth-modal');
    if (!this.modalEl) {
      this.modalEl = document.createElement('div'); this.modalEl.id = 'auth-modal';
      this.modalEl.className = 'fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 hidden';
      document.body.appendChild(this.modalEl);
    }
    this.render();
    this.modalEl.classList.add('hidden');
  }
  render() {
    const signup = this.mode === 'signup';
    this.modalEl.innerHTML = `<div class="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl relative">
      <button id="close-auth-modal" class="absolute top-5 right-5 p-2" aria-label="Close">✕</button>
      <h2 class="font-display text-2xl font-bold text-primary mb-2">${signup ? 'Create your WISHBAKE account' : 'Welcome back'}</h2>
      <p class="text-sm text-on-surface-variant mb-5">Your saved cart, orders, and delivery details stay with your account.</p>
      <div id="auth-alert-box" class="hidden mb-4 p-3 rounded-xl text-sm"></div>
      <form id="password-auth-form" class="space-y-4">
        ${signup ? '<label class="block text-sm">Name<input id="auth-name" required maxlength="120" autocomplete="name" class="mt-1 w-full p-3 rounded-xl border border-outline-variant"></label>' : ''}
        <label class="block text-sm">Email<input id="auth-email" required type="email" autocomplete="email" class="mt-1 w-full p-3 rounded-xl border border-outline-variant"></label>
        <label class="block text-sm">Password<input id="auth-password" required type="password" minlength="8" maxlength="128" autocomplete="${signup ? 'new-password' : 'current-password'}" class="mt-1 w-full p-3 rounded-xl border border-outline-variant"></label>
        <button id="auth-submit" class="w-full bg-primary text-white font-bold py-3 rounded-full">${signup ? 'Create account' : 'Sign in'}</button>
      </form>
      <p class="text-sm text-center mt-5">${signup ? 'Already registered?' : 'New to WISHBAKE?'} <button id="auth-toggle" class="text-primary font-bold underline">${signup ? 'Sign in' : 'Create an account'}</button></p>
    </div>`;
    this.modalEl.classList.remove('hidden');
    this.modalEl.querySelector('#close-auth-modal').onclick = () => this.close();
    this.modalEl.querySelector('#auth-toggle').onclick = () => { this.mode = signup ? 'login' : 'signup'; this.render(); };
    this.modalEl.querySelector('#password-auth-form').onsubmit = async event => {
      event.preventDefault();
      const button = this.modalEl.querySelector('#auth-submit'); button.disabled = true; button.textContent = 'Please wait…';
      const credentials = { email: this.modalEl.querySelector('#auth-email').value.trim(), password: this.modalEl.querySelector('#auth-password').value };
      if (signup) credentials.name = this.modalEl.querySelector('#auth-name').value.trim();
      try {
        await authManager[signup ? 'signup' : 'login'](credentials);
        this.close(); if (this.onSuccess) this.onSuccess(authManager.getUser());
      } catch (error) {
        const alert = this.modalEl.querySelector('#auth-alert-box'); alert.textContent = error.message;
        alert.className = 'mb-4 p-3 rounded-xl text-sm bg-red-50 text-red-700';
        button.disabled = false; button.textContent = signup ? 'Create account' : 'Sign in';
      }
    };
  }
  open() { this.mode = 'login'; this.render(); }
  close() { this.modalEl.classList.add('hidden'); }
}
