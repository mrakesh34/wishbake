import { renderMinimalTermsSection } from './TermsSection.js';

export class AboutView {
  constructor(containerElement) {
    this.container = containerElement;
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="wb-about">
        <section class="wb-about__hero" aria-labelledby="about-title">
          <div class="wb-page-width">
            <p class="wb-eyebrow">A little about WISHBAKE</p>
            <div class="wb-about__hero-grid">
              <h1 id="about-title">From the first sketch<br />to the <em>last slice.</em></h1>
              <p>WISHBAKE is a bakery and cake studio in Bhubaneswar, bringing together personal design and the pleasure of a cake made for your table.</p>
            </div>
          </div>
        </section>

        <section class="wb-about__story" aria-labelledby="about-story-title">
          <div class="wb-page-width wb-about__story-grid">
            <figure class="wb-about__image">
              <img src="/assets/images/gulab_cheesecake.jpg" alt="A saffron and rose finished celebration cake" loading="lazy" decoding="async" />
              <figcaption>Thoughtful details, finished by hand.</figcaption>
            </figure>
            <div class="wb-about__story-copy">
              <p class="wb-eyebrow">The thought behind it</p>
              <h2 id="about-story-title">A cake should feel like it belongs to <em>your day.</em></h2>
              <p>Some celebrations call for a familiar favourite. Others begin with a colour, a flavour, or an idea you haven’t quite put into words yet. WISHBAKE gives you room to start either way.</p>
              <p>Pick a signature cake from the collection, or use the 3D studio to shape a design around the occasion. Our kitchen prepares the order and finishes the details by hand.</p>
              <a href="#shop" class="wb-button wb-button--outline">Explore the collection <span class="material-symbols-outlined" aria-hidden="true">arrow_forward</span></a>
            </div>
          </div>
        </section>

        <section class="wb-about__approach" aria-labelledby="about-approach-title">
          <div class="wb-page-width">
            <div class="wb-section__heading">
              <p class="wb-eyebrow">A simple way to begin</p>
              <h2 id="about-approach-title">A little more personal,<br /><em>at every step.</em></h2>
            </div>
            <div class="wb-about__approach-grid">
              <article><span>01</span><h3>Start with the occasion</h3><p>Browse cakes for birthdays, weddings, Diwali, and the days that don’t need a label.</p></article>
              <article><span>02</span><h3>Choose the details</h3><p>Set the size, sponge, filling, colour, and finishing touches in the cake studio.</p></article>
              <article><span>03</span><h3>Make room at the table</h3><p>Choose delivery details at checkout and leave the final finishing to our kitchen.</p></article>
            </div>
          </div>
        </section>

        <section class="wb-about__studio" aria-labelledby="about-studio-title">
          <div class="wb-page-width wb-about__studio-inner">
            <div>
              <p class="wb-eyebrow">The WISHBAKE cake studio</p>
              <h2 id="about-studio-title">See the idea<br />before it’s <em>baked.</em></h2>
              <p>Build a cake one choice at a time. The live preview turns with your design, and the price updates as you go.</p>
              <a href="#customizer" class="wb-button wb-button--light">Open the 3D studio <span class="material-symbols-outlined" aria-hidden="true">arrow_forward</span></a>
            </div>
            <img src="/assets/images/choco_hazelnut_front.jpg" alt="Chocolate and hazelnut celebration cake" loading="lazy" decoding="async" />
          </div>
        </section>

        <section class="wb-about__contact">
          <div class="wb-page-width wb-about__contact-inner">
            <p class="wb-eyebrow">A special order in mind?</p>
            <h2>Tell us what you’re<br /><em>celebrating.</em></h2>
            <a href="mailto:concierge@wishbake.com" class="wb-text-link">Write to the bakery <span aria-hidden="true">↗</span></a>
          </div>
        </section>

        ${renderMinimalTermsSection('about')}
      </div>
    `;
  }
}
