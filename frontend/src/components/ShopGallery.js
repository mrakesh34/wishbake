import { apiUrl } from '../services/api.js';

export class ShopGallery {
  constructor(containerElement, onAddToCartCallback, onCustomizeSimilarCallback, onOpenDetailCallback) {
    this.container = containerElement;
    this.onAddToCart = onAddToCartCallback;
    this.onCustomizeSimilar = onCustomizeSimilarCallback;
    this.onOpenDetail = onOpenDetailCallback;

    this.cakes = [];
    this.currentCategory = "All";
    this.searchQuery = "";

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

      const res = await fetch(apiUrl(endpoint));
      const data = await res.json();
      if (data.status === 'success') {
        this.cakes = data.data;
      }
    } catch (e) {
      console.warn('Fallback catalog cakes loading', e);
    }
  }

  renderSkeleton() {
    this.container.innerHTML = `
      <section class="max-w-7xl mx-auto px-6 py-12">
        <div class="animate-pulse space-y-6">
          <div class="h-8 bg-surface-container rounded-full w-48 mx-auto"></div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div class="h-80 bg-surface-container rounded-3xl"></div>
            <div class="h-80 bg-surface-container rounded-3xl"></div>
            <div class="h-80 bg-surface-container rounded-3xl"></div>
          </div>
        </div>
      </section>
    `;
  }

  render() {
    const categories = ["All", "Diwali Special", "Birthday", "Weddings & Galas", "Anniversary"];

    this.container.innerHTML = `
      <section class="max-w-7xl mx-auto px-6 py-12">
        
        <div class="text-center max-w-2xl mx-auto mb-10">
          <span class="bg-primary/10 text-primary text-xs uppercase font-bold tracking-widest px-4 py-1.5 rounded-full inline-block mb-3">Artisanal Gallery</span>
          <h1 class="font-display text-4xl font-bold text-on-surface">Shop Our Signature Creations</h1>
          <p class="text-on-surface-variant text-sm mt-2">Explore our collection of handcrafted, high-end pastry creations ready for your celebration or as inspiration for your own 3D custom cake.</p>
        </div>

        <div class="flex flex-col md:flex-row items-center justify-between gap-4 mb-10 pb-6 border-b border-outline-variant/30">
          <div class="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            ${categories.map(cat => `
              <button data-category="${cat}" class="cat-tab-btn whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all ${this.currentCategory === cat ? 'bg-primary text-white shadow-md' : 'bg-white text-on-surface-variant border border-outline-variant hover:bg-surface-container'}">
                ${cat}
              </button>
            `).join('')}
          </div>

          <div class="relative w-full md:w-72">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
            <input type="text" id="shop-search-input" value="${this.searchQuery}" placeholder="Search flavors, styles..." class="w-full pl-10 pr-4 py-2 text-xs rounded-full border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-white" />
          </div>
        </div>

        ${this.cakes.length === 0 ? `
          <div class="text-center py-16 bg-white rounded-3xl border border-outline-variant/40">
            <span class="material-symbols-outlined text-primary text-5xl mb-2">cake</span>
            <h3 class="font-display text-xl font-bold text-on-surface">No Creations Found</h3>
            <p class="text-xs text-on-surface-variant mt-1">Try adjusting your search criteria or explore another category tab.</p>
          </div>
        ` : `
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            ${this.cakes.map(cake => this.renderCakeCard(cake)).join('')}
          </div>
        `}

      </section>
    `;

    this.attachEvents();
  }

  renderCakeCard(cake) {
    return `
      <div class="bg-white rounded-3xl overflow-hidden shadow-lg border border-outline-variant/40 group hover:shadow-2xl transition-all duration-300 flex flex-col justify-between">
        
        <div class="relative h-64 overflow-hidden bg-surface-container-low cursor-pointer open-detail-btn" data-id="${cake.id}">
          <img src="${cake.image}" alt="${cake.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          
          ${cake.badge ? `
            <span class="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-primary text-xs font-bold px-3 py-1 rounded-full shadow-xs border border-primary/20">
              ${cake.badge}
            </span>
          ` : ''}

          <div class="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm text-on-surface text-xs font-bold px-3 py-1 rounded-full shadow-xs flex items-center gap-1">
            <span class="material-symbols-outlined text-amber-500 text-sm" style="font-variation-settings: 'FILL' 1;">star</span>
            <span>${cake.rating} (${cake.reviews})</span>
          </div>
        </div>

        <div class="p-6 flex-grow flex flex-col justify-between space-y-4">
          <div>
            <div class="text-xs font-bold text-primary uppercase tracking-wider mb-1">${cake.category}</div>
            <h3 class="font-display font-bold text-xl text-on-surface group-hover:text-primary transition-colors cursor-pointer open-detail-btn" data-id="${cake.id}">${cake.title}</h3>
            <p class="text-xs text-on-surface-variant line-clamp-2 mt-2 leading-relaxed">${cake.description}</p>
          </div>

          <div class="pt-4 border-t border-outline-variant/30 flex items-center justify-between">
            <div>
              <span class="text-[10px] text-on-surface-variant block uppercase font-bold">Price</span>
              <span class="font-display font-bold text-2xl text-primary">₹${cake.price.toLocaleString('en-IN')}</span>
            </div>

            <div class="flex gap-2">
              <button data-id="${cake.id}" class="customize-similar-btn p-2.5 rounded-full border border-primary/30 text-primary hover:bg-primary/10 transition-colors" title="Customize Similar in 3D">
                <span class="material-symbols-outlined text-lg">view_in_ar</span>
              </button>
              <button data-id="${cake.id}" class="add-preset-cart-btn bg-primary text-white px-4 py-2.5 rounded-full font-bold text-xs shadow-md hover:bg-primary/90 transition-all flex items-center gap-1">
                <span class="material-symbols-outlined text-sm">shopping_bag</span>
                <span>Add</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    `;
  }

  attachEvents() {
    this.container.querySelectorAll('.cat-tab-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        this.currentCategory = e.currentTarget.dataset.category;
        await this.fetchCakes();
        this.render();
      });
    });

    const searchInput = this.container.querySelector('#shop-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', async (e) => {
        this.searchQuery = e.target.value;
        await this.fetchCakes();
        this.render();
      });
    }

    this.container.querySelectorAll('.add-preset-cart-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const cake = this.cakes.find(c => c.id === id);
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

    this.container.querySelectorAll('.customize-similar-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const cake = this.cakes.find(c => c.id === id);
        if (cake && this.onCustomizeSimilar) {
          this.onCustomizeSimilar(cake);
        }
      });
    });

    this.container.querySelectorAll('.open-detail-btn').forEach(el => {
      el.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        if (this.onOpenDetail) {
          this.onOpenDetail(id);
        } else {
          window.location.hash = `#cake-detail?id=${id}`;
        }
      });
    });
  }
}
