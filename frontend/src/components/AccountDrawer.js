import { authManager } from '../services/AuthManager.js';

export class AccountDrawer {
  constructor() {
    this.activeTab = 'orders'; // 'orders' or 'profile'
    this.orders = [];
    this.isLoadingOrders = false;
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
      overlay.className = 'fixed inset-0 bg-black/40 backdrop-blur-xs z-50 hidden transition-opacity duration-300';
      
      overlay.innerHTML = `
        <div id="account-panel" class="absolute top-0 right-0 w-full max-w-md h-full bg-white shadow-2xl flex flex-col transform translate-x-full transition-transform duration-300">
          
          <!-- Header -->
          <div class="p-6 border-b border-outline-variant bg-surface-container-low flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div id="account-user-avatar" class="w-11 h-11 rounded-full bg-primary text-white font-display font-bold flex items-center justify-center text-lg shadow-sm">
                W
              </div>
              <div>
                <h3 id="account-user-name" class="font-display font-bold text-base text-on-surface leading-tight">My Account</h3>
                <p id="account-user-email" class="text-xs text-on-surface-variant flex items-center gap-1">
                  <span>guest@wishbake.com</span>
                  <span class="material-symbols-outlined text-green-600 text-xs" title="Verified Account">verified</span>
                </p>
              </div>
            </div>
            <button id="close-account-btn" class="p-1.5 text-on-surface-variant hover:text-primary rounded-full hover:bg-surface-container transition-colors">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <!-- Tab Navigation -->
          <div class="flex border-b border-outline-variant/60 bg-surface-container-lowest text-xs font-bold">
            <button id="tab-btn-orders" class="flex-1 py-3 text-center border-b-2 border-primary text-primary transition-all flex items-center justify-center gap-1.5">
              <span class="material-symbols-outlined text-sm">receipt_long</span>
              <span>My Orders</span>
            </button>
            <button id="tab-btn-profile" class="flex-1 py-3 text-center border-b-2 border-transparent text-on-surface-variant hover:text-primary transition-all flex items-center justify-center gap-1.5">
              <span class="material-symbols-outlined text-sm">manage_accounts</span>
              <span>Profile & Address</span>
            </button>
          </div>

          <!-- Content Body -->
          <div id="account-content-container" class="flex-grow overflow-y-auto p-6 space-y-4">
            <!-- Dynamic Tab Content -->
          </div>

          <!-- Footer -->
          <div class="p-4 border-t border-outline-variant bg-surface-container-lowest flex items-center justify-between">
            <button id="account-signout-btn" class="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-red-50 transition-colors">
              <span class="material-symbols-outlined text-sm">logout</span>
              <span>Sign Out</span>
            </button>
            <span class="text-[11px] text-outline">WISHBAKE Concierge</span>
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

    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this.close();
      });
    }

    if (closeBtn) closeBtn.addEventListener('click', () => this.close());

    if (tabOrders) {
      tabOrders.addEventListener('click', () => {
        this.switchTab('orders');
      });
    }

    if (tabProfile) {
      tabProfile.addEventListener('click', () => {
        this.switchTab('profile');
      });
    }

    if (signoutBtn) {
      signoutBtn.addEventListener('click', () => {
        if (confirm('Are you sure you wish to sign out?')) {
          authManager.logout();
          this.close();
        }
      });
    }
  }

  updateHeader(user) {
    if (!user) return;
    const nameEl = document.getElementById('account-user-name');
    const emailEl = document.getElementById('account-user-email');
    const avatarEl = document.getElementById('account-user-avatar');

    if (nameEl) nameEl.textContent = user.name || 'Valued Connoisseur';
    if (emailEl) {
      emailEl.innerHTML = `
        <span>${user.email}</span>
        <span class="material-symbols-outlined text-green-600 text-xs" title="Verified Account">verified</span>
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

    if (tab === 'orders') {
      tabOrders.className = 'flex-1 py-3 text-center border-b-2 border-primary text-primary font-bold transition-all flex items-center justify-center gap-1.5';
      tabProfile.className = 'flex-1 py-3 text-center border-b-2 border-transparent text-on-surface-variant hover:text-primary font-medium transition-all flex items-center justify-center gap-1.5';
      this.renderOrdersTab();
    } else {
      tabProfile.className = 'flex-1 py-3 text-center border-b-2 border-primary text-primary font-bold transition-all flex items-center justify-center gap-1.5';
      tabOrders.className = 'flex-1 py-3 text-center border-b-2 border-transparent text-on-surface-variant hover:text-primary font-medium transition-all flex items-center justify-center gap-1.5';
      this.renderProfileTab();
    }
  }

  async loadData() {
    const user = authManager.getUser();
    if (!user) return;
    this.updateHeader(user);

    if (this.activeTab === 'orders') {
      this.renderOrdersTab();
      try {
        this.isLoadingOrders = true;
        this.orders = await authManager.fetchOrders();
        this.isLoadingOrders = false;
        this.renderOrdersTab();
      } catch (err) {
        this.isLoadingOrders = false;
        console.error('Failed to load orders', err);
      }
    } else {
      this.renderProfileTab();
    }
  }

  renderOrdersTab() {
    const container = document.getElementById('account-content-container');
    if (!container) return;

    if (this.isLoadingOrders) {
      container.innerHTML = `
        <div class="py-16 text-center text-on-surface-variant space-y-3">
          <span class="material-symbols-outlined text-3xl text-primary animate-spin">refresh</span>
          <p class="text-xs">Fetching your bespoke order history...</p>
        </div>
      `;
      return;
    }

    if (this.orders.length === 0) {
      container.innerHTML = `
        <div class="py-12 text-center space-y-3">
          <div class="w-14 h-14 bg-surface-container rounded-2xl flex items-center justify-center mx-auto text-primary">
            <span class="material-symbols-outlined text-3xl">cake</span>
          </div>
          <h4 class="font-display font-bold text-on-surface text-base">No Orders Placed Yet</h4>
          <p class="text-xs text-on-surface-variant max-w-xs mx-auto">Design a 3D centerpiece cake or explore our signature handcrafted confections.</p>
          <div class="pt-2">
            <a href="#customizer" class="inline-flex items-center gap-1.5 bg-primary text-white text-xs font-bold px-4 py-2.5 rounded-full hover:bg-primary/90 transition-colors">
              <span>Open 3D Studio</span>
              <span class="material-symbols-outlined text-xs">brush</span>
            </a>
          </div>
        </div>
      `;
      return;
    }

    let ordersHtml = `<div class="space-y-4">`;
    this.orders.forEach(order => {
      const itemsHtml = order.items.map(item => `
        <div class="flex justify-between items-center text-xs py-1">
          <span class="text-on-surface">${item.quantity}x ${item.title}</span>
          <span class="font-bold text-primary">₹${(item.unit_price * item.quantity).toLocaleString()}</span>
        </div>
      `).join('');

      ordersHtml += `
        <div class="bg-surface-container-low border border-outline-variant/60 rounded-2xl p-4 space-y-3 shadow-xs">
          <div class="flex items-center justify-between border-b border-outline-variant/40 pb-2.5">
            <div>
              <span class="font-mono text-xs font-bold text-primary">${order.order_id}</span>
              <p class="text-[10px] text-on-surface-variant">${new Date(order.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}</p>
            </div>
            <span class="bg-green-100 text-green-700 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
              <span class="material-symbols-outlined text-[12px]">local_shipping</span>
              ${order.status}
            </span>
          </div>

          <div class="space-y-1">
            ${itemsHtml}
          </div>

          <div class="bg-white p-3 rounded-xl border border-outline-variant/40 text-[11px] space-y-1">
            <div class="flex justify-between text-on-surface-variant">
              <span>Delivery Slot:</span>
              <span class="font-medium text-on-surface capitalize">${order.delivery_date} (${order.delivery_time_slot || 'Standard'})</span>
            </div>
            <div class="text-on-surface-variant truncate">
              <span>Address:</span> <span class="text-on-surface">${order.delivery_address}</span>
            </div>
          </div>

          <div class="flex justify-between items-center pt-1 border-t border-outline-variant/40 text-xs">
            <span class="font-bold text-on-surface">Total Paid:</span>
            <span class="font-display font-bold text-base text-primary">₹${order.total_amount.toLocaleString()}</span>
          </div>
        </div>
      `;
    });
    ordersHtml += `</div>`;

    container.innerHTML = ordersHtml;
  }

  renderProfileTab() {
    const container = document.getElementById('account-content-container');
    if (!container) return;

    const user = authManager.getUser() || {};
    const defaultAddr = (user.addresses && user.addresses[0]) || {};

    container.innerHTML = `
      <form id="profile-edit-form" class="space-y-4">
        <div class="space-y-3">
          <h4 class="text-xs font-bold uppercase tracking-wider text-on-surface">Personal Information</h4>
          
          <div>
            <label class="block text-[11px] font-bold text-on-surface mb-1">Full Name</label>
            <input type="text" id="profile-name-input" value="${user.name || ''}" placeholder="e.g. Priya Sharma" class="w-full px-3.5 py-2 text-xs rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-surface-container-lowest" />
          </div>

          <div>
            <label class="block text-[11px] font-bold text-on-surface mb-1">Phone Number</label>
            <input type="tel" id="profile-phone-input" value="${user.phone || ''}" placeholder="+91 98765 43210" class="w-full px-3.5 py-2 text-xs rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-surface-container-lowest" />
          </div>

          <div>
            <label class="block text-[11px] font-bold text-on-surface mb-1">Email Address</label>
            <input type="email" value="${user.email || ''}" disabled class="w-full px-3.5 py-2 text-xs rounded-xl border border-outline-variant/50 bg-surface-container text-on-surface-variant cursor-not-allowed" />
          </div>
        </div>

        <div class="border-t border-outline-variant/40 pt-4 space-y-3">
          <h4 class="text-xs font-bold uppercase tracking-wider text-on-surface flex items-center gap-1">
            <span class="material-symbols-outlined text-xs text-primary">location_on</span>
            Default Delivery Address
          </h4>

          <div>
            <label class="block text-[11px] text-on-surface-variant mb-1">Flat / Building</label>
            <input type="text" id="profile-flat" value="${defaultAddr.flat_house_no || ''}" placeholder="Flat 402, Sunrise Apts" class="w-full px-3.5 py-2 text-xs rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-surface-container-lowest" />
          </div>

          <div>
            <label class="block text-[11px] text-on-surface-variant mb-1">Street / Area</label>
            <input type="text" id="profile-street" value="${defaultAddr.street_locality || ''}" placeholder="Indiranagar 100ft Rd" class="w-full px-3.5 py-2 text-xs rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-surface-container-lowest" />
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-[11px] text-on-surface-variant mb-1">City</label>
              <input type="text" id="profile-city" value="${defaultAddr.city || 'Bangalore'}" class="w-full px-3.5 py-2 text-xs rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-surface-container-lowest" />
            </div>
            <div>
              <label class="block text-[11px] text-on-surface-variant mb-1">PIN Code</label>
              <input type="text" id="profile-pincode" value="${defaultAddr.pincode || ''}" placeholder="560038" maxlength="6" class="w-full px-3.5 py-2 text-xs rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-surface-container-lowest" />
            </div>
          </div>
        </div>

        <div id="profile-status-msg" class="hidden text-xs p-2 rounded-xl text-center"></div>

        <button type="submit" id="save-profile-btn" class="w-full bg-primary text-white font-bold py-2.5 rounded-full text-xs hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5 shadow-sm">
          <span class="material-symbols-outlined text-sm">save</span>
          <span>Save Changes</span>
        </button>
      </form>
    `;

    const form = document.getElementById('profile-edit-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nameVal = document.getElementById('profile-name-input').value.trim();
        const phoneVal = document.getElementById('profile-phone-input').value.trim();
        const flatVal = document.getElementById('profile-flat').value.trim();
        const streetVal = document.getElementById('profile-street').value.trim();
        const cityVal = document.getElementById('profile-city').value.trim();
        const pinVal = document.getElementById('profile-pincode').value.trim();

        const saveBtn = document.getElementById('save-profile-btn');
        const statusMsg = document.getElementById('profile-status-msg');

        saveBtn.disabled = true;
        saveBtn.innerHTML = `<span class="material-symbols-outlined text-sm animate-spin">refresh</span> Saving...`;

        try {
          const addresses = [];
          if (flatVal && streetVal) {
            addresses.push({
              id: 'addr-1',
              label: 'Home',
              flat_house_no: flatVal,
              street_locality: streetVal,
              landmark: '',
              city: cityVal || 'Bangalore',
              state: 'Karnataka',
              pincode: pinVal || '560001',
              is_default: true
            });
          }

          await authManager.updateProfile({
            name: nameVal,
            phone: phoneVal,
            addresses: addresses.length > 0 ? addresses : undefined
          });

          statusMsg.className = 'text-xs p-2 rounded-xl text-center bg-green-50 text-green-700 border border-green-200 block';
          statusMsg.textContent = 'Profile updated successfully!';
          setTimeout(() => {
            if (statusMsg) statusMsg.classList.add('hidden');
          }, 3000);
        } catch (err) {
          statusMsg.className = 'text-xs p-2 rounded-xl text-center bg-red-50 text-red-700 border border-red-200 block';
          statusMsg.textContent = err.message || 'Failed to update profile.';
        } finally {
          saveBtn.disabled = false;
          saveBtn.innerHTML = `<span class="material-symbols-outlined text-sm">save</span><span>Save Changes</span>`;
        }
      });
    }
  }

  isOpen() {
    const overlay = document.getElementById('account-overlay');
    return overlay && !overlay.classList.contains('hidden');
  }

  open() {
    const overlay = document.getElementById('account-overlay');
    const panel = document.getElementById('account-panel');
    if (overlay && panel) {
      overlay.classList.remove('hidden');
      setTimeout(() => {
        panel.classList.remove('translate-x-full');
      }, 10);
      this.loadData();
    }
  }

  close() {
    const overlay = document.getElementById('account-overlay');
    const panel = document.getElementById('account-panel');
    if (overlay && panel) {
      panel.classList.add('translate-x-full');
      setTimeout(() => {
        overlay.classList.add('hidden');
      }, 300);
    }
  }
}
