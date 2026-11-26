import { HomeHero } from './components/HomeHero.js';
import { ShopGallery } from './components/ShopGallery.js';
import { SingleCakeDetail } from './components/SingleCakeDetail.js';
import { CustomizerStudio } from './components/CustomizerStudio.js';
import { AboutView } from './components/AboutView.js';
import { CartDrawer } from './components/CartDrawer.js';
import { ScrollAnimator } from './components/ScrollAnimator.js';
import { authManager } from './services/AuthManager.js';
import { initPaymentGateway, verifyOnlinePayment } from './services/paymentGateway.js';
import { AuthModal } from './components/AuthModal.js';
import { AccountDrawer } from './components/AccountDrawer.js';
import { escapeHtml, showToast } from './utils/ui.js';

const GUEST_CART_KEY = 'wb_guest_cart';

function loadGuestCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(GUEST_CART_KEY) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function saveGuestCart(items) {
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items || []));
  } catch {
    /* ignore storage quota errors */
  }
}

function mergeCartItems(serverItems = [], guestItems = []) {
  const merged = (serverItems || []).map(item => ({ ...item }));
  (guestItems || []).forEach(guestItem => {
    if (guestItem.item_type === 'preset') {
      const sizeKey = guestItem.size || '1lb';
      const existing = merged.find(
        item => item.item_type === 'preset' && item.cake_id === guestItem.cake_id && (item.size || '1lb') === sizeKey
      );
      if (existing) {
        existing.quantity += guestItem.quantity || 1;
        return;
      }
    }
    merged.push({ ...guestItem });
  });
  return merged;
}

class App {
  constructor() {
    this.appContent = document.getElementById('app-content');
    this.cartState = authManager.isLoggedIn() ? [] : loadGuestCart();
    this.cartDrawer = null;
    this.authModal = null;
    this.accountDrawer = null;
    this.activeComponent = null;
    this.scrollAnimator = new ScrollAnimator();

    this.init();
  }

  init() {
    this.authModal = new AuthModal((user) => {
      this.updateHeaderAuthUI(user);
    });

    this.accountDrawer = new AccountDrawer();

    this.cartDrawer = new CartDrawer(
      this.cartState,
      (updatedCart) => {
        this.cartState = updatedCart;
        if (authManager.isLoggedIn()) {
          authManager.saveCart(updatedCart).catch(console.error);
        } else {
          saveGuestCart(updatedCart);
        }
      },
      () => {
        this.authModal.open();
      }
    );

    this.setupHeaderAuth();
    this.setupMobileNav();
    window.addEventListener('hashchange', () => this.routePage());
    this.routePage();

    initPaymentGateway();
    this.handlePaymentReturnIfPresent();
  }

  async handlePaymentReturnIfPresent() {
    if (window.location.pathname !== '/payment-return') return;
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('order_id');
    window.history.replaceState({}, '', '/#home');

    if (!orderId) return;
    const token = authManager.getToken();
    if (!token) {
      showToast('Please sign in to view your payment status in My Orders.', 'info', 5000);
      return;
    }

    showToast('Verifying your payment...', 'info', 2500);
    try {
      const verification = await verifyOnlinePayment(orderId, token);
      this.cartDrawer?.handleVerifiedOnlineResult(verification);
    } catch (err) {
      showToast(err.message || 'Could not verify payment status. Check My Orders shortly.', 'error', 5000);
    }
  }

  setupMobileNav() {
    this.mobileMenuButton = document.getElementById('mobile-menu-btn');
    this.mobileNav = document.getElementById('primary-navigation');
    if (!this.mobileMenuButton || !this.mobileNav) return;

    this.mobileMenuButton.addEventListener('click', () => {
      const isOpen = this.mobileMenuButton.getAttribute('aria-expanded') === 'true';
      this.setMobileNavOpen(!isOpen);
    });

    this.mobileNav.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => this.setMobileNavOpen(false));
    });

    this._mobileNavKeyHandler = event => {
      if (event.key === 'Escape') this.setMobileNavOpen(false);
    };
    this._mobileNavResizeHandler = () => {
      if (window.matchMedia('(min-width: 64rem)').matches) this.setMobileNavOpen(false);
    };
    document.addEventListener('keydown', this._mobileNavKeyHandler);
    window.addEventListener('resize', this._mobileNavResizeHandler, { passive: true });
  }

  setMobileNavOpen(isOpen) {
    if (!this.mobileMenuButton || !this.mobileNav) return;
    this.mobileNav.dataset.open = String(isOpen);
    this.mobileMenuButton.setAttribute('aria-expanded', String(isOpen));
    this.mobileMenuButton.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
    const icon = this.mobileMenuButton.querySelector('.material-symbols-outlined');
    if (icon) icon.textContent = isOpen ? 'close' : 'menu';
  }

  async syncAuthenticatedCart() {
    if (!authManager.isLoggedIn()) return;
    try {
      const { items: serverItems } = await authManager.fetchCart();
      const guestItems = loadGuestCart();
      if (guestItems.length > 0) {
        const merged = mergeCartItems(serverItems || [], guestItems);
        saveGuestCart([]);
        this.cartState = merged;
        await authManager.saveCart(merged);
      } else {
        this.cartState = serverItems || [];
      }
      this.cartDrawer.cart = this.cartState;
      this.cartDrawer.renderCartItems();
    } catch (error) {
      console.error('Failed to sync account cart', error);
    }
  }

  setupHeaderAuth() {
    const accountBtn = document.getElementById('header-account-btn');
    if (accountBtn) {
      accountBtn.addEventListener('click', () => {
        if (authManager.isLoggedIn()) {
          this.accountDrawer.open();
        } else {
          this.authModal.open();
        }
      });
    }

    authManager.onAuthChange(({ user, isLoggedIn }) => {
      this.updateHeaderAuthUI(user);
      if (isLoggedIn) {
        this.syncAuthenticatedCart();
      } else {
        this.cartState = loadGuestCart();
        this.cartDrawer.cart = this.cartState;
        this.cartDrawer.renderCartItems();
      }
    });

    this.updateHeaderAuthUI(authManager.getUser());
    if (authManager.isLoggedIn()) {
      this.syncAuthenticatedCart();
    }
  }

  updateHeaderAuthUI(user) {
    const accountBtn = document.getElementById('header-account-btn');
    if (!accountBtn) return;

    if (user && authManager.isLoggedIn()) {
      const initial = escapeHtml((user.name ? user.name.charAt(0) : user.email.charAt(0)).toUpperCase());
      const displayName = escapeHtml(user.name ? user.name.split(' ')[0] : user.email.split('@')[0]);

      accountBtn.className = 'wb-account-button';
      accountBtn.innerHTML = `
        <span class="wb-account-button__avatar" aria-hidden="true">${initial}</span>
        <span id="header-account-label">${displayName}</span>
        <span class="material-symbols-outlined" aria-hidden="true">expand_more</span>
      `;
    } else {
      accountBtn.className = 'wb-account-button';
      accountBtn.innerHTML = `
        <span class="material-symbols-outlined" aria-hidden="true">person_outline</span>
        <span id="header-account-label">Sign in</span>
      `;
    }
  }

  routePage() {
    this.setMobileNavOpen(false);
    const rawHash = window.location.hash.replace('#', '') || 'home';
    const [path, queryString] = rawHash.split('?');
    const queryParams = new URLSearchParams(queryString || '');

    document.body.classList.toggle('wb-is-customizer', path === 'customizer');

    document.querySelectorAll('.nav-link').forEach(link => {
      if (link.dataset.page === path) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });

    if (this.activeComponent && typeof this.activeComponent.destroy === 'function') {
      this.activeComponent.destroy();
    }

    this.appContent.innerHTML = '';
    window.scrollTo({ top: 0, behavior: 'auto' });

    const goToCustomizer = (presetCake = null) => {
      window.location.hash = presetCake?.id
        ? `#customizer?preset=${encodeURIComponent(presetCake.id)}`
        : '#customizer';
    };

    const goToShop = (category = null) => {
      window.location.hash = category && category !== 'All'
        ? `#shop?category=${encodeURIComponent(category)}`
        : '#shop';
    };

    if (path === 'home') {
      this.activeComponent = new HomeHero(
        this.appContent,
        () => goToCustomizer(null),
        (category) => goToShop(category)
      );
    } else if (path === 'shop') {
      const initialCategory = queryParams.get('category') || 'All';
      this.activeComponent = new ShopGallery(
        this.appContent,
        (item) => this.cartDrawer.addItem(item),
        (presetCake) => goToCustomizer(presetCake),
        (cakeId) => { window.location.hash = `#cake-detail?id=${encodeURIComponent(cakeId)}`; },
        initialCategory
      );
    } else if (path === 'cake-detail') {
      const cakeId = queryParams.get('id') || 'cake-gulab-cheesecake';
      this.activeComponent = new SingleCakeDetail(
        this.appContent,
        cakeId,
        (item) => this.cartDrawer.addItem(item),
        (presetCake) => goToCustomizer(presetCake)
      );
    } else if (path === 'customizer') {
      const presetId = queryParams.get('preset') || null;
      this.activeComponent = new CustomizerStudio(
        this.appContent,
        (item) => this.cartDrawer.addItem(item),
        presetId
      );
    } else if (path === 'about') {
      this.activeComponent = new AboutView(this.appContent);
    } else {
      window.location.hash = '#home';
    }

    requestAnimationFrame(() => {
      this.scrollAnimator.observeElements(this.appContent);
      this.scrollAnimator.observeCounters(this.appContent);
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new App();
});
