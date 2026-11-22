import { animate } from 'motion';
import { Cake3DViewer } from './Cake3DViewer.js';
import { apiUrl } from '../services/api.js';

export class HomeHero {
  constructor(containerElement, onStartCustomizingCallback, onExploreCollectionCallback) {
    this.container = containerElement;
    this.onStartCustomizing = onStartCustomizingCallback;
    this.onExploreCollection = onExploreCollectionCallback;
    this.viewer = null;
    this.motionControls = [];
    this.isDestroyed = false;
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="wb-home">
        <section class="wb-home-hero" aria-labelledby="home-hero-title">
          <div class="wb-home-hero__inner">
            <div class="wb-home-hero__copy">
              <p class="wb-eyebrow" data-motion-in>Bespoke cake studio · Bhubaneswar</p>
              <h1 id="home-hero-title" data-motion-in>A centrepiece<br />with <em>your name</em><br />on it.</h1>
              <p class="wb-home-hero__lede" data-motion-in>Choose a cake from our collection or sketch out your own in the WISHBAKE cake studio. We’ll bake it fresh and finish it by hand.</p>

              <div class="wb-home-hero__actions" data-motion-in>
                <button id="hero-customizer-btn" class="wb-button wb-button--primary" type="button">
                  <span>Design your cake</span>
                  <span class="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
                </button>
                <button id="hero-explore-btn" class="wb-button wb-button--outline" type="button">See the collection</button>
              </div>

              <div class="wb-home-hero__notes" data-motion-in>
                <div><span class="material-symbols-outlined" aria-hidden="true">bakery_dining</span><span>Baked to order<br />in Bhubaneswar</span></div>
                <span class="wb-home-hero__notes-divider" aria-hidden="true"></span>
                <div><span class="material-symbols-outlined" aria-hidden="true">local_shipping</span><span>Chilled, careful<br />hand delivery</span></div>
              </div>
            </div>

            <figure class="wb-home-hero__visual" data-motion-in>
              <div class="wb-home-hero__photo-frame">
                <img src="/assets/images/rasmalai_royale_angle.jpg" alt="Hand-finished celebration cake decorated with marigold flowers" fetchpriority="high" decoding="async" />
              </div>
              <span class="wb-home-hero__photo-index" aria-hidden="true">01</span>
              <figcaption class="wb-home-hero__photo-note">
                <small>From the WISHBAKE kitchen</small>
                <strong>Finished by hand,<br />made to be shared.</strong>
              </figcaption>
            </figure>
          </div>
        </section>

        <section class="wb-proof-strip" aria-label="How we make WISHBAKE cakes">
          <div class="wb-proof-strip__inner">
            <div class="wb-proof-stat"><strong>01</strong><span>Made to order for your date</span></div>
            <div class="wb-proof-stat"><strong>02</strong><span>Finished by hand in our kitchen</span></div>
            <div class="wb-proof-stat"><strong>03</strong><span>Personalise it in the cake studio</span></div>
          </div>
        </section>

        <section class="wb-section wb-featured" aria-labelledby="featured-title">
          <div class="wb-featured__inner">
            <div class="wb-section__heading wb-section__heading--split">
              <div>
                <p class="wb-eyebrow">A few from the counter</p>
                <h2 id="featured-title">Made here.<br /><em>Remembered there.</em></h2>
                <p>Signature cakes for birthdays, big tables, and the days you simply want cake.</p>
              </div>
              <button id="hero-view-all-btn" class="wb-text-link" type="button">Browse the collection <span aria-hidden="true">↗</span></button>
            </div>
            <div id="featured-cakes-grid" class="wb-product-grid" aria-live="polite" aria-busy="true"></div>
          </div>
        </section>

        <section class="wb-design-callout" aria-labelledby="design-callout-title">
          <div class="wb-design-callout__copy">
            <p class="wb-eyebrow">A preview of your design</p>
            <h2 id="design-callout-title">Try a few ideas on for size.</h2>
            <p>Change the shape, layers, colours, and finish in the 3D studio. You’ll see the price update as you make your choices.</p>
            <button id="hero-cta-customizer-btn" class="wb-button wb-button--light" type="button">Open the cake studio <span class="material-symbols-outlined" aria-hidden="true">arrow_forward</span></button>
          </div>
          <div class="wb-design-callout__visual" aria-label="Interactive 3D cake preview">
            <div id="hero-3d-viewer" class="three-canvas-container" role="img" aria-label="Rotating 3D preview of a custom WISHBAKE cake"></div>
            <p class="wb-design-callout__hint"><span class="material-symbols-outlined" aria-hidden="true">360</span>Drag to turn the cake</p>
          </div>
        </section>

        <section class="wb-brand-story" aria-labelledby="brand-story-title">
          <div class="wb-brand-story__inner">
            <div class="wb-brand-story__image-wrap" data-motion-in>
              <img src="/assets/images/kesar_pista_angle.jpg" alt="A slice of saffron and pistachio cake" loading="lazy" decoding="async" />
              <span class="wb-brand-story__image-note">A familiar flavour, with a little ceremony</span>
            </div>
            <div class="wb-brand-story__copy">
              <p class="wb-eyebrow">A little about us</p>
              <h2 id="brand-story-title">A good cake<br />brings people <em>closer.</em></h2>
              <p>WISHBAKE brings thoughtful design and the pleasure of a freshly baked cake to the same table. Choose a favourite from the collection, or shape something of your own in the studio.</p>
              <p>Each order is finished by hand, with care for the details that make a celebration feel personal.</p>
              <a class="wb-button wb-button--outline" href="#about">Our story <span class="material-symbols-outlined" aria-hidden="true">arrow_forward</span></a>
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
                <span class="wb-occasion-card__copy">Tiers and finishing details for a long-awaited day.</span>
                <span class="wb-occasion-card__arrow" aria-hidden="true">↗</span>
              </button>
              <button class="wb-occasion-card" type="button" data-category="Anniversary">
                <span class="wb-occasion-card__icon"><span class="material-symbols-outlined" aria-hidden="true">favorite_border</span></span>
                <span class="wb-occasion-card__title">Anniversaries</span>
                <span class="wb-occasion-card__copy">A small reason to make a lovely evening of it.</span>
                <span class="wb-occasion-card__arrow" aria-hidden="true">↗</span>
              </button>
            </div>
          </div>
        </section>

        <section class="wb-process" aria-labelledby="process-title">
          <div class="wb-process__inner">
            <div class="wb-section__heading">
              <p class="wb-eyebrow">From idea to table</p>
              <h2 id="process-title">A little planning.<br /><em>A lot of cake.</em></h2>
            </div>
            <div class="wb-process__steps">
              <article class="wb-process__step"><span class="wb-process__number">01</span><h3>Choose a cake</h3><p>Start with one of our signature creations or open the studio for a custom design.</p></article>
              <article class="wb-process__step"><span class="wb-process__number">02</span><h3>Make it yours</h3><p>Set the size, flavour, colour, and finishing touches that suit the occasion.</p></article>
              <article class="wb-process__step"><span class="wb-process__number">03</span><h3>Gather around</h3><p>We prepare your cake for the date and delivery details you provide at checkout.</p></article>
            </div>
          </div>
        </section>

        <section class="wb-home-cta" aria-labelledby="home-cta-title">
          <div class="wb-home-cta__inner">
            <div>
              <p class="wb-eyebrow">Your cake, your way</p>
              <h2 id="home-cta-title">Have someone in mind?</h2>
              <p>Start with a flavour, a colour, or a sketch. We’ll take it from there.</p>
            </div>
            <button id="home-cta-design-btn" class="wb-button wb-button--light" type="button">Start a design <span class="material-symbols-outlined" aria-hidden="true">arrow_forward</span></button>
          </div>
        </section>
      </div>
    `;

    this.mountViewer();
    this.loadFeaturedCakes();
    this.attachEvents();
    this.playEntrance(this.container.querySelectorAll('.wb-home-hero [data-motion-in]'), 0.06);
  }

  playEntrance(elements, delayStep = 0.05) {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    Array.from(elements).forEach((element, index) => {
      this.motionControls.push(animate(element, { opacity: [0, 1], y: [12, 0] }, {
        duration: 0.48,
        delay: index * delayStep,
        ease: [0.22, 1, 0.36, 1]
      }));
    });
  }

  mountViewer() {
    const viewerContainer = this.container.querySelector('#hero-3d-viewer');
    if (!viewerContainer) return;
    this.viewer = new Cake3DViewer(viewerContainer);
    this.viewer.updateCake({
      tiers: 2,
      shape: 'round',
      size: '8in',
      base_frosting: 'smooth',
      icing_color: '#e8c9c9',
      piping_style: 'pearl',
      toppings: ['gold_leaf', 'macarons'],
      inscription: ''
    });
  }

  async loadFeaturedCakes() {
    const grid = this.container.querySelector('#featured-cakes-grid');
    if (!grid) return;
    grid.innerHTML = Array(3).fill('<div class="wb-product-skeleton" aria-hidden="true"></div>').join('');

    try {
      const response = await fetch(apiUrl('/api/cakes'));
      if (!response.ok) throw new Error(`Catalog request failed (${response.status})`);
      const data = await response.json();
      if (this.isDestroyed) return;
      if (data.status !== 'success' || !Array.isArray(data.data)) throw new Error('Catalog response was not available.');

      const featured = data.data.slice(0, 3);
      if (!featured.length) {
        grid.innerHTML = this.emptyCatalogMessage('Our next batch of cakes is on its way.');
      } else {
        grid.innerHTML = featured.map(cake => this.renderCakeCard(cake)).join('');
        this.playEntrance(grid.querySelectorAll('[data-motion-card]'), 0.07);
      }
    } catch (error) {
      if (this.isDestroyed) return;
      console.warn('Could not load featured cakes', error);
      grid.innerHTML = this.emptyCatalogMessage('The collection is having a moment. Please try the full shop.');
    } finally {
      if (!this.isDestroyed) grid.setAttribute('aria-busy', 'false');
    }
    grid.querySelector('[data-open-shop]')?.addEventListener('click', () => this.onExploreCollection());
  }

  emptyCatalogMessage(message) {
    return `
      <div class="wb-featured-empty">
        <span class="material-symbols-outlined" aria-hidden="true">cake</span>
        <p>${message}</p>
        <button class="wb-text-link" type="button" data-open-shop>Visit the shop <span aria-hidden="true">↗</span></button>
      </div>
    `;
  }

  renderCakeCard(cake) {
    const detailHref = `#cake-detail?id=${encodeURIComponent(cake.id)}`;
    const price = Number(cake.price || 0).toLocaleString('en-IN');
    return `
      <a class="wb-product-card" data-motion-card href="${detailHref}">
        <div class="wb-product-card__image-wrap">
          <img src="${cake.image}" alt="${cake.title}" loading="lazy" decoding="async" />
          ${cake.badge ? `<span class="wb-product-card__badge">${cake.badge}</span>` : ''}
          <span class="wb-product-card__image-arrow material-symbols-outlined" aria-hidden="true">north_east</span>
        </div>
        <div class="wb-product-card__body">
          <div class="wb-product-card__meta"><span>${cake.category}</span><span class="wb-product-card__rating"><span aria-hidden="true">★</span> ${cake.rating}</span></div>
          <h3>${cake.title}</h3>
          <p>${cake.description}</p>
          <div class="wb-product-card__footer">
            <span class="wb-product-card__price">₹${price}</span>
            <span class="wb-product-card__servings"><span class="material-symbols-outlined" aria-hidden="true">group</span> Serves ${cake.servings}</span>
          </div>
        </div>
      </a>
    `;
  }

  attachEvents() {
    this.container.querySelectorAll('#hero-customizer-btn, #hero-cta-customizer-btn, #home-cta-design-btn').forEach(button => {
      button.addEventListener('click', () => this.onStartCustomizing());
    });
    this.container.querySelectorAll('#hero-explore-btn, #hero-view-all-btn').forEach(button => {
      button.addEventListener('click', () => this.onExploreCollection());
    });
    this.container.querySelectorAll('.wb-occasion-card').forEach(button => {
      button.addEventListener('click', () => this.onExploreCollection(button.dataset.category));
    });
  }

  destroy() {
    this.isDestroyed = true;
    this.motionControls.forEach(control => control.stop());
    this.motionControls = [];
    if (this.viewer) {
      this.viewer.destroy();
      this.viewer = null;
    }
  }
}
