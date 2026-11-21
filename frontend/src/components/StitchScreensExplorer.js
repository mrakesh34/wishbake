export class StitchScreensExplorer {
  constructor(containerElement) {
    this.container = containerElement;
    this.stitchScreens = [
      { id: "ecc6b69474a646d0a39e660ac7daa332", title: "Home - WISHBAKE", category: "Core Pages", filename: "ecc6b69474a646d0a39e660ac7daa332_home___lumi_re_p_tisserie.html" },
      { id: "012f019719c14660a84b006280b04120", title: "Shop Our Creations", category: "Core Pages", filename: "012f019719c14660a84b006280b04120_shop_our_creations___lumi_re_p_tisserie.html" },
      { id: "2d08218f625741318651ff08698e0846", title: "Customizer: Step 1 - Foundation", category: "Standard Customizer", filename: "2d08218f625741318651ff08698e0846_customizer__step_1___foundation.html" },
      { id: "c96898c753f24b4681cd87996b086acb", title: "Customizer: Step 1 - Foundation (with Quick Start)", category: "Standard Customizer", filename: "c96898c753f24b4681cd87996b086acb_customizer__step_1___foundation__with_quick_start_.html" },
      { id: "64d4c12bee5c4caf9df5bc5ed17acb9e", title: "Customizer: Step 1 - Foundation (Diwali Special)", category: "Diwali Special Customizer", filename: "64d4c12bee5c4caf9df5bc5ed17acb9e_customizer__step_1___foundation__diwali_special_.html" },
      { id: "61c138beac7d49d89d41eee4a3db185c", title: "Customizer: Step 2 - Flavors", category: "Standard Customizer", filename: "61c138beac7d49d89d41eee4a3db185c_customizer__step_2___flavors.html" },
      { id: "6dd5ca4186d14601aea54573e306c5aa", title: "Customizer: Step 2 - Flavors (Diwali Special)", category: "Diwali Special Customizer", filename: "6dd5ca4186d14601aea54573e306c5aa_customizer__step_2___flavors__diwali_special_.html" },
      { id: "7fcf154978be4beab699cea9b290e447", title: "Customizer: Step 2 - Flavors (Traditional Infusions)", category: "Standard Customizer", filename: "7fcf154978be4beab699cea9b290e447_customizer__step_2___flavors__traditional_infusions_.html" },
      { id: "3d1067ff073b4887a245bf2a4f0f3c6f", title: "Customizer: Step 3 - Decoration", category: "Standard Customizer", filename: "3d1067ff073b4887a245bf2a4f0f3c6f_customizer__step_3___decoration.html" },
      { id: "93dffd4a0bff4bf19d5f6f42059df9e5", title: "Customizer: Step 3 - Decoration (Diwali Special)", category: "Diwali Special Customizer", filename: "93dffd4a0bff4bf19d5f6f42059df9e5_customizer__step_3___decoration__diwali_special_.html" },
      { id: "e28cc314211b464bac20e47970538fef", title: "Customizer: Step 4 - Review", category: "Standard Customizer", filename: "e28cc314211b464bac20e47970538fef_customizer__step_4___review.html" },
      { id: "b7c511602de34ef6b428ec461f202db6", title: "Customizer: Step 4 - Review (Diwali Special)", category: "Diwali Special Customizer", filename: "b7c511602de34ef6b428ec461f202db6_customizer__step_4___review__diwali_special_.html" }
    ];

    this.selectedScreen = this.stitchScreens[0];
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <section class="max-w-7xl mx-auto px-6 py-8">
        
        <div class="bg-amber-50 border border-amber-200 rounded-3xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-amber-800">grid_view</span>
              <h1 class="font-display text-2xl font-bold text-amber-900">100% Stitch UI Screen Gallery</h1>
            </div>
            <p class="text-xs text-amber-800 mt-1">Browse all 14+ imported screens generated in Stitch (Core pages, Diwali specials, QuickStarts, Infusions, Tiers & Reviews).</p>
          </div>

          <div class="flex items-center gap-2 w-full md:w-auto">
            <span class="text-xs font-bold text-amber-900 uppercase">Select Screen:</span>
            <select id="stitch-screen-selector" class="w-full md:w-80 px-4 py-2 text-xs rounded-full border border-amber-300 bg-white font-medium text-amber-900 focus:outline-none">
              ${this.stitchScreens.map(s => `
                <option value="${s.id}" ${this.selectedScreen.id === s.id ? 'selected' : ''}>[${s.category}] ${s.title}</option>
              `).join('')}
            </select>
          </div>
        </div>

        <!-- Rendered Screen Sandbox -->
        <div class="bg-white rounded-3xl overflow-hidden shadow-2xl border border-outline-variant/40 relative min-h-[700px]">
          
          <div class="bg-surface-container-low px-6 py-3 border-b border-outline-variant/30 flex items-center justify-between text-xs text-on-surface-variant">
            <span class="font-bold text-primary flex items-center gap-1.5">
              <span class="material-symbols-outlined text-base">web</span>
              <span>Active Stitch View: ${this.selectedScreen.title}</span>
            </span>
            <span class="font-mono text-[11px] bg-white px-3 py-1 rounded-full border border-outline-variant">ID: ${this.selectedScreen.id}</span>
          </div>

          <!-- Screen Frame -->
          <div class="relative w-full h-[850px] overflow-y-auto">
            <img src="/assets/images/screen_${this.selectedScreen.id}.jpg" alt="${this.selectedScreen.title}" class="w-full h-auto object-top shadow-md" />
          </div>

        </div>

      </section>
    `;

    this.attachEvents();
  }

  attachEvents() {
    const selector = this.container.querySelector('#stitch-screen-selector');
    if (selector) {
      selector.addEventListener('change', (e) => {
        const selectedId = e.target.value;
        const found = this.stitchScreens.find(s => s.id === selectedId);
        if (found) {
          this.selectedScreen = found;
          this.render();
        }
      });
    }
  }
}
