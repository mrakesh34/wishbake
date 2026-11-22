import { animate } from 'motion';
import { apiUrl } from '../services/api.js';

export class ShopGallery {
  constructor(containerElement, onAddToCartCallback, onCustomizeSimilarCallback, onOpenDetailCallback) {
    this.container = containerElement;
    this.onAddToCart = onAddToCartCallback;
    this.onCustomizeSimilar = onCustomizeSimilarCallback;
    this.onOpenDetail = onOpenDetailCallback;
    this.cakes = [];
    this.currentCategory = 'All';
    this.searchQuery = '';
    this.motionControls = [];
    this.requestFailed = false;
    this.init();
  }

  async init() {
    this.renderSkeleton();
    await this.fetchCakes();
    this.render();
  }

  async fetchCakes() {
    try {
      let endpoint = '/api/cakes';
      const params = new URLSearchParams();
      if (this.currentCategory !== 'All') params.append('category', this.currentCategory);
      if (this.searchQuery) params.append('search', this.searchQuery);
      if (params.toString()) endpoint += `?${params.toString()}`;

      const response = await fetch(apiUrl(endpoint));
      const data = await response.json();
      if (data.status === 'success') {
        this.cakes = data.data;
        this.requestFailed = false;
      } else {
        this.cakes = [];
        this.requestFailed = true;
      }
    } catch (error) {
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
        duration: .38,
        delay: Math.min(index * .045, .24),
        ease: [0.22, 1, 0.36, 1]
      }));
    });
  }

  renderSkeleton() {
    this.container.innerHTML = `
      <section class="wb-shop">
        <div class="wb-page-width wb-shop__skeleton">
          <div class="wb-shop__skeleton-heading"></div>
          <div class="wb-shop__skeleton-grid">${Array(6).fill('<div class="wb-product-skeleton"></div>').join('')}</div>
        </div>
      </section>
    `;
  }

  render() {
    this.stopEntrance();
    const categories = ['All', 'Diwali Special', 'Birthday', 'Weddings & Galas', 'Anniversary'];
    const countLabel = this.cakes.length === 1 ? '1 cake' : `${this.cakes.length} cakes`;

    this.container.innerHTML = `
      <section class="wb-shop" aria-labelledby="shop-title">
        <div class="wb-shop__intro">
          <div class="wb-page-width">
            <p class="wb-eyebrow">WISHBAKE · The collection</p>
            <div class="wb-shop__intro-row">
              <h1 id="shop-title">A cake for<br /><em>the gathering.</em></h1>
              <p>Browse the signature collection by occasion, or search for a flavour you already have in mind.</p>
            </div>
          </div>
        </div>

        <div class="wb-page-width wb-shop__content">
          <div class="wb-shop__toolbar">
            <div class="wb-shop__filters" role="tablist" aria-label="Filter cakes by occasion">
              ${categories.map(category => `
                <button type="button" role="tab" aria-selected="${this.currentCategory === category}" data-category="${category}" class="wb-filter-btn ${this.currentCategory === category ? 'is-selected' : ''}">${category === 'All' ? 'All cakes' : category}</button>
              `).join('')}
            </div>
            <label class="wb-shop__search">
              <span class="material-symbols-outlined" aria-hidden="true">search</span>
              <span class="wb-visually-hidden">Search cakes</span>
              <input type="search" id="shop-search-input" value="${this.searchQuery}" placeholder="Search cakes" autocomplete="off" />
            </label>
          </div>

          <div class="wb-shop__result-line"><span>${this.currentCategory === 'All' ? 'The cake counter' : this.currentCategory}</span><span>${this.requestFailed ? 'Collection unavailable' : countLabel}</span></div>

          ${this.cakes.length === 0 ? `
            <div class="wb-shop__empty" role="status">
              <span class="material-symbols-outlined" aria-hidden="true">${this.requestFailed ? 'wifi_off' : 'search_off'}</span>
              <h2>${this.requestFailed ? 'The counter is resting for a moment.' : 'Nothing on the counter just now.'}</h2>
              <p>${this.requestFailed ? 'Please try the collection again shortly.' : 'Try another occasion or a shorter search.'}</p>
              ${this.requestFailed ? '<button class="wb-button wb-button--outline" type="button" id="shop-retry-btn">Try again</button>' : ''}
            </div>
          ` : `
            <div class="wb-product-grid wb-shop__grid">
              ${this.cakes.map((cake, index) => this.renderCakeCard(cake, index)).join('')}
            </div>
          `}
        </div>
      </section>
    `;

    this.attachEvents();
    this.playEntrance(Array.from(this.container.querySelectorAll('[data-motion-card]')));
  }

  renderCakeCard(cake, index) {
    const price = Number(cake.price || 0).toLocaleString('en-IN');
    return `
      <article class="wb-product-card wb-shop-card" data-motion-card style="--wb-card-index:${index}">
        <a class="wb-shop-card__image open-detail-btn" href="#cake-detail?id=${encodeURIComponent(cake.id)}" data-id="${cake.id}" aria-label="View ${cake.title}">
          <img src="${cake.image}" alt="${cake.title}" loading="lazy" decoding="async" />
          ${cake.badge ? `<span class="wb-product-card__badge">${cake.badge}</span>` : ''}
          <span class="wb-shop-card__image-open" aria-hidden="true">View cake <span>↗</span></span>
        </a>
        <div class="wb-product-card__body wb-shop-card__body">
          <div class="wb-product-card__meta"><span>${cake.category}</span><span class="wb-product-card__rating"><span aria-hidden="true">★</span> ${cake.rating} · ${cake.reviews}</span></div>
          <button class="wb-shop-card__title open-detail-btn" type="button" data-id="${cake.id}">${cake.title}</button>
          <p>${cake.description}</p>
          <div class="wb-product-card__footer wb-shop-card__footer">
            <span class="wb-product-card__price">₹${price}</span>
            <span class="wb-product-card__servings">Serves ${cake.servings}</span>
          </div>
          <div class="wb-shop-card__actions">
            <button type="button" data-id="${cake.id}" class="wb-shop-card__customize customize-similar-btn"><span class="material-symbols-outlined" aria-hidden="true">view_in_ar</span> Make it yours</button>
            <button type="button" data-id="${cake.id}" class="wb-shop-card__add add-preset-cart-btn" aria-label="Add ${cake.title} to bag"><span class="material-symbols-outlined" aria-hidden="true">add</span><span>Add to bag</span></button>
          </div>
        </div>
      </article>
    `;
  }

  attachEvents() {
    this.container.querySelectorAll('.wb-filter-btn').forEach(button => {
      button.addEventListener('click', async event => {
        this.currentCategory = event.currentTarget.dataset.category;
        await this.fetchCakes();
        this.render();
      });
    });

    const searchInput = this.container.querySelector('#shop-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', async event => {
        this.searchQuery = event.target.value;
        await this.fetchCakes();
        this.render();
      });
    }

    const retryButton = this.container.querySelector('#shop-retry-btn');
    retryButton?.addEventListener('click', async () => {
      this.renderSkeleton();
      await this.fetchCakes();
      this.render();
    });

    this.container.querySelectorAll('.add-preset-cart-btn').forEach(button => {
      button.addEventListener('click', event => {
        const cake = this.cakes.find(item => item.id === event.currentTarget.dataset.id);
        if (cake && this.onAddToCart) {
          this.onAddToCart({
            item_type: 'preset',
            cake_id: cake.id,
            title: cake.title,
            quantity: 1,
            unit_price: cake.price
          });
        }
      });
    });

    this.container.querySelectorAll('.customize-similar-btn').forEach(button => {
      button.addEventListener('click', event => {
        const cake = this.cakes.find(item => item.id === event.currentTarget.dataset.id);
        if (cake && this.onCustomizeSimilar) this.onCustomizeSimilar(cake);
      });
    });

    this.container.querySelectorAll('.open-detail-btn').forEach(element => {
      element.addEventListener('click', event => {
        if (event.currentTarget.tagName === 'A') event.preventDefault();
        const id = event.currentTarget.dataset.id;
        if (this.onOpenDetail) this.onOpenDetail(id);
        else window.location.hash = `#cake-detail?id=${id}`;
      });
    });
  }

  destroy() {
    this.stopEntrance();
  }
}
