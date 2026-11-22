import * as THREE from 'three';

export class Cake3DViewer {
  constructor(containerElement) {
    this.container = containerElement;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.cakeGroup = null;
    this.animFrameId = null;
    this.resizeObserver = null;

    // Mouse interaction states
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    this.targetRotationY = 0.5;
    this.targetRotationX = 0.2;
    this.currentRotationY = 0.5;
    this.currentRotationX = 0.2;

    this.init();
  }

  init() {
    let width = this.container.clientWidth || this.container.parentElement?.clientWidth || 600;
    let height = this.container.clientHeight || this.container.parentElement?.clientHeight || 460;
    if (width === 0) width = 600;
    if (height === 0) height = 460;

    // Scene creation
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf5eee5);

    // Camera setup
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, 3.5, 9);
    this.camera.lookAt(0, 1.2, 0);

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Append canvas
    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    // Lighting setup
    this.setupLighting();

    // Marble Pedestal Stand
    this.setupPedestal();

    // Main Cake Group
    this.cakeGroup = new THREE.Group();
    this.cakeGroup.position.y = 0.5;
    this.scene.add(this.cakeGroup);

    // Attach Event Listeners
    this.attachEvents();

    // Setup ResizeObserver for dynamic container resizes
    if (window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver(() => this.handleResize());
      this.resizeObserver.observe(this.container);
    }

    // Force resize check in next frame
    requestAnimationFrame(() => this.handleResize());

    // Start render loop
    this.animate();
  }

  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xfff5ed, 1.3);
    this.scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
    keyLight.position.set(5, 8, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0001;
    this.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffe6d5, 0.9);
    fillLight.position.set(-5, 4, -4);
    this.scene.add(fillLight);

    const rimLight = new THREE.PointLight(0xffffff, 0.8, 10);
    rimLight.position.set(0, 6, 2);
    this.scene.add(rimLight);
  }

  setupPedestal() {
    const pedestalGroup = new THREE.Group();

    const marbleMat = new THREE.MeshStandardMaterial({
      color: 0xf5f0eb,
      roughness: 0.15,
      metalness: 0.05
    });

    const baseGeo = new THREE.CylinderGeometry(2.4, 2.6, 0.15, 64);
    const baseMesh = new THREE.Mesh(baseGeo, marbleMat);
    baseMesh.position.y = 0.075;
    baseMesh.receiveShadow = true;
    pedestalGroup.add(baseMesh);

    const stemGeo = new THREE.CylinderGeometry(0.8, 1.1, 0.4, 32);
    const stemMesh = new THREE.Mesh(stemGeo, marbleMat);
    stemMesh.position.y = 0.3;
    stemMesh.receiveShadow = true;
    pedestalGroup.add(stemMesh);

    const topPlateGeo = new THREE.CylinderGeometry(2.2, 2.2, 0.1, 64);
    const topPlateMesh = new THREE.Mesh(topPlateGeo, marbleMat);
    topPlateMesh.position.y = 0.5;
    topPlateMesh.receiveShadow = true;
    pedestalGroup.add(topPlateMesh);

    this.pedestalGroup = pedestalGroup;
    this.scene.add(pedestalGroup);
  }

  attachEvents() {
    const dom = this.renderer.domElement;

    // Store references for clean removal in destroy()
    this._onMouseDown = (e) => {
      this.isDragging = true;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    this._onMouseMove = (e) => {
      if (!this.isDragging) return;
      const deltaX = e.clientX - this.previousMousePosition.x;
      const deltaY = e.clientY - this.previousMousePosition.y;
      this.targetRotationY += deltaX * 0.008;
      this.targetRotationX = Math.max(-0.2, Math.min(0.6, this.targetRotationX + deltaY * 0.008));
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    this._onMouseUp = () => { this.isDragging = false; };

    this._onTouchStart = (e) => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    this._onTouchMove = (e) => {
      if (!this.isDragging || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - this.previousMousePosition.x;
      const deltaY = e.touches[0].clientY - this.previousMousePosition.y;
      this.targetRotationY += deltaX * 0.008;
      this.targetRotationX = Math.max(-0.2, Math.min(0.6, this.targetRotationX + deltaY * 0.008));
      this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    this._onTouchEnd = () => { this.isDragging = false; };
    this._onResize = () => this.handleResize();

    dom.addEventListener('mousedown', this._onMouseDown);
    window.addEventListener('mousemove', this._onMouseMove);
    window.addEventListener('mouseup', this._onMouseUp);
    dom.addEventListener('touchstart', this._onTouchStart);
    window.addEventListener('touchmove', this._onTouchMove);
    window.addEventListener('touchend', this._onTouchEnd);
    window.addEventListener('resize', this._onResize);
  }

  handleResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth || this.container.parentElement?.clientWidth || 600;
    const height = this.container.clientHeight || this.container.parentElement?.clientHeight || 460;
    if (width > 0 && height > 0) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    }
  }

  updateCake(selection, optionsData = {}) {
    if (!this.cakeGroup) return;

    this.clearGroup(this.cakeGroup);

    const {
      tiers = 1,
      shape = "round",
      size = "1lb",
      base_frosting = "smooth",
      icing_color = "#ff85a2",
      sponge_flavor = "vanilla",
      piping_style = "pearl",
      toppings = [],
      inscription = ""
    } = selection;

    const spongeColor = this.getSpongeColor(sponge_flavor, optionsData);
    const icing = new THREE.Color(icing_color);
    const outerColor = base_frosting === 'semi-naked'
      ? icing.clone().lerp(new THREE.Color(spongeColor), 0.38)
      : icing;
    const frostingMaterial = new THREE.MeshStandardMaterial({
      color: outerColor,
      roughness: base_frosting === "textured" ? 0.84 : base_frosting === "semi-naked" ? 0.72 : base_frosting === 'fondant' ? 0.2 : 0.34,
      metalness: 0.015
    });

    const sizeRadii = { '0.5lb': 1.12, '1lb': 1.42, '2lb': 1.66, '3lb': 1.82, '5lb': 2.0, '6in': 1.4, '8in': 1.75, '10in': 2.0 };
    const baseRadius = sizeRadii[size] || 1.42;
    const platterScale = Math.max(1, baseRadius / 1.45);
    if (this.pedestalGroup) this.pedestalGroup.scale.set(platterScale, 1, platterScale);

    const tierHeight = 0.74;
    let currentY = 0.05;

    for (let i = 0; i < tiers; i++) {
      const tierRadius = baseRadius - (i * Math.min(0.28, baseRadius * 0.19));
      const tierGeo = this.makeTierGeometry(shape, tierRadius, tierHeight);
      const tierMesh = new THREE.Mesh(tierGeo, frostingMaterial);
      tierMesh.position.y = currentY + (tierHeight / 2);
      tierMesh.castShadow = true;
      tierMesh.receiveShadow = true;
      this.cakeGroup.add(tierMesh);

      if (piping_style !== "none") {
        this.addPipingBorder(tierRadius, currentY + 0.02, shape, outerColor, piping_style);
      }
      if (base_frosting === 'textured' || base_frosting === 'ruffled') {
        this.addFrostingDetail(tierRadius, currentY, tierHeight, outerColor, shape, base_frosting);
      }

      currentY += tierHeight;
    }

    const topY = currentY;
    const topRadius = baseRadius - ((tiers - 1) * Math.min(0.28, baseRadius * 0.19));

    if (toppings.includes("gold_leaf")) {
      this.addGoldLeafAccents(tiers, baseRadius, topY);
    }
    if (toppings.includes("marigolds")) {
      this.addMarigoldToppers(topRadius, topY);
    }
    if (toppings.includes("macarons")) {
      this.addMacaronToppers(topRadius, topY);
    }
    if (toppings.includes("berries")) {
      this.addBerriesCluster(topRadius, topY);
    }
    if (toppings.includes("silver_vark")) this.addSilverVark(topRadius, topY);
    if (toppings.includes("dry_fruits")) this.addDryFruitToppers(topRadius, topY);
    if (toppings.includes("chocolate_shards")) this.addChocolateShardToppers(topRadius, topY);
    if (toppings.includes("coconut_flakes")) this.addCoconutFlakes(topRadius, topY);

    if (inscription && inscription.trim() !== "") {
      this.addInscriptionPlaque(baseRadius, topY / 2, inscription.trim());
    }

    this.camera.position.set(0, 2.4 + (tiers * 0.55), 9 + Math.max(0, baseRadius - 1.5) * 1.8);
    this.camera.lookAt(0, 0.78 + (tiers * 0.34), 0);

    // Force resize check and render
    this.handleResize();
  }

  clearGroup(group) {
    const geometries = new Set();
    const materials = new Set();
    group.traverse(object => {
      if (object.geometry) geometries.add(object.geometry);
      if (object.material) {
        (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => materials.add(material));
      }
    });
    geometries.forEach(geometry => geometry.dispose());
    materials.forEach(material => {
      if (material.map) material.map.dispose();
      material.dispose();
    });
    while (group.children.length) group.remove(group.children[0]);
  }

  getSpongeColor(id, optionsData = {}) {
    const colors = {
      vanilla: '#fbf4e3', chocolate: '#4a2c2a', red_velvet: '#8b1e28', butterscotch: '#d4a547',
      black_forest: '#3b1f1f', paan: '#4a7c59', mango: '#f5a623', rasmalai: '#fef3c7',
      pistachio: '#a8b892', saffron: '#e8a04b'
    };
    const optionColor = optionsData.sponge_flavors?.find(option => option.id === id)?.color;
    return optionColor || colors[id] || '#e5c999';
  }

  makeTierGeometry(shape, radius, height) {
    if (shape === 'square') return new THREE.BoxGeometry(radius * 1.72, height, radius * 1.72);
    if (shape === 'hexagon') return new THREE.CylinderGeometry(radius, radius, height, 6, 1, false);
    if (shape === 'heart') {
      const outline = new THREE.Shape();
      outline.moveTo(0, -radius * 0.82);
      outline.bezierCurveTo(-radius * 0.16, -radius * 0.56, -radius, radius * 0.06, -radius * 0.82, radius * 0.52);
      outline.bezierCurveTo(-radius * 0.62, radius * 1.08, -radius * 0.12, radius * 0.85, 0, radius * 0.62);
      outline.bezierCurveTo(radius * 0.12, radius * 0.85, radius * 0.62, radius * 1.08, radius * 0.82, radius * 0.52);
      outline.bezierCurveTo(radius, radius * 0.06, radius * 0.16, -radius * 0.56, 0, -radius * 0.82);
      const geometry = new THREE.ExtrudeGeometry(outline, { depth: height, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.035, bevelThickness: 0.025 });
      geometry.rotateX(-Math.PI / 2);
      return geometry;
    }
    return new THREE.CylinderGeometry(radius, radius, height, 56, 1, false);
  }

  addFrostingDetail(radius, y, height, color, shape, style) {
    const detailColor = new THREE.Color(color).clone().offsetHSL(0, -0.02, style === 'ruffled' ? 0.08 : -0.06);
    const material = new THREE.MeshStandardMaterial({ color: detailColor, roughness: style === 'ruffled' ? 0.48 : 0.78 });
    const count = shape === 'square' ? 4 : Math.max(28, Math.round(radius * 42));
    for (let i = 0; i < count; i++) {
      const angle = shape === 'square' ? (Math.floor(i / (count / 4)) * Math.PI / 2) + 0.08 : (i / count) * Math.PI * 2;
      const detail = style === 'ruffled'
        ? new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 6), material)
        : new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, height * 0.82, 6), material);
      detail.position.set(Math.cos(angle) * (radius + 0.008), y + height / 2, Math.sin(angle) * (radius + 0.008));
      if (style === 'ruffled') detail.position.y += Math.sin(i * 2.3) * 0.12;
      this.cakeGroup.add(detail);
    }
  }

  addPipingBorder(radius, yPos, shape, colorHex, style) {
    const borderGroup = new THREE.Group();
    const count = Math.max(16, Math.floor(radius * (style === 'shell' ? 14 : 22)));
    const pipingMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(colorHex).clone().offsetHSL(0, 0, 0.08), roughness: 0.36 });
    const pearlGeo = new THREE.SphereGeometry(style === 'rosette' ? 0.073 : style === 'mehndi' ? 0.025 : 0.047, 10, 8);
    const shellGeo = new THREE.ConeGeometry(0.075, 0.16, 8);
    const shellBaseGeo = new THREE.SphereGeometry(0.055, 8, 6);
    const mehndiGeo = new THREE.TorusGeometry(0.055, 0.012, 6, 12);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const x = Math.cos(angle) * (radius + 0.02);
      const z = Math.sin(angle) * (radius + 0.02);
      let decoration;
      if (style === 'shell') {
        decoration = new THREE.Group();
        const shell = new THREE.Mesh(shellGeo, pipingMat);
        shell.rotation.z = Math.PI / 2;
        shell.rotation.y = -angle;
        decoration.add(shell, new THREE.Mesh(shellBaseGeo, pipingMat));
      } else if (style === 'mehndi') {
        decoration = new THREE.Mesh(mehndiGeo, pipingMat);
        decoration.rotation.x = Math.PI / 2;
        decoration.rotation.y = angle;
      } else {
        decoration = new THREE.Mesh(pearlGeo, pipingMat);
      }
      decoration.position.set(x, yPos + (style === 'rosette' ? Math.sin(i * 2) * 0.025 : 0), z);
      borderGroup.add(decoration);
    }
    this.cakeGroup.add(borderGroup);
  }

  addGoldLeafAccents(tiers, baseRadius, topY) {
    const goldGroup = new THREE.Group();
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xd7ad55, metalness: 0.72, roughness: 0.24, side: THREE.DoubleSide });

    const leafCount = 9 * tiers;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < leafCount; i++) {
      const leafGeo = new THREE.PlaneGeometry(0.12, 0.1);
      const flake = new THREE.Mesh(leafGeo, goldMat);
      const angle = i * goldenAngle;
      const height = 0.12 + (i / Math.max(leafCount, 1)) * Math.max(0.1, topY - 0.25);
      const radius = baseRadius * (0.72 + ((i % 3) * 0.08));

      flake.position.set(
        Math.cos(angle) * radius,
        height,
        Math.sin(angle) * radius
      );
      flake.rotation.set(0.4 + (i % 3) * 0.35, angle, (i % 2) * 0.7);
      goldGroup.add(flake);
    }
    this.cakeGroup.add(goldGroup);
  }

  addMarigoldToppers(topRadius, topY) {
    const flowersGroup = new THREE.Group();
    const petalColors = [0xff8c00, 0xffa500, 0xffd700];

    const flowerPositions = [
      { x: 0, z: 0 },
      { x: topRadius * 0.4, z: topRadius * 0.3 },
      { x: -topRadius * 0.35, z: topRadius * 0.4 },
      { x: -topRadius * 0.2, z: -topRadius * 0.4 }
    ];

    flowerPositions.forEach(pos => {
      const flower = new THREE.Group();
      const petalsCount = 20;

      for (let p = 0; p < petalsCount; p++) {
        const petalGeo = new THREE.ConeGeometry(0.06, 0.2, 5);
        const col = petalColors[p % petalColors.length];
        const petalMat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.6 });

        const petal = new THREE.Mesh(petalGeo, petalMat);
        const pAngle = (p / petalsCount) * Math.PI * 2;
        petal.position.set(Math.cos(pAngle) * 0.1, 0, Math.sin(pAngle) * 0.1);
        petal.rotation.z = Math.PI / 3;
        petal.rotation.y = pAngle;
        flower.add(petal);
      }

      flower.position.set(pos.x, topY + 0.08, pos.z);
      flowersGroup.add(flower);
    });

    this.cakeGroup.add(flowersGroup);
  }

  addMacaronToppers(topRadius, topY) {
    const macaronGroup = new THREE.Group();
    const macColors = [0xffb1c1, 0xe5e0cc, 0xc8a39b, 0xa8b892];

    for (let i = 0; i < 4; i++) {
      const mac = new THREE.Group();
      const col = macColors[i % macColors.length];
      const macMat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.3 });
      const fillMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1 });

      const shellTop = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.06, 24), macMat);
      shellTop.position.y = 0.04;
      const filling = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.03, 24), fillMat);
      const shellBottom = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.06, 24), macMat);
      shellBottom.position.y = -0.04;

      mac.add(shellTop, filling, shellBottom);

      const angle = (i / 4) * Math.PI * 2 + 0.4;
      const rad = topRadius * 0.5;
      mac.position.set(Math.cos(angle) * rad, topY + 0.1, Math.sin(angle) * rad);
      mac.rotation.z = 0.3;
      mac.rotation.y = angle;

      macaronGroup.add(mac);
    }
    this.cakeGroup.add(macaronGroup);
  }

  addBerriesCluster(topRadius, topY) {
    const berriesGroup = new THREE.Group();
    const berryMaterials = [0x9f2444, 0x33213a, 0xc94c56].map(color => new THREE.MeshStandardMaterial({ color, roughness: 0.28 }));

    for (let i = 0; i < 12; i++) {
      const berry = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 10), berryMaterials[i % berryMaterials.length]);
      const angle = i * 2.399;
      const rad = (i % 4) * (topRadius * 0.12);
      berry.position.set(Math.cos(angle) * rad, topY + 0.06, Math.sin(angle) * rad);
      berriesGroup.add(berry);
    }
    this.cakeGroup.add(berriesGroup);
  }

  addSilverVark(topRadius, topY) {
    const group = new THREE.Group();
    const material = new THREE.MeshStandardMaterial({ color: 0xd8d8d8, metalness: 0.78, roughness: 0.2, side: THREE.DoubleSide });
    for (let i = 0; i < 10; i++) {
      const flake = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.09), material);
      const angle = i * 2.399;
      const r = topRadius * (0.28 + (i % 3) * 0.12);
      flake.position.set(Math.cos(angle) * r, topY + 0.025, Math.sin(angle) * r);
      flake.rotation.set(-Math.PI / 2 + 0.15, angle, (i % 3) * 0.4);
      group.add(flake);
    }
    this.cakeGroup.add(group);
  }

  addDryFruitToppers(topRadius, topY) {
    const group = new THREE.Group();
    const colors = [0xb17a42, 0xdbc18a, 0x6d7d4c, 0x99623e];
    const materials = colors.map(color => new THREE.MeshStandardMaterial({ color, roughness: 0.68 }));
    for (let i = 0; i < 15; i++) {
      const nut = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), materials[i % materials.length]);
      const angle = i * 2.399;
      const r = topRadius * (0.12 + (i % 4) * 0.11);
      nut.scale.set(i % 2 ? 1.25 : 0.78, 0.7, 0.8);
      nut.position.set(Math.cos(angle) * r, topY + 0.06, Math.sin(angle) * r);
      group.add(nut);
    }
    this.cakeGroup.add(group);
  }

  addChocolateShardToppers(topRadius, topY) {
    const group = new THREE.Group();
    const shades = [0x3a2422, 0x5a302a, 0x75402f];
    shades.forEach((color, i) => {
      const shard = new THREE.Mesh(
        new THREE.ConeGeometry(0.13 - i * 0.015, 0.48 - i * 0.04, 3),
        new THREE.MeshStandardMaterial({ color, roughness: 0.28, metalness: 0.04 })
      );
      const angle = i * (Math.PI * 2 / 3) + 0.25;
      shard.position.set(Math.cos(angle) * topRadius * 0.28, topY + 0.22, Math.sin(angle) * topRadius * 0.28);
      shard.rotation.set(0.18, angle, (i - 1) * 0.2);
      group.add(shard);
    });
    this.cakeGroup.add(group);
  }

  addCoconutFlakes(topRadius, topY) {
    const group = new THREE.Group();
    const material = new THREE.MeshStandardMaterial({ color: 0xf6ead1, roughness: 0.86 });
    for (let i = 0; i < 24; i++) {
      const flake = new THREE.Mesh(new THREE.SphereGeometry(0.035, 7, 5), material);
      const angle = i * 2.399;
      const r = topRadius * (0.12 + ((i * 7) % 9) / 12);
      flake.scale.set(1.7, 0.55, 0.8);
      flake.position.set(Math.cos(angle) * r, topY + 0.025 + (i % 3) * 0.012, Math.sin(angle) * r);
      flake.rotation.y = angle;
      group.add(flake);
    }
    this.cakeGroup.add(group);
  }

  addInscriptionPlaque(radius, yPos, text) {
    const plaqueGroup = new THREE.Group();
    const plaqueMat = new THREE.MeshStandardMaterial({ color: 0xfff8f0, roughness: 0.3 });

    const plaque = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.3, 0.04), plaqueMat);
    plaque.position.set(0, yPos, radius + 0.03);
    plaqueGroup.add(plaque);

    const labelCanvas = document.createElement('canvas');
    labelCanvas.width = 512;
    labelCanvas.height = 96;
    const context = labelCanvas.getContext('2d');
    if (context) {
      context.clearRect(0, 0, labelCanvas.width, labelCanvas.height);
      context.fillStyle = '#542137';
      context.font = '500 42px Georgia, serif';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      const label = text.length > 22 ? `${text.slice(0, 20)}…` : text;
      context.fillText(label, labelCanvas.width / 2, labelCanvas.height / 2, labelCanvas.width - 24);
      const texture = new THREE.CanvasTexture(labelCanvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      const labelMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(1.1, 0.2),
        new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide })
      );
      labelMesh.position.set(0, yPos, radius + 0.055);
      plaqueGroup.add(labelMesh);
    }

    this.cakeGroup.add(plaqueGroup);
  }

  animate() {
    this.animFrameId = requestAnimationFrame(() => this.animate());

    if (this.cakeGroup) {
      this.currentRotationY += (this.targetRotationY - this.currentRotationY) * 0.08;
      this.currentRotationX += (this.targetRotationX - this.currentRotationX) * 0.08;

      this.cakeGroup.rotation.y = this.currentRotationY;
      this.cakeGroup.rotation.x = this.currentRotationX;

      if (!this.isDragging) {
        this.targetRotationY += 0.002;
      }
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  destroy() {
    // Cancel animation loop
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    // Disconnect resize observer
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    // Remove all window event listeners using stored references
    if (this._onMouseMove) window.removeEventListener('mousemove', this._onMouseMove);
    if (this._onMouseUp) window.removeEventListener('mouseup', this._onMouseUp);
    if (this._onTouchMove) window.removeEventListener('touchmove', this._onTouchMove);
    if (this._onTouchEnd) window.removeEventListener('touchend', this._onTouchEnd);
    if (this._onResize) window.removeEventListener('resize', this._onResize);

    // Dispose Three.js resources
    if (this.scene) {
      const geometries = new Set();
      const materials = new Set();
      const textures = new Set();
      this.scene.traverse((object) => {
        if (object.geometry) geometries.add(object.geometry);
        if (object.material) {
          (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => {
            materials.add(material);
            Object.values(material).forEach(value => { if (value?.isTexture) textures.add(value); });
          });
        }
      });
      geometries.forEach(geometry => geometry.dispose());
      textures.forEach(texture => texture.dispose());
      materials.forEach(material => material.dispose());
    }

    if (this.renderer) {
      this.renderer.domElement?.remove();
      this.renderer.dispose();
      this.renderer = null;
    }

    this.scene = null;
    this.camera = null;
    this.cakeGroup = null;
  }
}
