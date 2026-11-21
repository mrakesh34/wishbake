export class AboutView {
  constructor(containerElement) {
    this.container = containerElement;
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <section class="max-w-7xl mx-auto px-6 py-16">
        <div class="text-center max-w-2xl mx-auto mb-16">
          <span class="bg-primary/10 text-primary text-xs uppercase font-bold tracking-widest px-4 py-1.5 rounded-full inline-block mb-3">Brand Heritage</span>
          <h1 class="font-display text-4xl font-bold text-on-surface">The Story of WISHBAKE</h1>
          <p class="text-on-surface-variant text-sm mt-3 leading-relaxed">Blending classical French patisserie technique with innovative 3D digital custom design and vibrant royal spice infusions.</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
          <div class="space-y-6">
            <h2 class="font-display text-3xl font-bold text-on-surface">Digital Indulgence & Artisanal Craft</h2>
            <p class="text-on-surface-variant text-sm leading-relaxed">
              Founded with a vision to redefine celebration centerpieces, WISHBAKE bridges the gap between digital custom design and physical culinary excellence. Every cake is designed collaboratively with you using our real-time 3D WebGL studio before being brought to life by master pastry chefs.
            </p>
            <p class="text-on-surface-variant text-sm leading-relaxed">
              We source only the finest global ingredients: 24k gold leaf, organic marigold petals, Valrhona dark chocolate, Kashmiri saffron, and organic Madagascar vanilla beans.
            </p>

            <div class="grid grid-cols-2 gap-4 pt-4 border-t border-outline-variant/30">
              <div class="bg-surface-container p-4 rounded-2xl">
                <span class="font-display font-bold text-2xl text-primary">100%</span>
                <span class="text-xs text-on-surface-variant block mt-1">Freshly Baked Daily</span>
              </div>
              <div class="bg-surface-container p-4 rounded-2xl">
                <span class="font-display font-bold text-2xl text-primary">24K</span>
                <span class="text-xs text-on-surface-variant block mt-1">Certified Edible Gold</span>
              </div>
            </div>
          </div>

          <div class="relative">
            <img src="/assets/images/kitchen_about.jpg" alt="Our Kitchen Studio" class="w-full h-96 object-cover rounded-3xl shadow-xl border border-outline-variant/40" />
          </div>
        </div>
      </section>
    `;
  }
}
