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
    this.scene.background = new THREE.Color(0xf7f2e9);

    // Camera setup
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, 3.5, 9);
    this.camera.lookAt(0, 1.2, 0);

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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

  updateCake(selection) {
    if (!this.cakeGroup) return;

    // Clear previous cake meshes safely
    while (this.cakeGroup.children.length > 0) {
      const child = this.cakeGroup.children[0];
      this.cakeGroup.remove(child);
    }

    const {
      tiers = 1,
      shape = "round",
      size = "8in",
      base_frosting = "smooth",
      icing_color = "#ff85a2",
      piping_style = "pearl",
      toppings = [],
      inscription = ""
    } = selection;

    const frostingMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(icing_color),
      roughness: base_frosting === "textured" ? 0.8 : (base_frosting === "semi-naked" ? 0.6 : 0.35),
      metalness: 0.05
    });

    let baseRadius = 1.8;
    if (size === '6in') baseRadius = 1.4;
    if (size === '10in') baseRadius = 2.0;

    const tierHeight = 0.75;
    let currentY = 0.05;

    for (let i = 0; i < tiers; i++) {
      const tierRadius = baseRadius - (i * 0.35);
      let tierGeo;

      if (shape === "square") {
        const side = tierRadius * 1.6;
        tierGeo = new THREE.BoxGeometry(side, tierHeight, side);
      } else if (shape === "hexagon") {
        tierGeo = new THREE.CylinderGeometry(tierRadius, tierRadius, tierHeight, 6);
      } else {
        tierGeo = new THREE.CylinderGeometry(tierRadius, tierRadius, tierHeight, 48);
      }

      const tierMesh = new THREE.Mesh(tierGeo, frostingMaterial);
      tierMesh.position.y = currentY + (tierHeight / 2);
      tierMesh.castShadow = true;
      tierMesh.receiveShadow = true;
      this.cakeGroup.add(tierMesh);

      if (piping_style !== "none") {
        this.addPipingBorder(tierRadius, currentY + 0.02, shape, icing_color, piping_style);
      }

      currentY += tierHeight;
    }

    const topY = currentY;
    const topRadius = baseRadius - ((tiers - 1) * 0.35);

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

    if (inscription && inscription.trim() !== "") {
      this.addInscriptionPlaque(baseRadius, topY / 2, inscription);
    }

    this.camera.position.y = 3.2 + (tiers * 0.3);
    this.camera.lookAt(0, 1.2 + (tiers * 0.2), 0);

    // Force resize check and render
    this.handleResize();
  }

  addPipingBorder(radius, yPos, shape, colorHex, style) {
    const pearlGroup = new THREE.Group();
    const count = Math.floor(radius * 24);
    const pearlGeo = new THREE.SphereGeometry(style === "rosette" ? 0.08 : 0.05, 12, 12);
    
    const pipingMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colorHex).clone().offsetHSL(0, 0, 0.08),
      roughness: 0.2
    });

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const x = Math.cos(angle) * (radius + 0.02);
      const z = Math.sin(angle) * (radius + 0.02);

      const pearl = new THREE.Mesh(pearlGeo, pipingMat);
      pearl.position.set(x, yPos, z);
      pearlGroup.add(pearl);
    }
    this.cakeGroup.add(pearlGroup);
  }

  addGoldLeafAccents(tiers, baseRadius, topY) {
    const goldGroup = new THREE.Group();
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.95,
      roughness: 0.1
    });

    const leafCount = 18 * tiers;
    for (let i = 0; i < leafCount; i++) {
      const leafGeo = new THREE.PlaneGeometry(0.12, 0.1);
      const flake = new THREE.Mesh(leafGeo, goldMat);

      const angle = Math.random() * Math.PI * 2;
      const height = 0.2 + Math.random() * (topY - 0.3);
      const radius = baseRadius * 0.9 + Math.random() * 0.15;

      flake.position.set(
        Math.cos(angle) * radius,
        height,
        Math.sin(angle) * radius
      );
      flake.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
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
    const berryMat = new THREE.MeshStandardMaterial({ color: 0x8b0000, roughness: 0.2 });

    for (let i = 0; i < 12; i++) {
      const berry = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), berryMat);
      const angle = Math.random() * Math.PI * 2;
      const rad = Math.random() * (topRadius * 0.6);
      berry.position.set(Math.cos(angle) * rad, topY + 0.06, Math.sin(angle) * rad);
      berriesGroup.add(berry);
    }
    this.cakeGroup.add(berriesGroup);
  }

  addInscriptionPlaque(radius, yPos, text) {
    const plaqueGroup = new THREE.Group();
    const plaqueMat = new THREE.MeshStandardMaterial({ color: 0xfff8f0, roughness: 0.3 });

    const plaque = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.3, 0.04), plaqueMat);
    plaque.position.set(0, yPos, radius + 0.03);
    plaqueGroup.add(plaque);

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
      this.scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(m => m.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
    }

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }

    this.scene = null;
    this.camera = null;
    this.cakeGroup = null;
  }
}
