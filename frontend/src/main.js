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

    window.addEventListener('hashchange', () => this.routePage());
    this.routePage();

    const mobileBtn = document.getElementById('mobile-menu-btn');
    if (mobileBtn) {
      mobileBtn.addEventListener('click', () => {
        const nav = document.querySelector('header nav');
        if (nav) {
          nav.classList.toggle('hidden');
          nav.classList.toggle('flex');
          nav.classList.toggle('flex-col');
          nav.classList.toggle('absolute');
          nav.classList.toggle('top-20');
          nav.classList.toggle('left-0');
          nav.classList.toggle('w-full');
          nav.classList.toggle('bg-white');
          nav.classList.toggle('p-6');
          nav.classList.toggle('shadow-xl');
        }
      });
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
      
      accountBtn.className = 'flex items-center gap-2 text-xs font-bold text-on-surface bg-surface-container hover:bg-surface-container-high px-3 py-1.5 rounded-full border border-outline-variant/60 transition-all shadow-xs';
      accountBtn.innerHTML = `
        <div class="w-6 h-6 rounded-full bg-primary text-white text-[11px] font-bold flex items-center justify-center shadow-xs">${initial}</div>
        <span id="header-account-label" class="max-w-[80px] truncate">${displayName}</span>
        <span class="material-symbols-outlined text-xs text-outline">expand_more</span>
      `;
    } else {
      accountBtn.className = 'flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-3.5 py-2 rounded-full transition-all';
      accountBtn.innerHTML = `
        <span class="material-symbols-outlined text-lg">person</span>
        <span id="header-account-label">Sign In</span>
      `;
    }
  }

  routePage() {
    const rawHash = window.location.hash.replace('#', '') || 'home';
    const [path, queryString] = rawHash.split('?');

    // Parse query params
    const queryParams = new URLSearchParams(queryString || '');

    // Update active nav links
    document.querySelectorAll('.nav-link').forEach(link => {
      if (link.dataset.page === path) {
        link.classList.add('text-primary', 'font-bold', 'border-b-2', 'border-primary', 'pb-1');
        link.classList.remove('text-on-surface-variant');
      } else {
        link.classList.remove('text-primary', 'font-bold', 'border-b-2', 'border-primary', 'pb-1');
        link.classList.add('text-on-surface-variant');
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
