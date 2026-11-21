# WISHBAKE — Project Reference Guide

> **Read this file first** before exploring the codebase. It gives the complete architecture,
> file map, API contracts, and instructions needed to work on this project.

---

## Brand & Identity

| Key            | Value                                                      |
|----------------|-----------------------------------------------------------|
| **Brand Name** | WISHBAKE                                                   |
| **Tagline**    | Digital Indulgence & Haute Confectionery                   |
| **Domain**     | wishbake.com                                               |
| **Order Prefix** | `WISH-XXXXXXXX`                                          |
| **Contact**    | concierge@wishbake.com                                     |

---

## Tech Stack

| Layer       | Technology                          | Details                                  |
|-------------|-------------------------------------|------------------------------------------|
| **Frontend**| Vanilla JS + Vite 5                | SPA with hash-based routing              |
| **3D**      | Three.js (v0.160)                  | WebGL cake builder/viewer                |
| **Styling** | Tailwind CSS (CDN) + custom CSS    | Material Design 3 inspired color tokens  |
| **Fonts**   | Playfair Display + Plus Jakarta Sans | Google Fonts CDN                        |
| **Icons**   | Material Symbols Outlined          | Google Fonts CDN                         |
| **Backend** | FastAPI + Uvicorn                  | Python 3.14, auto-reload enabled         |
| **Models**  | Pydantic v2                        | Request/response validation              |
| **Database**| In-memory dict (ORDERS_DB)         | ⚠️ PostgreSQL integration **PENDING**    |

---

## How to Run

```bash
# Terminal 1 — Backend (from project root)
python -m uvicorn backend.main:app --reload
# → http://127.0.0.1:8000

# Terminal 2 — Frontend
cd frontend
npm run dev
# → http://localhost:5173
```

The Vite dev server proxies `/api` requests to the backend (configured in `vite.config.js`).

---

## Directory Structure

```
BAKERIES/
├── PROJECT.md                ← THIS FILE (read first)
│
├── backend/                  ← FastAPI REST API
│   ├── main.py               ← App entry: FastAPI instance, CORS, router mounting, health check
│   ├── models.py             ← Pydantic models (CustomizerSelection, OrderItem, etc.)
│   ├── data.py               ← In-memory catalog (PRESET_CAKES, CUSTOMIZER_OPTIONS, ORDERS_DB)
│   ├── requirements.txt      ← Python deps: fastapi, uvicorn, pydantic
│   └── routes/
│       ├── __init__.py        ← Empty package init
│       ├── catalog.py         ← GET /api/cakes, GET /api/cakes/{id}, GET /api/customizer/options
│       └── orders.py          ← POST /api/customizer/price, POST /api/orders, GET /api/orders/{id}
│
├── frontend/                 ← Vite SPA
│   ├── index.html            ← Shell: navbar, footer, cart drawer, checkout modal, success modal
│   ├── vite.config.js        ← Dev server on :5173, proxy /api → :8000
│   ├── package.json          ← name: wishbake-frontend, deps: three, vite
│   ├── public/form, POST /api/orders, success modal
│       │   ├── ScrollAnimator.js     ← IntersectionObserver-based scroll reveal animations
│       │   │                            + scroll progress bar + counter animations
│       │   └── StitchScreensExplorer.js ← Design mockup browser (Stitch-generated screens)
│       └── stitch_screens/           ← Static HTML design mockups (reference only, not live)
└── .git/                             ← Both frontend/ and backend/ have separate git repos
```
│   │   └── assets/images/    ← Product images (JPG) used by the catalog
│   └── src/
│       ├── main.js            ← App class: hash router, page mounting, cart state
│       ├── style.css          ← Custom CSS: scroll reveals, glassmorphism, animations, orbs
│       ├── components/
│       │   ├── HomeHero.js           ← Landing page: hero with 3D viewer, stats, how-it-works,
│       │   │                            featured cakes (fetched from API), testimonials, CTA
│       │   ├── ShopGallery.js        ← Cake catalog grid with category filter & search
│       │   ├── SingleCakeDetail.js   ← Individual cake detail page (fetched by ID)
│       │   ├── CustomizerStudio.js   ← Full 3D cake builder (tiers, shape, size, color,
│       │   │                            toppings, inscription) with live 3D preview & pricing
│       │   ├── AboutView.js          ← Brand story / "Our Story" page
│       │   ├── Cake3DViewer.js       ← Three.js WebGL renderer: builds cake geometry from
│       │   │                            selection params (tiers, shape, color, toppings, etc.)
│       │   ├── CartDrawer.js         ← Slide-out cart panel: add/remove items, quantity,
│       │   │                            checkout 

---

## Frontend Architecture

### Routing (Hash-based SPA)

| Hash            | Component              | Description                           |
|-----------------|------------------------|---------------------------------------|
| `#home`         | `HomeHero`             | Landing page with 3D hero, stats, CTA |
| `#shop`         | `ShopGallery`          | Filterable cake catalog grid          |
| `#cake-detail?id=<cakeId>` | `SingleCakeDetail` | Individual cake detail page    |
| `#customizer`   | `CustomizerStudio`     | Interactive 3D cake builder           |
| `#about`        | `AboutView`            | Brand story page                      |

### Component Lifecycle

Every page component follows this pattern:
- **Constructor** receives `containerElement` + callback functions
- **render()** sets `this.container.innerHTML` with full page HTML
- **destroy()** (optional) cleans up Three.js, observers, event listeners
- The `App` class in `main.js` calls `destroy()` before mounting a new page

### State Management

- **Cart state** lives in `App.cartState[]` (array of `OrderItem` objects)
- **CartDrawer** is a singleton that persists across page navigations
- **No external state library** — cart is passed via callbacks

### Key UI Elements (defined in `index.html`, not components)

| Element                | ID / Location    | Notes                                  |
|------------------------|------------------|----------------------------------------|
| Navbar                 | `<header>`       | Fixed top, responsive mobile menu      |
| Cart drawer            | `#cart-overlay`  | Slide-out right panel                  |
| Checkout modal         | `#checkout-modal`| Form overlay for delivery details      |
| Order success modal    | `#order-success-modal` | Post-order confirmation          |
| Scroll progress bar    | `#scroll-progress-bar` | Fixed top gradient bar           |

---

## Backend API Reference

Base URL: `http://127.0.0.1:8000`

### Health

```
GET /health
→ { "status": "healthy", "service": "WISHBAKE Backend API", "version": "1.0.0" }
```

### Catalog

```
GET /api/cakes
GET /api/cakes?category=Birthday&search=rose
→ { "status": "success", "count": N, "data": [ ...cakes ] }

GET /api/cakes/{cake_id}
→ { "status": "success", "data": { ...cake } }

GET /api/customizer/options
→ { "status": "success", "data": { shapes, sizes, tiers, base_frosting, sponge_flavors, filling_flavors, toppings, piping_styles } }
```

### Pricing

```
POST /api/customizer/price
Body: { "selection": { tiers, shape, size, base_frosting, sponge_flavor, filling_flavor, icing_color, piping_style, toppings[], inscription? } }
→ { base_price, tiers_extra, toppings_extra, inscription_extra, total_price, currency, weight_kg, estimated_servings }
```

### Orders

```
POST /api/orders
Body: { customer_name, customer_email, customer_phone, delivery_address, delivery_date, special_instructions?, items[] }
→ { order_id: "WISH-XXXXXXXX", customer_name, total_amount, currency, status, created_at, delivery_date, items[] }

GET /api/orders/{order_id}
→ Same OrderResponse schema
```

---

## Pydantic Models (backend/models.py)

| Model                    | Purpose                                           |
|--------------------------|-------------------------------------------------|
| `CustomizerSelection`    | All cake config params (tiers, shape, size, etc.) |
| `PriceCalculationRequest`| Wraps a `CustomizerSelection` for pricing         |
| `PriceCalculationResponse`| Itemized price breakdown + weight/servings       |
| `OrderItem`              | Single item in an order (custom or preset)        |
| `CreateOrderRequest`     | Customer info + list of `OrderItem`               |
| `OrderResponse`          | Confirmed order with generated ID + totals        |

---

## Catalog Data (backend/data.py)

### Preset Cakes (6 items)

| ID                         | Title                              | Category         | Price  |
|----------------------------|------------------------------------|------------------|--------|
| `cake-gulab-cheesecake`    | Royal Gulab Jamun Cheesecake       | Diwali Special   | $68    |
| `cake-marigold-elegance`   | Marigold & Saffron 2-Tier Dream    | Weddings & Galas | $145   |
| `cake-rose-pistachio`      | Persian Rose & Pistachio Cloud     | Birthday         | $54    |
| `cake-wishbake-signature`  | WISHBAKE Strawberry Gold Royale    | Birthday         | $72    |
| `cake-dark-truffle`        | Midnight Dark Chocolate Truffle    | Anniversary      | $62    |
| `cake-citrus-berry-bliss`  | Citrus Blossom & Elderflower       | Anniversary      | $58    |

### Customizer Options

- **Shapes**: round, square, hexagon
- **Sizes**: 6in ($45), 8in ($65), 10in ($90)
- **Tiers**: 1 (×1.0), 2 (×1.7 + $45), 3 (×2.4 + $95)
- **Base Frosting**: smooth, semi-naked, textured (+$8), ruffled (+$15)
- **Sponge Flavors**: vanilla, chocolate, red_velvet, pistachio, saffron
- **Filling Flavors**: cream, dulce (+$5), raspberry (+$6), gulab_jamun (+$12), white_choc (+$8)
- **Toppings**: gold_leaf ($12), silver_vark ($8), marigolds ($10), macarons ($15), berries ($9)
- **Piping**: none, pearl (+$5), shell (+$6), rosette (+$10)
- **Inscription**: +$5 if provided

---

## Design System (Tailwind Config in index.html)

### Color Tokens (Material Design 3 inspired)

| Token                     | Hex       | Usage                        |
|---------------------------|-----------|------------------------------|
| `primary`                 | `#a03a57` | Buttons, links, accents      |
| `primary-container`       | `#ff85a2` | Badges, hover fills          |
| `on-primary`              | `#ffffff` | Text on primary backgrounds  |
| `surface`                 | `#fff8f6` | Page background              |
| `on-surface`              | `#201a19` | Primary text                 |
| `on-surface-variant`      | `#554245` | Secondary text               |
| `outline-variant`         | `#dbc0c4` | Borders, dividers            |
| `surface-container`       | `#f7ebe9` | Card backgrounds             |

### Fonts

| Token     | Font Family           | Usage              |
|-----------|-----------------------|--------------------|
| `display` | Playfair Display      | Headings, prices   |
| `body`    | Plus Jakarta Sans     | Body text, UI      |

### Custom CSS Classes (style.css)

| Class                  | Effect                                         |
|------------------------|-------------------------------------------------|
| `.scroll-reveal`       | Fade-up on scroll (IntersectionObserver)         |
| `.scroll-reveal-left`  | Slide-in from left on scroll                     |
| `.scroll-reveal-right` | Slide-in from right on scroll                    |
| `.scroll-reveal-scale` | Scale-up on scroll                               |
| `.gradient-text`       | Animated gradient text fill                      |
| `.glass-card`          | Glassmorphism card with blur backdrop             |
| `.tilt-card`           | 3D perspective tilt on hover                     |
| `.float-badge`         | Floating vertical animation                      |
| `.animated-border`     | Rotating gradient border animation               |
| `.cta-gradient`        | Animated gradient background for CTA sections    |
| `.section-divider`     | Horizontal gradient line                         |

---

## 3D Cake Viewer (Cake3DViewer.js)

Built with **Three.js**. Key capabilities:
- Generates cake geometry procedurally from `CustomizerSelection` params
- Supports 1–3 tiers with round / square / hexagon shapes
- Dynamic icing color via `MeshStandardMaterial`
- Topping decorations (gold leaf spheres, macarons, berries, etc.)
- Text inscription rendered as a colored band
- Mouse drag to rotate, auto-rotation when idle
- Soft shadows + ambient/directional/point lighting
- Responsive resizing via `ResizeObserver`

---

## Pending / TODO

| Item                     | Status    | Notes                                         |
|--------------------------|-----------|-----------------------------------------------|
| PostgreSQL integration   | ⏳ PENDING | Currently using in-memory `ORDERS_DB` dict. Owner will provide connection key. |
| Production build         | ⏳ PENDING | Run `cd frontend && npm run build` to generate `dist/` |
| Authentication           | ❌ None    | No user auth implemented yet                  |
| Payment gateway          | ❌ None    | Orders are confirmed immediately without payment |
| Image optimization       | ⏳ TODO    | Images are raw JPGs, no lazy loading          |

---

## Quick Commands

```bash
# Start everything
python -m uvicorn backend.main:app --reload          # Backend → :8000
cd frontend && npm run dev                            # Frontend → :5173

# Test backend
curl http://127.0.0.1:8000/health
curl http://127.0.0.1:8000/api/cakes
curl http://127.0.0.1:8000/api/customizer/options

# Production build
cd frontend && npm run build                          # Output → frontend/dist/

# Install dependencies (if fresh clone)
pip install -r backend/requirements.txt
cd frontend && npm install
```

---

## Important Notes for LLM Sessions

1. **Brand is WISHBAKE** — not Lumière Pâtisserie (the old name). All source files are rebranded.
2. **No framework** on frontend — it's vanilla JS classes, not React/Vue/Angular.
3. **Cart persists only in JS memory** — page refresh clears it.
4. **Orders persist only in Python memory** — server restart clears `ORDERS_DB`.
5. **The `/api` proxy** is essential — frontend calls `/api/cakes`, Vite forwards to `:8000`.
6. **Three.js** is the only npm dependency. Everything else is CDN.
7. **`stitch_screens/`** in `frontend/src/` are static Stitch design mockups — they are NOT part of the live app.
8. **`dist/`** in `frontend/` is a stale production build — rebuild with `npm run build` if deploying.
