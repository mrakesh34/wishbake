from typing import Dict, List, Any

# Pre-made Artisanal Bakery Catalog with 3 Angles of Realistic High-End Images
PRESET_CAKES: List[Dict[str, Any]] = [
    {
        "id": "cake-kesar-pista",
        "title": "Shahi Kesar Pista Tres Leches Cake",
        "category": "Diwali Special",
        "price": 1799.0,
        "description": "Slow-soaked Kashmiri saffron milk sponge layered with velvety cardamom cream, crushed emerald pistachios, dried rose petals, and 24K edible gold leaf.",
        "image": "/assets/images/kesar_pista_front.jpg",
        "images": [
            "/assets/images/kesar_pista_front.jpg",
            "/assets/images/kesar_pista_angle.jpg",
            "/assets/images/kesar_pista_top.jpg"
        ],
        "badge": "Chef Highlight",
        "servings": "8-10",
        "weight_lbs": 2.0,
        "rating": 5.0,
        "reviews": 184
    },
    {
        "id": "cake-mango-mousse",
        "title": "Ratnagiri Alphonso Mango Mirror Glaze",
        "category": "Signature Special",
        "price": 2199.0,
        "description": "Pure Ratnagiri Alphonso mango mousse encasing light vanilla genoise with a flawless golden mirror glaze, white chocolate filigree spirals, and fresh mango rosettes.",
        "image": "/assets/images/mango_mousse_front.jpg",
        "images": [
            "/assets/images/mango_mousse_front.jpg",
            "/assets/images/mango_mousse_angle.jpg",
            "/assets/images/mango_mousse_top.jpg"
        ],
        "badge": "Bestseller",
        "servings": "10-12",
        "weight_lbs": 2.5,
        "rating": 4.9,
        "reviews": 248
    },
    {
        "id": "cake-choco-hazelnut",
        "title": "Belgian Dark Chocolate Hazelnut Truffle",
        "category": "Anniversary",
        "price": 1999.0,
        "description": "Decadent 70% Callebaut dark chocolate sponge with roasted Turkish hazelnut gianduja cream, dripping chocolate ganache, and gold-dusted chocolate crown shards.",
        "image": "/assets/images/choco_hazelnut_front.jpg",
        "images": [
            "/assets/images/choco_hazelnut_front.jpg",
            "/assets/images/choco_hazelnut_angle.jpg",
            "/assets/images/choco_hazelnut_top.jpg"
        ],
        "badge": "Decadent",
        "servings": "10-12",
        "weight_lbs": 2.0,
        "rating": 4.9,
        "reviews": 312
    },
    {
        "id": "cake-kaju-royale",
        "title": "Kaju Katli Royale Banquet Cake",
        "category": "Weddings & Galas",
        "price": 3499.0,
        "description": "Opulent celebration cake layered with slow-ground cashew paste praline, aromatic green cardamom buttercream, genuine diamond silver vark, and roasted cashew borders.",
        "image": "/assets/images/kaju_royale_front.jpg",
        "images": [
            "/assets/images/kaju_royale_front.jpg",
            "/assets/images/kaju_royale_angle.jpg",
            "/assets/images/kaju_royale_top.jpg"
        ],
        "badge": "Royal Banquet",
        "servings": "18-22",
        "weight_lbs": 3.5,
        "rating": 5.0,
        "reviews": 115
    },
    {
        "id": "cake-lotus-biscoff",
        "title": "Lotus Biscoff Speculoos Cream Cake",
        "category": "Birthday",
        "price": 1899.0,
        "description": "Caramelized Belgian speculoos sponge layered with velvety Biscoff spread, whipped mascarpone rosettes, biscoff cookie crumble border, and warm cookie butter drizzle.",
        "image": "/assets/images/lotus_biscoff_front.jpg",
        "images": [
            "/assets/images/lotus_biscoff_front.jpg",
            "/assets/images/lotus_biscoff_angle.jpg",
            "/assets/images/lotus_biscoff_top.jpg"
        ],
        "badge": "Trending",
        "servings": "8-10",
        "weight_lbs": 2.0,
        "rating": 4.9,
        "reviews": 290
    },
    {
        "id": "cake-gulab-cheesecake",
        "title": "Royal Gulab Jamun Cardamom Cheesecake",
        "category": "Diwali Special",
        "price": 1899.0,
        "description": "Fusion patisserie featuring a cardamom-infused velvet cream cheese tier topped with syrup-drenched mini gulab jamuns, 24k gold leaf, and crushed pistachio dusting.",
        "image": "/assets/images/gulab_cheesecake_front.jpg",
        "images": [
            "/assets/images/gulab_cheesecake_front.jpg",
            "/assets/images/gulab_cheesecake_angle.jpg",
            "/assets/images/gulab_cheesecake_top.jpg"
        ],
        "badge": "Festive Highlight",
        "servings": "10-12",
        "weight_lbs": 2.0,
        "rating": 4.9,
        "reviews": 128
    },
    {
        "id": "cake-marigold-elegance",
        "title": "Marigold & Saffron 2-Tier Dream",
        "category": "Weddings & Galas",
        "price": 5499.0,
        "description": "Two elegant ivory frosting tiers embellished with intricate gold filigree, organic marigold petals, and saffron sponge cake layers.",
        "image": "/assets/images/marigold_elegance_front.jpg",
        "images": [
            "/assets/images/marigold_elegance_front.jpg",
            "/assets/images/marigold_elegance_angle.jpg",
            "/assets/images/marigold_elegance_top.jpg"
        ],
        "badge": "Masterpiece",
        "servings": "20-25",
        "weight_lbs": 4.0,
        "rating": 5.0,
        "reviews": 94
    },
    {
        "id": "cake-rose-pistachio",
        "title": "Persian Rose & Pistachio Cloud",
        "category": "Birthday",
        "price": 1499.0,
        "description": "Delicate rosewater infused sponge cake filled with slow-churned pistachio butter cream, decorated with dried rosebuds and silver vark.",
        "image": "/assets/images/rose_pistachio_front.jpg",
        "images": [
            "/assets/images/rose_pistachio_front.jpg",
            "/assets/images/rose_pistachio_angle.jpg",
            "/assets/images/rose_pistachio_top.jpg"
        ],
        "badge": "Chef Special",
        "servings": "8-10",
        "weight_lbs": 1.5,
        "rating": 4.8,
        "reviews": 162
    },
    {
        "id": "cake-wishbake-signature",
        "title": "WISHBAKE Strawberry Gold Royale",
        "category": "Birthday",
        "price": 2199.0,
        "description": "Our signature strawberry champagne sponge layered with vanilla bean mousse, hand-painted edible gold foil, and fresh wild strawberries.",
        "image": "/assets/images/strawberry_royale_front.jpg",
        "images": [
            "/assets/images/strawberry_royale_front.jpg",
            "/assets/images/strawberry_royale_angle.jpg",
            "/assets/images/strawberry_royale_top.jpg"
        ],
        "badge": "Best Seller",
        "servings": "12-14",
        "weight_lbs": 2.5,
        "rating": 4.9,
        "reviews": 210
    },
    {
        "id": "cake-dark-truffle",
        "title": "Midnight Dark Chocolate Truffle",
        "category": "Anniversary",
        "price": 1799.0,
        "description": "Rich 70% Valrhona dark chocolate mousse cake, glossy mirror glaze, handmade dark chocolate macarons, and sea salt flakes.",
        "image": "/assets/images/midnight_truffle_front.jpg",
        "images": [
            "/assets/images/midnight_truffle_front.jpg",
            "/assets/images/midnight_truffle_angle.jpg",
            "/assets/images/midnight_truffle_top.jpg"
        ],
        "badge": "Decadent",
        "servings": "10-12",
        "weight_lbs": 2.0,
        "rating": 4.9,
        "reviews": 185
    },
    {
        "id": "cake-citrus-berry-bliss",
        "title": "Citrus Blossom & Elderflower",
        "category": "Anniversary",
        "price": 1599.0,
        "description": "Bright lemon curd and elderflower soaked cake layers with whipped white chocolate buttercream and fresh blueberries.",
        "image": "/assets/images/citrus_elderflower_front.jpg",
        "images": [
            "/assets/images/citrus_elderflower_front.jpg",
            "/assets/images/citrus_elderflower_angle.jpg",
            "/assets/images/citrus_elderflower_top.jpg"
        ],
        "badge": "Seasonal",
        "servings": "8-10",
        "weight_lbs": 1.5,
        "rating": 4.7,
        "reviews": 79
    },
    {
        "id": "cake-rasmalai-royale",
        "title": "Rasmalai Royale 3-Tier Grandeur",
        "category": "Weddings & Galas",
        "price": 8999.0,
        "description": "Three-tier rasmalai-infused sponge with saffron cream layers, hand-piped royal icing, edible gold leaf cascades, and premium dry fruit garnish.",
        "image": "/assets/images/rasmalai_royale_front.jpg",
        "images": [
            "/assets/images/rasmalai_royale_front.jpg",
            "/assets/images/rasmalai_royale_angle.jpg",
            "/assets/images/rasmalai_royale_top.jpg"
        ],
        "badge": "Grand Luxe",
        "servings": "40-50",
        "weight_lbs": 7.0,
        "rating": 5.0,
        "reviews": 56
    },
    {
        "id": "cake-butterscotch-crunch",
        "title": "Butterscotch Caramel Crunch Tower",
        "category": "Birthday",
        "price": 999.0,
        "description": "India's favourite butterscotch sponge with crunchy praline layers, salted caramel drizzle, and toasted almond flakes.",
        "image": "/assets/images/butterscotch_crunch_front.jpg",
        "images": [
            "/assets/images/butterscotch_crunch_front.jpg",
            "/assets/images/butterscotch_crunch_angle.jpg",
            "/assets/images/butterscotch_crunch_top.jpg"
        ],
        "badge": "Fan Favourite",
        "servings": "8-10",
        "weight_lbs": 1.5,
        "rating": 4.8,
        "reviews": 340
    },
    {
        "id": "cake-black-forest-classic",
        "title": "Heritage Black Forest Gâteau",
        "category": "Birthday",
        "price": 849.0,
        "description": "Classic dark chocolate layers soaked in cherry kirsch, whipped cream rosettes, chocolate curls, and maraschino cherries.",
        "image": "/assets/images/black_forest_front.jpg",
        "images": [
            "/assets/images/black_forest_front.jpg",
            "/assets/images/black_forest_angle.jpg",
            "/assets/images/black_forest_top.jpg"
        ],
        "badge": "Classic",
        "servings": "8-10",
        "weight_lbs": 1.5,
        "rating": 4.7,
        "reviews": 420
    },
    {
        "id": "cake-paan-delight",
        "title": "Calcutta Paan & Gulkand Fusion",
        "category": "Diwali Special",
        "price": 1699.0,
        "description": "An aromatic paan-flavoured sponge with gulkand cream filling, betel leaf garnish, and rose petal accents. A fusion masterpiece.",
        "image": "/assets/images/paan_fusion_front.jpg",
        "images": [
            "/assets/images/paan_fusion_front.jpg",
            "/assets/images/paan_fusion_angle.jpg",
            "/assets/images/paan_fusion_top.jpg"
        ],
        "badge": "Signature Fusion",
        "servings": "10-12",
        "weight_lbs": 2.0,
        "rating": 4.9,
        "reviews": 98
    },
    {
        "id": "cake-redvelvet-cheesecake",
        "title": "Red Velvet Baked Cheesecake Dream",
        "category": "Anniversary",
        "price": 1699.0,
        "description": "Classic crimson cocoa sponge sandwiching a dense New York-style baked cheesecake center, finished with silky cream cheese frosting and velvet crumb border.",
        "image": "/assets/images/redvelvet_cheesecake_front.jpg",
        "images": [
            "/assets/images/redvelvet_cheesecake_front.jpg",
            "/assets/images/redvelvet_cheesecake_angle.jpg",
            "/assets/images/redvelvet_cheesecake_top.jpg"
        ],
        "badge": "Romantic",
        "servings": "8-10",
        "weight_lbs": 2.0,
        "rating": 4.9,
        "reviews": 174
    },
    {
        "id": "cake-mishti-doi",
        "title": "Kolkata Baked Mishti Doi Honeycomb",
        "category": "Signature Fusion",
        "price": 1849.0,
        "description": "Caramelized terracotta-baked mishti doi custard layer on a buttery cardamom graham base, topped with raw honeycomb clusters and roasted pistachio slivers.",
        "image": "/assets/images/mishti_doi_front.jpg",
        "images": [
            "/assets/images/mishti_doi_front.jpg",
            "/assets/images/mishti_doi_angle.jpg",
            "/assets/images/mishti_doi_top.jpg"
        ],
        "badge": "Heritage Fusion",
        "servings": "10-12",
        "weight_lbs": 2.0,
        "rating": 4.8,
        "reviews": 142
    },
    {
        "id": "cake-anjeer-badam",
        "title": "Royal Anjeer & Roasted Badam Gateau",
        "category": "Diwali Special",
        "price": 2399.0,
        "description": "Slow-stewed Turkish fig compote layered with honeyed saffron cream and slow-roasted Mamra almond flakes, wrapped in a smooth ivory buttercream drape.",
        "image": "/assets/images/anjeer_badam_front.jpg",
        "images": [
            "/assets/images/anjeer_badam_front.jpg",
            "/assets/images/anjeer_badam_angle.jpg",
            "/assets/images/anjeer_badam_top.jpg"
        ],
        "badge": "Festive Luxe",
        "servings": "12-14",
        "weight_lbs": 2.5,
        "rating": 4.9,
        "reviews": 110
    },
    {
        "id": "cake-saffron-rose-grand",
        "title": "Imperial Saffron Rose 2-Tier Grandeur",
        "category": "Weddings & Galas",
        "price": 6499.0,
        "description": "A magnificent two-tier spectacle with damask rosewater infusion, Kashmiri saffron mousse, hand-piped intricate royal filigree, and genuine 24K gold foil cascading downward.",
        "image": "/assets/images/saffron_rose_front.jpg",
        "images": [
            "/assets/images/saffron_rose_front.jpg",
            "/assets/images/saffron_rose_angle.jpg",
            "/assets/images/saffron_rose_top.jpg"
        ],
        "badge": "Grand Luxe",
        "servings": "28-35",
        "weight_lbs": 5.0,
        "rating": 5.0,
        "reviews": 78
    },
    {
        "id": "cake-banoffee-crunch",
        "title": "Banoffee Dulce de Leche Caramel Tower",
        "category": "Birthday",
        "price": 1599.0,
        "description": "Slow-caramelized banana puree and espresso chantilly cream between layers of golden vanilla sponge, crowned with toffee crunch shards and dark chocolate curls.",
        "image": "/assets/images/banoffee_crunch_front.jpg",
        "images": [
            "/assets/images/banoffee_crunch_front.jpg",
            "/assets/images/banoffee_crunch_angle.jpg",
            "/assets/images/banoffee_crunch_top.jpg"
        ],
        "badge": "Crowd Pleaser",
        "servings": "8-10",
        "weight_lbs": 2.0,
        "rating": 4.8,
        "reviews": 204
    }
]

CUSTOMIZER_OPTIONS = {
    "shapes": [
        {"id": "round", "name": "Classic Round", "extra_cost": 0.0},
        {"id": "square", "name": "Modern Square", "extra_cost": 199.0},
        {"id": "hexagon", "name": "Boutique Hexagon", "extra_cost": 349.0},
        {"id": "heart", "name": "Romantic Heart", "extra_cost": 249.0}
    ],
    "sizes": [
        {"id": "0.5lb", "name": "Half Pound (2-4 Servings)", "base_cost": 549.0, "servings": 4, "weight_lbs": 0.5, "weight_kg": 0.23},
        {"id": "1lb", "name": "1 Pound (6-8 Servings)", "base_cost": 899.0, "servings": 8, "weight_lbs": 1.0, "weight_kg": 0.45},
        {"id": "2lb", "name": "2 Pounds (10-14 Servings)", "base_cost": 1599.0, "servings": 14, "weight_lbs": 2.0, "weight_kg": 0.9},
        {"id": "3lb", "name": "3 Pounds (16-22 Servings)", "base_cost": 2299.0, "servings": 22, "weight_lbs": 3.0, "weight_kg": 1.36},
        {"id": "5lb", "name": "5 Pounds (30-40 Servings)", "base_cost": 3499.0, "servings": 40, "weight_lbs": 5.0, "weight_kg": 2.27}
    ],
    "tiers": [
        {"count": 1, "multiplier": 1.0, "extra_cost": 0.0},
        {"count": 2, "multiplier": 1.7, "extra_cost": 999.0},
        {"count": 3, "multiplier": 2.4, "extra_cost": 2499.0}
    ],
    "base_frosting": [
        {"id": "smooth", "name": "Velvet Smooth Buttercream", "extra_cost": 0.0},
        {"id": "semi-naked", "name": "Rustic Semi-Naked Finish", "extra_cost": 0.0},
        {"id": "textured", "name": "Stucco Textured Palette", "extra_cost": 199.0},
        {"id": "ruffled", "name": "Ribbon Ruffled Piping", "extra_cost": 349.0},
        {"id": "fondant", "name": "Premium Fondant Finish", "extra_cost": 499.0}
    ],
    "sponge_flavors": [
        {"id": "vanilla", "name": "Madagascar Vanilla Bean", "color": "#fbf4e3"},
        {"id": "chocolate", "name": "Belgian Dark Chocolate", "color": "#4a2c2a"},
        {"id": "red_velvet", "name": "Classic Red Velvet", "color": "#8b1e28"},
        {"id": "butterscotch", "name": "Butterscotch Caramel", "color": "#d4a547"},
        {"id": "black_forest", "name": "Black Forest", "color": "#3b1f1f"},
        {"id": "paan", "name": "Calcutta Paan", "color": "#4a7c59"},
        {"id": "mango", "name": "Alphonso Mango", "color": "#f5a623"},
        {"id": "rasmalai", "name": "Rasmalai", "color": "#fef3c7"},
        {"id": "pistachio", "name": "Pistachio Cardamom", "color": "#a8b892"},
        {"id": "saffron", "name": "Saffron Rose Infusion", "color": "#e8a04b"}
    ],
    "filling_flavors": [
        {"id": "cream", "name": "Chantilly Cream", "extra_cost": 0.0},
        {"id": "dulce", "name": "Salted Caramel Dulce de Leche", "extra_cost": 149.0},
        {"id": "raspberry", "name": "Wild Raspberry Preserves", "extra_cost": 199.0},
        {"id": "gulab_jamun", "name": "Gulab Jamun Saffron Mousse", "extra_cost": 249.0},
        {"id": "white_choc", "name": "Belgian White Chocolate Ganache", "extra_cost": 199.0},
        {"id": "dark_choc", "name": "Belgian Dark Chocolate Ganache", "extra_cost": 199.0},
        {"id": "rabri", "name": "Malai Rabri Cream", "extra_cost": 199.0},
        {"id": "mango_mousse", "name": "Alphonso Mango Mousse", "extra_cost": 249.0},
        {"id": "kaju_praline", "name": "Kaju Katli Praline", "extra_cost": 299.0},
        {"id": "hazelnut", "name": "Roasted Hazelnut Praline", "extra_cost": 249.0}
    ],
    "toppings": [
        {"id": "gold_leaf", "name": "24K Edible Gold Leaf Accents", "price": 399.0},
        {"id": "silver_vark", "name": "Traditional Silver Vark", "price": 249.0},
        {"id": "marigolds", "name": "Organic Marigold & Rose Petals", "price": 199.0},
        {"id": "macarons", "name": "Handcrafted Artisanal Macarons (4x)", "price": 349.0},
        {"id": "berries", "name": "Fresh Wild Berries Cluster", "price": 299.0},
        {"id": "dry_fruits", "name": "Premium Mixed Dry Fruits & Nuts", "price": 349.0},
        {"id": "chocolate_shards", "name": "Belgian Chocolate Shards & Curls", "price": 249.0},
        {"id": "coconut_flakes", "name": "Toasted Coconut Flakes", "price": 149.0}
    ],
    "piping_styles": [
        {"id": "none", "name": "Clean Edge (No Trim)", "extra_cost": 0.0},
        {"id": "pearl", "name": "Classic Pearl Border", "extra_cost": 149.0},
        {"id": "shell", "name": "Victorian Shell Border", "extra_cost": 199.0},
        {"id": "rosette", "name": "WISHBAKE Rosette Crown", "extra_cost": 299.0},
        {"id": "mehndi", "name": "Mehndi Pattern Border", "extra_cost": 399.0}
    ],
    "delivery_time_slots": [
        {"id": "morning", "name": "Morning (9 AM – 12 PM)"},
        {"id": "afternoon", "name": "Afternoon (12 PM – 4 PM)"},
        {"id": "evening", "name": "Evening (4 PM – 8 PM)"},
        {"id": "night", "name": "Night (8 PM – 11 PM)", "extra_cost": 99.0}
    ]
}

ORDERS_DB: Dict[str, Dict[str, Any]] = {}
