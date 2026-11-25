import { escapeHtml, formatINR } from '../utils/ui.js';
import { renderMinimalTermsSection } from './TermsSection.js';

const FEATURED_FLAGSHIPS = [
  {
    id: 'cake-rasmalai-royale',
    category: 'Weddings & Galas',
    title: 'Rasmalai Royale 3-Tier Grandeur',
    badge: 'Showstopper',
    rating: 4.9,
    servings: '35-45',
    price: 8999,
    image: '/assets/images/rasmalai_royale_angle.jpg',
    description: 'Three-tier rasmalai-infused sponge with saffron cream layers, hand-piped royal icing, edible gold leaf cascades, and roasted dry fruit garnish.'
  },
  {
    id: 'cake-saffron-rose-grand',
    category: 'Weddings & Galas',
    title: 'Imperial Saffron Rose 2-Tier Grandeur',
    badge: 'Royal Reserve',
    rating: 5.0,
    servings: '24-32',
    price: 6499,
    image: '/assets/images/saffron_rose_front.jpg',
    description: 'Magnificent palace banquet spectacle layered with damask rosewater, Kashmiri saffron mousse, diamond silver vark, and hand-piped royal filigree.'
  },
  {
    id: 'cake-choco-hazelnut',
    category: 'Anniversary',
    title: 'Belgian Dark Chocolate Hazelnut Truffle',
    badge: 'Signature',
    rating: 4.9,
    servings: '10-12',
    price: 1999,
    image: '/assets/images/choco_hazelnut_front.jpg',
    description: '70% Callebaut dark chocolate sponge with roasted Turkish hazelnut gianduja cream, glossy ganache drip, and gold-dusted chocolate shards.'
  }
];

export class HomeHero {
  constructor(containerElement, onStartCustomizingCallback, onExploreCollectionCallback) {
    this.container = containerElement;
    this.onStartCustomizing = onStartCustomizingCallback;
    this.onExploreCollection = onExploreCollectionCallback;
    this.isDestroyed = false;
    this._clickHandler = null;
    this.render();
  }

  render() {
    this.detachEvents();

    this.container.innerHTML = `
      <div class="wb-home">
        <section class="wb-home-hero" aria-labelledby="home-hero-title">
          <div class="wb-home-hero__inner">
            <div class="wb-home-hero__copy">
              <p class="wb-eyebrow">Couture cakes · Bhubaneswar</p>
              <h1 id="home-hero-title">A little joy,<br /><em>made to share.</em></h1>
              <p class="wb-home-hero__lede">For grand celebrations, milestone tables, and days worth remembering. Choose a hand-finished flagship creation or craft your own bespoke tiered cake in our 3D studio.</p>

              <div class="wb-home-hero__actions">
                <button id="hero-customizer-btn" class="wb-button wb-button--primary" type="button">
                  <span>Design your cake</span>
                  <span class="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
                </button>
                <button id="hero-explore-btn" class="wb-button wb-button--outline" type="button">See the collection</button>
              </div>

              <div class="wb-home-hero__notes">
                <div><span class="material-symbols-outlined" aria-hidden="true">bakery_dining</span><span>Baked to order<br />in Bhubaneswar</span></div>
                <span class="wb-home-hero__notes-divider" aria-hidden="true"></span>
                <div><span class="material-symbols-outlined" aria-hidden="true">local_shipping</span><span>Chilled, careful<br />hand delivery</span></div>
              </div>
            </div>

            <figure class="wb-home-hero__visual">
              <div class="wb-home-hero__photo-frame">
                <img src="/assets/images/hero_couture_cake.jpg" alt="Four-tier ivory celebration cake adorned with crimson garden roses, 24K gold leaf, and macarons on an antique brass pedestal" fetchpriority="high" decoding="async" />
              </div>
              <span class="wb-home-hero__photo-index" aria-hidden="true">01</span>
              <figcaption class="wb-home-hero__photo-note">
                <small>Couture Edition · 4 Tiers</small>
                <strong>Finished by hand,<br />made for the occasion.</strong>
              </figcaption>
            </figure>
          </div>
        </section>

        <section class="wb-proof-strip" aria-label="How we craft WISHBAKE cakes">
          <div class="wb-proof-strip__inner">
            <div class="wb-proof-stat"><strong>01</strong><span>Freshly baked for your celebration date</span></div>
            <div class="wb-proof-stat"><strong>02</strong><span>Hand-piped filigree, florals, and 24K gold accents</span></div>
            <div class="wb-proof-stat"><strong>03</strong><span>Custom 1 to 5-tier builds in the live 3D studio</span></div>
          </div>
        </section>

        <section class="wb-section wb-featured" aria-labelledby="featured-title">
          <div class="wb-featured__inner">
            <div class="wb-section__heading wb-section__heading--split">
              <div>
                <p class="wb-eyebrow">Flagship creations</p>
                <h2 id="featured-title">Made here.<br /><em>Remembered there.</em></h2>
                <p>High-craft multi-tier centerpieces and signature flavours prepared fresh for Bhubaneswar tables.</p>
              </div>
              <button id="hero-view-all-btn" class="wb-text-link" type="button">Browse the collection <span aria-hidden="true">↗</span></button>
            </div>
            <div id="featured-cakes-grid" class="wb-product-grid">
              ${FEATURED_FLAGSHIPS.map(cake => this.renderCakeCard(cake)).join('')}
            </div>
          </div>
        </section>

        <section class="wb-design-callout" aria-labelledby="design-callout-title">
          <div class="wb-design-callout__copy">
            <p class="wb-eyebrow">Interactive 3D Cake Studio</p>
            <h2 id="design-callout-title">Preview every tier, flavour, and detail.</h2>
            <p>Customise up to five tiers and 15 pounds—choosing sponge, cream filling, frosting texture, toppings, brass toppers, plaque text colour, and party add-ons with instant pricing.</p>
            <button id="hero-cta-customizer-btn" class="wb-button wb-button--light" type="button">Open the cake studio <span class="material-symbols-outlined" aria-hidden="true">arrow_forward</span></button>
          </div>
          <div class="wb-design-callout__visual">
            <img src="/assets/images/saffron_rose_front.jpg" alt="Imperial 3-tier silver vark celebration cake crafted at WISHBAKE" loading="lazy" decoding="async" />
            <p class="wb-design-callout__hint"><span class="material-symbols-outlined" aria-hidden="true">view_in_ar</span>Live 3D configurator · 1 to 5 tiers</p>
          </div>
        </section>

        <section class="wb-brand-story" aria-labelledby="brand-about-title">
          <div class="wb-brand-story__inner">
            <div class="wb-brand-story__image-wrap">
              <img src="/assets/images/kesar_pista_angle.jpg" alt="Slice of saffron and pistachio cake finished with 24K gold leaf" loading="lazy" decoding="async" />
              <span class="wb-brand-story__image-note">A familiar flavour, finished with ceremony</span>
            </div>
            <div class="wb-brand-story__copy">
              <p class="wb-eyebrow">About WISHBAKE</p>
              <h2 id="brand-about-title">A good cake<br />brings people <em>closer.</em></h2>
              <p>WISHBAKE brings thoughtful design and the pleasure of a freshly baked cake to the same table. Choose a flagship centerpiece from the collection, or shape your own creation in our 3D studio.</p>
              <p>Each order is finished by hand in Bhubaneswar, with care for every detail that makes a gathering memorable.</p>
              <a class="wb-button wb-button--outline" href="#about">About WISHBAKE <span class="material-symbols-outlined" aria-hidden="true">arrow_forward</span></a>
            </div>
          </div>
        </section>

        <section class="wb-section wb-occasions" aria-labelledby="occasion-title">
          <div class="wb-occasions__inner">
            <div class="wb-section__heading">
              <p class="wb-eyebrow">Find a starting point</p>
              <h2 id="occasion-title">What’s on <em>the calendar?</em></h2>
              <p>Pick an occasion and explore cakes made for the gathering.</p>
            </div>
            <div class="wb-occasion-grid">
              <button class="wb-occasion-card" type="button" data-category="Diwali Special">
                <span class="wb-occasion-card__icon"><span class="material-symbols-outlined" aria-hidden="true">flare</span></span>
                <span class="wb-occasion-card__title">Diwali</span>
                <span class="wb-occasion-card__copy">Saffron, cardamom, and the people around the table.</span>
                <span class="wb-occasion-card__arrow" aria-hidden="true">↗</span>
              </button>
              <button class="wb-occasion-card" type="button" data-category="Birthday">
                <span class="wb-occasion-card__icon"><span class="material-symbols-outlined" aria-hidden="true">cake</span></span>
                <span class="wb-occasion-card__title">Birthdays</span>
                <span class="wb-occasion-card__copy">A cake with their favourite flavour and a personal touch.</span>
                <span class="wb-occasion-card__arrow" aria-hidden="true">↗</span>
              </button>
              <button class="wb-occasion-card" type="button" data-category="Weddings & Galas">
                <span class="wb-occasion-card__icon"><span class="material-symbols-outlined" aria-hidden="true">local_florist</span></span>
                <span class="wb-occasion-card__title">Weddings</span>
                <span class="wb-occasion-card__copy">Multi-tier grandeur and finishing details for your day.</span>
                <span class="wb-occasion-card__arrow" aria-hidden="true">↗</span>
              </button>
              <button class="wb-occasion-card" type="button" data-category="Anniversary">
                <span class="wb-occasion-card__icon"><span class="material-symbols-outlined" aria-hidden="true">favorite_border</span></span>
                <span class="wb-occasion-card__title">Anniversaries</span>
                <span class="wb-occasion-card__copy">Signature chocolate, berries, and curated gift cakes.</span>
                <span class="wb-occasion-card__arrow" aria-hidden="true">↗</span>
              </button>
            </div>
          </div>
        </section>

        <section class="wb-process" aria-labelledby="process-title">
          <div class="wb-process__inner">
            <div class="wb-section__heading">
              <p class="wb-eyebrow">From idea to table</p>
              <h2 id="process-title">Thoughtfully planned.<br /><em>Freshly baked.</em></h2>
            </div>
            <div class="wb-process__steps">
              <article class="wb-process__step"><span class="wb-process__number">01</span><h3>Choose a cake</h3><p>Start with one of our flagship creations or open the studio for a custom tiered design.</p></article>
              <article class="wb-process__step"><span class="wb-process__number">02</span><h3>Make it yours</h3><p>Set the tiers, size, flavour, icing colour, fondant plaque, and celebration add-ons.</p></article>
              <article class="wb-process__step"><span class="wb-process__number">03</span><h3>Gather around</h3><p>We bake your cake fresh and deliver chilled across serviceable Bhubaneswar PIN codes.</p></article>
            </div>
          </div>
        </section>

        <section class="wb-home-cta" aria-labelledby="home-cta-title">
          <div class="wb-home-cta__inner">
            <div>
              <p class="wb-eyebrow">Your cake, your way</p>
              <h2 id="home-cta-title">Have someone in mind?</h2>
              <p>Start with a flavour, a colour, or a multi-tier concept in our 3D studio.</p>
            </div>
            <button id="home-cta-design-btn" class="wb-button wb-button--light" type="button">Start a design <span class="material-symbols-outlined" aria-hidden="true">arrow_forward</span></button>
          </div>
        </section>

        ${renderMinimalTermsSection('home')}
      </div>
    `;

    this.attachEvents();
  }

  renderCakeCard(cake) {
    const detailHref = `#cake-detail?id=${encodeURIComponent(cake.id)}`;
    const price = formatINR(cake.price);
    return `
      <a class="wb-product-card" href="${detailHref}">
        <div class="wb-product-card__image-wrap">
          <img src="${escapeHtml(cake.image)}" alt="${escapeHtml(cake.title)}" loading="lazy" decoding="async" />
          ${cake.badge ? `<span class="wb-product-card__badge">${escapeHtml(cake.badge)}</span>` : ''}
          <span class="wb-product-card__image-arrow material-symbols-outlined" aria-hidden="true">north_east</span>
        </div>
        <div class="wb-product-card__body">
          <div class="wb-product-card__meta"><span>${escapeHtml(cake.category)}</span><span class="wb-product-card__rating"><span aria-hidden="true">★</span> ${escapeHtml(cake.rating)}</span></div>
          <h3>${escapeHtml(cake.title)}</h3>
          <p>${escapeHtml(cake.description)}</p>
          <div class="wb-product-card__footer">
            <span class="wb-product-card__price">${price}</span>
            <span class="wb-product-card__servings"><span class="material-symbols-outlined" aria-hidden="true">group</span> Serves ${escapeHtml(cake.servings)}</span>
          </div>
        </div>
      </a>
    `;
  }

  attachEvents() {
    this._clickHandler = (event) => {
      const target = event.target.closest('button, a');
      if (!target || !this.container.contains(target)) return;

      if (target.matches('#hero-customizer-btn, #hero-cta-customizer-btn, #home-cta-design-btn')) {
        event.preventDefault();
        if (typeof this.onStartCustomizing === 'function') {
          this.onStartCustomizing();
        } else {
          window.location.hash = '#customizer';
        }
        return;
      }

      if (target.matches('#hero-explore-btn, #hero-view-all-btn')) {
        event.preventDefault();
        if (typeof this.onExploreCollection === 'function') {
          this.onExploreCollection();
        } else {
          window.location.hash = '#shop';
        }
        return;
      }

      if (target.matches('.wb-occasion-card')) {
        event.preventDefault();
        const category = target.dataset.category || null;
        if (typeof this.onExploreCollection === 'function') {
          this.onExploreCollection(category);
        } else {
          window.location.hash = category ? `#shop?category=${encodeURIComponent(category)}` : '#shop';
        }
      }
    };

    this.container.addEventListener('click', this._clickHandler);
  }

  detachEvents() {
    if (this._clickHandler) {
      this.container.removeEventListener('click', this._clickHandler);
      this._clickHandler = null;
    }
  }

  destroy() {
    this.isDestroyed = true;
    this.detachEvents();
  }
}
