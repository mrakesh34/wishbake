import { HomeHero } from './components/HomeHero.js';
import { ShopGallery } from './components/ShopGallery.js';
import { SingleCakeDetail } from './components/SingleCakeDetail.js';
import { CustomizerStudio } from './components/CustomizerStudio.js';
import { AboutView } from './components/AboutView.js';
import { CartDrawer } from './components/CartDrawer.js';
import { ScrollAnimator } from './components/ScrollAnimator.js';
import { authManager } from './services/AuthManager.js';
import { AuthModal } from './components/AuthModal.js';
import { AccountDrawer } from './components/AccountDrawer.js';

class App {
  constructor() {
    this.appContent = document.getElementById('app-content');
    this.cartState = [];
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
        if (authManager.isLoggedIn()) authManager.saveCart(updatedCart).catch(console.error);
      },
      () => {
        this.authModal.open();
      }
    );

    this.setupHeaderAuth();

    this.setupMobileNav();
    window.addEventListener('hashchange', () => this.routePage());
    this.routePage();
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
      if (isLoggedIn) authManager.fetchCart().then(({ items }) => {
        this.cartState = items || [];
        this.cartDrawer.cart = this.cartState;
        this.cartDrawer.renderCartItems();
      }).catch(console.error);
    });

    this.updateHeaderAuthUI(authManager.getUser());
    if (authManager.isLoggedIn()) authManager.fetchCart().then(({ items }) => {
      this.cartState = items || [];
      this.cartDrawer.cart = this.cartState;
      this.cartDrawer.renderCartItems();
    }).catch(console.error);
  }

  updateHeaderAuthUI(user) {
    const accountBtn = document.getElementById('header-account-btn');
    const labelEl = document.getElementById('header-account-label');
    if (!accountBtn || !labelEl) return;

    if (user && authManager.isLoggedIn()) {
      const initial = (user.name ? user.name.charAt(0) : user.email.charAt(0)).toUpperCase();
      const displayName = user.name ? user.name.split(' ')[0] : user.email.split('@')[0];
      
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
        <span id="header-account-label">Sign In</span>
      `;
    }
  }

  routePage() {
    this.setMobileNavOpen(false);
    const rawHash = window.location.hash.replace('#', '') || 'home';
    const [path, queryString] = rawHash.split('?');

    // Parse query params
    const queryParams = new URLSearchParams(queryString || '');

    // Update active nav links
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
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (path === 'home') {
      this.activeComponent = new HomeHero(
        this.appContent,
        () => { window.location.hash = '#customizer'; },
        (category) => { window.location.hash = '#shop'; }
      );
    } else if (path === 'shop') {
      this.activeComponent = new ShopGallery(
        this.appContent,
        (item) => this.cartDrawer.addItem(item),
        (presetCake) => { window.location.hash = '#customizer'; },
        (cakeId) => { window.location.hash = `#cake-detail?id=${cakeId}`; }
      );
    } else if (path === 'cake-detail') {
      const cakeId = queryParams.get('id') || 'cake-gulab-cheesecake';
      this.activeComponent = new SingleCakeDetail(
        this.appContent,
        cakeId,
        (item) => this.cartDrawer.addItem(item),
        (presetCake) => { window.location.hash = '#customizer'; }
      );
    } else if (path === 'customizer') {
      this.activeComponent = new CustomizerStudio(
        this.appContent,
        (item) => this.cartDrawer.addItem(item)
      );
    } else if (path === 'about') {
      this.activeComponent = new AboutView(this.appContent);
    } else {
      window.location.hash = '#home';
    }

    // Observe scroll-reveal elements on the new page
    requestAnimationFrame(() => {
      this.scrollAnimator.observeElements(this.appContent);
      this.scrollAnimator.observeCounters(this.appContent);
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new App();
});
