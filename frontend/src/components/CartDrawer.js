import { authManager } from '../services/AuthManager.js';
import { apiUrl } from '../services/api.js';
import { escapeHtml, formatINR, resolveApiError, showToast } from '../utils/ui.js';
import {
  DELIVERY_FEE_INR,
  NIGHT_SLOT_FEE_INR,
  clearFieldErrors,
  getLocalDateStr,
  getPincodeLocality,
  setFieldErrors,
  syncServiceablePincodes,
  validateAddressFields,
  validateDeliveryDate,
  validateEmail,
  validateIndianPhone
} from '../utils/validation.js';

export class CartDrawer {
  constructor(cartState, onCartUpdateCallback, onOpenAuthCallback) {
    this.cart = authManager.isLoggedIn() ? [] : (cartState || []);
    this.onCartUpdate = onCartUpdateCallback;
    this.onOpenAuth = onOpenAuthCallback;
    this.deliveryCost = DELIVERY_FEE_INR;

    this.init();
  }

  init() {
    this.attachDomEvents();
    this.renderCartItems();
  }

  attachDomEvents() {
    const openBtn = document.getElementById('open-cart-btn');
    const closeBtn = document.getElementById('close-cart-btn');
    const overlay = document.getElementById('cart-overlay');
    const checkoutBtn = document.getElementById('checkout-btn');

    const checkoutModal = document.getElementById('checkout-modal');
    const closeCheckoutModal = document.getElementById('close-checkout-modal');
    const checkoutForm = document.getElementById('checkout-form');
    const timeslotSelect = document.getElementById('cust-timeslot');
    const pincodeInput = document.getElementById('cust-pincode');
    const checkoutTermsLink = document.getElementById('checkout-terms-link');
    const successModal = document.getElementById('order-success-modal');
    const closeSuccessBtn = document.getElementById('close-success-btn');

    openBtn?.addEventListener('click', () => this.openCart());
    closeBtn?.addEventListener('click', () => this.closeCart());

    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) this.closeCart();
    });

    checkoutModal?.addEventListener('click', (e) => {
      if (e.target === checkoutModal) this.closeCheckoutModal();
    });

    successModal?.addEventListener('click', (e) => {
      if (e.target === successModal) this.closeSuccessModal();
    });

    checkoutBtn?.addEventListener('click', () => {
      if (!authManager.isLoggedIn()) {
        showToast('Please sign in to save your bag and place your order.', 'info');
        this.closeCart();
        this.onOpenAuth?.();
        return;
      }
      if (this.cart.length === 0) {
        showToast('Your confectionery bag is empty. Add a cake first!', 'warning');
        return;
      }
      this.closeCart();
      this.openCheckoutModal();
    });

    closeCheckoutModal?.addEventListener('click', () => this.closeCheckoutModal());
    checkoutForm?.addEventListener('submit', (e) => this.handleCheckoutSubmit(e));
    timeslotSelect?.addEventListener('change', () => this.updateCheckoutTotals());

    pincodeInput?.addEventListener('input', () => {
      this.updatePincodeHint(pincodeInput.value);
    });

    document.querySelectorAll('input[name="payment_method"]').forEach(radio => {
      radio.addEventListener('change', () => this.syncPaymentMethodUI());
    });

    checkoutTermsLink?.addEventListener('click', () => {
      this.closeCheckoutModal();
    });

    closeSuccessBtn?.addEventListener('click', () => this.closeSuccessModal());

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (checkoutModal && !checkoutModal.classList.contains('is-hidden')) {
        this.closeCheckoutModal();
      } else if (successModal && !successModal.classList.contains('is-hidden')) {
        this.closeSuccessModal();
      } else if (overlay && !overlay.classList.contains('is-hidden')) {
        this.closeCart();
      }
    });
  }

  closeCheckoutModal() {
    const checkoutModal = document.getElementById('checkout-modal');
    checkoutModal?.classList.add('is-hidden');
  }

  closeSuccessModal() {
    const successModal = document.getElementById('order-success-modal');
    successModal?.classList.add('is-hidden');
  }

  updatePincodeHint(rawPin) {
    const hintEl = document.getElementById('cust-pincode-hint');
    if (!hintEl) return;
    const pin = (rawPin || '').trim();
    if (pin.length < 6) {
      hintEl.textContent = '';
      hintEl.className = 'wb-field-hint is-hidden';
      return;
    }
    const locality = getPincodeLocality(pin);
    if (locality) {
      hintEl.textContent = `✓ Deliverable area: ${locality}`;
      hintEl.className = 'wb-field-hint is-valid';
    } else {
      hintEl.textContent = 'Outside current Bhubaneswar delivery zone';
      hintEl.className = 'wb-field-hint is-invalid';
    }
  }

  addItem(item) {
    if (item.item_type === 'preset') {
      const sizeKey = item.size || '1lb';
      const existing = this.cart.find(
        i => i.item_type === 'preset' && i.cake_id === item.cake_id && (i.size || '1lb') === sizeKey
      );
      if (existing) {
        existing.quantity += item.quantity || 1;
      } else {
        this.cart.push({ ...item, size: sizeKey });
      }
    } else {
      this.cart.push({ ...item });
    }

    this.renderCartItems();
    this.openCart();
    showToast(`Added "${item.title}" to your bag.`, 'success');
    if (this.onCartUpdate) this.onCartUpdate(this.cart);
  }

  openCart() {
    const overlay = document.getElementById('cart-overlay');
    const panel = document.getElementById('cart-panel');
    if (overlay && panel) {
      overlay.classList.remove('is-hidden');
      requestAnimationFrame(() => {
        panel.classList.remove('is-closed');
      });
    }
  }

  closeCart() {
    const overlay = document.getElementById('cart-overlay');
    const panel = document.getElementById('cart-panel');
    if (overlay && panel) {
      panel.classList.add('is-closed');
      setTimeout(() => {
        overlay.classList.add('is-hidden');
      }, 280);
    }
  }

  renderCartItems() {
    const container = document.getElementById('cart-items-container');
    const badge = document.getElementById('cart-badge-count');
    const subtotalEl = document.getElementById('cart-subtotal');
    const totalEl = document.getElementById('cart-total');
    const deliveryEl = document.getElementById('cart-delivery');

    if (!container) return;

    const totalItemCount = this.cart.reduce((sum, item) => sum + item.quantity, 0);
    if (badge) {
      badge.textContent = totalItemCount;
      badge.classList.toggle('scale-0', totalItemCount <= 0);
      badge.classList.toggle('scale-100', totalItemCount > 0);
    }

    if (this.cart.length === 0) {
      container.innerHTML = `
        <div class="wb-empty-state">
          <span class="material-symbols-outlined" aria-hidden="true">shopping_bag</span>
          <p class="wb-empty-state__title">Your Confectionery Bag is Empty</p>
          <p class="wb-empty-state__copy">Explore our signature cakes or design your own in the 3D cake studio.</p>
        </div>
      `;
      if (subtotalEl) subtotalEl.textContent = '₹0';
      if (deliveryEl) deliveryEl.textContent = formatINR(this.deliveryCost);
      if (totalEl) totalEl.textContent = '₹0';
      return;
    }

    let subtotal = 0;
    container.innerHTML = this.cart.map((item, idx) => {
      const itemTotal = Math.round(item.unit_price) * item.quantity;
      subtotal += itemTotal;
      const addonCount = item.selection?.addons?.length || 0;
      const selectionSummary = item.selection
        ? `${item.selection.tiers} ${item.selection.tiers > 1 ? 'Tiers' : 'Tier'} · ${item.selection.shape} · ${item.selection.size}${addonCount ? ` · +${addonCount} add-on${addonCount > 1 ? 's' : ''}` : ''}`
        : '';

      return `
        <div class="wb-bag-item">
          <div class="wb-bag-item__top">
            <div>
              <span class="wb-bag-item__tag ${item.item_type === 'custom' ? 'is-custom' : ''}">
                ${item.item_type === 'custom' ? '3D Custom Cake' : 'Artisanal Creation'}
              </span>
              <h4>${escapeHtml(item.title)}</h4>
              ${selectionSummary ? `<p class="wb-bag-item__meta">${escapeHtml(selectionSummary)}</p>` : ''}
            </div>

            <button type="button" data-idx="${idx}" class="remove-cart-item-btn wb-bag-item__remove" aria-label="Remove ${escapeHtml(item.title)}">
              <span class="material-symbols-outlined" aria-hidden="true">delete</span>
            </button>
          </div>

          <div class="wb-bag-item__bottom">
            <div class="wb-qty-pill">
              <button type="button" data-idx="${idx}" data-action="dec" class="qty-btn" aria-label="Decrease quantity">−</button>
              <span>${item.quantity}</span>
              <button type="button" data-idx="${idx}" data-action="inc" class="qty-btn" aria-label="Increase quantity">+</button>
            </div>

            <span class="wb-bag-item__price">${formatINR(itemTotal)}</span>
          </div>
        </div>
      `;
    }).join('');

    const finalTotal = subtotal + this.deliveryCost;
    if (subtotalEl) subtotalEl.textContent = formatINR(subtotal);
    if (deliveryEl) deliveryEl.textContent = formatINR(this.deliveryCost);
    if (totalEl) totalEl.textContent = formatINR(finalTotal);

    container.querySelectorAll('.qty-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.dataset.idx, 10);
        const action = e.currentTarget.dataset.action;
        if (action === 'inc') {
          this.cart[idx].quantity += 1;
        } else if (action === 'dec') {
          this.cart[idx].quantity -= 1;
          if (this.cart[idx].quantity <= 0) {
            this.cart.splice(idx, 1);
          }
        }
        this.renderCartItems();
        if (this.onCartUpdate) this.onCartUpdate(this.cart);
      });
    });

    container.querySelectorAll('.remove-cart-item-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.dataset.idx, 10);
        this.cart.splice(idx, 1);
        this.renderCartItems();
        if (this.onCartUpdate) this.onCartUpdate(this.cart);
      });
    });
  }

  getActiveDeliveryFee() {
    const slot = document.getElementById('cust-timeslot')?.value || 'afternoon';
    return this.deliveryCost + (slot === 'night' ? NIGHT_SLOT_FEE_INR : 0);
  }

  updateCheckoutTotals() {
    const subtotal = this.cart.reduce((sum, item) => sum + Math.round(item.unit_price) * item.quantity, 0);
    const fee = this.getActiveDeliveryFee();
    const finalTotal = subtotal + fee;

    const feeEl = document.getElementById('modal-delivery-fee');
    const orderTotalEl = document.getElementById('modal-order-total');
    if (feeEl) feeEl.textContent = formatINR(fee);
    if (orderTotalEl) orderTotalEl.textContent = formatINR(finalTotal);
  }

  openCheckoutModal() {
    syncServiceablePincodes();
    const checkoutModal = document.getElementById('checkout-modal');
    const checkoutForm = document.getElementById('checkout-form');
    clearFieldErrors(checkoutForm);

    const dateInput = document.getElementById('cust-date');
    const codOption = document.querySelector('input[name="payment_method"][value="COD"]');
    if (codOption) codOption.checked = true;
    this.syncPaymentMethodUI();

    if (dateInput) {
      const tomorrowStr = getLocalDateStr(1);
      const maxStr = getLocalDateStr(90);
      dateInput.min = tomorrowStr;
      dateInput.max = maxStr;
      if (!dateInput.value || dateInput.value < tomorrowStr) {
        dateInput.value = tomorrowStr;
      }
    }

    const user = authManager.getUser();
    const bannerContainer = document.getElementById('checkout-auth-banner');

    if (user) {
      const nameInput = document.getElementById('cust-name');
      const emailInput = document.getElementById('cust-email');
      const phoneInput = document.getElementById('cust-phone');

      if (nameInput && user.name && !nameInput.value) nameInput.value = user.name;
      if (emailInput && user.email) {
        emailInput.value = user.email;
        emailInput.readOnly = true;
      }
      if (phoneInput && user.phone && !phoneInput.value) phoneInput.value = user.phone;

      if (user.addresses && user.addresses.length > 0) {
        const addr = user.addresses[0];
        const flatInput = document.getElementById('cust-flat');
        const streetInput = document.getElementById('cust-street');
        const landmarkInput = document.getElementById('cust-landmark');
        const cityInput = document.getElementById('cust-city');
        const stateInput = document.getElementById('cust-state');
        const pinInput = document.getElementById('cust-pincode');

        if (flatInput && addr.flat_house_no) flatInput.value = addr.flat_house_no;
        if (streetInput && addr.street_locality) streetInput.value = addr.street_locality;
        if (landmarkInput && addr.landmark) landmarkInput.value = addr.landmark;
        if (cityInput && addr.city) cityInput.value = addr.city;
        if (stateInput && addr.state) stateInput.value = addr.state;
        if (pinInput && addr.pincode) {
          pinInput.value = addr.pincode;
          this.updatePincodeHint(addr.pincode);
        }
      }

      if (bannerContainer) {
        bannerContainer.innerHTML = `
          <div class="wb-auth-banner">
            <div>
              <span class="material-symbols-outlined" aria-hidden="true">verified_user</span>
              <span>Ordering as <strong>${escapeHtml(user.name || user.email)}</strong></span>
            </div>
            <span class="wb-auth-banner__pill">Account linked</span>
          </div>
        `;
        bannerContainer.classList.remove('is-hidden');
      }
    }

    this.updateCheckoutTotals();
    checkoutModal?.classList.remove('is-hidden');
  }

  async handleCheckoutSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    clearFieldErrors(form);

    const nameRaw = document.getElementById('cust-name').value.trim();
    const emailRaw = document.getElementById('cust-email').value.trim();
    const phoneRaw = document.getElementById('cust-phone').value.trim();
    const flatRaw = document.getElementById('cust-flat').value;
    const streetRaw = document.getElementById('cust-street').value;
    const landmarkRaw = document.getElementById('cust-landmark').value;
    const cityRaw = document.getElementById('cust-city').value;
    const stateRaw = document.getElementById('cust-state').value;
    const pinRaw = document.getElementById('cust-pincode').value;
    const dateRaw = document.getElementById('cust-date').value;

    const fieldErrors = {};
    if (nameRaw.length < 2) fieldErrors['cust-name'] = 'Enter your full name (at least 2 characters).';

    const emailCheck = validateEmail(emailRaw);
    if (!emailCheck.valid) fieldErrors['cust-email'] = emailCheck.error;

    const phoneCheck = validateIndianPhone(phoneRaw);
    if (!phoneCheck.valid) fieldErrors['cust-phone'] = phoneCheck.error;

    const addrCheck = validateAddressFields({
      flat_house_no: flatRaw,
      street_locality: streetRaw,
      landmark: landmarkRaw,
      city: cityRaw,
      state: stateRaw,
      pincode: pinRaw
    });
    if (!addrCheck.valid) {
      if (addrCheck.errors.flat_house_no) fieldErrors['cust-flat'] = addrCheck.errors.flat_house_no;
      if (addrCheck.errors.street_locality) fieldErrors['cust-street'] = addrCheck.errors.street_locality;
      if (addrCheck.errors.landmark) fieldErrors['cust-landmark'] = addrCheck.errors.landmark;
      if (addrCheck.errors.city) fieldErrors['cust-city'] = addrCheck.errors.city;
      if (addrCheck.errors.state) fieldErrors['cust-state'] = addrCheck.errors.state;
      if (addrCheck.errors.pincode) fieldErrors['cust-pincode'] = addrCheck.errors.pincode;
    }

    const dateCheck = validateDeliveryDate(dateRaw);
    if (!dateCheck.valid) fieldErrors['cust-date'] = dateCheck.error;

    if (Object.keys(fieldErrors).length > 0) {
      setFieldErrors(form, fieldErrors);
      showToast('Please check the highlighted delivery fields.', 'warning');
      return;
    }

    const submitBtn = document.getElementById('place-order-submit-btn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>Processing Order...</span><span class="material-symbols-outlined animate-spin" aria-hidden="true">sync</span>`;
    }

    const payload = {
      customer_name: nameRaw,
      customer_email: emailCheck.value,
      customer_phone: phoneCheck.value,
      flat_house_no: addrCheck.normalized.flat_house_no,
      street_locality: addrCheck.normalized.street_locality,
      landmark: addrCheck.normalized.landmark,
      city: addrCheck.normalized.city,
      state: addrCheck.normalized.state,
      pincode: addrCheck.normalized.pincode,
      delivery_date: dateRaw,
      delivery_time_slot: document.getElementById('cust-timeslot')?.value || 'afternoon',
      recipient_name: document.getElementById('cust-recipient')?.value.trim() || null,
      special_instructions: document.getElementById('cust-instructions')?.value.trim() || null,
      payment_method: document.querySelector('input[name="payment_method"]:checked')?.value || 'COD',
      items: this.cart.map(item => ({
        item_type: item.item_type,
        cake_id: item.cake_id || null,
        size: item.size || '1lb',
        title: item.title,
        quantity: item.quantity,
        unit_price: item.unit_price,
        selection: item.selection || null
      }))
    };

    const headers = { 'Content-Type': 'application/json' };
    const token = authManager.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    try {
      const res = await fetch(apiUrl('/api/orders'), {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const orderData = await res.json();
        this.cart = [];
        this.renderCartItems();
        if (this.onCartUpdate) this.onCartUpdate(this.cart);
        authManager.fetchMe().catch(() => {});

        this.closeCheckoutModal();

        document.getElementById('confirmed-order-id').textContent = orderData.order_id;
        document.getElementById('confirmed-delivery-date').textContent = orderData.delivery_date;
        document.getElementById('confirmed-total').textContent = formatINR(orderData.total_amount);
        const confirmedPayEl = document.getElementById('confirmed-payment-method');
        if (confirmedPayEl) {
          confirmedPayEl.textContent = orderData.payment_method === 'CASHFREE' ? 'Cashfree Online Payment' : 'Cash on Delivery';
        }
        const confirmedSubEl = document.getElementById('confirmed-order-subtitle');
        if (confirmedSubEl) {
          confirmedSubEl.textContent = orderData.payment_method === 'CASHFREE'
            ? 'Thank you! Your Cashfree online payment order has been received by our pastry kitchen.'
            : 'Thank you! Your Cash on Delivery order has been sent to our pastry kitchen.';
        }

        document.getElementById('order-success-modal')?.classList.remove('is-hidden');
        showToast('Order placed! Confirmation details saved to My Orders.', 'success');
      } else {
        const errData = await res.json().catch(() => null);
        showToast(resolveApiError(errData, 'Failed to process order. Please check your details.'), 'error', 5000);
      }
    } catch (err) {
      console.error('Error submitting order', err);
      showToast('Unable to reach server. Please check your connection and try again.', 'error', 5000);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        this.syncPaymentMethodUI();
      }
    }
  }

  syncPaymentMethodUI() {
    const selectedMethod = document.querySelector('input[name="payment_method"]:checked')?.value || 'COD';
    const isCashfree = selectedMethod === 'CASHFREE';

    document.querySelectorAll('[data-payment-card]').forEach(card => {
      card.classList.toggle('is-selected', card.dataset.paymentCard === selectedMethod);
    });

    const notice = document.getElementById('cashfree-payment-notice');
    if (notice) notice.classList.toggle('is-hidden', !isCashfree);

    const submitBtn = document.getElementById('place-order-submit-btn');
    if (submitBtn) {
      submitBtn.innerHTML = isCashfree
        ? `<span id="place-order-btn-label">Proceed to Cashfree Payment</span><span class="material-symbols-outlined" aria-hidden="true">lock</span>`
        : `<span id="place-order-btn-label">Place COD Order</span><span class="material-symbols-outlined" aria-hidden="true">check_circle</span>`;
    }
  }
}
