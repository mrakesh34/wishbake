import { animate } from 'motion';
import { apiUrl } from '../services/api.js';
import { escapeHtml, formatINR } from '../utils/ui.js';

const DEFAULT_CATEGORIES = ['Birthday', 'Anniversary', 'Weddings & Galas', 'Diwali Special', 'Signature Fusion'];

export class ShopGallery {
  constructor(
    containerElement,
    onAddToCartCallback,
    onCustomizeSimilarCallback,
    onOpenDetailCallback,
    initialCategory = 'All'
  ) {
    this.container = containerElement;
    this.onAddToCart = onAddToCartCallback;
    this.onCustomizeSimilar = onCustomizeSimilarCallback;
    this.onOpenDetail = onOpenDetailCallback;
    this.cakes = [];
    this.categories = ['All', ...DEFAULT_CATEGORIES];
    this.currentCategory = initialCategory || 'All';
    this.searchQuery = '';
    this.motionControls = [];
    this.requestFailed = false;
    this.isDestroyed = false;
    this.searchDebounce = null;
    this.fetchSequence = 0;

    this.init();
  }

  async init() {
    this.renderShell();
    this.renderSkeletonResults();
    await this.fetchCategories();
    if (this.isDestroyed) return;
    this.renderFilterTabs();
    await this.fetchCakes();
    if (this.isDestroyed) return;
    this.renderResults();
  }

  async fetchCategories() {
    try {
      const response = await fetch(apiUrl('/api/categories'));
      if (!response.ok) return;
      const data = await response.json();
      if (data.status === 'success' && Array.isArray(data.data) && data.data.length > 0) {
        this.categories = ['All', ...data.data.map(item => item.name)];
      }
    } catch {
      // Retain default category list
    }
    if (!this.categories.includes(this.currentCategory)) {
      this.currentCategory = 'All';
    }
  }

  async fetchCakes() {
    const seq = ++this.fetchSequence;
    try {
      let endpoint = '/api/cakes';
      const params = new URLSearchParams();
      if (this.currentCategory !== 'All') params.append('category', this.currentCategory);
      if (this.searchQuery.trim()) params.append('search', this.searchQuery.trim());
      if (params.toString()) endpoint += `?${params.toString()}`;

      const response = await fetch(apiUrl(endpoint));
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (seq !== this.fetchSequence || this.isDestroyed) return;

      if (data.status === 'success' && Array.isArray(data.data)) {
        this.cakes = data.data;
        this.requestFailed = false;
      } else {
        this.cakes = [];
        this.requestFailed = true;
      }
    } catch (error) {
      if (seq !== this.fetchSequence || this.isDestroyed) return;
      this.cakes = [];
      this.requestFailed = true;
      console.warn('Catalog cakes could not be loaded', error);
    }
  }

  stopEntrance() {
    this.motionControls.forEach(control => control.stop());
    this.motionControls = [];
  }

  playEntrance(elements) {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    elements.forEach((element, index) => {
      this.motionControls.push(animate(element, { opacity: [0, 1], y: [10, 0] }, {
        duration: 0.36,
        delay: Math.min(index * 0.04, 0.2),
        ease: [0.22, 1, 0.36, 1]
      }));
    });
  }

  renderShell() {
    this.container.innerHTML = `
      <section class="wb-shop" aria-labelledby="shop-title">
        <div class="wb-shop__intro">
          <div class="wb-page-width">
            <p class="wb-eyebrow">WISHBAKE · The collection</p>
            <div class="wb-shop__intro-row">
              <h1 id="shop-title">A cake for<br /><em>the gathering.</em></h1>
              <p>Browse our signature creations by occasion, or search for a flavour you already have in mind.</p>
            </div>
          </div>
        </div>

        <div class="wb-page-width wb-shop__content">
          <div class="wb-shop__toolbar">
            <div id="shop-filters-list" class="wb-shop__filters" role="tablist" aria-label="Filter cakes by occasion"></div>
            <label class="wb-shop__search">
              <span class="material-symbols-outlined" aria-hidden="true">search</span>
              <span class="wb-visually-hidden">Search cakes</span>
              <input type="search" id="shop-search-input" value="${escapeHtml(this.searchQuery)}" placeholder="Search cakes, flavours..." autocomplete="off" />
            </label>
          </div>

          <div id="shop-results-region" aria-live="polite"></div>
        </div>
      </section>
    `;

    this.renderFilterTabs();
    this.attachToolbarEvents();
  }

  renderFilterTabs() {
    const filtersEl = this.container.querySelector('#shop-filters-list');
    if (!filtersEl) return;
    filtersEl.innerHTML = this.categories.map(category => `
      <button type="button" role="tab" aria-selected="${this.currentCategory === category}" data-category="${escapeHtml(category)}" class="wb-filter-btn ${this.currentCategory === category ? 'is-selected' : ''}">
        ${category === 'All' ? 'All cakes' : escapeHtml(category)}
      </button>
    `).join('');

    filtersEl.querySelectorAll('.wb-filter-btn').forEach(button => {
      button.addEventListener('click', async event => {
        const nextCat = event.currentTarget.dataset.category;
        if (nextCat === this.currentCategory) return;
        this.currentCategory = nextCat;
        this.renderFilterTabs();
        this.renderSkeletonResults();
        await this.fetchCakes();
        if (!this.isDestroyed) this.renderResults();
      });
    });
  }

  renderSkeletonResults() {
    const region = this.container.querySelector('#shop-results-region');
    if (!region) return;
    region.innerHTML = `
      <div class="wb-shop__result-line">
        <span>${this.currentCategory === 'All' ? 'The cake counter' : escapeHtml(this.currentCategory)}</span>
        <span>Loading collection...</span>
      </div>
      <div class="wb-shop__skeleton-grid">${Array(6).fill('<div class="wb-product-skeleton"></div>').join('')}</div>
    `;
  }

  renderResults() {
    this.stopEntrance();
    const region = this.container.querySelector('#shop-results-region');
    if (!region) return;

    const countLabel = this.cakes.length === 1 ? '1 cake' : `${this.cakes.length} cakes`;
    const hasActiveFilters = this.currentCategory !== 'All' || this.searchQuery.trim() !== '';

    region.innerHTML = `
      <div class="wb-shop__result-line">
        <span>${this.currentCategory === 'All' ? 'The cake counter' : escapeHtml(this.currentCategory)}</span>
        <span>${this.requestFailed ? 'Collection unavailable' : countLabel}</span>
      </div>

      ${this.cakes.length === 0 ? `
        <div class="wb-shop__empty" role="status">
          <span class="material-symbols-outlined" aria-hidden="true">${this.requestFailed ? 'wifi_off' : 'search_off'}</span>
          <h2>${this.requestFailed ? 'Unable to load the collection right now.' : 'Nothing matched your selection.'}</h2>
          <p>${this.requestFailed ? 'Please try loading the collection again.' : 'Try another occasion or clear your search filter.'}</p>
          ${this.requestFailed
            ? '<button class="wb-button wb-button--outline" type="button" id="shop-retry-btn">Try again</button>'
            : (hasActiveFilters ? '<button class="wb-button wb-button--outline" type="button" id="shop-clear-btn">Show all cakes</button>' : '')
          }
        </div>
      ` : `
        <div class="wb-product-grid wb-shop__grid">
          ${this.cakes.map((cake, index) => this.renderCakeCard(cake, index)).join('')}
        </div>
      `}
    `;

    this.attachResultEvents();
    this.playEntrance(Array.from(region.querySelectorAll('[data-motion-card]')));
  }

  renderCakeCard(cake, index) {
    const price = formatINR(cake.price);
    const idAttr = escapeHtml(cake.id);
    const titleSafe = escapeHtml(cake.title);

    return `
      <article class="wb-product-card wb-shop-card" data-motion-card style="--wb-card-index:${index}">
        <a class="wb-shop-card__image open-detail-btn" href="#cake-detail?id=${encodeURIComponent(cake.id)}" data-id="${idAttr}" aria-label="View ${titleSafe}">
          <img src="${escapeHtml(cake.image)}" alt="${titleSafe}" loading="lazy" decoding="async" />
          ${cake.badge ? `<span class="wb-product-card__badge">${escapeHtml(cake.badge)}</span>` : ''}
          <span class="wb-shop-card__image-open" aria-hidden="true">View cake <span>↗</span></span>
        </a>
        <div class="wb-product-card__body wb-shop-card__body">
          <div class="wb-product-card__meta"><span>${escapeHtml(cake.category)}</span><span class="wb-product-card__rating"><span aria-hidden="true">★</span> ${escapeHtml(cake.rating)} · ${escapeHtml(cake.reviews)}</span></div>
          <button class="wb-shop-card__title open-detail-btn" type="button" data-id="${idAttr}">${titleSafe}</button>
          <p>${escapeHtml(cake.description)}</p>
          <div class="wb-product-card__footer wb-shop-card__footer">
            <span class="wb-product-card__price">${price}</span>
            <span class="wb-product-card__servings">Serves ${escapeHtml(cake.servings)}</span>
          </div>
          <div class="wb-shop-card__actions">
            <button type="button" data-id="${idAttr}" class="wb-shop-card__customize customize-similar-btn"><span class="material-symbols-outlined" aria-hidden="true">view_in_ar</span> Make it yours</button>
            <button type="button" data-id="${idAttr}" class="wb-shop-card__add add-preset-cart-btn" aria-label="Add ${titleSafe} to bag"><span class="material-symbols-outlined" aria-hidden="true">add</span><span>Add to bag</span></button>
          </div>
        </div>
      </article>
    `;
  }

  attachToolbarEvents() {
    const searchInput = this.container.querySelector('#shop-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', event => {
        this.searchQuery = event.target.value;
        clearTimeout(this.searchDebounce);
        this.searchDebounce = setTimeout(async () => {
          await this.fetchCakes();
          if (!this.isDestroyed) this.renderResults();
        }, 220);
      });
    }
  }

  attachResultEvents() {
    const region = this.container.querySelector('#shop-results-region');
    if (!region) return;

    region.querySelector('#shop-retry-btn')?.addEventListener('click', async () => {
      this.renderSkeletonResults();
      await this.fetchCakes();
      if (!this.isDestroyed) this.renderResults();
    });

    region.querySelector('#shop-clear-btn')?.addEventListener('click', async () => {
      this.currentCategory = 'All';
      this.searchQuery = '';
      const searchInput = this.container.querySelector('#shop-search-input');
      if (searchInput) searchInput.value = '';
      this.renderFilterTabs();
      this.renderSkeletonResults();
      await this.fetchCakes();
      if (!this.isDestroyed) this.renderResults();
    });

    region.querySelectorAll('.add-preset-cart-btn').forEach(button => {
      button.addEventListener('click', event => {
        const cake = this.cakes.find(item => item.id === event.currentTarget.dataset.id);
        if (cake && this.onAddToCart) {
          this.onAddToCart({
            item_type: 'preset',
            cake_id: cake.id,
            size: '1lb',
            title: `${cake.title} (1lb)`,
            quantity: 1,
            unit_price: Math.round(cake.price)
          });
        }
      });
    });

    region.querySelectorAll('.customize-similar-btn').forEach(button => {
      button.addEventListener('click', event => {
        const cake = this.cakes.find(item => item.id === event.currentTarget.dataset.id);
        if (cake && this.onCustomizeSimilar) this.onCustomizeSimilar(cake);
      });
    });

    region.querySelectorAll('.open-detail-btn').forEach(element => {
      element.addEventListener('click', event => {
        if (event.currentTarget.tagName === 'A') event.preventDefault();
        const id = event.currentTarget.dataset.id;
        if (this.onOpenDetail) this.onOpenDetail(id);
        else window.location.hash = `#cake-detail?id=${encodeURIComponent(id)}`;
      });
    });
  }

  destroy() {
    this.isDestroyed = true;
    clearTimeout(this.searchDebounce);
    this.stopEntrance();
  }
}
