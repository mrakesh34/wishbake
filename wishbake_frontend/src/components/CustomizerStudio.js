import { Cake3DViewer } from './Cake3DViewer.js';
import { apiUrl } from '../services/api.js';

export class CustomizerStudio {
  constructor(containerElement, onAddToCartCallback) {
    this.container = containerElement;
    this.onAddToCart = onAddToCartCallback;
    this.viewer = null;

    this.currentStep = 1;
    this.totalSteps = 5;

    // Synchronous default options so UI never waits or blocks
    this.optionsData = {
      shapes: [
        { id: "round", name: "Classic Round", extra_cost: 0.0 },
        { id: "square", name: "Modern Square", extra_cost: 199.0 },
        { id: "hexagon", name: "Boutique Hexagon", extra_cost: 349.0 },
        { id: "heart", name: "Romantic Heart", extra_cost: 249.0 }
      ],
      sizes: [
        { id: "0.5lb", name: "Half Pound (2-4 Servings)", base_cost: 549.0, servings: 4, weight_lbs: 0.5, weight_kg: 0.23 },
        { id: "1lb", name: "1 Pound (6-8 Servings)", base_cost: 899.0, servings: 8, weight_lbs: 1.0, weight_kg: 0.45 },
        { id: "2lb", name: "2 Pounds (10-14 Servings)", base_cost: 1599.0, servings: 14, weight_lbs: 2.0, weight_kg: 0.9 },
        { id: "3lb", name: "3 Pounds (16-22 Servings)", base_cost: 2299.0, servings: 22, weight_lbs: 3.0, weight_kg: 1.36 },
        { id: "5lb", name: "5 Pounds (30-40 Servings)", base_cost: 3499.0, servings: 40, weight_lbs: 5.0, weight_kg: 2.27 }
      ],
      tiers: [
        { count: 1, multiplier: 1.0, extra_cost: 0.0 },
        { count: 2, multiplier: 1.7, extra_cost: 999.0 },
        { count: 3, multiplier: 2.4, extra_cost: 2499.0 }
      ],
      base_frosting: [
        { id: "smooth", name: "Velvet Smooth Buttercream", extra_cost: 0.0 },
        { id: "semi-naked", name: "Rustic Semi-Naked Finish", extra_cost: 0.0 },
        { id: "textured", name: "Stucco Textured Palette", extra_cost: 199.0 },
        { id: "ruffled", name: "Ribbon Ruffled Piping", extra_cost: 349.0 },
        { id: "fondant", name: "Premium Fondant Finish", extra_cost: 499.0 }
      ],
      sponge_flavors: [
        { id: "vanilla", name: "Madagascar Vanilla Bean", color: "#fbf4e3" },
        { id: "chocolate", name: "Belgian Dark Chocolate", color: "#4a2c2a" },
        { id: "red_velvet", name: "Classic Red Velvet", color: "#8b1e28" },
        { id: "butterscotch", name: "Butterscotch Caramel", color: "#d4a547" },
        { id: "black_forest", name: "Black Forest", color: "#3b1f1f" },
        { id: "paan", name: "Calcutta Paan", color: "#4a7c59" },
        { id: "mango", name: "Alphonso Mango", color: "#f5a623" },
        { id: "rasmalai", name: "Rasmalai", color: "#fef3c7" },
        { id: "pistachio", name: "Pistachio Cardamom", color: "#a8b892" },
        { id: "saffron", name: "Saffron Rose Infusion", color: "#e8a04b" }
      ],
      filling_flavors: [
        { id: "cream", name: "Chantilly Cream", extra_cost: 0.0 },
        { id: "dulce", name: "Salted Caramel Dulce de Leche", extra_cost: 149.0 },
        { id: "raspberry", name: "Wild Raspberry Preserves", extra_cost: 199.0 },
        { id: "gulab_jamun", name: "Gulab Jamun Saffron Mousse", extra_cost: 249.0 },
        { id: "white_choc", name: "Belgian White Chocolate Ganache", extra_cost: 199.0 },
        { id: "dark_choc", name: "Belgian Dark Chocolate Ganache", extra_cost: 199.0 },
        { id: "rabri", name: "Malai Rabri Cream", extra_cost: 199.0 },
        { id: "mango_mousse", name: "Alphonso Mango Mousse", extra_cost: 249.0 },
        { id: "kaju_praline", name: "Kaju Katli Praline", extra_cost: 299.0 },
        { id: "hazelnut", name: "Roasted Hazelnut Praline", extra_cost: 249.0 }
      ],
      toppings: [
        { id: "gold_leaf", name: "24K Edible Gold Leaf Accents", price: 399.0 },
        { id: "silver_vark", name: "Traditional Silver Vark", price: 249.0 },
        { id: "marigolds", name: "Organic Marigold & Rose Petals", price: 199.0 },
        { id: "macarons", name: "Handcrafted Artisanal Macarons (4x)", price: 349.0 },
        { id: "berries", name: "Fresh Wild Berries Cluster", price: 299.0 },
        { id: "dry_fruits", name: "Premium Mixed Dry Fruits & Nuts", price: 349.0 },
        { id: "chocolate_shards", name: "Belgian Chocolate Shards & Curls", price: 249.0 },
        { id: "coconut_flakes", name: "Toasted Coconut Flakes", price: 149.0 }
      ],
      piping_styles: [
        { id: "none", name: "Clean Edge (No Trim)", extra_cost: 0.0 },
        { id: "pearl", name: "Classic Pearl Border", extra_cost: 149.0 },
        { id: "shell", name: "Victorian Shell Border", extra_cost: 199.0 },
        { id: "rosette", name: "WISHBAKE Rosette Crown", extra_cost: 299.0 },
        { id: "mehndi", name: "Mehndi Pattern Border", extra_cost: 399.0 }
      ],
      delivery_time_slots: [
        { id: "morning", name: "Morning (9 AM – 12 PM)" },
        { id: "afternoon", name: "Afternoon (12 PM – 4 PM)" },
        { id: "evening", name: "Evening (4 PM – 8 PM)" },
        { id: "night", name: "Night (8 PM – 11 PM)", extra_cost: 99.0 }
      ]
    };

    // Default Selection State
    this.selection = {
      tiers: 1,
      shape: "round",
      size: "1lb",
      base_frosting: "smooth",
      sponge_flavor: "vanilla",
      filling_flavor: "cream",
      icing_color: "#ff85a2",
      piping_style: "pearl",
      toppings: ["gold_leaf"],
      inscription: ""
    };

    // Delivery details stored separately
    this.deliveryDetails = {
      recipient_name: "",
      delivery_date: this.getTomorrowDate(),
      delivery_time_slot: "afternoon"
    };

    this.pricing = {
      base_price: 899.0,
      tiers_extra: 0.0,
      toppings_extra: 399.0,
      inscription_extra: 0.0,
      total_price: 1447.0,
      currency: "INR",
      weight_lbs: 1.0,
      weight_kg: 0.45,
      estimated_servings: 8
    };

    this.init();
  }

  getTomorrowDate() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }

  async init() {
    // 1. Immediately render layout with default options so everything is interactive instantly
    this.renderLayout();
    
    // 2. Mount Three.js Viewer
    const canvasContainer = this.container.querySelector('#cake-canvas-wrapper');
    if (canvasContainer) {
      this.viewer = new Cake3DViewer(canvasContainer);
      requestAnimationFrame(() => {
        if (this.viewer) {
          this.viewer.updateCake(this.selection);
        }
      });
    }

    // 3. Attach all DOM event listeners via delegation
    this.attachEventListeners();

    // 4. Calculate initial pricing
    this.computePrice();

    // 5. Fetch fresh options from backend if available (non-blocking)
    this.fetchOptions();
  }

  async fetchOptions() {
    try {
      const res = await fetch(apiUrl('/api/customizer/options'));
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success' && data.data) {
          this.optionsData = data.data;
          this.renderStepContent();
        }
      }
    } catch (e) {
      // Keep using default local options
      console.warn('Backend customizer options sync skipped, using built-in options', e);
    }
  }

  computeLocalPrice() {
    const sizeMap = {};
    this.optionsData.sizes.forEach(sz => {
      sizeMap[sz.id] = { base: sz.base_cost, weight_lbs: sz.weight_lbs, weight_kg: sz.weight_kg, servings: sz.servings };
    });
    const shapeExtraMap = {};
    this.optionsData.shapes.forEach(sh => { shapeExtraMap[sh.id] = sh.extra_cost; });
    const tierMap = {};
    this.optionsData.tiers.forEach(t => { tierMap[t.count] = { extra: t.extra_cost, mult: t.multiplier }; });
    const fillingExtraMap = {};
    this.optionsData.filling_flavors.forEach(fl => { fillingExtraMap[fl.id] = fl.extra_cost || 0; });
    const frostingExtraMap = {};
    this.optionsData.base_frosting.forEach(bf => { frostingExtraMap[bf.id] = bf.extra_cost || 0; });
    const pipingExtraMap = {};
    this.optionsData.piping_styles.forEach(p => { pipingExtraMap[p.id] = p.extra_cost || 0; });
    const toppingPriceMap = {};
    this.optionsData.toppings.forEach(t => { toppingPriceMap[t.id] = t.price; });

    const sizeInfo = sizeMap[this.selection.size] || sizeMap['1lb'] || { base: 899, weight_lbs: 1.0, weight_kg: 0.45, servings: 8 };
    const shapeExtra = shapeExtraMap[this.selection.shape] || 0.0;
    const tierInfo = tierMap[this.selection.tiers] || { extra: 0, mult: 1.0 };
    const fillingExtra = fillingExtraMap[this.selection.filling_flavor] || 0.0;
    const frostingExtra = frostingExtraMap[this.selection.base_frosting] || 0.0;
    const pipingExtra = pipingExtraMap[this.selection.piping_style] || 0.0;

    const base_price = Math.round((sizeInfo.base + shapeExtra + frostingExtra + fillingExtra + pipingExtra) * tierInfo.mult * 100) / 100;
    
    let toppings_extra = 0.0;
    (this.selection.toppings || []).forEach(t => {
      toppings_extra += (toppingPriceMap[t] || 0.0);
    });

    const inscription_extra = (this.selection.inscription && this.selection.inscription.trim()) ? 99.0 : 0.0;
    const total_price = Math.round((base_price + tierInfo.extra + toppings_extra + inscription_extra) * 100) / 100;
    const weight_lbs = Math.round(sizeInfo.weight_lbs * (1.0 + (this.selection.tiers - 1) * 0.7) * 10) / 10;
    const weight_kg = Math.round(sizeInfo.weight_kg * (1.0 + (this.selection.tiers - 1) * 0.7) * 100) / 100;
    const estimated_servings = Math.round(sizeInfo.servings * (1.0 + (this.selection.tiers - 1) * 0.8));

    return {
      base_price,
      tiers_extra: tierInfo.extra,
      toppings_extra,
      inscription_extra,
      total_price,
      currency: "INR",
      weight_lbs,
      weight_kg,
      estimated_servings
    };
  }

  async computePrice() {
    // 1. Calculate local fallback immediately so UI is always responsive
    this.pricing = this.computeLocalPrice();
    this.updatePriceDisplay();

    // 2. Sync with backend API in background
    try {
      const res = await fetch(apiUrl('/api/customizer/price'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selection: this.selection })
      });
      if (res.ok) {
        const data = await res.json();
        this.pricing = data;
        this.updatePriceDisplay();
      }
    } catch (e) {
      // Local pricing already applied
    }
  }

  updatePriceDisplay() {
    const totalEl = this.container.querySelector('#customizer-total-price');
    const servingsEl = this.container.querySelector('#customizer-servings-badge');
    const summaryBreakdownEl = this.container.querySelector('#pricing-breakdown-panel');

    if (totalEl) totalEl.textContent = `₹${this.pricing.total_price.toLocaleString('en-IN')}`;
    if (servingsEl) servingsEl.textContent = `${this.pricing.weight_lbs} lbs (~${this.pricing.weight_kg} kg) • ${this.pricing.estimated_servings} servings`;

    if (summaryBreakdownEl) {
      summaryBreakdownEl.innerHTML = `
        <div class="flex justify-between py-1 border-b border-outline-variant/30">
          <span class="text-on-surface-variant">Base Structure & Size:</span>
          <span class="font-bold text-on-surface">₹${this.pricing.base_price.toLocaleString('en-IN')}</span>
        </div>
        <div class="flex justify-between py-1 border-b border-outline-variant/30">
          <span class="text-on-surface-variant">Tier Multiplier Addon:</span>
          <span class="font-bold text-on-surface">+₹${this.pricing.tiers_extra.toLocaleString('en-IN')}</span>
        </div>
        <div class="flex justify-between py-1 border-b border-outline-variant/30">
          <span class="text-on-surface-variant">Luxury Toppings:</span>
          <span class="font-bold text-on-surface">+₹${this.pricing.toppings_extra.toLocaleString('en-IN')}</span>
        </div>
        <div class="flex justify-between py-1">
          <span class="text-on-surface-variant">Custom Inscription Plaque:</span>
          <span class="font-bold text-on-surface">+₹${this.pricing.inscription_extra.toLocaleString('en-IN')}</span>
        </div>
      `;
    }
  }

  renderLayout() {
    const stepLabels = ['Foundation', 'Flavors', 'Decoration', 'Delivery', 'Review'];
    this.container.innerHTML = `
      <section class="max-w-7xl mx-auto px-6 py-8">
        <!-- Header Title -->
        <div class="text-center max-w-2xl mx-auto mb-8">
          <span class="bg-primary/10 text-primary text-xs uppercase font-bold tracking-widest px-4 py-1.5 rounded-full inline-flex items-center gap-1.5 mb-3">
            <span class="material-symbols-outlined text-sm">view_in_ar</span>
            Interactive 3D Studio
          </span>
          <h1 class="font-display text-4xl font-bold text-on-surface">3D Custom Cake Studio</h1>
          <p class="text-on-surface-variant text-sm mt-2">Design your bespoke centerpieces in real-time 3D. Choose tier layers, artisanal flavor infusions, and luxury toppings.</p>
        </div>

        <!-- Step Navigation Tabs -->
        <div class="grid grid-cols-5 gap-2 sm:gap-3 max-w-3xl mx-auto mb-8 bg-surface-container p-1.5 rounded-2xl border border-outline-variant/40">
          ${stepLabels.map((label, i) => {
            const stepNum = i + 1;
            return `
            <button type="button" data-step-nav="${stepNum}" class="step-nav-tab py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${this.currentStep === stepNum ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:text-primary hover:bg-white/50'}">
              <span class="w-5 h-5 rounded-full ${this.currentStep === stepNum ? 'bg-white text-primary' : 'bg-outline-variant/50 text-on-surface'} flex items-center justify-center text-[10px]">${stepNum}</span>
              <span class="hidden sm:inline">${label}</span>
            </button>`;
          }).join('')}
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <!-- 3D Canvas Column -->
          <div class="lg:col-span-7 bg-white rounded-3xl p-6 shadow-xl border border-outline-variant/40 relative">
            <div id="cake-canvas-wrapper" class="three-canvas-container h-[460px] min-h-[460px] w-full relative rounded-2xl overflow-hidden">
              <div class="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-sm text-xs font-bold text-primary flex items-center gap-1.5 border border-primary/20 pointer-events-none">
                <span class="material-symbols-outlined text-base">view_in_ar</span>
                <span>Live 3D WebGL Engine</span>
              </div>

              <div class="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-white/90 backdrop-blur-sm px-5 py-1.5 rounded-full shadow-md text-xs font-medium text-on-surface-variant flex items-center gap-2 border border-outline-variant pointer-events-none">
                <span class="material-symbols-outlined text-primary text-base">360</span>
                <span>Drag to rotate 360°</span>
              </div>
            </div>

            <!-- Quick Theme Presets -->
            <div class="mt-6 pt-4 border-t border-outline-variant/30 flex flex-wrap items-center justify-between gap-3">
              <span class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Preset Themes:</span>
              <div class="flex flex-wrap gap-2">
                <button type="button" data-theme="diwali" class="quick-theme-btn text-xs px-3.5 py-1.5 rounded-full bg-amber-50 text-amber-800 font-bold hover:bg-amber-100 transition-colors border border-amber-200/60 shadow-2xs">✨ Diwali Gold</button>
                <button type="button" data-theme="rose" class="quick-theme-btn text-xs px-3.5 py-1.5 rounded-full bg-pink-50 text-pink-800 font-bold hover:bg-pink-100 transition-colors border border-pink-200/60 shadow-2xs">🌸 Rose Royale</button>
                <button type="button" data-theme="modern" class="quick-theme-btn text-xs px-3.5 py-1.5 rounded-full bg-surface-container text-on-surface font-bold hover:bg-surface-container-high transition-colors border border-outline-variant/60 shadow-2xs">⬛ Modern Hex</button>
                <button type="button" data-theme="wedding" class="quick-theme-btn text-xs px-3.5 py-1.5 rounded-full bg-red-50 text-red-800 font-bold hover:bg-red-100 transition-colors border border-red-200/60 shadow-2xs">💍 Wedding Grand</button>
              </div>
            </div>
          </div>

          <!-- Configuration Controls Column -->
          <div class="lg:col-span-5 bg-white rounded-3xl p-6 shadow-xl border border-outline-variant/40 flex flex-col justify-between min-h-[560px]">
            <div>
              <div class="flex items-center justify-between pb-4 border-b border-outline-variant/40 mb-6">
                <div class="flex items-center gap-2">
                  <span class="w-8 h-8 rounded-full bg-primary text-white font-bold flex items-center justify-center text-sm" id="step-number-badge">${this.currentStep}</span>
                  <h3 class="font-display font-bold text-lg text-on-surface" id="step-title-text">Step 1: Foundation</h3>
                </div>
                <div class="flex gap-1.5" id="step-dots-container">
                  ${[1,2,3,4,5].map(i => `<span class="w-2.5 h-2.5 rounded-full ${this.currentStep >= i ? 'bg-primary' : 'bg-outline-variant'}"></span>`).join('')}
                </div>
              </div>

              <!-- Dynamic Step Controls Container -->
              <div id="step-controls-content" class="overflow-y-auto max-h-[400px] pr-1">
                ${this.getStepHtml(this.currentStep)}
              </div>
            </div>

            <!-- Footer: Pricing and Next/Back buttons -->
            <div class="pt-6 border-t border-outline-variant/40 mt-6">
              <div class="flex items-center justify-between mb-4">
                <div>
                  <span class="text-xs text-on-surface-variant block">Calculated Total</span>
                  <span id="customizer-total-price" class="font-display text-3xl font-bold text-primary">₹${this.pricing.total_price.toLocaleString('en-IN')}</span>
                </div>
                <span id="customizer-servings-badge" class="text-xs font-bold bg-surface-container px-3 py-1.5 rounded-full text-secondary">
                  ${this.pricing.weight_lbs} lbs (~${this.pricing.weight_kg} kg) • ${this.pricing.estimated_servings} servings
                </span>
              </div>

              <div class="flex gap-3">
                <button type="button" id="prev-step-btn" class="px-5 py-3 rounded-full border border-outline-variant text-on-surface-variant font-bold text-sm hover:bg-surface-container transition-colors disabled:opacity-40 disabled:cursor-not-allowed" ${this.currentStep === 1 ? 'disabled' : ''}>
                  Back
                </button>
                <button type="button" id="next-step-btn" class="flex-grow bg-primary text-white py-3 px-6 rounded-full font-bold text-sm shadow-md hover:bg-primary/90 transition-all flex items-center justify-center gap-2 cursor-pointer">
                  <span id="next-btn-label">${this.currentStep === this.totalSteps ? 'Add Custom Cake to Cart' : 'Next Step'}</span>
                  <span id="next-btn-icon" class="material-symbols-outlined text-base">${this.currentStep === this.totalSteps ? 'shopping_bag' : 'arrow_forward'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  getStepHtml(step) {
    if (!this.optionsData) return '<p class="text-sm text-on-surface-variant">Loading options...</p>';

    if (step === 1) {
      return `
        <div class="space-y-5">
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-on-surface mb-2">Number of Tiers</label>
            <div class="grid grid-cols-3 gap-3">
              ${[1, 2, 3].map(count => `
                <button type="button" data-field="tiers" data-val="${count}" class="opt-btn p-3 rounded-2xl border text-center transition-all cursor-pointer ${this.selection.tiers === count ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs ring-2 ring-primary/30' : 'border-outline-variant text-on-surface hover:bg-surface-container'}">
                  <div class="text-lg font-bold">${count} Tier${count > 1 ? 's' : ''}</div>
                  <div class="text-[10px] opacity-75">${count === 1 ? 'Single' : count === 2 ? 'Double' : 'Grand Trio'}</div>
                </button>
              `).join('')}
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-on-surface mb-2">Cake Shape</label>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              ${this.optionsData.shapes.map(sh => `
                <button type="button" data-field="shape" data-val="${sh.id}" class="opt-btn p-3 rounded-2xl border text-center transition-all cursor-pointer ${this.selection.shape === sh.id ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs ring-2 ring-primary/30' : 'border-outline-variant text-on-surface hover:bg-surface-container'}">
                  <div class="text-sm font-bold">${sh.name}</div>
                  <div class="text-[10px] text-on-surface-variant">${sh.extra_cost > 0 ? `+₹${sh.extra_cost}` : 'Standard'}</div>
                </button>
              `).join('')}
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-on-surface mb-2">Cake Weight</label>
            <div class="grid grid-cols-3 sm:grid-cols-5 gap-2">
              ${this.optionsData.sizes.map(sz => `
                <button type="button" data-field="size" data-val="${sz.id}" class="opt-btn p-3 rounded-2xl border text-center transition-all cursor-pointer ${this.selection.size === sz.id ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs ring-2 ring-primary/30' : 'border-outline-variant text-on-surface hover:bg-surface-container'}">
                  <div class="text-sm font-bold">${sz.id}</div>
                  <div class="text-[10px] text-on-surface-variant">₹${sz.base_cost.toLocaleString('en-IN')}</div>
                </button>
              `).join('')}
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-on-surface mb-2">Base Frosting Style</label>
            <div class="grid grid-cols-2 gap-2">
              ${this.optionsData.base_frosting.map(bf => `
                <button type="button" data-field="base_frosting" data-val="${bf.id}" class="opt-btn p-2.5 rounded-xl border text-left text-xs font-medium transition-all cursor-pointer ${this.selection.base_frosting === bf.id ? 'border-primary bg-primary/10 text-primary font-bold ring-2 ring-primary/30' : 'border-outline-variant text-on-surface hover:bg-surface-container'}">
                  <div>${bf.name}</div>
                  <div class="text-[10px] text-on-surface-variant">${bf.extra_cost > 0 ? `+₹${bf.extra_cost}` : 'Included'}</div>
                </button>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    }

    if (step === 2) {
      return `
        <div class="space-y-5">
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-on-surface mb-2">Artisanal Sponge Flavor</label>
            <div class="grid grid-cols-2 gap-2">
              ${this.optionsData.sponge_flavors.map(sp => `
                <button type="button" data-field="sponge_flavor" data-val="${sp.id}" class="opt-btn w-full p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${this.selection.sponge_flavor === sp.id ? 'border-primary bg-primary/10 text-primary font-bold ring-2 ring-primary/30' : 'border-outline-variant text-on-surface hover:bg-surface-container'}">
                  <span class="w-5 h-5 rounded-full border border-outline-variant/50 flex-shrink-0" style="background-color: ${sp.color || '#ddd'}"></span>
                  <span class="text-xs font-medium">${sp.name}</span>
                </button>
              `).join('')}
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-on-surface mb-2">Inner Layer Cream Filling</label>
            <div class="space-y-2">
              ${this.optionsData.filling_flavors.map(fl => `
                <button type="button" data-field="filling_flavor" data-val="${fl.id}" class="opt-btn w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${this.selection.filling_flavor === fl.id ? 'border-primary bg-primary/10 text-primary font-bold ring-2 ring-primary/30' : 'border-outline-variant text-on-surface hover:bg-surface-container'}">
                  <span class="text-sm font-medium">${fl.name}</span>
                  <span class="text-xs text-on-surface-variant font-bold">${fl.extra_cost > 0 ? `+₹${fl.extra_cost}` : 'Included'}</span>
                </button>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    }

    if (step === 3) {
      return `
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-on-surface mb-2">Outer Frosting Color</label>
            <div class="flex items-center gap-3 flex-wrap">
              ${['#ff85a2', '#fbf4e3', '#4a2c2a', '#e8a04b', '#a8b892', '#ffffff', '#8b1e28', '#1a1a2e'].map(colorHex => `
                <button type="button" data-field="icing_color" data-val="${colorHex}" class="color-btn w-9 h-9 rounded-full border-2 transition-transform cursor-pointer ${this.selection.icing_color === colorHex ? 'scale-115 border-primary ring-2 ring-primary/40' : 'border-white shadow-xs hover:scale-105'}" style="background-color: ${colorHex}" title="${colorHex}"></button>
              `).join('')}
              <label class="relative cursor-pointer flex items-center gap-1.5 text-xs text-on-surface-variant font-medium ml-1">
                <input type="color" id="custom-color-input" value="${this.selection.icing_color}" class="w-8 h-8 rounded-full border-0 cursor-pointer" />
                <span>Custom</span>
              </label>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-on-surface mb-2">Piped Edge Trim</label>
            <div class="grid grid-cols-2 gap-2">
              ${this.optionsData.piping_styles.map(p => `
                <button type="button" data-field="piping_style" data-val="${p.id}" class="opt-btn p-2.5 rounded-xl border text-xs font-medium text-left transition-all cursor-pointer ${this.selection.piping_style === p.id ? 'border-primary bg-primary/10 text-primary font-bold ring-2 ring-primary/30' : 'border-outline-variant text-on-surface hover:bg-surface-container'}">
                  <div>${p.name}</div>
                  <div class="text-[10px] text-on-surface-variant">${p.extra_cost > 0 ? `+₹${p.extra_cost}` : 'Included'}</div>
                </button>
              `).join('')}
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-on-surface mb-2">Luxury Toppings & Accents</label>
            <div class="space-y-2">
              ${this.optionsData.toppings.map(t => {
                const isSelected = this.selection.toppings.includes(t.id);
                return `
                  <button type="button" data-topping="${t.id}" class="topping-btn w-full p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all cursor-pointer ${isSelected ? 'border-primary bg-primary/10 text-primary font-bold ring-2 ring-primary/30' : 'border-outline-variant text-on-surface hover:bg-surface-container'}">
                    <span class="flex items-center gap-2">
                      <span class="material-symbols-outlined text-sm ${isSelected ? 'text-primary' : 'text-outline-variant'}">${isSelected ? 'check_box' : 'check_box_outline_blank'}</span>
                      <span>${t.name}</span>
                    </span>
                    <span class="font-bold">+₹${t.price}</span>
                  </button>
                `;
              }).join('')}
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-on-surface mb-1">Message on Cake (+₹99)</label>
            <input type="text" id="inscription-input" value="${this.selection.inscription || ''}" placeholder="e.g. Happy Birthday Priya!" class="w-full px-3 py-2 text-xs rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
          </div>
        </div>
      `;
    }

    if (step === 4) {
      return `
        <div class="space-y-5">
          <div class="bg-surface-container/50 p-4 rounded-2xl border border-outline-variant/30">
            <div class="flex items-center gap-2 mb-3">
              <span class="material-symbols-outlined text-primary text-lg">local_shipping</span>
              <h4 class="font-display font-bold text-on-surface">Delivery Details</h4>
            </div>
            <p class="text-[11px] text-on-surface-variant mb-4">Tell us when and where to deliver your masterpiece. We deliver across major Indian cities.</p>

            <div class="space-y-4">
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-on-surface mb-1">Recipient Name</label>
                <input type="text" id="delivery-recipient-input" value="${this.deliveryDetails.recipient_name || ''}" placeholder="e.g. Priya Sharma" class="w-full px-3 py-2.5 text-sm rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
                <p class="text-[10px] text-on-surface-variant mt-1">Name of the person receiving the cake</p>
              </div>

              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-on-surface mb-1">Delivery Date</label>
                <input type="date" id="delivery-date-input" value="${this.deliveryDetails.delivery_date}" min="${this.getTomorrowDate()}" class="w-full px-3 py-2.5 text-sm rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
                <p class="text-[10px] text-on-surface-variant mt-1">Minimum 1 day advance booking required</p>
              </div>

              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-on-surface mb-2">Preferred Time Slot</label>
                <div class="grid grid-cols-2 gap-2">
                  ${(this.optionsData.delivery_time_slots || [
                    { id: "morning", name: "Morning (9 AM – 12 PM)" },
                    { id: "afternoon", name: "Afternoon (12 PM – 4 PM)" },
                    { id: "evening", name: "Evening (4 PM – 8 PM)" },
                    { id: "night", name: "Night (8 PM – 11 PM)", extra_cost: 99 }
                  ]).map(slot => `
                    <button type="button" data-timeslot="${slot.id}" class="timeslot-btn p-2.5 rounded-xl border text-xs font-medium text-left transition-all cursor-pointer ${this.deliveryDetails.delivery_time_slot === slot.id ? 'border-primary bg-primary/10 text-primary font-bold ring-2 ring-primary/30' : 'border-outline-variant text-on-surface hover:bg-surface-container'}">
                      <div>${slot.name}</div>
                      ${slot.extra_cost ? `<div class="text-[10px] text-on-surface-variant">+₹${slot.extra_cost}</div>` : ''}
                    </button>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    if (step === 5) {
      const selectedSponge = this.optionsData.sponge_flavors.find(s => s.id === this.selection.sponge_flavor);
      return `
        <div class="space-y-4">
          <div class="bg-surface-container p-4 rounded-2xl border border-outline-variant/40">
            <h4 class="font-display font-bold text-on-surface mb-3">Custom Cake Specification Summary</h4>
            <ul class="text-xs space-y-2 text-on-surface-variant">
              <li class="flex justify-between"><strong class="text-on-surface">Tiers & Shape:</strong> <span>${this.selection.tiers} Tier(s) • ${this.selection.shape.toUpperCase()} (${this.selection.size})</span></li>
              <li class="flex justify-between"><strong class="text-on-surface">Frosting Finish:</strong> <span>${this.selection.base_frosting}</span></li>
              <li class="flex justify-between"><strong class="text-on-surface">Sponge & Filling:</strong> <span>${this.selection.sponge_flavor} with ${this.selection.filling_flavor}</span></li>
              <li class="flex justify-between"><strong class="text-on-surface">Piping & Color:</strong> <span>${this.selection.piping_style} trim (<span class="inline-block w-2.5 h-2.5 rounded-full align-middle mr-0.5 border" style="background-color: ${this.selection.icing_color}"></span>${this.selection.icing_color})</span></li>
              <li class="flex justify-between"><strong class="text-on-surface">Luxury Toppings:</strong> <span>${this.selection.toppings.length ? this.selection.toppings.join(', ') : 'None'}</span></li>
              <li class="flex justify-between"><strong class="text-on-surface">Message on Cake:</strong> <span>"${this.selection.inscription || 'None'}"</span></li>
            </ul>
          </div>

          ${this.deliveryDetails.recipient_name || this.deliveryDetails.delivery_date ? `
          <div class="bg-surface-container p-4 rounded-2xl border border-outline-variant/40">
            <h4 class="font-display font-bold text-on-surface mb-3 flex items-center gap-2">
              <span class="material-symbols-outlined text-primary text-base">local_shipping</span>
              Delivery Info
            </h4>
            <ul class="text-xs space-y-2 text-on-surface-variant">
              ${this.deliveryDetails.recipient_name ? `<li class="flex justify-between"><strong class="text-on-surface">Recipient:</strong> <span>${this.deliveryDetails.recipient_name}</span></li>` : ''}
              <li class="flex justify-between"><strong class="text-on-surface">Delivery Date:</strong> <span>${this.deliveryDetails.delivery_date}</span></li>
              <li class="flex justify-between"><strong class="text-on-surface">Time Slot:</strong> <span>${this.deliveryDetails.delivery_time_slot}</span></li>
            </ul>
          </div>
          ` : ''}

          <div id="pricing-breakdown-panel" class="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/40 space-y-2 text-xs">
          </div>
        </div>
      `;
    }

    return '';
  }

  attachEventListeners() {
    // 1. Unified delegated click handler for all buttons in container
    this.container.addEventListener('click', (e) => {
      // Step Navigation Tabs (1-5)
      const stepTab = e.target.closest('[data-step-nav]');
      if (stepTab) {
        const stepNum = parseInt(stepTab.dataset.stepNav);
        if (stepNum >= 1 && stepNum <= this.totalSteps) {
          this.currentStep = stepNum;
          this.renderStepContent();
        }
        return;
      }

      // Next / Add-To-Cart button
      const nextBtn = e.target.closest('#next-step-btn');
      if (nextBtn) {
        if (this.currentStep < this.totalSteps) {
          this.currentStep++;
          this.renderStepContent();
        } else {
          const customCakeItem = {
            item_type: 'custom',
            title: `Bespoke ${this.selection.tiers}-Tier ${this.selection.shape.toUpperCase()} Cake (${this.selection.size})`,
            quantity: 1,
            unit_price: this.pricing.total_price,
            selection: { ...this.selection },
            delivery_details: { ...this.deliveryDetails }
          };
          if (this.onAddToCart) {
            this.onAddToCart(customCakeItem);
          }
        }
        return;
      }

      // Back button
      const prevBtn = e.target.closest('#prev-step-btn');
      if (prevBtn) {
        if (this.currentStep > 1) {
          this.currentStep--;
          this.renderStepContent();
        }
        return;
      }

      // Option selection buttons (tiers, shape, size, sponge, filling, piping, frosting)
      const optBtn = e.target.closest('.opt-btn');
      if (optBtn) {
        const field = optBtn.dataset.field;
        const val = optBtn.dataset.val;
        if (field) {
          if (field === 'tiers') this.selection.tiers = parseInt(val);
          else this.selection[field] = val;

          this.updateUiAnd3D();
        }
        return;
      }

      // Color selection button
      const colorBtn = e.target.closest('.color-btn');
      if (colorBtn) {
        this.selection.icing_color = colorBtn.dataset.val;
        this.updateUiAnd3D();
        return;
      }

      // Topping toggle button
      const toppingBtn = e.target.closest('.topping-btn');
      if (toppingBtn) {
        const toppingId = toppingBtn.dataset.topping;
        if (this.selection.toppings.includes(toppingId)) {
          this.selection.toppings = this.selection.toppings.filter(t => t !== toppingId);
        } else {
          this.selection.toppings.push(toppingId);
        }
        this.updateUiAnd3D();
        return;
      }

      // Time slot selection
      const timeslotBtn = e.target.closest('.timeslot-btn');
      if (timeslotBtn) {
        this.deliveryDetails.delivery_time_slot = timeslotBtn.dataset.timeslot;
        this.renderStepContent();
        return;
      }

      // Preset theme buttons
      const themeBtn = e.target.closest('.quick-theme-btn');
      if (themeBtn) {
        const theme = themeBtn.dataset.theme;
        this.applyThemePreset(theme);
        return;
      }
    });

    // 2. Input events for text fields and color input
    this.container.addEventListener('input', (e) => {
      if (e.target.id === 'inscription-input') {
        this.selection.inscription = e.target.value;
        this.computePrice();
        if (this.viewer) this.viewer.updateCake(this.selection);
      }
      if (e.target.id === 'custom-color-input') {
        this.selection.icing_color = e.target.value;
        this.updateUiAnd3D();
      }
      if (e.target.id === 'delivery-recipient-input') {
        this.deliveryDetails.recipient_name = e.target.value;
      }
      if (e.target.id === 'delivery-date-input') {
        this.deliveryDetails.delivery_date = e.target.value;
      }
    });
  }

  applyThemePreset(theme) {
    if (theme === 'diwali') {
      this.selection.tiers = 2;
      this.selection.shape = 'round';
      this.selection.base_frosting = 'smooth';
      this.selection.icing_color = '#fbf4e3';
      this.selection.piping_style = 'rosette';
      this.selection.toppings = ['gold_leaf', 'marigolds'];
      this.selection.inscription = 'Happy Diwali!';
    } else if (theme === 'rose') {
      this.selection.tiers = 2;
      this.selection.shape = 'round';
      this.selection.base_frosting = 'smooth';
      this.selection.icing_color = '#ff85a2';
      this.selection.piping_style = 'pearl';
      this.selection.toppings = ['silver_vark', 'macarons'];
      this.selection.inscription = 'WISHBAKE Royale';
    } else if (theme === 'modern') {
      this.selection.tiers = 3;
      this.selection.shape = 'hexagon';
      this.selection.base_frosting = 'textured';
      this.selection.icing_color = '#4a2c2a';
      this.selection.piping_style = 'shell';
      this.selection.toppings = ['gold_leaf', 'berries'];
      this.selection.inscription = 'Celebration 2026';
    } else if (theme === 'wedding') {
      this.selection.tiers = 3;
      this.selection.shape = 'heart';
      this.selection.size = '5lb';
      this.selection.base_frosting = 'fondant';
      this.selection.icing_color = '#ffffff';
      this.selection.piping_style = 'mehndi';
      this.selection.toppings = ['gold_leaf', 'marigolds', 'dry_fruits'];
      this.selection.inscription = 'Forever Together';
    }
    this.updateUiAnd3D();
  }

  updateUiAnd3D() {
    this.renderStepContent();
    this.computePrice();
    if (this.viewer) {
      this.viewer.updateCake(this.selection);
    }
  }

  renderStepContent() {
    const contentBox = this.container.querySelector('#step-controls-content');
    const numberBadge = this.container.querySelector('#step-number-badge');
    const titleText = this.container.querySelector('#step-title-text');
    const prevBtn = this.container.querySelector('#prev-step-btn');
    const nextBtnLabel = this.container.querySelector('#next-btn-label');
    const nextBtnIcon = this.container.querySelector('#next-btn-icon');
    const dotsContainer = this.container.querySelector('#step-dots-container');

    const titles = [
      'Step 1: Foundation',
      'Step 2: Flavors & Fillings',
      'Step 3: Decoration & Styling',
      'Step 4: Delivery Details',
      'Step 5: Review & Order'
    ];

    if (contentBox) contentBox.innerHTML = this.getStepHtml(this.currentStep);
    if (numberBadge) numberBadge.textContent = this.currentStep;
    if (titleText) titleText.textContent = titles[this.currentStep - 1];

    // Update Step Navigation Tabs
    this.container.querySelectorAll('.step-nav-tab').forEach(tab => {
      const stepNum = parseInt(tab.dataset.stepNav);
      const pill = tab.querySelector('span:first-child');
      if (stepNum === this.currentStep) {
        tab.className = 'step-nav-tab py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 bg-primary text-white shadow-sm';
        if (pill) pill.className = 'w-5 h-5 rounded-full bg-white text-primary flex items-center justify-center text-[10px]';
      } else {
        tab.className = 'step-nav-tab py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 text-on-surface-variant hover:text-primary hover:bg-white/50';
        if (pill) pill.className = 'w-5 h-5 rounded-full bg-outline-variant/50 text-on-surface flex items-center justify-center text-[10px]';
      }
    });

    // Update Header Step Dots
    if (dotsContainer) {
      dotsContainer.innerHTML = [1,2,3,4,5].map(i =>
        `<span class="w-2.5 h-2.5 rounded-full ${this.currentStep >= i ? 'bg-primary' : 'bg-outline-variant'}"></span>`
      ).join('');
    }

    if (prevBtn) prevBtn.disabled = this.currentStep === 1;
    if (nextBtnLabel) {
      nextBtnLabel.textContent = this.currentStep === this.totalSteps ? 'Add Custom Cake to Cart' : 'Next Step';
    }
    if (nextBtnIcon) {
      nextBtnIcon.textContent = this.currentStep === this.totalSteps ? 'shopping_bag' : 'arrow_forward';
    }

    if (this.currentStep === this.totalSteps) {
      this.updatePriceDisplay();
    }
  }

  destroy() {
    if (this.viewer) {
      this.viewer.destroy();
      this.viewer = null;
    }
  }
}
