import { Cake3DViewer } from './Cake3DViewer.js';
import { apiUrl } from '../services/api.js';
import { escapeHtml, formatINR, showToast } from '../utils/ui.js';

const PRESET_CAKE_INSPIRATIONS = {
  'cake-kesar-pista': { tiers: 1, shape: 'round', size: '2lb', base_frosting: 'smooth', sponge_flavor: 'pistachio', filling_flavor: 'rabri', icing_color: '#faebc2', piping_style: 'pearl', toppings: ['gold_leaf', 'praline_nuts'] },
  'cake-mango-mousse': { tiers: 1, shape: 'round', size: '2lb', base_frosting: 'mirror_glaze', sponge_flavor: 'mango', filling_flavor: 'mango_mousse', icing_color: '#f5ad2e', piping_style: 'none', toppings: ['gold_leaf'] },
  'cake-choco-hazelnut': { tiers: 1, shape: 'round', size: '2lb', base_frosting: 'smooth', sponge_flavor: 'chocolate', filling_flavor: 'hazelnut', icing_color: '#4a2c2a', piping_style: 'drip', toppings: ['choco_truffles', 'gold_leaf'] },
  'cake-kaju-royale': { tiers: 3, shape: 'round', size: '5lb', base_frosting: 'fondant', sponge_flavor: 'vanilla', filling_flavor: 'kaju_praline', icing_color: '#fbf4e3', piping_style: 'mehndi', toppings: ['gold_leaf', 'praline_nuts'] },
  'cake-lotus-biscoff': { tiers: 1, shape: 'round', size: '2lb', base_frosting: 'textured', sponge_flavor: 'butterscotch', filling_flavor: 'dulce', icing_color: '#d9a468', piping_style: 'drip', toppings: ['choco_truffles'] },
  'cake-gulab-cheesecake': { tiers: 1, shape: 'round', size: '2lb', base_frosting: 'semi-naked', sponge_flavor: 'saffron', filling_flavor: 'gulab_jamun', icing_color: '#f8dfd2', piping_style: 'pearl', toppings: ['gold_leaf', 'marigolds'] },
  'cake-marigold-elegance': { tiers: 2, shape: 'round', size: '3lb', base_frosting: 'smooth', sponge_flavor: 'saffron', filling_flavor: 'rabri', icing_color: '#fbf4e3', piping_style: 'pearl', toppings: ['gold_leaf', 'marigolds'] },
  'cake-rose-pistachio': { tiers: 1, shape: 'round', size: '1lb', base_frosting: 'smooth', sponge_flavor: 'pistachio', filling_flavor: 'cream', icing_color: '#f2c1cc', piping_style: 'rosette', toppings: ['floral_roses', 'praline_nuts'] },
  'cake-wishbake-signature': { tiers: 1, shape: 'heart', size: '2lb', base_frosting: 'smooth', sponge_flavor: 'vanilla', filling_flavor: 'raspberry', icing_color: '#d4838f', piping_style: 'pearl', toppings: ['gold_leaf', 'berries'] },
  'cake-dark-truffle': { tiers: 1, shape: 'round', size: '2lb', base_frosting: 'mirror_glaze', sponge_flavor: 'chocolate', filling_flavor: 'dark_choc', icing_color: '#331b18', piping_style: 'none', toppings: ['macarons', 'choco_truffles'] },
  'cake-citrus-berry-bliss': { tiers: 1, shape: 'round', size: '1lb', base_frosting: 'semi-naked', sponge_flavor: 'vanilla', filling_flavor: 'white_choc', icing_color: '#fbf4e3', piping_style: 'shell', toppings: ['berries'] },
  'cake-rasmalai-royale': { tiers: 4, shape: 'round', size: '10lb', base_frosting: 'fondant', sponge_flavor: 'rasmalai', filling_flavor: 'rabri', icing_color: '#faebc2', piping_style: 'mehndi', toppings: ['gold_leaf', 'marigolds', 'praline_nuts'] },
  'cake-butterscotch-crunch': { tiers: 1, shape: 'round', size: '1lb', base_frosting: 'textured', sponge_flavor: 'butterscotch', filling_flavor: 'dulce', icing_color: '#e5b869', piping_style: 'shell', toppings: ['praline_nuts'] },
  'cake-black-forest-classic': { tiers: 1, shape: 'round', size: '1lb', base_frosting: 'smooth', sponge_flavor: 'black_forest', filling_flavor: 'cream', icing_color: '#ffffff', piping_style: 'drip', toppings: ['choco_truffles', 'berries'] },
  'cake-paan-delight': { tiers: 1, shape: 'hexagon', size: '2lb', base_frosting: 'smooth', sponge_flavor: 'paan', filling_flavor: 'rabri', icing_color: '#9db389', piping_style: 'pearl', toppings: ['floral_roses', 'gold_leaf'] },
  'cake-redvelvet-cheesecake': { tiers: 1, shape: 'heart', size: '2lb', base_frosting: 'smooth', sponge_flavor: 'red_velvet', filling_flavor: 'white_choc', icing_color: '#ffffff', piping_style: 'pearl', toppings: ['berries', 'floral_roses'] },
  'cake-mishti-doi': { tiers: 1, shape: 'round', size: '2lb', base_frosting: 'textured', sponge_flavor: 'butterscotch', filling_flavor: 'rabri', icing_color: '#e8c499', piping_style: 'none', toppings: ['praline_nuts', 'gold_leaf'] },
  'cake-anjeer-badam': { tiers: 1, shape: 'square', size: '2lb', base_frosting: 'smooth', sponge_flavor: 'saffron', filling_flavor: 'kaju_praline', icing_color: '#fbf4e3', piping_style: 'shell', toppings: ['praline_nuts', 'gold_leaf'] },
  'cake-saffron-rose-grand': { tiers: 3, shape: 'round', size: '8lb', base_frosting: 'fondant', sponge_flavor: 'saffron', filling_flavor: 'gulab_jamun', icing_color: '#f2c8ce', piping_style: 'mehndi', toppings: ['gold_leaf', 'floral_roses', 'acrylic_topper'] },
  'cake-banoffee-crunch': { tiers: 1, shape: 'round', size: '2lb', base_frosting: 'textured', sponge_flavor: 'butterscotch', filling_flavor: 'dulce', icing_color: '#d9a468', piping_style: 'drip', toppings: ['choco_truffles'] }
};

const SHAPE_SVGS = {
  round: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
  square: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4.5" y="4.5" width="15" height="15" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
  hexagon: '<svg viewBox="0 0 24 24" aria-hidden="true"><polygon points="12,3.5 19.5,7.8 19.5,16.2 12,20.5 4.5,16.2 4.5,7.8" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
  heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.5-8.5-9A4.8 4.8 0 0 1 12 6.8 4.8 4.8 0 0 1 20.5 11c-1.5 4.5-8.5 9-8.5 9z" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>'
};

export class CustomizerStudio {
  constructor(containerElement, onAddToCartCallback, initialPresetId = null) {
    this.container = containerElement;
    this.onAddToCart = onAddToCartCallback;
    this.initialPresetId = initialPresetId;
    this.viewer = null;

    this.currentStep = 1;
    this.totalSteps = 4;
    this.priceRequestId = 0;
    this.sliceViewActive = false;
    this.autoRotateActive = true;
    this.userToggledSliceManually = false;

    this.optionsData = {
      shapes: [
        { id: 'round', name: 'Classic Round', extra_cost: 0.0 },
        { id: 'square', name: 'Modern Square', extra_cost: 299.0 },
        { id: 'hexagon', name: 'Boutique Hexagon', extra_cost: 499.0 },
        { id: 'heart', name: 'Romantic Heart', extra_cost: 399.0 }
      ],
      sizes: [
        { id: '0.5lb', name: 'Half Pound (2–4 Servings)', base_cost: 599.0, servings: 4, weight_lbs: 0.5, weight_kg: 0.23 },
        { id: '1lb', name: '1 Pound (6–8 Servings)', base_cost: 949.0, servings: 8, weight_lbs: 1.0, weight_kg: 0.45 },
        { id: '2lb', name: '2 Pounds (10–14 Servings)', base_cost: 1699.0, servings: 14, weight_lbs: 2.0, weight_kg: 0.9 },
        { id: '3lb', name: '3 Pounds (16–22 Servings)', base_cost: 2499.0, servings: 22, weight_lbs: 3.0, weight_kg: 1.36 },
        { id: '5lb', name: '5 Pounds (30–40 Servings)', base_cost: 3999.0, servings: 40, weight_lbs: 5.0, weight_kg: 2.27 },
        { id: '8lb', name: '8 Pounds Banquet (50–65 Servings)', base_cost: 6199.0, servings: 65, weight_lbs: 8.0, weight_kg: 3.63 },
        { id: '10lb', name: '10 Pounds Grand Gala (70–90 Servings)', base_cost: 7999.0, servings: 90, weight_lbs: 10.0, weight_kg: 4.54 },
        { id: '15lb', name: '15 Pounds Royal Estate (110–140 Servings)', base_cost: 11499.0, servings: 140, weight_lbs: 15.0, weight_kg: 6.8 }
      ],
      tiers: [
        { count: 1, multiplier: 1.0, extra_cost: 0.0 },
        { count: 2, multiplier: 1.65, extra_cost: 1199.0 },
        { count: 3, multiplier: 2.3, extra_cost: 2899.0 },
        { count: 4, multiplier: 2.9, extra_cost: 5499.0 },
        { count: 5, multiplier: 3.45, extra_cost: 8999.0 }
      ],
      base_frosting: [
        { id: 'smooth', name: 'Velvet Smooth Buttercream', extra_cost: 0.0 },
        { id: 'semi-naked', name: 'Rustic Sheer-Frosting Finish', extra_cost: 0.0 },
        { id: 'textured', name: 'Stucco Textured Palette', extra_cost: 249.0 },
        { id: 'ruffled', name: 'Ribbon Ruffled Piping', extra_cost: 399.0 },
        { id: 'fondant', name: 'Porcelain Fondant Finish', extra_cost: 599.0 },
        { id: 'mirror_glaze', name: 'Mirror Glaze Gloss', extra_cost: 699.0 }
      ],
      sponge_flavors: [
        { id: 'vanilla', name: 'Madagascar Vanilla Bean', color: '#fbf4e3' },
        { id: 'chocolate', name: 'Belgian Dark Chocolate', color: '#4a2c2a' },
        { id: 'red_velvet', name: 'Classic Red Velvet', color: '#8b1e28' },
        { id: 'butterscotch', name: 'Butterscotch Caramel', color: '#d4a547' },
        { id: 'black_forest', name: 'Black Forest', color: '#3b1f1f' },
        { id: 'paan', name: 'Calcutta Paan', color: '#4a7c59' },
        { id: 'mango', name: 'Alphonso Mango', color: '#f5a623' },
        { id: 'rasmalai', name: 'Rasmalai', color: '#fef3c7' },
        { id: 'pistachio', name: 'Pistachio Cardamom', color: '#a8b892' },
        { id: 'saffron', name: 'Saffron Rose Infusion', color: '#e8a04b' }
      ],
      filling_flavors: [
        { id: 'cream', name: 'Chantilly Cream', extra_cost: 0.0 },
        { id: 'dulce', name: 'Salted Caramel Dulce de Leche', extra_cost: 149.0 },
        { id: 'raspberry', name: 'Wild Raspberry Preserves', extra_cost: 199.0 },
        { id: 'gulab_jamun', name: 'Gulab Jamun Saffron Mousse', extra_cost: 249.0 },
        { id: 'white_choc', name: 'Belgian White Chocolate Ganache', extra_cost: 199.0 },
        { id: 'dark_choc', name: 'Belgian Dark Chocolate Ganache', extra_cost: 199.0 },
        { id: 'rabri', name: 'Malai Rabri Cream', extra_cost: 199.0 },
        { id: 'mango_mousse', name: 'Alphonso Mango Mousse', extra_cost: 249.0 },
        { id: 'kaju_praline', name: 'Kaju Katli Praline', extra_cost: 349.0 },
        { id: 'hazelnut', name: 'Roasted Hazelnut Praline', extra_cost: 299.0 }
      ],
      toppings: [
        { id: 'gold_leaf', name: '24K Gold Leaf & Pearl Cascade', price: 599.0 },
        { id: 'floral_roses', name: "Garden Roses & Baby's Breath", price: 799.0 },
        { id: 'marigolds', name: 'Royal Marigold & Jasmine Garland', price: 499.0 },
        { id: 'macarons', name: 'Artisanal French Macarons (6x)', price: 699.0 },
        { id: 'choco_truffles', name: 'Belgian Chocolate Sails & Truffles', price: 549.0 },
        { id: 'berries', name: 'Fresh Berries & Mint Crown', price: 599.0 },
        { id: 'praline_nuts', name: 'Roasted Nuts & Amber Praline', price: 499.0 },
        { id: 'acrylic_topper', name: "Brushed Gold 'Celebrate' Topper", price: 399.0 }
      ],
      piping_styles: [
        { id: 'none', name: 'Clean Edge (No Trim)', extra_cost: 0.0 },
        { id: 'pearl', name: 'Classic Pearl Border', extra_cost: 149.0 },
        { id: 'shell', name: 'Victorian Shell Border', extra_cost: 199.0 },
        { id: 'rosette', name: 'WISHBAKE Rosette Crown', extra_cost: 299.0 },
        { id: 'mehndi', name: 'Mehndi Pattern Border', extra_cost: 449.0 },
        { id: 'drip', name: 'Ganache Drip Crown', extra_cost: 349.0 }
      ],
      party_addons: [
        { id: 'party_popper', name: 'Confetti Party Popper (2x)', price: 149.0 },
        { id: 'sparkle_candle', name: 'Gold Sparkle Fountain Candle', price: 99.0 },
        { id: 'magic_candles', name: 'Metallic Celebration Candles', price: 79.0 },
        { id: 'knife_server', name: 'Brass Cake Knife & Server Set', price: 249.0 },
        { id: 'greeting_card', name: 'Handwritten Foil Greeting Card', price: 49.0 },
        { id: 'chilled_box', name: 'Extended Chilled Gel Box (2hr+)', price: 129.0 }
      ]
    };

    this.selection = {
      tiers: 1,
      shape: 'round',
      size: '1lb',
      base_frosting: 'smooth',
      sponge_flavor: 'vanilla',
      filling_flavor: 'cream',
      icing_color: '#d4838f',
      piping_style: 'pearl',
      toppings: ['gold_leaf'],
      addons: [],
      inscription: '',
      inscription_color: '#542137'
    };

    if (this.initialPresetId && PRESET_CAKE_INSPIRATIONS[this.initialPresetId]) {
      const preset = PRESET_CAKE_INSPIRATIONS[this.initialPresetId];
      this.selection = {
        ...this.selection,
        ...preset,
        toppings: [...(preset.toppings || [])],
        addons: []
      };
    }

    this.pricing = this.computeLocalPrice();
    this.init();
  }

  async init() {
    this.renderLayout();
    this.updatePreviewDetails();

    const canvasContainer = this.container.querySelector('#cake-canvas-wrapper');
    if (canvasContainer) {
      this.viewer = new Cake3DViewer(canvasContainer);
      requestAnimationFrame(() => {
        if (this.viewer) {
          this.viewer.updateCake(this.selection, this.optionsData);
        }
      });
    }

    this.attachEventListeners();
    this.computePrice();
    this.fetchOptions();

    if (this.initialPresetId && PRESET_CAKE_INSPIRATIONS[this.initialPresetId]) {
      showToast('Loaded signature inspiration into the 3D Studio — customize freely!', 'info');
    }
  }

  async fetchOptions() {
    try {
      const res = await fetch(apiUrl('/api/customizer/options'));
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success' && data.data) {
          this.optionsData = { ...this.optionsData, ...data.data };
          this.renderStepContent();
          this.updatePreviewDetails();
          if (this.viewer) this.viewer.updateCake(this.selection, this.optionsData);
        }
      }
    } catch {
      // Built-in options stay active
    }
  }

  computeLocalPrice() {
    const sizeInfo = this.optionsData.sizes.find(sz => sz.id === this.selection.size)
      || { base_cost: 949, weight_lbs: 1.0, weight_kg: 0.45, servings: 8 };
    const shapeInfo = this.optionsData.shapes.find(sh => sh.id === this.selection.shape) || { extra_cost: 0 };
    const tierInfo = this.optionsData.tiers.find(t => t.count === this.selection.tiers) || { extra_cost: 0, multiplier: 1.0 };
    const fillingInfo = this.optionsData.filling_flavors.find(fl => fl.id === this.selection.filling_flavor) || { extra_cost: 0 };
    const frostingInfo = this.optionsData.base_frosting.find(bf => bf.id === this.selection.base_frosting) || { extra_cost: 0 };
    const pipingInfo = this.optionsData.piping_styles.find(p => p.id === this.selection.piping_style) || { extra_cost: 0 };

    const base_price = Math.round(
      (sizeInfo.base_cost + shapeInfo.extra_cost + (frostingInfo.extra_cost || 0) + (fillingInfo.extra_cost || 0) + (pipingInfo.extra_cost || 0))
      * tierInfo.multiplier
      * 100
    ) / 100;

    let toppings_extra = 0;
    (this.selection.toppings || []).forEach(id => {
      const found = this.optionsData.toppings.find(t => t.id === id);
      if (found) toppings_extra += found.price;
    });

    let addons_extra = 0;
    (this.selection.addons || []).forEach(id => {
      const found = (this.optionsData.party_addons || []).find(a => a.id === id);
      if (found) addons_extra += found.price;
    });

    const inscription_extra = (this.selection.inscription && this.selection.inscription.trim()) ? 99.0 : 0.0;
    const total_price = Math.round((base_price + tierInfo.extra_cost + toppings_extra + addons_extra + inscription_extra) * 100) / 100;
    const weight_lbs = Math.round(sizeInfo.weight_lbs * (1.0 + (this.selection.tiers - 1) * 0.7) * 10) / 10;
    const weight_kg = Math.round(sizeInfo.weight_kg * (1.0 + (this.selection.tiers - 1) * 0.7) * 100) / 100;
    const estimated_servings = Math.round(sizeInfo.servings * (1.0 + (this.selection.tiers - 1) * 0.8));

    return {
      base_price,
      tiers_extra: tierInfo.extra_cost,
      toppings_extra,
      addons_extra,
      inscription_extra,
      total_price,
      currency: 'INR',
      weight_lbs,
      weight_kg,
      estimated_servings
    };
  }

  async computePrice() {
    const requestId = ++this.priceRequestId;
    this.pricing = this.computeLocalPrice();
    this.updatePriceDisplay();

    try {
      const res = await fetch(apiUrl('/api/customizer/price'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selection: this.selection })
      });
      if (res.ok) {
        const data = await res.json();
        if (requestId === this.priceRequestId) {
          this.pricing = data;
          this.updatePriceDisplay();
        }
      }
    } catch {
      // Local calculation already applied
    }
  }

  updatePriceDisplay() {
    const totalEl = this.container.querySelector('#customizer-total-price');
    const servingsEl = this.container.querySelector('#customizer-servings-badge');
    const summaryBreakdownEl = this.container.querySelector('#pricing-breakdown-panel');

    if (totalEl) totalEl.textContent = formatINR(this.pricing.total_price);
    if (servingsEl) servingsEl.textContent = `${this.pricing.weight_lbs} lbs (~${this.pricing.weight_kg} kg) · ${this.pricing.estimated_servings} servings`;

    if (summaryBreakdownEl) {
      summaryBreakdownEl.innerHTML = `
        <div class="wb-breakdown-row"><span>Base Size, Shape, Finish &amp; Filling</span><strong>${formatINR(this.pricing.base_price)}</strong></div>
        <div class="wb-breakdown-row"><span>Multi-Tier Craftsmanship</span><strong>+${formatINR(this.pricing.tiers_extra)}</strong></div>
        <div class="wb-breakdown-row"><span>Toppings &amp; Accents</span><strong>+${formatINR(this.pricing.toppings_extra)}</strong></div>
        <div class="wb-breakdown-row"><span>Celebration Add-Ons</span><strong>+${formatINR(this.pricing.addons_extra || 0)}</strong></div>
        <div class="wb-breakdown-row"><span>Custom Fondant Plaque</span><strong>+${formatINR(this.pricing.inscription_extra)}</strong></div>
      `;
    }
  }

  renderLayout() {
    const stepLabels = ['Structure', 'Flavours', 'Decorate', 'Review'];

    this.container.innerHTML = `
      <section class="wb-studio" aria-label="3D Cake Studio">
        <div class="wb-studio__topbar">
          <div class="wb-studio__brand-title">
            <span class="wb-studio__eyebrow">3D Cake Studio</span>
            <h1>Craft your celebration cake</h1>
          </div>

          <nav class="wb-studio__steps" aria-label="Cake design steps">
            ${stepLabels.map((label, i) => {
              const stepNum = i + 1;
              return `
                <button type="button" data-step-nav="${stepNum}" class="step-nav-tab ${this.currentStep === stepNum ? 'is-current' : ''}" aria-current="${this.currentStep === stepNum ? 'step' : 'false'}">
                  <span class="step-nav-tab__num">${String(stepNum).padStart(2, '0')}</span>
                  <span>${label}</span>
                </button>
              `;
            }).join('')}
          </nav>

          <div class="wb-studio__themes" aria-label="Quick theme inspirations">
            <button type="button" data-theme="diwali" class="quick-theme-btn"><i class="wb-swatch wb-swatch--gold"></i> Festive Gold</button>
            <button type="button" data-theme="rose" class="quick-theme-btn"><i class="wb-swatch wb-swatch--rose"></i> Rose Garden</button>
            <button type="button" data-theme="modern" class="quick-theme-btn"><i class="wb-swatch wb-swatch--cocoa"></i> Modern Cocoa</button>
            <button type="button" data-theme="wedding" class="quick-theme-btn"><i class="wb-swatch wb-swatch--ivory"></i> Royal Gala</button>
          </div>
        </div>

        <div class="wb-studio__workspace">
          <section class="wb-studio__stage" aria-label="Interactive 3D cake preview">
            <div class="wb-studio__stage-toolbar">
              <div class="wb-studio__view-pills" role="group" aria-label="Camera angle">
                <button type="button" data-view="threeQuarter" class="wb-stage-pill is-active">3/4 View</button>
                <button type="button" data-view="front" class="wb-stage-pill">Front</button>
                <button type="button" data-view="top" class="wb-stage-pill">Top</button>
              </div>

              <div class="wb-studio__stage-tools">
                <button type="button" id="toggle-slice-btn" class="wb-stage-pill wb-stage-pill--accent" aria-pressed="${this.sliceViewActive}">
                  <span class="material-symbols-outlined" aria-hidden="true">pie_chart</span>
                  <span>Peek Inside</span>
                </button>
                <button type="button" id="toggle-rotate-btn" class="wb-stage-pill is-active" aria-pressed="${this.autoRotateActive}" title="Toggle auto-rotation">
                  <span class="material-symbols-outlined" aria-hidden="true">360</span>
                  <span>Spin</span>
                </button>
                <button type="button" id="zoom-in-btn" class="wb-stage-icon-btn" aria-label="Zoom in">
                  <span class="material-symbols-outlined" aria-hidden="true">add</span>
                </button>
                <button type="button" id="zoom-out-btn" class="wb-stage-icon-btn" aria-label="Zoom out">
                  <span class="material-symbols-outlined" aria-hidden="true">remove</span>
                </button>
              </div>
            </div>

            <div id="cake-canvas-wrapper" class="wb-studio__canvas" role="img" aria-label="Interactive 3D cake model"></div>

            <div class="wb-studio__stage-footer">
              <div class="wb-studio__live-spec" aria-live="polite">
                <strong id="live-cake-name">1 Tier · Classic Round</strong>
                <span id="live-cake-flavours">Madagascar Vanilla Bean · Chantilly Cream</span>
                <span id="live-cake-toppings">24K Gold Leaf &amp; Pearl Cascade</span>
              </div>
              <span class="wb-studio__drag-hint">Drag to rotate · Scroll to zoom</span>
            </div>
          </section>

          <section class="wb-studio__inspector" aria-label="Cake customization controls">
            <header class="wb-studio__inspector-head">
              <div>
                <span class="wb-studio__step-kicker">Step <span id="step-number-badge">${this.currentStep}</span> of ${this.totalSteps}</span>
                <h2 id="step-title-text">Structure &amp; Frosting</h2>
              </div>
              <div id="step-dots-container" class="wb-studio__dots" aria-hidden="true">
                ${[1, 2, 3, 4].map(i => `<span class="${i === this.currentStep ? 'is-current' : i < this.currentStep ? 'is-done' : ''}"></span>`).join('')}
              </div>
            </header>

            <div id="step-controls-content" class="wb-studio__controls">
              ${this.getStepHtml(this.currentStep)}
            </div>

            <footer class="wb-studio__summary">
              <div class="wb-studio__price-row">
                <div>
                  <span class="wb-studio__price-label">Estimated Total</span>
                  <strong id="customizer-total-price">${formatINR(this.pricing.total_price)}</strong>
                </div>
                <span id="customizer-servings-badge" class="wb-studio__servings-pill">${this.pricing.weight_lbs} lbs (~${this.pricing.weight_kg} kg) · ${this.pricing.estimated_servings} servings</span>
              </div>
              <div class="wb-studio__actions">
                <button type="button" id="prev-step-btn" class="wb-button wb-button--outline" ${this.currentStep === 1 ? 'disabled' : ''}>Back</button>
                <button type="button" id="next-step-btn" class="wb-button wb-button--primary">
                  <span id="next-btn-label">${this.currentStep === this.totalSteps ? 'Add Custom Cake to Bag' : 'Next Step'}</span>
                  <span id="next-btn-icon" class="material-symbols-outlined" aria-hidden="true">${this.currentStep === this.totalSteps ? 'shopping_bag' : 'arrow_forward'}</span>
                </button>
              </div>
            </footer>
          </section>
        </div>
      </section>
    `;
  }

  getStepHtml(step) {
    if (step === 1) {
      return `
        <div class="wb-studio-step">
          <div class="wb-studio-group">
            <span class="wb-studio-label">Number of Tiers</span>
            <div class="wb-opt-grid wb-opt-grid--5">
              ${(this.optionsData.tiers || []).map(t => `
                <button type="button" data-field="tiers" data-val="${t.count}" class="opt-btn wb-opt-card ${this.selection.tiers === t.count ? 'is-selected' : ''}">
                  <strong>${t.count} ${t.count > 1 ? 'Tiers' : 'Tier'}</strong>
                  <span>${t.extra_cost > 0 ? `+₹${t.extra_cost.toLocaleString('en-IN')}` : 'Base'}</span>
                </button>
              `).join('')}
            </div>
          </div>

          <div class="wb-studio-group">
            <span class="wb-studio-label">Cake Shape</span>
            <div class="wb-opt-grid wb-opt-grid--4">
              ${this.optionsData.shapes.map(sh => `
                <button type="button" data-field="shape" data-val="${sh.id}" class="opt-btn wb-opt-card wb-opt-card--shape ${this.selection.shape === sh.id ? 'is-selected' : ''}">
                  <span class="wb-shape-icon">${SHAPE_SVGS[sh.id] || ''}</span>
                  <strong>${escapeHtml(sh.name.replace('Classic ', '').replace('Modern ', '').replace('Boutique ', '').replace('Romantic ', ''))}</strong>
                  <span>${sh.extra_cost > 0 ? `+₹${sh.extra_cost}` : 'Standard'}</span>
                </button>
              `).join('')}
            </div>
          </div>

          <div class="wb-studio-group">
            <span class="wb-studio-label">Cake Size &amp; Weight</span>
            <div class="wb-opt-grid wb-opt-grid--4">
              ${this.optionsData.sizes.map(sz => `
                <button type="button" data-field="size" data-val="${sz.id}" class="opt-btn wb-opt-card ${this.selection.size === sz.id ? 'is-selected' : ''}">
                  <strong>${escapeHtml(sz.id)}</strong>
                  <span>₹${sz.base_cost.toLocaleString('en-IN')}</span>
                </button>
              `).join('')}
            </div>
          </div>

          <div class="wb-studio-group">
            <span class="wb-studio-label">Base Frosting Finish</span>
            <div class="wb-opt-grid wb-opt-grid--3">
              ${this.optionsData.base_frosting.map(bf => `
                <button type="button" data-field="base_frosting" data-val="${bf.id}" class="opt-btn wb-opt-card wb-opt-card--row ${this.selection.base_frosting === bf.id ? 'is-selected' : ''}">
                  <strong>${escapeHtml(bf.name.replace(' Finish', '').replace(' Buttercream', '').replace(' Palette', '').replace(' Piping', ''))}</strong>
                  <span>${bf.extra_cost > 0 ? `+₹${bf.extra_cost}` : 'Free'}</span>
                </button>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    }

    if (step === 2) {
      return `
        <div class="wb-studio-step">
          <div class="wb-studio-peek-banner">
            <span class="material-symbols-outlined" aria-hidden="true">pie_chart</span>
            <span>Cutaway view lets you inspect sponge &amp; cream layers live on the 3D cake.</span>
          </div>

          <div class="wb-studio-group">
            <span class="wb-studio-label">Artisanal Sponge Flavor</span>
            <div class="wb-opt-grid wb-opt-grid--2">
              ${this.optionsData.sponge_flavors.map(sp => `
                <button type="button" data-field="sponge_flavor" data-val="${sp.id}" class="opt-btn wb-opt-card wb-opt-card--swatch ${this.selection.sponge_flavor === sp.id ? 'is-selected' : ''}">
                  <span class="wb-color-dot" style="background-color: ${escapeHtml(sp.color || '#ddd')}"></span>
                  <strong>${escapeHtml(sp.name)}</strong>
                </button>
              `).join('')}
            </div>
          </div>

          <div class="wb-studio-group">
            <span class="wb-studio-label">Inner Layer Cream Filling</span>
            <div class="wb-opt-grid wb-opt-grid--2">
              ${this.optionsData.filling_flavors.map(fl => `
                <button type="button" data-field="filling_flavor" data-val="${fl.id}" class="opt-btn wb-opt-card wb-opt-card--row ${this.selection.filling_flavor === fl.id ? 'is-selected' : ''}">
                  <strong>${escapeHtml(fl.name)}</strong>
                  <span>${fl.extra_cost > 0 ? `+₹${fl.extra_cost}` : 'Free'}</span>
                </button>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    }

    if (step === 3) {
      const palette = ['#d4838f', '#fbf4e3', '#f2c8ce', '#d9a468', '#9db389', '#8b1e28', '#4a2c2a', '#ffffff', '#2d3748'];
      const msgColors = [
        { hex: '#542137', label: 'Berry' },
        { hex: '#1b1416', label: 'Espresso' },
        { hex: '#9a6f28', label: 'Gold' },
        { hex: '#1e5c42', label: 'Emerald' },
        { hex: '#1c3b6f', label: 'Royal Blue' },
        { hex: '#ffffff', label: 'White' }
      ];
      const msgVal = this.selection.inscription || '';
      const inkHex = this.selection.inscription_color || '#542137';

      return `
        <div class="wb-studio-step">
          <div class="wb-studio-group">
            <span class="wb-studio-label">Outer Frosting Color</span>
            <div class="wb-color-row">
              ${palette.map(hex => `
                <button type="button" data-field="icing_color" data-val="${hex}" class="color-btn wb-color-chip ${this.selection.icing_color.toLowerCase() === hex.toLowerCase() ? 'is-selected' : ''}" style="background-color: ${hex}" aria-label="Color ${hex}" title="${hex}"></button>
              `).join('')}
              <label class="wb-custom-color-wrap" title="Choose any custom icing color">
                <input type="color" id="custom-color-input" value="${escapeHtml(this.selection.icing_color)}" />
                <span>Custom</span>
              </label>
            </div>
          </div>

          <div class="wb-studio-group">
            <span class="wb-studio-label">Piped Edge &amp; Drip Trim</span>
            <div class="wb-opt-grid wb-opt-grid--3">
              ${this.optionsData.piping_styles.map(p => `
                <button type="button" data-field="piping_style" data-val="${p.id}" class="opt-btn wb-opt-card wb-opt-card--row ${this.selection.piping_style === p.id ? 'is-selected' : ''}">
                  <strong>${escapeHtml(p.name.replace(' (No Trim)', '').replace(' Border', ''))}</strong>
                  <span>${p.extra_cost > 0 ? `+₹${p.extra_cost}` : 'Free'}</span>
                </button>
              `).join('')}
            </div>
          </div>

          <div class="wb-studio-group">
            <span class="wb-studio-label">Luxury Toppings &amp; Accents</span>
            <div class="wb-opt-grid wb-opt-grid--2">
              ${this.optionsData.toppings.map(t => {
                const isSelected = this.selection.toppings.includes(t.id);
                return `
                  <button type="button" data-topping="${t.id}" class="topping-btn wb-opt-card wb-opt-card--check ${isSelected ? 'is-selected' : ''}" aria-pressed="${isSelected}">
                    <span class="material-symbols-outlined wb-check-icon" aria-hidden="true">${isSelected ? 'check_box' : 'check_box_outline_blank'}</span>
                    <strong>${escapeHtml(t.name)}</strong>
                    <span class="wb-opt-price">+₹${t.price}</span>
                  </button>
                `;
              }).join('')}
            </div>
          </div>

          <div class="wb-studio-group">
            <div class="wb-studio-label-row">
              <label for="inscription-input" class="wb-studio-label">Message on Fondant Plaque (+₹99)</label>
              <span id="inscription-char-count" class="wb-char-count">${msgVal.length}/28</span>
            </div>
            <div class="wb-plaque-controls">
              <input type="text" id="inscription-input" maxlength="28" value="${escapeHtml(msgVal)}" placeholder="e.g. Happy Birthday Priya!" />
              <div class="wb-plaque-colors" role="group" aria-label="Plaque text color">
                ${msgColors.map(c => `
                  <button type="button" data-field="inscription_color" data-val="${c.hex}" class="msg-color-btn wb-color-chip wb-color-chip--sm ${inkHex.toLowerCase() === c.hex.toLowerCase() ? 'is-selected' : ''}" style="background-color: ${c.hex}" title="${c.label} text" aria-label="${c.label} plaque text"></button>
                `).join('')}
                <input type="color" id="inscription-color-input" value="${escapeHtml(inkHex)}" title="Custom text color" aria-label="Custom plaque text color" />
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // Step 4: Celebration Add-ons & Review
    const shapeLabel = this.optionsData.shapes.find(s => s.id === this.selection.shape)?.name || this.selection.shape;
    const sizeLabel = this.optionsData.sizes.find(s => s.id === this.selection.size)?.name || this.selection.size;
    const frostingLabel = this.optionsData.base_frosting.find(f => f.id === this.selection.base_frosting)?.name || this.selection.base_frosting;
    const spongeLabel = this.optionsData.sponge_flavors.find(s => s.id === this.selection.sponge_flavor)?.name || this.selection.sponge_flavor;
    const fillingLabel = this.optionsData.filling_flavors.find(f => f.id === this.selection.filling_flavor)?.name || this.selection.filling_flavor;
    const pipingLabel = this.optionsData.piping_styles.find(p => p.id === this.selection.piping_style)?.name || this.selection.piping_style;
    const toppingNames = this.optionsData.toppings
      .filter(t => this.selection.toppings.includes(t.id))
      .map(t => t.name);
    const partyAddons = this.optionsData.party_addons || [];

    return `
      <div class="wb-studio-step">
        <div class="wb-studio-group">
          <span class="wb-studio-label">Essential Celebration Add-Ons</span>
          <div class="wb-opt-grid wb-opt-grid--2">
            ${partyAddons.map(addon => {
              const checked = (this.selection.addons || []).includes(addon.id);
              return `
                <button type="button" data-addon="${addon.id}" class="addon-btn wb-opt-card wb-opt-card--check ${checked ? 'is-selected' : ''}" aria-pressed="${checked}">
                  <span class="material-symbols-outlined wb-check-icon" aria-hidden="true">${checked ? 'check_box' : 'check_box_outline_blank'}</span>
                  <strong>${escapeHtml(addon.name)}</strong>
                  <span class="wb-opt-price">+₹${addon.price}</span>
                </button>
              `;
            }).join('')}
          </div>
        </div>

        <div class="wb-review-card">
          <h3>Cake Specification Summary</h3>
          <ul class="wb-review-list">
            <li><span>Structure</span><strong>${this.selection.tiers} ${this.selection.tiers > 1 ? 'Tiers' : 'Tier'} · ${escapeHtml(shapeLabel)} · ${escapeHtml(sizeLabel)}</strong></li>
            <li><span>Finish &amp; Trim</span><strong>${escapeHtml(frostingLabel)} · ${escapeHtml(pipingLabel)} <span class="wb-inline-swatch" style="background-color: ${escapeHtml(this.selection.icing_color)}"></span></strong></li>
            <li><span>Sponge &amp; Filling</span><strong>${escapeHtml(spongeLabel)} · ${escapeHtml(fillingLabel)}</strong></li>
            <li><span>Toppings</span><strong>${toppingNames.length ? escapeHtml(toppingNames.join(', ')) : 'None'}</strong></li>
            <li>
              <span>Fondant Plaque</span>
              <strong>
                ${this.selection.inscription?.trim() ? `“${escapeHtml(this.selection.inscription.trim())}” <span class="wb-inline-swatch" style="background-color: ${escapeHtml(this.selection.inscription_color || '#542137')}"></span>` : 'None'}
              </strong>
            </li>
          </ul>
        </div>

        <div id="pricing-breakdown-panel" class="wb-review-breakdown"></div>
      </div>
    `;
  }

  attachEventListeners() {
    this.container.addEventListener('click', (e) => {
      const stepTab = e.target.closest('[data-step-nav]');
      if (stepTab) {
        const stepNum = parseInt(stepTab.dataset.stepNav, 10);
        if (stepNum >= 1 && stepNum <= this.totalSteps) {
          this.goToStep(stepNum);
        }
        return;
      }

      const nextBtn = e.target.closest('#next-step-btn');
      if (nextBtn) {
        if (this.currentStep < this.totalSteps) {
          this.goToStep(this.currentStep + 1);
        } else {
          const shapeName = this.optionsData.shapes.find(s => s.id === this.selection.shape)?.name || this.selection.shape;
          const customCakeItem = {
            item_type: 'custom',
            title: `Bespoke ${this.selection.tiers}-Tier ${shapeName} (${this.selection.size})`,
            quantity: 1,
            unit_price: this.pricing.total_price,
            selection: {
              ...this.selection,
              toppings: [...this.selection.toppings],
              addons: [...(this.selection.addons || [])]
            }
          };
          if (this.onAddToCart) this.onAddToCart(customCakeItem);
        }
        return;
      }

      const prevBtn = e.target.closest('#prev-step-btn');
      if (prevBtn) {
        if (this.currentStep > 1) this.goToStep(this.currentStep - 1);
        return;
      }

      const viewBtn = e.target.closest('[data-view]');
      if (viewBtn) {
        this.container.querySelectorAll('[data-view]').forEach(b => b.classList.remove('is-active'));
        viewBtn.classList.add('is-active');
        this.viewer?.setViewPreset(viewBtn.dataset.view);
        return;
      }

      if (e.target.closest('#toggle-slice-btn')) {
        this.userToggledSliceManually = true;
        this.setSliceMode(!this.sliceViewActive);
        return;
      }

      if (e.target.closest('#toggle-rotate-btn')) {
        this.autoRotateActive = !this.autoRotateActive;
        const btn = this.container.querySelector('#toggle-rotate-btn');
        btn?.classList.toggle('is-active', this.autoRotateActive);
        btn?.setAttribute('aria-pressed', String(this.autoRotateActive));
        this.viewer?.setAutoRotate(this.autoRotateActive);
        return;
      }

      if (e.target.closest('#zoom-in-btn')) {
        this.viewer?.zoomBy(0.86);
        return;
      }

      if (e.target.closest('#zoom-out-btn')) {
        this.viewer?.zoomBy(1.16);
        return;
      }

      const optBtn = e.target.closest('.opt-btn');
      if (optBtn) {
        const field = optBtn.dataset.field;
        const val = optBtn.dataset.val;
        if (field) {
          this.selection[field] = field === 'tiers' ? parseInt(val, 10) : val;
          this.updateUiAnd3D();
        }
        return;
      }

      const colorBtn = e.target.closest('.color-btn');
      if (colorBtn) {
        this.selection.icing_color = colorBtn.dataset.val;
        this.updateUiAnd3D();
        return;
      }

      const msgColorBtn = e.target.closest('.msg-color-btn');
      if (msgColorBtn) {
        this.selection.inscription_color = msgColorBtn.dataset.val;
        this.updateUiAnd3D();
        return;
      }

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

      const addonBtn = e.target.closest('.addon-btn');
      if (addonBtn) {
        const addonId = addonBtn.dataset.addon;
        const currentAddons = this.selection.addons || [];
        if (currentAddons.includes(addonId)) {
          this.selection.addons = currentAddons.filter(a => a !== addonId);
        } else {
          this.selection.addons = [...currentAddons, addonId];
        }
        this.renderStepContent();
        this.computePrice();
        return;
      }

      const themeBtn = e.target.closest('.quick-theme-btn');
      if (themeBtn) {
        this.applyThemePreset(themeBtn.dataset.theme);
      }
    });

    this.container.addEventListener('input', (e) => {
      if (e.target.id === 'inscription-input') {
        this.selection.inscription = e.target.value;
        const counter = this.container.querySelector('#inscription-char-count');
        if (counter) counter.textContent = `${e.target.value.length}/28`;
        this.computePrice();
        this.updatePreviewDetails();
        this.viewer?.updateCake(this.selection, this.optionsData);
      } else if (e.target.id === 'custom-color-input') {
        this.selection.icing_color = e.target.value;
        this.container.querySelectorAll('.color-btn').forEach(btn => {
          btn.classList.toggle('is-selected', btn.dataset.val.toLowerCase() === e.target.value.toLowerCase());
        });
        this.viewer?.updateCake(this.selection, this.optionsData);
      } else if (e.target.id === 'inscription-color-input') {
        this.selection.inscription_color = e.target.value;
        this.container.querySelectorAll('.msg-color-btn').forEach(btn => {
          btn.classList.toggle('is-selected', btn.dataset.val.toLowerCase() === e.target.value.toLowerCase());
        });
        this.viewer?.updateCake(this.selection, this.optionsData);
      }
    });
  }

  setSliceMode(active) {
    this.sliceViewActive = active;
    const btn = this.container.querySelector('#toggle-slice-btn');
    if (btn) {
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', String(active));
    }
    this.viewer?.setSliceView(active);
  }

  goToStep(stepNum) {
    this.currentStep = stepNum;
    if (!this.userToggledSliceManually) {
      if (stepNum === 2) this.setSliceMode(true);
      else if (this.sliceViewActive && stepNum !== 2) this.setSliceMode(false);
    }
    this.renderStepContent();
  }

  applyThemePreset(theme) {
    const presets = {
      diwali: {
        tiers: 2,
        shape: 'round',
        size: '3lb',
        base_frosting: 'smooth',
        sponge_flavor: 'saffron',
        filling_flavor: 'rabri',
        icing_color: '#fbf4e3',
        piping_style: 'rosette',
        toppings: ['gold_leaf', 'marigolds'],
        inscription: 'Happy Diwali!'
      },
      rose: {
        tiers: 2,
        shape: 'round',
        size: '2lb',
        base_frosting: 'smooth',
        sponge_flavor: 'pistachio',
        filling_flavor: 'raspberry',
        icing_color: '#d4838f',
        piping_style: 'pearl',
        toppings: ['floral_roses', 'macarons'],
        inscription: 'WISHBAKE Royale'
      },
      modern: {
        tiers: 3,
        shape: 'hexagon',
        size: '5lb',
        base_frosting: 'mirror_glaze',
        sponge_flavor: 'chocolate',
        filling_flavor: 'hazelnut',
        icing_color: '#4a2c2a',
        piping_style: 'drip',
        toppings: ['choco_truffles', 'gold_leaf', 'acrylic_topper'],
        inscription: 'Celebration 2026'
      },
      wedding: {
        tiers: 5,
        shape: 'round',
        size: '10lb',
        base_frosting: 'fondant',
        sponge_flavor: 'vanilla',
        filling_flavor: 'kaju_praline',
        icing_color: '#ffffff',
        piping_style: 'mehndi',
        toppings: ['gold_leaf', 'floral_roses', 'acrylic_topper'],
        inscription: 'Forever Together'
      }
    };

    const chosen = presets[theme];
    if (!chosen) return;
    this.selection = { ...this.selection, ...chosen, toppings: [...chosen.toppings] };
    this.updateUiAnd3D();
  }

  updateUiAnd3D() {
    this.renderStepContent();
    this.updatePreviewDetails();
    this.computePrice();
    this.viewer?.updateCake(this.selection, this.optionsData);
  }

  renderStepContent() {
    const contentBox = this.container.querySelector('#step-controls-content');
    const numberBadge = this.container.querySelector('#step-number-badge');
    const titleText = this.container.querySelector('#step-title-text');
    const prevBtn = this.container.querySelector('#prev-step-btn');
    const nextBtnLabel = this.container.querySelector('#next-btn-label');
    const nextBtnIcon = this.container.querySelector('#next-btn-icon');
    const dotsContainer = this.container.querySelector('#step-dots-container');

    const titles = ['Structure & Frosting', 'Flavours & Filling', 'Colour & Decor', 'Add-Ons & Review'];

    if (contentBox) contentBox.innerHTML = this.getStepHtml(this.currentStep);
    if (numberBadge) numberBadge.textContent = this.currentStep;
    if (titleText) titleText.textContent = titles[this.currentStep - 1];

    this.container.querySelectorAll('.step-nav-tab').forEach(tab => {
      const stepNum = parseInt(tab.dataset.stepNav, 10);
      tab.classList.toggle('is-done', stepNum < this.currentStep);
      tab.classList.toggle('is-current', stepNum === this.currentStep);
      tab.setAttribute('aria-current', stepNum === this.currentStep ? 'step' : 'false');
    });

    if (dotsContainer) {
      dotsContainer.innerHTML = [1, 2, 3, 4].map(i =>
        `<span class="${i === this.currentStep ? 'is-current' : i < this.currentStep ? 'is-done' : ''}"></span>`
      ).join('');
    }

    if (prevBtn) prevBtn.disabled = this.currentStep === 1;
    if (nextBtnLabel) {
      nextBtnLabel.textContent = this.currentStep === this.totalSteps ? 'Add Custom Cake to Bag' : 'Next Step';
    }
    if (nextBtnIcon) {
      nextBtnIcon.textContent = this.currentStep === this.totalSteps ? 'shopping_bag' : 'arrow_forward';
    }

    if (this.currentStep === this.totalSteps) {
      this.updatePriceDisplay();
    }
    this.updatePreviewDetails();
  }

  updatePreviewDetails() {
    const nameEl = this.container.querySelector('#live-cake-name');
    const flavoursEl = this.container.querySelector('#live-cake-flavours');
    const toppingsEl = this.container.querySelector('#live-cake-toppings');
    if (!nameEl || !flavoursEl || !toppingsEl) return;

    const shape = this.optionsData.shapes.find(option => option.id === this.selection.shape);
    const sponge = this.optionsData.sponge_flavors.find(option => option.id === this.selection.sponge_flavor);
    const filling = this.optionsData.filling_flavors.find(option => option.id === this.selection.filling_flavor);
    const frosting = this.optionsData.base_frosting.find(option => option.id === this.selection.base_frosting);
    const toppings = this.optionsData.toppings
      .filter(option => this.selection.toppings.includes(option.id))
      .map(option => option.name);

    nameEl.textContent = `${this.selection.tiers} ${this.selection.tiers > 1 ? 'Tiers' : 'Tier'} · ${shape?.name || this.selection.shape} · ${this.selection.size}`;
    flavoursEl.textContent = `${sponge?.name || this.selection.sponge_flavor} · ${filling?.name || this.selection.filling_flavor} · ${frosting?.name || this.selection.base_frosting}`;
    const finish = toppings.length ? toppings.join(', ') : 'Clean finish';
    toppingsEl.textContent = this.selection.inscription?.trim()
      ? `${finish} · Plaque: “${this.selection.inscription.trim()}”`
      : finish;
  }

  destroy() {
    if (this.viewer) {
      this.viewer.destroy();
      this.viewer = null;
    }
  }
}
