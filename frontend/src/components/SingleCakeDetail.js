import { apiUrl } from '../services/api.js';

export class SingleCakeDetail {
  constructor(containerElement, cakeId, onAddToCartCallback, onCustomizeSimilarCallback) {
    this.container = containerElement;
    this.cakeId = cakeId;
    this.onAddToCart = onAddToCartCallback;
    this.onCustomizeSimilar = onCustomizeSimilarCallback;

    this.cake = null;
    this.selectedPortion = 1; // multiplier
    this.selectedSize = '1lb';
    this.init();
  }

  async init() {
    this.renderSkeleton();
    await this.fetchCakeDetail();
    if (this.cake) {
      this.render();
    } else {
      this.renderError();
    }
  }

  async fetchCakeDetail() {
    try {
      const res = await fetch(apiUrl(`/api/cakes/${this.cakeId}`));
      const data = await res.json();
      if (data.status === 'success') {
        this.cake = data.data;
      }
    } catch (e) {
      console.warn('Error fetching cake details from API', e);
    }
  }

  renderSkeleton() {
    this.container.innerHTML = `
      <section class="max-w-6xl mx-auto px-6 py-12">
        <div class="animate-pulse grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div class="h-96 bg-surface-container rounded-3xl"></div>
          <div class="space-y-4">
            <div class="h-8 bg-surface-container rounded-full w-2/3"></div>
            <div class="h-4 bg-surface-container rounded-full w-1/3"></div>
            <div class="h-24 bg-surface-container rounded-2xl"></div>
          </div>
        </div>
      </section>
    `;
  }

  renderError() {
    this.container.innerHTML = `
      <section class="max-w-4xl mx-auto px-6 py-16 text-center">
        <span class="material-symbols-outlined text-primary text-5xl mb-2">error</span>
        <h2 class="font-display text-2xl font-bold text-on-surface">Cake Not Found</h2>
        <p class="text-xs text-on-surface-variant mt-2">The creation you are looking for is unavailable.</p>
        <a href="#shop" class="mt-6 inline-block bg-primary text-white text-xs font-bold px-6 py-3 rounded-full">Back to Shop</a>
      </section>
    `;
  }

  render() {
    const computedPrice = this.cake.price * (this.selectedSize === '3lb' ? 1.5 : (this.selectedSize === '0.5lb' ? 0.6 : 1.0)) * this.selectedPortion;

    this.container.innerHTML = `
      <section class="max-w-6xl mx-auto px-6 py-10">
        
        <!-- Breadcrumbs -->
        <div class="flex items-center gap-2 text-xs text-on-surface-variant mb-6">
          <a href="#home" class="hover:text-primary">Home</a>
          <span>/</span>
          <a href="#shop" class="hover:text-primary">Shop Creations</a>
          <span>/</span>
          <span class="text-on-surface font-bold">${this.cake.title}</span>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          <!-- Left Column: Large Image Gallery (7 cols) -->
          <div class="lg:col-span-7 bg-white p-4 rounded-3xl shadow-xl border border-outline-variant/40 relative">
            <div class="relative h-[480px] rounded-2xl overflow-hidden bg-surface-container-low">
              <img id="main-cake-img" src="${this.cake.image}" alt="${this.cake.title}" class="w-full h-full object-cover" />
              
              ${this.cake.badge ? `
                <span class="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-primary text-xs font-bold px-4 py-1.5 rounded-full shadow-sm border border-primary/20">
                  ${this.cake.badge}
                </span>
              ` : ''}
            </div>

            <!-- Thumbnail Badges -->
            <div class="grid grid-cols-3 gap-3 mt-4">
              <div class="bg-surface-container p-3 rounded-2xl text-center border border-outline-variant/30">
                <span class="material-symbols-outlined text-primary text-xl">groups</span>
                <span class="text-xs text-on-surface-variant block font-medium mt-1">Serves ${this.cake.servings}</span>
              </div>
              <div class="bg-surface-container p-3 rounded-2xl text-center border border-outline-variant/30">
                <span class="material-symbols-outlined text-amber-500 text-xl" style="font-variation-settings: 'FILL' 1;">star</span>
                <span class="text-xs text-on-surface-variant block font-medium mt-1">${this.cake.rating} / 5.0 (${this.cake.reviews})</span>
              </div>
              <div class="bg-surface-container p-3 rounded-2xl text-center border border-outline-variant/30">
                <span class="material-symbols-outlined text-green-600 text-xl">eco</span>
                <span class="text-xs text-on-surface-variant block font-medium mt-1">100% Artisanal</span>
              </div>
            </div>
          </div>

          <!-- Right Column: Interactive Details & Order Options (5 cols) -->
          <div class="lg:col-span-5 bg-white p-6 rounded-3xl shadow-xl border border-outline-variant/40 space-y-6">
            
            <div>
              <span class="text-xs font-bold text-primary uppercase tracking-wider">${this.cake.category}</span>
              <h1 class="font-display font-bold text-3xl text-on-surface mt-1">${this.cake.title}</h1>
              <p class="text-xs text-on-surface-variant leading-relaxed mt-3">${this.cake.description}</p>
            </div>

            <!-- Size Selector -->
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-on-surface mb-2">Select Cake Size</label>
              <div class="grid grid-cols-3 gap-2">
                ${[{id: '0.5lb', label: '½ lb', desc: '2-4 Servings'}, {id: '1lb', label: '1 lb', desc: '6-8 Servings'}, {id: '3lb', label: '3 lb', desc: '16-22 Servings'}].map(sz => `
                  <button type="button" data-size="${sz.id}" class="detail-size-btn p-3 rounded-2xl border text-center transition-all ${this.selectedSize === sz.id ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs' : 'border-outline-variant text-on-surface hover:bg-surface-container'}">
                    <div class="text-sm font-bold">${sz.label}</div>
                    <div class="text-[10px] text-on-surface-variant">${sz.desc}</div>
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- Quantity Selector -->
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-on-surface mb-2">Quantity</label>
              <div class="flex items-center gap-4 bg-surface-container w-max px-4 py-2 rounded-full border border-outline-variant">
                <button id="detail-qty-dec" class="font-bold text-lg text-on-surface hover:text-primary">-</button>
                <span id="detail-qty-val" class="font-bold text-base px-2">${this.selectedPortion}</span>
                <button id="detail-qty-inc" class="font-bold text-lg text-on-surface hover:text-primary">+</button>
              </div>
            </div>

            <!-- Ingredients & Storage Note -->
            <div class="bg-surface-container p-4 rounded-2xl border border-outline-variant/40 space-y-2 text-xs">
              <div class="font-bold text-on-surface flex items-center gap-1.5">
                <span class="material-symbols-outlined text-primary text-base">restaurant</span>
                <span>Craft Ingredients</span>
              </div>
              <p class="text-on-surface-variant">Kashmiri saffron, Valrhona dark chocolate ganache, French butter, organic rose petals, and 24k edible gold leaf.</p>
            </div>

            <!-- Price & Actions Bar -->
            <div class="pt-4 border-t border-outline-variant/40 space-y-3">
              <div class="flex justify-between items-baseline">
                <span class="text-xs text-on-surface-variant">Calculated Total</span>
                <span id="detail-calculated-price" class="font-display font-bold text-3xl text-primary">₹${Math.round(computedPrice).toLocaleString('en-IN')}</span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button id="detail-customize-3d-btn" class="py-3.5 px-4 rounded-full border border-primary text-primary font-bold text-xs hover:bg-primary/10 transition-colors flex items-center justify-center gap-2">
                  <span class="material-symbols-outlined text-base">view_in_ar</span>
                  <span>Customize in 3D</span>
                </button>
                <button id="detail-add-cart-btn" class="bg-primary text-white py-3.5 px-4 rounded-full font-bold text-xs shadow-md hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
                  <span class="material-symbols-outlined text-base">shopping_bag</span>
                  <span>Add to Order Bag</span>
                </button>
              </div>
            </div>

          </div>

        </div>
      </section>
    `;

    this.attachEvents();
  }

  attachEvents() {
    // Size selection
    this.container.querySelectorAll('.detail-size-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.selectedSize = e.currentTarget.dataset.size;
        this.render();
      });
    });

    // Quantity selectors
    const decBtn = this.container.querySelector('#detail-qty-dec');
    const incBtn = this.container.querySelector('#detail-qty-inc');

    if (decBtn) {
      decBtn.addEventListener('click', () => {
        if (this.selectedPortion > 1) {
          this.selectedPortion--;
          this.render();
        }
      });
    }

    if (incBtn) {
      incBtn.addEventListener('click', () => {
        this.selectedPortion++;
        this.render();
      });
    }

    // Customize similar in 3D
    const cust3dBtn = this.container.querySelector('#detail-customize-3d-btn');
    if (cust3dBtn) {
      cust3dBtn.addEventListener('click', () => {
        if (this.onCustomizeSimilar) this.onCustomizeSimilar(this.cake);
      });
    }

    // Add to cart
    const addCartBtn = this.container.querySelector('#detail-add-cart-btn');
    if (addCartBtn) {
      addCartBtn.addEventListener('click', () => {
        const computedPrice = this.cake.price * (this.selectedSize === '3lb' ? 1.5 : (this.selectedSize === '0.5lb' ? 0.6 : 1.0));
        if (this.onAddToCart) {
          this.onAddToCart({
            item_type: 'preset',
            cake_id: this.cake.id,
            title: `${this.cake.title} (${this.selectedSize})`,
            quantity: this.selectedPortion,
            unit_price: computedPrice
          });
        }
      });
    }
  }
}
