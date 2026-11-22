import { apiUrl } from '../services/api.js';

export class SingleCakeDetail {
  constructor(containerElement, cakeId, onAddToCartCallback, onCustomizeSimilarCallback) {
    this.container = containerElement;
    this.cakeId = cakeId;
    this.onAddToCart = onAddToCartCallback;
    this.onCustomizeSimilar = onCustomizeSimilarCallback;
    this.cake = null;
    this.selectedPortion = 1;
    this.selectedSize = '1lb';
    this.init();
  }

  async init() {
    this.renderSkeleton();
    await this.fetchCakeDetail();
    if (this.cake) this.render();
    else this.renderError();
  }

  async fetchCakeDetail() {
    try {
      const response = await fetch(apiUrl(`/api/cakes/${this.cakeId}`));
      const data = await response.json();
      if (data.status === 'success') this.cake = data.data;
    } catch (error) {
      console.warn('Error fetching cake details from API', error);
    }
  }

  renderSkeleton() {
    this.container.innerHTML = `
      <section class="wb-detail">
        <div class="wb-page-width wb-detail__skeleton">
          <div class="wb-product-skeleton"></div>
          <div><div class="wb-shop__skeleton-heading"></div><div class="wb-shop__skeleton-heading"></div></div>
        </div>
      </section>
    `;
  }

  renderError() {
    this.container.innerHTML = `
      <section class="wb-detail wb-detail--empty">
        <div class="wb-page-width wb-shop__empty" role="status">
          <span class="material-symbols-outlined" aria-hidden="true">cake</span>
          <h1>This cake isn’t available right now.</h1>
          <p>Take a look at the rest of the collection.</p>
          <a href="#shop" class="wb-button wb-button--primary">Back to the collection</a>
        </div>
      </section>
    `;
  }

  render() {
    const sizeOptions = [
      { id: '0.5lb', label: '½ lb', servings: '2–4 servings' },
      { id: '1lb', label: '1 lb', servings: '6–8 servings' },
      { id: '3lb', label: '3 lb', servings: '16–22 servings' }
    ];
    const sizeMultiplier = this.selectedSize === '3lb' ? 1.5 : (this.selectedSize === '0.5lb' ? 0.6 : 1.0);
    const computedPrice = this.cake.price * sizeMultiplier * this.selectedPortion;

    this.container.innerHTML = `
      <section class="wb-detail" aria-labelledby="detail-title">
        <div class="wb-page-width">
          <nav class="wb-detail__breadcrumb" aria-label="Breadcrumb">
            <a href="#home">Home</a><span aria-hidden="true">/</span>
            <a href="#shop">The collection</a><span aria-hidden="true">/</span>
            <span aria-current="page">${this.cake.title}</span>
          </nav>

          <div class="wb-detail__layout">
            <figure class="wb-detail__gallery">
              <img id="main-cake-img" src="${this.cake.image}" alt="${this.cake.title}" fetchpriority="high" decoding="async" />
              ${this.cake.badge ? `<figcaption class="wb-product-card__badge">${this.cake.badge}</figcaption>` : ''}
              <div class="wb-detail__image-caption"><span>WISHBAKE · THE COLLECTION</span><strong>Made for the table.</strong></div>
            </figure>

            <div class="wb-detail__order-panel">
              <p class="wb-eyebrow">${this.cake.category}</p>
              <h1 id="detail-title">${this.cake.title}</h1>
              <div class="wb-detail__rating"><span aria-hidden="true">★</span><strong>${this.cake.rating}</strong><span>(${this.cake.reviews} reviews)</span></div>
              <p class="wb-detail__description">${this.cake.description}</p>

              <div class="wb-detail__fact-row">
                <div><span>Portion guide</span><strong>Serves ${this.cake.servings}</strong></div>
                <div><span>Prepared</span><strong>To order</strong></div>
              </div>

              <div class="wb-detail__choice-block">
                <div class="wb-detail__label-row"><span class="wb-detail__label">Choose a size</span><span class="wb-detail__label-note">Portion guide varies by cake</span></div>
                <div class="wb-detail__sizes">
                  ${sizeOptions.map(size => `
                    <button type="button" data-size="${size.id}" aria-pressed="${this.selectedSize === size.id}" class="wb-detail__size ${this.selectedSize === size.id ? 'is-selected' : ''}">
                      <strong>${size.label}</strong><span>${size.servings}</span>
                    </button>
                  `).join('')}
                </div>
              </div>

              <div class="wb-detail__quantity-row">
                <span class="wb-detail__label">Quantity</span>
                <div class="wb-quantity" aria-label="Quantity">
                  <button type="button" id="detail-qty-dec" aria-label="Decrease quantity" ${this.selectedPortion === 1 ? 'disabled' : ''}>−</button>
                  <span id="detail-qty-val" aria-live="polite">${this.selectedPortion}</span>
                  <button type="button" id="detail-qty-inc" aria-label="Increase quantity">+</button>
                </div>
              </div>

              <div class="wb-detail__price-row">
                <div><span>Price for this selection</span><strong id="detail-calculated-price">₹${Math.round(computedPrice).toLocaleString('en-IN')}</strong></div>
                <span class="wb-detail__delivery-note"><span class="material-symbols-outlined" aria-hidden="true">ac_unit</span> Chilled delivery</span>
              </div>

              <div class="wb-detail__actions">
                <button id="detail-add-cart-btn" class="wb-button wb-button--primary" type="button"><span class="material-symbols-outlined" aria-hidden="true">shopping_bag</span>Add to bag</button>
                <button id="detail-customize-3d-btn" class="wb-button wb-button--outline" type="button"><span class="material-symbols-outlined" aria-hidden="true">view_in_ar</span>Customise in 3D</button>
              </div>
              <p class="wb-detail__footnote">For custom designs, use the cake studio to choose flavours, tiers, and finishing details.</p>
            </div>
          </div>
        </div>
      </section>
    `;

    this.attachEvents();
  }

  attachEvents() {
    this.container.querySelectorAll('.wb-detail__size').forEach(button => {
      button.addEventListener('click', event => {
        this.selectedSize = event.currentTarget.dataset.size;
        this.render();
      });
    });

    this.container.querySelector('#detail-qty-dec')?.addEventListener('click', () => {
      if (this.selectedPortion > 1) {
        this.selectedPortion--;
        this.render();
      }
    });
    this.container.querySelector('#detail-qty-inc')?.addEventListener('click', () => {
      this.selectedPortion++;
      this.render();
    });

    this.container.querySelector('#detail-customize-3d-btn')?.addEventListener('click', () => {
      if (this.onCustomizeSimilar) this.onCustomizeSimilar(this.cake);
    });
    this.container.querySelector('#detail-add-cart-btn')?.addEventListener('click', () => {
      const sizeMultiplier = this.selectedSize === '3lb' ? 1.5 : (this.selectedSize === '0.5lb' ? 0.6 : 1.0);
      if (this.onAddToCart) {
        this.onAddToCart({
          item_type: 'preset',
          cake_id: this.cake.id,
          title: `${this.cake.title} (${this.selectedSize})`,
          quantity: this.selectedPortion,
          unit_price: this.cake.price * sizeMultiplier
        });
      }
    });
  }
}
