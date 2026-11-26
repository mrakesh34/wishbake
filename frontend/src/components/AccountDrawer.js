import { authManager } from '../services/AuthManager.js';
import {
  launchOnlineCheckout,
  retryOnlinePayment,
  verifyOnlinePayment
} from '../services/paymentGateway.js';
import { escapeHtml, formatINR, showToast } from '../utils/ui.js';
import {
  clearFieldErrors,
  getPincodeLocality,
  setFieldErrors,
  syncServiceablePincodes,
  validateAddressFields,
  validateIndianPhone
} from '../utils/validation.js';

export class AccountDrawer {
  constructor() {
    this.activeTab = 'orders';
    this.orders = [];
    this.isLoadingOrders = false;
    this.ordersLoadFailed = false;
    this.confirmingSignOut = false;
    this.init();
  }

  init() {
    this.render();
    this.attachEvents();

    authManager.onAuthChange(({ user, isLoggedIn }) => {
      if (isLoggedIn) {
        this.updateHeader(user);
        if (this.isOpen()) {
          this.loadData();
        }
      } else {
        this.close();
      }
    });
  }

  render() {
    let overlay = document.getElementById('account-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'account-overlay';
      overlay.className = 'wb-overlay is-hidden';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-labelledby', 'account-user-name');

      overlay.innerHTML = `
        <div id="account-panel" class="wb-drawer is-closed">
          <div class="wb-drawer__head">
            <div class="wb-account-head">
              <div id="account-user-avatar" class="wb-account-head__avatar">W</div>
              <div>
                <h3 id="account-user-name">My Account</h3>
                <p id="account-user-email" class="wb-account-head__email">
                  <span>guest@wishbake.com</span>
                </p>
              </div>
            </div>
            <button id="close-account-btn" class="wb-icon-close" type="button" aria-label="Close account drawer">
              <span class="material-symbols-outlined" aria-hidden="true">close</span>
            </button>
          </div>

          <div class="wb-account-tabs" role="tablist" aria-label="Account sections">
            <button id="tab-btn-orders" type="button" role="tab" aria-selected="true" class="wb-account-tab is-active">
              <span class="material-symbols-outlined" aria-hidden="true">receipt_long</span>
              <span>My Orders</span>
            </button>
            <button id="tab-btn-profile" type="button" role="tab" aria-selected="false" class="wb-account-tab">
              <span class="material-symbols-outlined" aria-hidden="true">manage_accounts</span>
              <span>Profile &amp; Address</span>
            </button>
          </div>

          <div id="account-content-container" class="wb-drawer__body"></div>

          <div class="wb-account-footer">
            <button id="account-signout-btn" type="button" class="wb-signout-btn">
              <span class="material-symbols-outlined" aria-hidden="true">logout</span>
              <span id="account-signout-label">Sign out</span>
            </button>
            <span class="wb-account-footer__brand">WISHBAKE Bhubaneswar</span>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
    }
  }

  attachEvents() {
    const overlay = document.getElementById('account-overlay');
    const closeBtn = document.getElementById('close-account-btn');
    const tabOrders = document.getElementById('tab-btn-orders');
    const tabProfile = document.getElementById('tab-btn-profile');
    const signoutBtn = document.getElementById('account-signout-btn');

    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) this.close();
    });
    closeBtn?.addEventListener('click', () => this.close());
    tabOrders?.addEventListener('click', () => this.switchTab('orders'));
    tabProfile?.addEventListener('click', () => this.switchTab('profile'));

    signoutBtn?.addEventListener('click', () => {
      if (!this.confirmingSignOut) {
        this.confirmingSignOut = true;
        const label = document.getElementById('account-signout-label');
        if (label) label.textContent = 'Click again to sign out';
        signoutBtn.classList.add('is-confirming');
        setTimeout(() => {
          this.confirmingSignOut = false;
          const lbl = document.getElementById('account-signout-label');
          if (lbl) lbl.textContent = 'Sign out';
          signoutBtn.classList.remove('is-confirming');
        }, 3500);
        return;
      }
      this.confirmingSignOut = false;
      authManager.logout();
      this.close();
      showToast('Signed out of your WISHBAKE account.', 'info');
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) this.close();
    });
  }

  updateHeader(user) {
    if (!user) return;
    const nameEl = document.getElementById('account-user-name');
    const emailEl = document.getElementById('account-user-email');
    const avatarEl = document.getElementById('account-user-avatar');

    if (nameEl) nameEl.textContent = user.name || 'Valued Guest';
    if (emailEl) {
      emailEl.innerHTML = `
        <span>${escapeHtml(user.email)}</span>
        <span class="material-symbols-outlined wb-verified-icon" title="Account active" aria-hidden="true">verified</span>
      `;
    }
    if (avatarEl) {
      const initial = (user.name ? user.name.charAt(0) : user.email.charAt(0)).toUpperCase();
      avatarEl.textContent = initial;
    }
  }

  switchTab(tab) {
    this.activeTab = tab;
    const tabOrders = document.getElementById('tab-btn-orders');
    const tabProfile = document.getElementById('tab-btn-profile');

    tabOrders?.classList.toggle('is-active', tab === 'orders');
    tabOrders?.setAttribute('aria-selected', String(tab === 'orders'));
    tabProfile?.classList.toggle('is-active', tab === 'profile');
    tabProfile?.setAttribute('aria-selected', String(tab === 'profile'));

    if (tab === 'orders') {
      this.loadOrders();
    } else {
      this.renderProfileTab();
    }
  }

  async loadData() {
    const user = authManager.getUser();
    if (!user) return;
    this.updateHeader(user);

    if (this.activeTab === 'orders') {
      await this.loadOrders();
    } else {
      this.renderProfileTab();
    }
  }

  async loadOrders() {
    this.isLoadingOrders = true;
    this.ordersLoadFailed = false;
    this.renderOrdersTab();
    try {
      this.orders = await authManager.fetchOrders();
      this.isLoadingOrders = false;
      this.ordersLoadFailed = false;
    } catch (err) {
      this.isLoadingOrders = false;
      this.ordersLoadFailed = true;
      console.error('Failed to load orders', err);
    }
    this.renderOrdersTab();
  }

  renderOrdersTab() {
    const container = document.getElementById('account-content-container');
    if (!container) return;

    if (this.isLoadingOrders) {
      container.innerHTML = `
        <div class="wb-empty-state">
          <span class="material-symbols-outlined animate-spin" aria-hidden="true">refresh</span>
          <p class="wb-empty-state__copy">Fetching your order history...</p>
        </div>
      `;
      return;
    }

    if (this.ordersLoadFailed) {
      container.innerHTML = `
        <div class="wb-empty-state">
          <span class="material-symbols-outlined" aria-hidden="true">wifi_off</span>
          <p class="wb-empty-state__title">Could not load your orders</p>
          <p class="wb-empty-state__copy">Please check your connection and try again.</p>
          <button type="button" id="retry-orders-btn" class="wb-button wb-button--outline">Retry</button>
        </div>
      `;
      container.querySelector('#retry-orders-btn')?.addEventListener('click', () => this.loadOrders());
      return;
    }

    if (this.orders.length === 0) {
      container.innerHTML = `
        <div class="wb-empty-state">
          <span class="material-symbols-outlined" aria-hidden="true">cake</span>
          <p class="wb-empty-state__title">No Orders Placed Yet</p>
          <p class="wb-empty-state__copy">Design a 3D celebration cake or browse our signature collection.</p>
          <a href="#customizer" class="wb-button wb-button--primary" id="account-open-studio-link">
            <span>Open 3D Studio</span>
            <span class="material-symbols-outlined" aria-hidden="true">brush</span>
          </a>
        </div>
      `;
      container.querySelector('#account-open-studio-link')?.addEventListener('click', () => this.close());
      return;
    }

    container.innerHTML = `
      <div class="wb-orders-list">
        ${this.orders.map(order => {
          const statusClass = order.status === 'CONFIRMED'
            ? 'is-confirmed'
            : (order.status === 'CANCELLED' ? 'is-failed' : 'is-pending');
          const statusIcon = order.status === 'CONFIRMED'
            ? 'local_shipping'
            : (order.status === 'CANCELLED' ? 'cancel' : 'schedule');
          const canRetryOnline = order.payment_method === 'ONLINE'
            && order.payment_status !== 'PAID'
            && order.status !== 'CANCELLED';

          return `
            <article class="wb-order-card">
              <div class="wb-order-card__head">
                <div>
                  <span class="wb-order-card__id">${escapeHtml(order.order_id)}</span>
                  <p class="wb-order-card__date">${escapeHtml(new Date(order.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' }))}</p>
                </div>
                <span class="wb-order-card__status ${statusClass}">
                  <span class="material-symbols-outlined" aria-hidden="true">${statusIcon}</span>
                  ${escapeHtml(order.status)}
                </span>
              </div>

              <div class="wb-order-card__items">
                ${(order.items || []).map(item => `
                  <div class="wb-order-card__item">
                    <span>${item.quantity}× ${escapeHtml(item.title)}</span>
                    <strong>${formatINR(item.unit_price * item.quantity)}</strong>
                  </div>
                `).join('')}
              </div>

              <div class="wb-order-card__meta">
                <div><span>Payment</span><strong>${order.payment_method === 'COD' ? 'Cash on Delivery' : (order.payment_method === 'ONLINE' ? 'Online Payment' : escapeHtml(order.payment_method))} · ${escapeHtml(order.payment_status || 'PENDING')}</strong></div>
                <div><span>Delivery Slot</span><strong>${escapeHtml(order.delivery_date)} (${escapeHtml(order.delivery_time_slot || 'Standard')})</strong></div>
                <div><span>Address</span><strong>${escapeHtml(order.delivery_address)}</strong></div>
              </div>

              <div class="wb-order-card__total">
                <span>Order Total</span>
                <strong>${formatINR(order.total_amount)}</strong>
              </div>

              ${canRetryOnline ? `
                <div class="wb-order-card__actions">
                  <button type="button" class="wb-button wb-button--primary retry-online-pay-btn" data-order-id="${escapeHtml(order.order_id)}">
                    Complete Payment
                  </button>
                  <button type="button" class="wb-button wb-button--outline verify-online-pay-btn" data-order-id="${escapeHtml(order.order_id)}">
                    Refresh Status
                  </button>
                </div>
              ` : ''}
            </article>
          `;
        }).join('')}
      </div>
    `;

    container.querySelectorAll('.retry-online-pay-btn').forEach(btn => {
      btn.addEventListener('click', () => this.handleRetryOrderPayment(btn.dataset.orderId, btn));
    });
    container.querySelectorAll('.verify-online-pay-btn').forEach(btn => {
      btn.addEventListener('click', () => this.handleRefreshOrderStatus(btn.dataset.orderId, btn));
    });
  }

  async handleRetryOrderPayment(orderId, btn) {
    const token = authManager.getToken();
    if (!token || !orderId) return;
    if (btn) btn.disabled = true;

    try {
      const orderData = await retryOnlinePayment(orderId, token);
      if (orderData.payment_status === 'PAID') {
        showToast('Payment already verified for this order!', 'success');
        authManager.fetchMe().catch(() => {});
        await this.loadOrders();
        return;
      }

      this.close();
      const checkoutResult = await launchOnlineCheckout(
        orderData.payment_session_id,
        orderData.gateway_mode || orderData.payment_gateway_env
      );
      if (checkoutResult.outcome === 'redirect') return;
      if (checkoutResult.outcome === 'cancelled' || checkoutResult.outcome === 'error') {
        showToast(checkoutResult.message, checkoutResult.outcome === 'error' ? 'error' : 'info', 4500);
        return;
      }

      const verification = await verifyOnlinePayment(orderId, token);
      if (verification.order_status === 'PAID') {
        showToast('Payment verified! Order confirmed.', 'success');
        authManager.fetchMe().catch(() => {});
      } else {
        showToast('Payment is not completed yet.', 'warning');
      }
      await this.loadOrders();
    } catch (err) {
      showToast(err.message || 'Could not resume payment.', 'error', 4500);
      await this.loadOrders();
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  async handleRefreshOrderStatus(orderId, btn) {
    const token = authManager.getToken();
    if (!token || !orderId) return;
    if (btn) btn.disabled = true;

    try {
      const verification = await verifyOnlinePayment(orderId, token);
      if (verification.order_status === 'PAID') {
        showToast('Payment confirmed!', 'success');
        authManager.fetchMe().catch(() => {});
      } else {
        showToast(`Current payment status: ${verification.order_status}`, 'info');
      }
      await this.loadOrders();
    } catch (err) {
      showToast(err.message || 'Could not verify order status.', 'error', 4500);
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  renderProfileTab() {
    syncServiceablePincodes();
    const container = document.getElementById('account-content-container');
    if (!container) return;

    const user = authManager.getUser() || {};
    const defaultAddr = (user.addresses && user.addresses[0]) || {};

    container.innerHTML = `
      <form id="profile-edit-form" class="wb-form" novalidate>
        <div class="wb-form-section">
          <h4 class="wb-form-section__title">Personal Information</h4>

          <div class="wb-field">
            <label for="profile-name-input">Full Name</label>
            <input type="text" id="profile-name-input" value="${escapeHtml(user.name || '')}" placeholder="e.g. Priya Mohanty" />
          </div>

          <div class="wb-field">
            <label for="profile-phone-input">Mobile Number</label>
            <input type="tel" id="profile-phone-input" value="${escapeHtml(user.phone || '')}" placeholder="+91 98765 43210" />
          </div>

          <div class="wb-field">
            <label for="profile-email-readonly">Email Address</label>
            <input type="email" id="profile-email-readonly" value="${escapeHtml(user.email || '')}" disabled />
          </div>
        </div>

        <div class="wb-form-section">
          <h4 class="wb-form-section__title">
            <span class="material-symbols-outlined" aria-hidden="true">location_on</span>
            Bhubaneswar Default Delivery Address
          </h4>

          <div class="wb-field">
            <label for="profile-flat">Flat / House No., Building</label>
            <input type="text" id="profile-flat" value="${escapeHtml(defaultAddr.flat_house_no || '')}" placeholder="e.g. Plot 42, Kalinga Residency" />
          </div>

          <div class="wb-field">
            <label for="profile-street">Street / Locality</label>
            <input type="text" id="profile-street" value="${escapeHtml(defaultAddr.street_locality || '')}" placeholder="e.g. Saheed Nagar" />
          </div>

          <div class="wb-field">
            <label for="profile-landmark">Landmark <span class="wb-label-opt">(optional)</span></label>
            <input type="text" id="profile-landmark" value="${escapeHtml(defaultAddr.landmark || '')}" placeholder="e.g. Near Esplanade One" />
          </div>

          <div class="wb-form-row wb-form-row--3">
            <div class="wb-field">
              <label for="profile-city">City</label>
              <input type="text" id="profile-city" value="${escapeHtml(defaultAddr.city || 'Bhubaneswar')}" placeholder="Bhubaneswar" />
            </div>
            <div class="wb-field">
              <label for="profile-state">State</label>
              <input type="text" id="profile-state" value="${escapeHtml(defaultAddr.state || 'Odisha')}" placeholder="Odisha" />
            </div>
            <div class="wb-field">
              <label for="profile-pincode">PIN Code</label>
              <input type="text" id="profile-pincode" value="${escapeHtml(defaultAddr.pincode || '')}" placeholder="751007" maxlength="6" inputmode="numeric" />
              <p id="profile-pincode-hint" class="wb-field-hint is-hidden"></p>
            </div>
          </div>
        </div>

        <div id="profile-status-msg" class="wb-inline-notice is-hidden"></div>

        <button type="submit" id="save-profile-btn" class="wb-button wb-button--primary wb-button--full">
          <span class="material-symbols-outlined" aria-hidden="true">save</span>
          <span>Save Changes</span>
        </button>
      </form>
    `;

    const form = document.getElementById('profile-edit-form');
    const pinInput = document.getElementById('profile-pincode');
    const updatePinHint = (val) => {
      const hint = document.getElementById('profile-pincode-hint');
      if (!hint) return;
      const pin = (val || '').trim();
      if (pin.length < 6) {
        hint.textContent = '';
        hint.className = 'wb-field-hint is-hidden';
        return;
      }
      const loc = getPincodeLocality(pin);
      hint.textContent = loc ? `✓ ${loc}` : 'Outside Bhubaneswar zone';
      hint.className = `wb-field-hint ${loc ? 'is-valid' : 'is-invalid'}`;
    };

    if (defaultAddr.pincode) updatePinHint(defaultAddr.pincode);
    pinInput?.addEventListener('input', () => updatePinHint(pinInput.value));

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearFieldErrors(form);

      const nameVal = document.getElementById('profile-name-input').value.trim();
      const phoneVal = document.getElementById('profile-phone-input').value.trim();
      const flatVal = document.getElementById('profile-flat').value;
      const streetVal = document.getElementById('profile-street').value;
      const landmarkVal = document.getElementById('profile-landmark').value;
      const cityVal = document.getElementById('profile-city').value;
      const stateVal = document.getElementById('profile-state').value;
      const pinVal = document.getElementById('profile-pincode').value;

      const fieldErrors = {};
      if (nameVal && nameVal.length < 2) {
        fieldErrors['profile-name-input'] = 'Enter at least 2 characters for your name.';
      }

      let normalizedPhone = '';
      if (phoneVal) {
        const phoneCheck = validateIndianPhone(phoneVal);
        if (!phoneCheck.valid) fieldErrors['profile-phone-input'] = phoneCheck.error;
        else normalizedPhone = phoneCheck.value;
      }

      const hasAnyAddressField = Boolean(flatVal.trim() || streetVal.trim() || pinVal.trim());
      let normalizedAddresses;
      if (hasAnyAddressField) {
        const addrCheck = validateAddressFields({
          flat_house_no: flatVal,
          street_locality: streetVal,
          landmark: landmarkVal,
          city: cityVal,
          state: stateVal,
          pincode: pinVal
        });
        if (!addrCheck.valid) {
          if (addrCheck.errors.flat_house_no) fieldErrors['profile-flat'] = addrCheck.errors.flat_house_no;
          if (addrCheck.errors.street_locality) fieldErrors['profile-street'] = addrCheck.errors.street_locality;
          if (addrCheck.errors.landmark) fieldErrors['profile-landmark'] = addrCheck.errors.landmark;
          if (addrCheck.errors.city) fieldErrors['profile-city'] = addrCheck.errors.city;
          if (addrCheck.errors.state) fieldErrors['profile-state'] = addrCheck.errors.state;
          if (addrCheck.errors.pincode) fieldErrors['profile-pincode'] = addrCheck.errors.pincode;
        } else {
          normalizedAddresses = [{
            id: defaultAddr.id || 'addr-1',
            label: defaultAddr.label || 'Home',
            ...addrCheck.normalized,
            is_default: true
          }];
        }
      }

      if (Object.keys(fieldErrors).length > 0) {
        setFieldErrors(form, fieldErrors);
        return;
      }

      const saveBtn = document.getElementById('save-profile-btn');
      const statusMsg = document.getElementById('profile-status-msg');
      saveBtn.disabled = true;
      saveBtn.innerHTML = `<span class="material-symbols-outlined animate-spin" aria-hidden="true">refresh</span><span>Saving...</span>`;

      try {
        await authManager.updateProfile({
          name: nameVal,
          phone: normalizedPhone,
          addresses: normalizedAddresses
        });
        statusMsg.className = 'wb-inline-notice is-success';
        statusMsg.textContent = 'Profile updated successfully!';
        showToast('Profile saved.', 'success');
      } catch (err) {
        statusMsg.className = 'wb-inline-notice is-error';
        statusMsg.textContent = err.message || 'Failed to update profile.';
      } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = `<span class="material-symbols-outlined" aria-hidden="true">save</span><span>Save Changes</span>`;
      }
    });
  }

  isOpen() {
    const overlay = document.getElementById('account-overlay');
    return overlay && !overlay.classList.contains('is-hidden');
  }

  open() {
    const overlay = document.getElementById('account-overlay');
    const panel = document.getElementById('account-panel');
    if (overlay && panel) {
      overlay.classList.remove('is-hidden');
      requestAnimationFrame(() => panel.classList.remove('is-closed'));
      this.loadData();
    }
  }

  close() {
    const overlay = document.getElementById('account-overlay');
    const panel = document.getElementById('account-panel');
    if (overlay && panel) {
      panel.classList.add('is-closed');
      setTimeout(() => overlay.classList.add('is-hidden'), 280);
    }
  }
}
