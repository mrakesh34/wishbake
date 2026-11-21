/**
 * ScrollAnimator — Reusable scroll-driven animation manager
 * Uses IntersectionObserver for performant scroll-triggered reveals
 */
export class ScrollAnimator {
  constructor() {
    this.observers = [];
    this.progressBar = null;
    this.countersAnimated = new Set();

    this.init();
  }

  init() {
    this.createProgressBar();
    this.setupScrollProgress();
  }

  /**
   * Create the fixed scroll progress bar at the top of the viewport
   */
  createProgressBar() {
    let bar = document.getElementById('scroll-progress-bar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'scroll-progress-bar';
      bar.style.width = '0%';
      document.body.prepend(bar);
    }
    this.progressBar = bar;
  }

  /**
   * Listen to scroll events to update the progress bar width
   */
  setupScrollProgress() {
    this._scrollHandler = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      if (this.progressBar) {
        this.progressBar.style.width = `${Math.min(progress, 100)}%`;
      }
    };

    window.addEventListener('scroll', this._scrollHandler, { passive: true });
  }

  /**
   * Observe all elements with scroll-reveal classes within a container
   */
  observeElements(container) {
    if (!container) return;

    const revealClasses = [
      'scroll-reveal',
      'scroll-reveal-left',
      'scroll-reveal-right',
      'scroll-reveal-scale'
    ];

    const allElements = [];
    revealClasses.forEach(cls => {
      container.querySelectorAll(`.${cls}`).forEach(el => allElements.push(el));
    });

    if (allElements.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -60px 0px'
    });

    allElements.forEach(el => observer.observe(el));
    this.observers.push(observer);
  }

  /**
   * Animate a counter element from 0 to its target value
   */
  animateCounter(element, target, duration = 2000, suffix = '') {
    if (!element || this.countersAnimated.has(element)) return;
    this.countersAnimated.add(element);

    const startTime = performance.now();
    const startValue = 0;

    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.round(startValue + (target - startValue) * eased);

      element.textContent = currentValue.toLocaleString() + suffix;

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  }

  /**
   * Observe counter elements and trigger animation when visible
   */
  observeCounters(container) {
    if (!container) return;

    const counterElements = container.querySelectorAll('[data-counter-target]');
    if (counterElements.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.dataset.counterTarget, 10);
          const suffix = el.dataset.counterSuffix || '';
          const duration = parseInt(el.dataset.counterDuration || '2000', 10);
          this.animateCounter(el, target, duration, suffix);
          observer.unobserve(el);
        }
      });
    }, {
      threshold: 0.5
    });

    counterElements.forEach(el => observer.observe(el));
    this.observers.push(observer);
  }

  /**
   * Disconnect all observers and remove event listeners
   */
  destroy() {
    this.observers.forEach(obs => obs.disconnect());
    this.observers = [];
    this.countersAnimated.clear();

    if (this._scrollHandler) {
      window.removeEventListener('scroll', this._scrollHandler);
    }
  }
}
