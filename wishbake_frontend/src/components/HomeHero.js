import { Cake3DViewer } from './Cake3DViewer.js';
import { ScrollAnimator } from './ScrollAnimator.js';
import { apiUrl } from '../services/api.js';

export class HomeHero {
  constructor(containerElement, onStartCustomizingCallback, onExploreCollectionCallback) {
    this.container = containerElement;
    this.onStartCustomizing = onStartCustomizingCallback;
    this.onExploreCollection = onExploreCollectionCallback;
    this.viewer = null;
    this.scrollAnimator = null;

    this.render();
  }

  render() {
    this.container.innerHTML = `

      <!-- ═══════ SECTION 1: Hero with 3D Cake ═══════ -->
      <section class="relative min-h-screen flex items-center overflow-hidden px-6 py-20">
        <!-- Decorative Orbs -->
        <div class="hero-orb hero-orb-1"></div>
        <div class="hero-orb hero-orb-2"></div>
        <div class="hero-orb hero-orb-3"></div>

        <div class="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">

          <!-- Left: Hero Copy -->
          <div class="flex flex-col gap-6 text-center lg:text-left">
            <span class="scroll-reveal bg-primary/10 text-primary text-[11px] uppercase font-bold tracking-[0.2em] px-5 py-2 rounded-full inline-flex items-center gap-2 w-max mx-auto lg:mx-0">
              <span class="material-symbols-outlined text-sm" style="font-variation-settings: 'FILL' 1;">auto_awesome</span>
              Haute Confectionery & 3D Studio
            </span>

            <h1 class="scroll-reveal delay-100 font-display text-4xl sm:text-5xl lg:text-[3.5rem] xl:text-6xl font-bold text-on-surface leading-[1.1] tracking-tight">
              Your Dream Cake,<br/>
              <span class="gradient-text italic">Brought to Life.</span>
            </h1>

            <p class="scroll-reveal delay-200 text-on-surface-variant text-base lg:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Experience the art of digital indulgence. Customize your celebration centerpiece with our
              <strong class="text-primary">real-time interactive 3D studio</strong>, delivered fresh from our master kitchen to your door.
            </p>

            <div class="scroll-reveal delay-300 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mt-2">
              <button id="hero-customizer-btn" class="group bg-primary text-white font-bold py-4 px-8 rounded-full hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-primary/30 flex items-center justify-center gap-2.5">
                <span>Start 3D Customizer</span>
                <span class="material-symbols-outlined text-lg group-hover:rotate-12 transition-transform">view_in_ar</span>
              </button>
              <button id="hero-explore-btn" class="bg-white/80 backdrop-blur-sm text-primary font-bold py-4 px-8 rounded-full hover:bg-white transition-all duration-300 border border-primary/20 flex items-center justify-center gap-2 shadow-sm">
                <span>Explore Creations</span>
                <span class="material-symbols-outlined text-lg">arrow_forward</span>
              </button>
            </div>

            <!-- Trust Badges -->
            <div class="scroll-reveal delay-400 pt-6 border-t border-outline-variant/30 flex items-center justify-center lg:justify-start gap-6 lg:gap-8 text-xs text-on-surface-variant font-medium">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-primary text-xl" style="font-variation-settings: 'FILL' 1;">verified</span>
                <span>Artisanal Ingredients</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-primary text-xl" style="font-variation-settings: 'FILL' 1;">local_shipping</span>
                <span>Chilled Delivery</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-amber-500 text-xl" style="font-variation-settings: 'FILL' 1;">star</span>
                <span>4.9 Star Rating</span>
              </div>
            </div>
          </div>

          <!-- Right: 3D Cake Viewer -->
          <div class="scroll-reveal-scale delay-200 relative flex items-center justify-center">
            <div class="animated-border w-full max-w-lg">
              <div id="hero-3d-viewer" class="three-canvas-container h-[420px] lg:h-[480px] w-full rounded-3xl relative bg-white">
                <!-- Three.js mounts here -->

                <!-- Floating Labels -->
                <div class="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-sm text-xs font-bold text-primary flex items-center gap-1.5 border border-primary/20 pointer-events-none float-badge">
                  <span class="material-symbols-outlined text-base">view_in_ar</span>
                  <span>Live 3D Preview</span>
                </div>

                <div class="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-white/90 backdrop-blur-sm px-5 py-1.5 rounded-full shadow-md text-xs font-medium text-on-surface-variant flex items-center gap-2 border border-outline-variant pointer-events-none">
                  <span class="material-symbols-outlined text-primary text-base">360</span>
                  <span>Drag to rotate 360°</span>
                </div>
              </div>
            </div>

            <!-- Floating Price Badge -->
            <div class="absolute -bottom-3 -right-2 lg:bottom-4 lg:-right-4 z-20 glass-card px-5 py-3 rounded-2xl float-badge-slow">
              <span class="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold block">Starting from</span>
              <span class="font-display font-bold text-2xl text-primary">$45</span>
            </div>
          </div>

        </div>

        <!-- Scroll Hint -->
        <div class="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10">
          <span class="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Scroll to explore</span>
          <span class="material-symbols-outlined text-primary text-xl scroll-hint-chevron">expand_more</span>
        </div>
      </section>

      <!-- ═══════ SECTION 2: Stats Counter ═══════ -->
      <section class="py-16 px-6 bg-surface-container-lowest">
        <div class="section-divider max-w-4xl mx-auto mb-16"></div>
        <div class="max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6">

          <div class="scroll-reveal text-center p-6 glass-card rounded-3xl">
            <span class="font-display font-bold text-4xl text-primary counter-value" data-counter-target="500" data-counter-suffix="+">0</span>
            <span class="text-xs text-on-surface-variant block mt-2 font-medium">Custom Cakes Crafted</span>
          </div>

          <div class="scroll-reveal delay-100 text-center p-6 glass-card rounded-3xl">
            <div class="flex items-center justify-center gap-1">
              <span class="font-display font-bold text-4xl text-primary counter-value" data-counter-target="4" data-counter-suffix=".9">0</span>
              <span class="material-symbols-outlined text-amber-500 text-2xl mt-1" style="font-variation-settings: 'FILL' 1;">star</span>
            </div>
            <span class="text-xs text-on-surface-variant block mt-2 font-medium">Customer Rating</span>
          </div>

          <div class="scroll-reveal delay-200 text-center p-6 glass-card rounded-3xl">
            <span class="font-display font-bold text-4xl text-primary">24K</span>
            <span class="text-xs text-on-surface-variant block mt-2 font-medium">Certified Edible Gold</span>
          </div>

          <div class="scroll-reveal delay-300 text-center p-6 glass-card rounded-3xl">
            <span class="font-display font-bold text-4xl text-primary counter-value" data-counter-target="100" data-counter-suffix="%">0</span>
            <span class="text-xs text-on-surface-variant block mt-2 font-medium">Freshly Baked Daily</span>
          </div>

        </div>
      </section>

      <!-- ═══════ SECTION 3: How It Works ═══════ -->
      <section class="py-20 px-6 bg-surface-container-low relative overflow-hidden">
        <div class="max-w-7xl mx-auto">
          <div class="scroll-reveal text-center max-w-2xl mx-auto mb-14">
            <span class="bg-primary/10 text-primary text-[11px] uppercase font-bold tracking-[0.2em] px-4 py-1.5 rounded-full inline-block mb-3">How It Works</span>
            <h2 class="font-display text-3xl lg:text-4xl font-bold text-on-surface">Three Steps to Your<br/><span class="gradient-text">Perfect Centerpiece</span></h2>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">

            <div class="scroll-reveal delay-100 tilt-card glass-card rounded-3xl p-8 text-center relative">
              <div class="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-primary text-white font-bold flex items-center justify-center text-sm shadow-lg">01</div>
              <div class="feature-icon-wrapper w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-5">
                <span class="material-symbols-outlined text-primary text-3xl" style="font-variation-settings: 'FILL' 1;">palette</span>
              </div>
              <h3 class="font-display font-bold text-xl text-on-surface mb-2">Design</h3>
              <p class="text-xs text-on-surface-variant leading-relaxed">Choose your tiers, shape, and size. Pick from round, square, or hexagon foundations.</p>
            </div>

            <div class="scroll-reveal delay-300 tilt-card glass-card rounded-3xl p-8 text-center relative">
              <div class="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-primary text-white font-bold flex items-center justify-center text-sm shadow-lg">02</div>
              <div class="feature-icon-wrapper w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-5">
                <span class="material-symbols-outlined text-primary text-3xl" style="font-variation-settings: 'FILL' 1;">brush</span>
              </div>
              <h3 class="font-display font-bold text-xl text-on-surface mb-2">Customize</h3>
              <p class="text-xs text-on-surface-variant leading-relaxed">Select artisanal flavors, icing colors, luxury toppings, and custom inscriptions in real-time 3D.</p>
            </div>

            <div class="scroll-reveal delay-500 tilt-card glass-card rounded-3xl p-8 text-center relative">
              <div class="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-primary text-white font-bold flex items-center justify-center text-sm shadow-lg">03</div>
              <div class="feature-icon-wrapper w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-5">
                <span class="material-symbols-outlined text-primary text-3xl" style="font-variation-settings: 'FILL' 1;">local_shipping</span>
              </div>
              <h3 class="font-display font-bold text-xl text-on-surface mb-2">Deliver</h3>
              <p class="text-xs text-on-surface-variant leading-relaxed">Chilled hand-delivery to your doorstep. Our master chefs bring your 3D design to life.</p>
            </div>

          </div>
        </div>
      </section>

      <!-- ═══════ SECTION 4: Featured Creations ═══════ -->
      <section class="py-20 px-6 bg-surface-container-lowest">
        <div class="max-w-7xl mx-auto">
          <div class="scroll-reveal flex flex-col md:flex-row items-center justify-between gap-4 mb-10">
            <div>
              <span class="bg-primary/10 text-primary text-[11px] uppercase font-bold tracking-[0.2em] px-4 py-1.5 rounded-full inline-block mb-3">Artisanal Gallery</span>
              <h2 class="font-display text-3xl lg:text-4xl font-bold text-on-surface">Signature Creations</h2>
            </div>
            <button id="hero-view-all-btn" class="text-primary font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all">
              <span>View All Creations</span>
              <span class="material-symbols-outlined text-base">arrow_forward</span>
            </button>
          </div>

          <div id="featured-cakes-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <!-- Populated dynamically -->
          </div>
        </div>
      </section>

      <!-- ═══════ SECTION 5: Occasion Collections ═══════ -->
      <section class="py-20 px-6 bg-surface-container-low">
        <div class="max-w-7xl mx-auto">
          <div class="scroll-reveal text-center max-w-2xl mx-auto mb-12">
            <span class="bg-primary/10 text-primary text-[11px] uppercase font-bold tracking-[0.2em] px-4 py-1.5 rounded-full inline-block mb-3">Browse by Occasion</span>
            <h2 class="font-display text-3xl lg:text-4xl font-bold text-on-surface">Occasion Collections</h2>
            <p class="text-on-surface-variant text-sm mt-2">Select a category to jumpstart your custom design or order a signature creation.</p>
          </div>

          <div class="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="scroll-reveal delay-100 cat-card glass-card p-6 rounded-3xl cursor-pointer text-center group" data-category="Diwali Special">
              <div class="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-600 group-hover:scale-110 transition-transform duration-300">
                <span class="material-symbols-outlined text-3xl" style="font-variation-settings: 'FILL' 1;">auto_awesome</span>
              </div>
              <h3 class="font-display font-bold text-lg text-on-surface">Diwali Specials</h3>
              <p class="text-xs text-on-surface-variant mt-2 leading-relaxed">Saffron, cardamom, gulab jamun fusion & edible gold leaf.</p>
            </div>

            <div class="scroll-reveal delay-200 cat-card glass-card p-6 rounded-3xl cursor-pointer text-center group" data-category="Birthday">
              <div class="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-4 text-primary group-hover:scale-110 transition-transform duration-300">
                <span class="material-symbols-outlined text-3xl" style="font-variation-settings: 'FILL' 1;">cake</span>
              </div>
              <h3 class="font-display font-bold text-lg text-on-surface">Birthday Celebration</h3>
              <p class="text-xs text-on-surface-variant mt-2 leading-relaxed">Vibrant multi-tiered cakes with customizable sprinkles and toppers.</p>
            </div>

            <div class="scroll-reveal delay-300 cat-card glass-card p-6 rounded-3xl cursor-pointer text-center group" data-category="Weddings & Galas">
              <div class="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-600 group-hover:scale-110 transition-transform duration-300">
                <span class="material-symbols-outlined text-3xl" style="font-variation-settings: 'FILL' 1;">diamond</span>
              </div>
              <h3 class="font-display font-bold text-lg text-on-surface">Weddings & Galas</h3>
              <p class="text-xs text-on-surface-variant mt-2 leading-relaxed">Grand 3-tier showstoppers with hand-piped pearl trims & fresh florals.</p>
            </div>

            <div class="scroll-reveal delay-400 cat-card glass-card p-6 rounded-3xl cursor-pointer text-center group" data-category="Anniversary">
              <div class="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600 group-hover:scale-110 transition-transform duration-300">
                <span class="material-symbols-outlined text-3xl" style="font-variation-settings: 'FILL' 1;">favorite</span>
              </div>
              <h3 class="font-display font-bold text-lg text-on-surface">Anniversary Elegance</h3>
              <p class="text-xs text-on-surface-variant mt-2 leading-relaxed">Persian rose water, dark chocolate ganache, and romantic flourishes.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- ═══════ SECTION 6: Testimonials ═══════ -->
      <section class="py-20 px-6 bg-surface-container-lowest">
        <div class="max-w-7xl mx-auto">
          <div class="scroll-reveal text-center max-w-2xl mx-auto mb-12">
            <span class="bg-primary/10 text-primary text-[11px] uppercase font-bold tracking-[0.2em] px-4 py-1.5 rounded-full inline-block mb-3">Loved by Clients</span>
            <h2 class="font-display text-3xl lg:text-4xl font-bold text-on-surface">What Our Clients Say</h2>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div class="scroll-reveal delay-100 glass-card rounded-3xl p-6 relative">
              <span class="quote-mark">"</span>
              <div class="flex items-center gap-1 mb-3 mt-4">
                ${Array(5).fill('<span class="material-symbols-outlined text-amber-500 text-sm" style="font-variation-settings: \'FILL\' 1;">star</span>').join('')}
              </div>
              <p class="text-sm text-on-surface-variant leading-relaxed mb-4">"The 3D customizer is absolutely magical! I designed a 2-tier saffron cake for Diwali and it arrived looking exactly like the preview. Pure art."</p>
              <div class="flex items-center gap-3 pt-3 border-t border-outline-variant/30">
                <div class="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">PM</div>
                <div>
                  <span class="font-bold text-xs text-on-surface block">Priya Mehta</span>
                  <span class="text-[10px] text-on-surface-variant">Diwali Special Order</span>
                </div>
              </div>
            </div>

            <div class="scroll-reveal delay-300 glass-card rounded-3xl p-6 relative">
              <span class="quote-mark">"</span>
              <div class="flex items-center gap-1 mb-3 mt-4">
                ${Array(5).fill('<span class="material-symbols-outlined text-amber-500 text-sm" style="font-variation-settings: \'FILL\' 1;">star</span>').join('')}
              </div>
              <p class="text-sm text-on-surface-variant leading-relaxed mb-4">"Used the hexagon modern theme for our wedding. The 24K gold leaf accents were stunning. Guests couldn't believe it was real!"</p>
              <div class="flex items-center gap-3 pt-3 border-t border-outline-variant/30">
                <div class="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">EV</div>
                <div>
                  <span class="font-bold text-xs text-on-surface block">Eleanor Vance</span>
                  <span class="text-[10px] text-on-surface-variant">Wedding 3-Tier Custom</span>
                </div>
              </div>
            </div>

            <div class="scroll-reveal delay-500 glass-card rounded-3xl p-6 relative">
              <span class="quote-mark">"</span>
              <div class="flex items-center gap-1 mb-3 mt-4">
                ${Array(5).fill('<span class="material-symbols-outlined text-amber-500 text-sm" style="font-variation-settings: \'FILL\' 1;">star</span>').join('')}
              </div>
              <p class="text-sm text-on-surface-variant leading-relaxed mb-4">"Ordered the Royal Gulab Jamun Cheesecake for my mom's birthday. Chilled delivery arrived on time. Best bakery experience ever!"</p>
              <div class="flex items-center gap-3 pt-3 border-t border-outline-variant/30">
                <div class="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">RS</div>
                <div>
                  <span class="font-bold text-xs text-on-surface block">Ravi Sharma</span>
                  <span class="text-[10px] text-on-surface-variant">Birthday Preset Order</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ═══════ SECTION 7: CTA Banner ═══════ -->
      <section class="scroll-reveal py-20 px-6">
        <div class="max-w-4xl mx-auto cta-gradient rounded-3xl p-12 lg:p-16 text-center text-white relative overflow-hidden">
          <!-- Decorative circles -->
          <div class="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div class="absolute bottom-0 left-0 w-60 h-60 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

          <span class="material-symbols-outlined text-5xl mb-4 opacity-80" style="font-variation-settings: 'FILL' 1;">view_in_ar</span>
          <h2 class="font-display text-3xl lg:text-4xl font-bold mb-4 relative z-10">Ready to Design Your Masterpiece?</h2>
          <p class="text-sm text-white/80 mb-8 max-w-xl mx-auto relative z-10">Open our real-time 3D customizer and build your dream cake from scratch. Choose every detail — from tiers to toppings.</p>
          <button id="hero-cta-customizer-btn" class="bg-white text-primary font-bold py-4 px-10 rounded-full hover:scale-105 transition-all duration-300 shadow-xl text-sm flex items-center gap-2 mx-auto relative z-10">
            <span>Launch 3D Studio</span>
            <span class="material-symbols-outlined text-lg">arrow_forward</span>
          </button>
        </div>
      </section>
    `;

    this.mountViewer();
    this.loadFeaturedCakes();
    this.attachEvents();

    // Initialize scroll animations after a brief delay to let the DOM settle
    requestAnimationFrame(() => {
      this.scrollAnimator = new ScrollAnimator();
      this.scrollAnimator.observeElements(this.container);
      this.scrollAnimator.observeCounters(this.container);
    });
  }

  /**
   * Mount the Three.js 3D cake viewer in the hero section
   */
  mountViewer() {
    const viewerContainer = this.container.querySelector('#hero-3d-viewer');
    if (viewerContainer) {
      this.viewer = new Cake3DViewer(viewerContainer);
      // Show a nice default cake
      this.viewer.updateCake({
        tiers: 2,
        shape: 'round',
        size: '8in',
        base_frosting: 'smooth',
        icing_color: '#ff85a2',
        piping_style: 'pearl',
        toppings: ['gold_leaf', 'macarons'],
        inscription: ''
      });
    }
  }

  /**
   * Fetch and render featured cakes from the API
   */
  async loadFeaturedCakes() {
    const grid = this.container.querySelector('#featured-cakes-grid');
    if (!grid) return;

    // Show skeleton while loading
    grid.innerHTML = Array(3).fill(`
      <div class="animate-pulse bg-surface-container rounded-3xl h-80"></div>
    `).join('');

    try {
      const res = await fetch(apiUrl('/api/cakes'));
      const data = await res.json();
      if (data.status === 'success' && data.data.length > 0) {
        const featured = data.data.slice(0, 3);
        grid.innerHTML = featured.map((cake, i) => `
          <div class="scroll-reveal delay-${(i + 1) * 200} tilt-card bg-white rounded-3xl overflow-hidden shadow-lg border border-outline-variant/40 group hover:shadow-2xl transition-all duration-300 flex flex-col justify-between cursor-pointer featured-cake-card" data-id="${cake.id}">
            <div class="relative h-56 overflow-hidden bg-surface-container-low">
              <img src="${cake.image}" alt="${cake.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ${cake.badge ? `
                <span class="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-primary text-xs font-bold px-3 py-1 rounded-full shadow-xs border border-primary/20">
                  ${cake.badge}
                </span>
              ` : ''}
              <div class="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm text-on-surface text-xs font-bold px-3 py-1 rounded-full shadow-xs flex items-center gap-1">
                <span class="material-symbols-outlined text-amber-500 text-sm" style="font-variation-settings: 'FILL' 1;">star</span>
                <span>${cake.rating}</span>
              </div>
            </div>
            <div class="p-6 flex-grow flex flex-col justify-between space-y-3">
              <div>
                <div class="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">${cake.category}</div>
                <h3 class="font-display font-bold text-lg text-on-surface group-hover:text-primary transition-colors">${cake.title}</h3>
                <p class="text-xs text-on-surface-variant line-clamp-2 mt-1.5 leading-relaxed">${cake.description}</p>
              </div>
              <div class="pt-3 border-t border-outline-variant/30 flex items-center justify-between">
                <span class="font-display font-bold text-2xl text-primary">₹${cake.price.toLocaleString('en-IN')}</span>
                <span class="text-xs text-on-surface-variant font-medium flex items-center gap-1">
                  <span class="material-symbols-outlined text-sm">groups</span>
                  ${cake.servings}
                </span>
              </div>
            </div>
          </div>
        `).join('');

        // Re-observe newly added elements
        if (this.scrollAnimator) {
          this.scrollAnimator.observeElements(grid);
        }

        // Attach click events to featured cards
        grid.querySelectorAll('.featured-cake-card').forEach(card => {
          card.addEventListener('click', () => {
            window.location.hash = `#cake-detail?id=${card.dataset.id}`;
          });
        });
      }
    } catch (e) {
      console.warn('Could not load featured cakes', e);
      grid.innerHTML = `
        <div class="col-span-3 text-center py-12 text-on-surface-variant text-xs">
          <span class="material-symbols-outlined text-3xl text-primary/40 mb-2 block">cloud_off</span>
          Unable to load creations. Please ensure the backend is running.
        </div>
      `;
    }
  }

  attachEvents() {
    const custBtn = this.container.querySelector('#hero-customizer-btn');
    const miniCustBtn = this.container.querySelector('#hero-cta-customizer-btn');
    const exploreBtn = this.container.querySelector('#hero-explore-btn');
    const viewAllBtn = this.container.querySelector('#hero-view-all-btn');

    if (custBtn) custBtn.addEventListener('click', () => this.onStartCustomizing());
    if (miniCustBtn) miniCustBtn.addEventListener('click', () => this.onStartCustomizing());
    if (exploreBtn) exploreBtn.addEventListener('click', () => this.onExploreCollection());
    if (viewAllBtn) viewAllBtn.addEventListener('click', () => this.onExploreCollection());

    this.container.querySelectorAll('.cat-card').forEach(card => {
      card.addEventListener('click', () => this.onExploreCollection(card.dataset.category));
    });
  }

  destroy() {
    if (this.viewer) {
      this.viewer.destroy();
      this.viewer = null;
    }
    if (this.scrollAnimator) {
      this.scrollAnimator.destroy();
      this.scrollAnimator = null;
    }
  }
}
