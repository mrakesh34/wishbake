import { authManager } from '../services/AuthManager.js';
import { apiUrl } from '../services/api.js';

export class CartDrawer {
  constructor(cartState, onCartUpdateCallback, onOpenAuthCallback) {
    this.cart = cartState || [];
    this.onCartUpdate = onCartUpdateCallback;
    this.onOpenAuth = onOpenAuthCallback;
    this.deliveryCost = 149.0;

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
    const successModal = document.getElementById('order-success-modal');
    const closeSuccessBtn = document.getElementById('close-success-btn');

    if (openBtn) {
      openBtn.addEventListener('click', () => this.openCart());
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeCart());
    }

    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this.closeCart();
      });
    }

    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => {
        if (this.cart.length === 0) {
          alert('Your confectionery bag is empty! Add a custom or signature cake first.');
          return;
        }
        this.closeCart();
        this.openCheckoutModal();
      });
    }

    if (closeCheckoutModal) {
      closeCheckoutModal.addEventListener('click', () => {
        checkoutModal.classList.add('hidden');
        checkoutModal.classList.remove('flex');
      });
    }

    if (checkoutForm) {
      checkoutForm.addEventListener('submit', (e) => this.handleCheckoutSubmit(e));
    }

    if (closeSuccessBtn) {
      closeSuccessBtn.addEventListener('click', () => {
        successModal.classList.add('hidden');
        successModal.classList.remove('flex');
      });
    }
  }

  addItem(item) {
    if (item.item_type === 'preset') {
      const existing = this.cart.find(i => i.item_type === 'preset' && i.cake_id === item.cake_id);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        this.cart.push(item);
      }
    } else {
      this.cart.push(item);
    }

    this.renderCartItems();
    this.openCart();
    if (this.onCartUpdate) this.onCartUpdate(this.cart);
  }

  openCart() {
    const overlay = document.getElementById('cart-overlay');
    const panel = document.getElementById('cart-panel');
    if (overlay && panel) {
      overlay.classList.remove('hidden');
      setTimeout(() => {
        panel.classList.remove('translate-x-full');
      }, 10);
    }
  }

  closeCart() {
    const overlay = document.getElementById('cart-overlay');
    const panel = document.getElementById('cart-panel');
    if (overlay && panel) {
      panel.classList.add('translate-x-full');
      setTimeout(() => {
        overlay.classList.add('hidden');
      }, 300);
    }
  }

  formatINR(amount) {
    return '₹' + amount.toLocaleString('en-IN');
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
      if (totalItemCount > 0) {
        badge.classList.remove('scale-0');
        badge.classList.add('scale-100');
      } else {
        badge.classList.add('scale-0');
        badge.classList.remove('scale-100');
      }
    }

    if (this.cart.length === 0) {
      container.innerHTML = `
        <div class="text-center py-16 text-on-surface-variant">
          <span class="material-symbols-outlined text-4xl mb-2 text-primary/40">shopping_bag</span>
          <p class="font-bold text-sm text-on-surface">Your Confectionery Bag is Empty</p>
          <p class="text-xs mt-1">Explore our signature cakes or design your own in the 3D Customizer.</p>
        </div>
      `;
      if (subtotalEl) subtotalEl.textContent = '₹0';
      if (totalEl) totalEl.textContent = '₹0';
      return;
    }

    let subtotal = 0;
    container.innerHTML = this.cart.map((item, idx) => {
      const itemTotal = item.unit_price * item.quantity;
      subtotal += itemTotal;

      return `
        <div class="bg-surface-container p-4 rounded-2xl border border-outline-variant/40 flex flex-col justify-between space-y-2">
          <div class="flex justify-between items-start">
            <div>
              <span class="text-[10px] font-bold uppercase tracking-wider ${item.item_type === 'custom' ? 'text-primary' : 'text-secondary'}">
                ${item.item_type === 'custom' ? '✨ 3D Custom Cake' : 'Artisanal Creation'}
              </span>
              <h4 class="font-display font-bold text-sm text-on-surface">${item.title}</h4>
              
              ${item.selection ? `
                <p class="text-[11px] text-on-surface-variant mt-1">
                  ${item.selection.tiers} Tiers • ${item.selection.shape} • ${item.selection.sponge_flavor}
                </p>
              ` : ''}
            </div>

            <button data-idx="${idx}" class="remove-cart-item-btn text-on-surface-variant hover:text-red-600 p-1">
              <span class="material-symbols-outlined text-sm">delete</span>
            </button>
          </div>

          <div class="flex items-center justify-between pt-2 border-t border-outline-variant/30">
            <div class="flex items-center gap-2 bg-white px-2 py-1 rounded-full border border-outline-variant text-xs">
              <button data-idx="${idx}" data-action="dec" class="qty-btn font-bold px-1 text-on-surface hover:text-primary">-</button>
              <span class="font-bold px-1">${item.quantity}</span>
              <button data-idx="${idx}" data-action="inc" class="qty-btn font-bold px-1 text-on-surface hover:text-primary">+</button>
            </div>

            <span class="font-display font-bold text-base text-primary">${this.formatINR(itemTotal)}</span>
          </div>
        </div>
      `;
    }).join('');

    const finalTotal = subtotal + this.deliveryCost;

    if (subtotalEl) subtotalEl.textContent = this.formatINR(subtotal);
    if (deliveryEl) deliveryEl.textContent = this.formatINR(this.deliveryCost);
    if (totalEl) totalEl.textContent = this.formatINR(finalTotal);

    container.querySelectorAll('.qty-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.dataset.idx);
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
        const idx = parseInt(e.currentTarget.dataset.idx);
        this.cart.splice(idx, 1);
        this.renderCartItems();
        if (this.onCartUpdate) this.onCartUpdate(this.cart);
      });
    });
  }

  openCheckoutModal() {
    const checkoutModal = document.getElementById('checkout-modal');
    const orderTotalEl = document.getElementById('modal-order-total');

    const subtotal = this.cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
    const finalTotal = subtotal + this.deliveryCost;

    if (orderTotalEl) orderTotalEl.textContent = this.formatINR(finalTotal);

    const dateInput = document.getElementById('cust-date');
    if (dateInput) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      dateInput.value = tomorrow.toISOString().split('T')[0];
      dateInput.min = tomorrow.toISOString().split('T')[0];
    }

    // Auto-fill logged-in user details if available
    const user = authManager.getUser();
    const bannerContainer = document.getElementById('checkout-auth-banner');
    
    if (user) {
      const nameInput = document.getElementById('cust-name');
      const emailInput = document.getElementById('cust-email');
      const phoneInput = document.getElementById('cust-phone');

      if (nameInput && user.name) nameInput.value = user.name;
      if (emailInput && user.email) emailInput.value = user.email;
      if (phoneInput && user.phone) phoneInput.value = user.phone;

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
        if (pinInput && addr.pincode) pinInput.value = addr.pincode;
      }

      if (bannerContainer) {
        bannerContainer.innerHTML = `
          <div class="p-3 bg-green-50 border border-green-200 rounded-2xl flex items-center justify-between text-xs text-green-800">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-green-700 text-sm">verified_user</span>
              <span>Ordering as <strong class="font-bold">${user.name || user.email}</strong></span>
            </div>
            <span class="text-[10px] bg-green-200 text-green-900 font-bold px-2 py-0.5 rounded-full">Auto-Filled</span>
          </div>
        `;
        bannerContainer.classList.remove('hidden');
      }
    } else {
      if (bannerContainer) {
        bannerContainer.innerHTML = `
          <div class="p-3 bg-primary/5 border border-primary/20 rounded-2xl flex items-center justify-between text-xs text-primary">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-primary text-sm">account_circle</span>
              <span>Have a WISHBAKE account?</span>
            </div>
            <button type="button" id="checkout-quick-signin-btn" class="bg-primary text-white text-[11px] font-bold px-3 py-1 rounded-lg hover:bg-primary/90 transition-colors">
              Sign In with OTP
            </button>
          </div>
        `;
        bannerContainer.classList.remove('hidden');
        const signinBtn = document.getElementById('checkout-quick-signin-btn');
        if (signinBtn && this.onOpenAuth) {
          signinBtn.addEventListener('click', () => {
            if (checkoutModal) {
              checkoutModal.classList.add('hidden');
              checkoutModal.classList.remove('flex');
            }
            this.onOpenAuth();
          });
        }
      }
    }

    if (checkoutModal) {
      checkoutModal.classList.remove('hidden');
      checkoutModal.classList.add('flex');
    }
  }

  async handleCheckoutSubmit(e) {
    e.preventDefault();

    const submitBtn = document.getElementById('place-order-submit-btn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>Processing Order...</span><span class="material-symbols-outlined animate-spin text-sm">sync</span>`;
    }

    const payload = {
      customer_name: document.getElementById('cust-name').value,
      customer_email: document.getElementById('cust-email').value,
      customer_phone: document.getElementById('cust-phone').value,
      flat_house_no: document.getElementById('cust-flat').value,
      street_locality: document.getElementById('cust-street').value,
      landmark: document.getElementById('cust-landmark').value || null,
      city: document.getElementById('cust-city').value,
      state: document.getElementById('cust-state').value,
      pincode: document.getElementById('cust-pincode').value,
      delivery_date: document.getElementById('cust-date').value,
      delivery_time_slot: document.getElementById('cust-timeslot')?.value || 'afternoon',
      recipient_name: document.getElementById('cust-recipient')?.value || null,
      special_instructions: document.getElementById('cust-instructions').value,
      items: this.cart
    };

    const headers = { 'Content-Type': 'application/json' };
    const token = authManager.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(apiUrl('/api/orders'), {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const orderData = await res.json();
        
        this.cart = [];
        this.renderCartItems();
        if (this.onCartUpdate) this.onCartUpdate(this.cart);

        const chkModal = document.getElementById('checkout-modal');
        if (chkModal) {
          chkModal.classList.add('hidden');
          chkModal.classList.remove('flex');
        }

        const successModal = document.getElementById('order-success-modal');
        document.getElementById('confirmed-order-id').textContent = orderData.order_id;
        document.getElementById('confirmed-delivery-date').textContent = orderData.delivery_date;
        document.getElementById('confirmed-total').textContent = this.formatINR(orderData.total_amount);

        if (successModal) {
          successModal.classList.remove('hidden');
          successModal.classList.add('flex');
        }
      } else {
        const errData = await res.json().catch(() => null);
        alert(errData?.detail || 'Failed to process order. Please try again.');
      }
    } catch (err) {
      console.error('Error submitting order', err);
      alert('Unable to process order at this moment. Please check your connection and try again.');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>Confirm & Place Order</span><span class="material-symbols-outlined">check_circle</span>`;
      }
    }
  }
}
