import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const SPONGE_COLORS = {
  vanilla: '#f7ead2',
  chocolate: '#4a2c26',
  red_velvet: '#8b1e28',
  butterscotch: '#d49a45',
  black_forest: '#381d1c',
  paan: '#4a7c59',
  mango: '#f2a227',
  rasmalai: '#faebc2',
  pistachio: '#9eb687',
  saffron: '#e89d42'
};

const FILLING_STYLES = {
  cream: { color: '#fff8ee', roughness: 0.35, metalness: 0.02 },
  dulce: { color: '#c47a35', roughness: 0.22, metalness: 0.05 },
  raspberry: { color: '#a81c3a', roughness: 0.16, metalness: 0.04 },
  gulab_jamun: { color: '#d88c3a', roughness: 0.28, metalness: 0.04 },
  white_choc: { color: '#f5ead6', roughness: 0.18, metalness: 0.03 },
  dark_choc: { color: '#331b18', roughness: 0.14, metalness: 0.06 },
  rabri: { color: '#f9edd1', roughness: 0.3, metalness: 0.02 },
  mango_mousse: { color: '#f5ad2e', roughness: 0.24, metalness: 0.03 },
  kaju_praline: { color: '#dfcfb2', roughness: 0.32, metalness: 0.04 },
  hazelnut: { color: '#7a4b2c', roughness: 0.26, metalness: 0.05 }
};

function getColorLuminance(color) {
  const hsl = { h: 0, s: 0, l: 0 };
  color.getHSL(hsl);
  return hsl.l;
}

export class Cake3DViewer {
  constructor(containerElement, options = {}) {
    this.container = containerElement;
    this.enableZoom = options.enableZoom !== undefined ? options.enableZoom : true;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.envRenderTarget = null;
    this.cakeGroup = null;
    this.pedestalGroup = null;
    this.animFrameId = null;
    this.resizeObserver = null;

    this.sliceView = false;
    this.autoRotate = true;
    this.lastSelection = null;
    this.lastOptionsData = {};
    this.sharedTextures = {};
    this.cameraTween = null;

    this.init();
  }

  init() {
    const { width, height } = this.measureContainer();

    // Warm mid-tone taupe studio backdrop so both crisp white & deep dark cakes stand out
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xcbc1b6);

    this.camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    this.camera.position.set(2.4, 3.8, 6.9);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envRenderTarget = pmrem.fromScene(new RoomEnvironment(), 0.04);
    this.scene.environment = this.envRenderTarget.texture;
    pmrem.dispose();

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.07;
    this.controls.enablePan = false;
    this.controls.enableZoom = this.enableZoom;
    this.controls.minDistance = 4.0;
    this.controls.maxDistance = 18.5;
    this.controls.minPolarAngle = 0.16;
    this.controls.maxPolarAngle = Math.PI * 0.48;
    this.controls.autoRotate = this.autoRotate;
    this.controls.autoRotateSpeed = 0.85;
    this.controls.target.set(0, 1.15, 0);
    this.controls.update();

    this.buildSharedTextures();
    this.setupLighting();
    this.setupStudioBackdrop();
    this.setupPedestal();

    this.cakeGroup = new THREE.Group();
    this.cakeGroup.position.y = 0.54;
    this.scene.add(this.cakeGroup);

    this._onResize = () => this.handleResize();
    window.addEventListener('resize', this._onResize);

    if (window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver(() => this.handleResize());
      this.resizeObserver.observe(this.container);
    }

    requestAnimationFrame(() => this.handleResize());
    this.animate();
  }

  measureContainer() {
    let width = this.container.clientWidth || this.container.parentElement?.clientWidth || 640;
    let height = this.container.clientHeight || this.container.parentElement?.clientHeight || 480;
    if (width <= 0) width = 640;
    if (height <= 0) height = 480;
    return { width, height };
  }

  buildSharedTextures() {
    // 1. Honed dark slate-stone pedestal veining texture
    const stoneCanvas = document.createElement('canvas');
    stoneCanvas.width = 512;
    stoneCanvas.height = 512;
    const mCtx = stoneCanvas.getContext('2d');
    if (mCtx) {
      mCtx.fillStyle = '#473e3c';
      mCtx.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 24; i++) {
        mCtx.beginPath();
        mCtx.strokeStyle = i % 3 === 0 ? 'rgba(218, 198, 172, 0.18)' : 'rgba(95, 84, 80, 0.35)';
        mCtx.lineWidth = 1 + (i % 3);
        let x = (i * 47) % 512;
        let y = 0;
        mCtx.moveTo(x, y);
        while (y < 512) {
          y += 28;
          x += Math.sin(y * 0.025 + i) * 18;
          mCtx.lineTo(x, y);
        }
        mCtx.stroke();
      }
    }
    const stoneTex = new THREE.CanvasTexture(stoneCanvas);
    stoneTex.colorSpace = THREE.SRGBColorSpace;
    stoneTex.wrapS = THREE.RepeatWrapping;
    stoneTex.wrapT = THREE.RepeatWrapping;
    this.sharedTextures.stone = stoneTex;

    // 2. Smooth satin buttercream micro-bump
    const smoothCanvas = document.createElement('canvas');
    smoothCanvas.width = 256;
    smoothCanvas.height = 256;
    const sCtx = smoothCanvas.getContext('2d');
    if (sCtx) {
      sCtx.fillStyle = '#808080';
      sCtx.fillRect(0, 0, 256, 256);
      for (let y = 0; y < 256; y += 3) {
        const shade = 124 + Math.round(Math.sin(y * 0.18) * 6);
        sCtx.fillStyle = `rgb(${shade},${shade},${shade})`;
        sCtx.fillRect(0, y, 256, 2);
      }
    }
    const smoothBump = new THREE.CanvasTexture(smoothCanvas);
    smoothBump.wrapS = THREE.RepeatWrapping;
    smoothBump.wrapT = THREE.RepeatWrapping;
    this.sharedTextures.smoothBump = smoothBump;

    // 3. Stucco / palette-knife textured buttercream bump map
    const stuccoCanvas = document.createElement('canvas');
    stuccoCanvas.width = 512;
    stuccoCanvas.height = 256;
    const tCtx = stuccoCanvas.getContext('2d');
    if (tCtx) {
      tCtx.fillStyle = '#787878';
      tCtx.fillRect(0, 0, 512, 256);
      for (let row = 0; row < 28; row++) {
        const y = row * 9;
        tCtx.beginPath();
        tCtx.strokeStyle = row % 2 === 0 ? '#c4c4c4' : '#444444';
        tCtx.lineWidth = 4.4;
        for (let x = 0; x <= 512; x += 16) {
          const offset = Math.sin(x * 0.04 + row * 1.1) * 3.5;
          if (x === 0) tCtx.moveTo(x, y + offset);
          else tCtx.lineTo(x, y + offset);
        }
        tCtx.stroke();
      }
    }
    const stuccoBump = new THREE.CanvasTexture(stuccoCanvas);
    stuccoBump.wrapS = THREE.RepeatWrapping;
    stuccoBump.wrapT = THREE.RepeatWrapping;
    stuccoBump.repeat.set(3, 1);
    this.sharedTextures.stuccoBump = stuccoBump;

    // 4. Baked sponge crumb bump map
    const spongeCanvas = document.createElement('canvas');
    spongeCanvas.width = 256;
    spongeCanvas.height = 256;
    const spCtx = spongeCanvas.getContext('2d');
    if (spCtx) {
      spCtx.fillStyle = '#999999';
      spCtx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 1600; i++) {
        const x = (i * 73) % 256;
        const y = (i * 139) % 256;
        const r = (i % 3) + 0.8;
        spCtx.fillStyle = i % 5 === 0 ? '#4e4e4e' : '#cbcbcb';
        spCtx.beginPath();
        spCtx.arc(x, y, r, 0, Math.PI * 2);
        spCtx.fill();
      }
    }
    const spongeBump = new THREE.CanvasTexture(spongeCanvas);
    spongeBump.wrapS = THREE.RepeatWrapping;
    spongeBump.wrapT = THREE.RepeatWrapping;
    spongeBump.repeat.set(2, 2);
    this.sharedTextures.spongeBump = spongeBump;
  }

  setupLighting() {
    const hemiLight = new THREE.HemisphereLight(0xfffaf4, 0x9c8e82, 1.05);
    this.scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfffdf9, 1.65);
    keyLight.position.set(5.2, 8.5, 5.5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 24;
    keyLight.shadow.camera.left = -4.5;
    keyLight.shadow.camera.right = 4.5;
    keyLight.shadow.camera.top = 4.5;
    keyLight.shadow.camera.bottom = -4.5;
    keyLight.shadow.bias = -0.0004;
    this.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffe9dc, 0.85);
    fillLight.position.set(-5.5, 4.8, 2.5);
    this.scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.78);
    rimLight.position.set(0, 5.5, -5.8);
    this.scene.add(rimLight);
  }

  setupStudioBackdrop() {
    const floorGeo = new THREE.CircleGeometry(14, 64);
    const floorMat = new THREE.ShadowMaterial({ opacity: 0.16 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    this.scene.add(floor);
  }

  setupPedestal() {
    const pedestalGroup = new THREE.Group();

    const stoneMat = new THREE.MeshPhysicalMaterial({
      map: this.sharedTextures.stone,
      color: 0xffffff,
      roughness: 0.24,
      metalness: 0.05,
      clearcoat: 0.35,
      clearcoatRoughness: 0.2
    });

    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xd4ae6a,
      roughness: 0.24,
      metalness: 0.86
    });

    const baseGeo = new THREE.CylinderGeometry(1.45, 1.65, 0.12, 64);
    const baseMesh = new THREE.Mesh(baseGeo, stoneMat);
    baseMesh.position.y = 0.06;
    baseMesh.receiveShadow = true;
    baseMesh.castShadow = true;
    pedestalGroup.add(baseMesh);

    const stemGeo = new THREE.CylinderGeometry(0.42, 0.64, 0.34, 48);
    const stemMesh = new THREE.Mesh(stemGeo, stoneMat);
    stemMesh.position.y = 0.29;
    stemMesh.receiveShadow = true;
    stemMesh.castShadow = true;
    pedestalGroup.add(stemMesh);

    const brassCollar = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.025, 12, 48), brassMat);
    brassCollar.rotation.x = Math.PI / 2;
    brassCollar.position.y = 0.45;
    pedestalGroup.add(brassCollar);

    const topPlateGeo = new THREE.CylinderGeometry(2.35, 2.28, 0.08, 72);
    const topPlateMesh = new THREE.Mesh(topPlateGeo, stoneMat);
    topPlateMesh.position.y = 0.5;
    topPlateMesh.receiveShadow = true;
    topPlateMesh.castShadow = true;
    pedestalGroup.add(topPlateMesh);

    const rimRing = new THREE.Mesh(new THREE.TorusGeometry(2.34, 0.024, 12, 72), brassMat);
    rimRing.rotation.x = Math.PI / 2;
    rimRing.position.y = 0.51;
    pedestalGroup.add(rimRing);

    this.pedestalGroup = pedestalGroup;
    this.scene.add(pedestalGroup);
  }

  handleResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const { width, height } = this.measureContainer();
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  setAutoRotate(enabled) {
    this.autoRotate = Boolean(enabled);
    if (this.controls) {
      this.controls.autoRotate = this.autoRotate;
    }
  }

  setSliceView(enabled) {
    this.sliceView = Boolean(enabled);
    if (this.lastSelection) {
      this.updateCake(this.lastSelection, this.lastOptionsData);
    }
  }

  setViewPreset(preset) {
    if (!this.camera || !this.controls) return;
    const tiers = this.lastSelection?.tiers || 1;
    const sizeRadii = { '0.5lb': 1.06, '1lb': 1.28, '2lb': 1.5, '3lb': 1.7, '5lb': 1.88, '8lb': 2.04, '10lb': 2.18, '15lb': 2.34 };
    const sizeHeights = { '0.5lb': 0.58, '1lb': 0.66, '2lb': 0.7, '3lb': 0.74, '5lb': 0.78, '8lb': 0.8, '10lb': 0.82, '15lb': 0.84 };
    const baseRadius = sizeRadii[this.lastSelection?.size || '1lb'] || 1.28;
    const tierHeight = sizeHeights[this.lastSelection?.size || '1lb'] || 0.68;
    const totalH = tiers * tierHeight;
    const centerY = 0.54 + totalH * 0.5;
    const dist = 5.8 + tiers * 1.25 + Math.max(0, baseRadius - 1.5) * 1.4;

    const presets = {
      threeQuarter: { pos: new THREE.Vector3(dist * 0.36, centerY + 1.85 + tiers * 0.55, dist * 0.92), target: new THREE.Vector3(0, centerY, 0) },
      front: { pos: new THREE.Vector3(0, centerY + 0.95 + tiers * 0.25, dist * 1.02), target: new THREE.Vector3(0, centerY, 0) },
      top: { pos: new THREE.Vector3(0, 6.4 + tiers * 1.05, 1.6), target: new THREE.Vector3(0, centerY * 0.88, 0) }
    };
    const chosen = presets[preset] || presets.threeQuarter;
    this.cameraTween = {
      fromPos: this.camera.position.clone(),
      toPos: chosen.pos,
      fromTarget: this.controls.target.clone(),
      toTarget: chosen.target,
      progress: 0
    };
  }

  zoomBy(factor) {
    if (!this.camera || !this.controls) return;
    const offset = this.camera.position.clone().sub(this.controls.target);
    const nextDist = THREE.MathUtils.clamp(offset.length() * factor, this.controls.minDistance, this.controls.maxDistance);
    offset.setLength(nextDist);
    this.camera.position.copy(this.controls.target).add(offset);
    this.controls.update();
  }

  getSpongeColor(id, optionsData = {}) {
    const optionColor = optionsData.sponge_flavors?.find(option => option.id === id)?.color;
    return optionColor || SPONGE_COLORS[id] || '#f7ead2';
  }

  getFillingStyle(id) {
    return FILLING_STYLES[id] || FILLING_STYLES.cream;
  }

  createShapeOutline(shape, radius) {
    const outline = new THREE.Shape();

    if (shape === 'square') {
      const half = radius * 0.86;
      const corner = radius * 0.14;
      outline.moveTo(-half + corner, -half);
      outline.lineTo(half - corner, -half);
      outline.quadraticCurveTo(half, -half, half, -half + corner);
      outline.lineTo(half, half - corner);
      outline.quadraticCurveTo(half, half, half - corner, half);
      outline.lineTo(-half + corner, half);
      outline.quadraticCurveTo(-half, half, -half, half - corner);
      outline.lineTo(-half, -half + corner);
      outline.quadraticCurveTo(-half, -half, -half + corner, -half);
      return outline;
    }

    if (shape === 'hexagon') {
      const sides = 6;
      const vertices = [];
      for (let i = 0; i < sides; i++) {
        const a = (i / sides) * Math.PI * 2 + Math.PI / 6;
        vertices.push(new THREE.Vector2(Math.cos(a) * radius * 0.98, Math.sin(a) * radius * 0.98));
      }
      const chamfer = 0.12;
      for (let i = 0; i < sides; i++) {
        const prev = vertices[(i - 1 + sides) % sides];
        const curr = vertices[i];
        const next = vertices[(i + 1) % sides];
        const pIn = new THREE.Vector2().lerpVectors(curr, prev, chamfer);
        const pOut = new THREE.Vector2().lerpVectors(curr, next, chamfer);
        if (i === 0) outline.moveTo(pIn.x, pIn.y);
        else outline.lineTo(pIn.x, pIn.y);
        outline.quadraticCurveTo(curr.x, curr.y, pOut.x, pOut.y);
      }
      outline.closePath();
      return outline;
    }

    if (shape === 'heart') {
      const s = radius * 0.96;
      const yOffset = -s * 0.08;
      outline.moveTo(0, -s * 0.82 + yOffset);
      outline.bezierCurveTo(s * 0.22, -s * 0.56 + yOffset, s * 1.02, s * 0.04 + yOffset, s * 0.84, s * 0.54 + yOffset);
      outline.bezierCurveTo(s * 0.65, s * 1.05 + yOffset, s * 0.14, s * 0.82 + yOffset, 0, s * 0.56 + yOffset);
      outline.bezierCurveTo(-s * 0.14, s * 0.82 + yOffset, -s * 0.65, s * 1.05 + yOffset, -s * 0.84, s * 0.54 + yOffset);
      outline.bezierCurveTo(-s * 1.02, s * 0.04 + yOffset, -s * 0.22, -s * 0.56 + yOffset, 0, -s * 0.82 + yOffset);
      return outline;
    }

    outline.absarc(0, 0, radius, 0, Math.PI * 2, false);
    return outline;
  }

  samplePerimeterFrames(shape, radius, count) {
    const outline = this.createShapeOutline(shape, radius);
    const pts = outline.getSpacedPoints(count);
    const frames = [];

    for (let i = 0; i < count; i++) {
      const pCurr = pts[i];
      const pPrev = pts[(i - 1 + count) % count];
      const pNext = pts[(i + 1) % count];
      const tx2 = pNext.x - pPrev.x;
      const ty2 = pNext.y - pPrev.y;
      const len = Math.hypot(tx2, ty2) || 1;
      const x = pCurr.x;
      const z = -pCurr.y;
      const tx = tx2 / len;
      const tz = -ty2 / len;
      let nx = ty2 / len;
      let nz = tx2 / len;
      if (nx * x + nz * z < 0 && shape !== 'heart') {
        nx = -nx;
        nz = -nz;
      }
      const theta = Math.atan2(x, z);
      const tangentAngle = Math.atan2(tx, tz);
      frames.push({ x, z, nx, nz, tx, tz, tangentAngle, theta });
    }
    return frames;
  }

  isAngleInsideCutout(theta) {
    if (!this.sliceView) return false;
    return theta > 0.12 && theta < 0.96;
  }

  createCutawayOutline(shape, radius, inset = 0) {
    const effectiveRadius = Math.max(0.2, radius - inset);
    const full = this.createShapeOutline(shape, effectiveRadius);
    if (!this.sliceView) return full;

    const pts = full.getSpacedPoints(96);
    const kept = [];
    for (const pt of pts) {
      const theta = Math.atan2(pt.x, -pt.y);
      if (theta <= 0.12 || theta >= 0.96) {
        kept.push({ pt, theta });
      }
    }

    const afterEnd = kept.filter(k => k.theta >= 0.96).sort((a, b) => a.theta - b.theta);
    const beforeStart = kept.filter(k => k.theta <= 0.12).sort((a, b) => a.theta - b.theta);
    const ordered = [...afterEnd, ...beforeStart];

    const cutShape = new THREE.Shape();
    cutShape.moveTo(0, 0);
    for (const item of ordered) {
      cutShape.lineTo(item.pt.x, item.pt.y);
    }
    cutShape.lineTo(0, 0);
    return cutShape;
  }

  makeTierSolid(shape, radius, height, bevelSize = 0.025) {
    const outline = this.createCutawayOutline(shape, radius, bevelSize * 0.8);
    const geo = new THREE.ExtrudeGeometry(outline, {
      depth: Math.max(0.04, height - bevelSize * 1.4),
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize,
      bevelThickness: bevelSize * 0.7,
      curveSegments: 40
    });
    geo.rotateX(-Math.PI / 2);
    geo.computeBoundingBox();
    const minY = geo.boundingBox.min.y;
    const maxY = geo.boundingBox.max.y;
    geo.translate(0, -(minY + maxY) / 2, 0);
    return geo;
  }

  makeCakeMaterial(baseFrosting, outerColor, spongeColor) {
    const icing = new THREE.Color(outerColor);
    if (baseFrosting === 'mirror_glaze') {
      return new THREE.MeshPhysicalMaterial({
        color: icing,
        roughness: 0.04,
        metalness: 0.04,
        clearcoat: 1.0,
        clearcoatRoughness: 0.03,
        reflectivity: 1.0
      });
    }
    if (baseFrosting === 'fondant') {
      return new THREE.MeshPhysicalMaterial({
        color: icing,
        roughness: 0.16,
        metalness: 0.02,
        clearcoat: 0.75,
        clearcoatRoughness: 0.1
      });
    }
    if (baseFrosting === 'textured') {
      return new THREE.MeshStandardMaterial({
        color: icing,
        bumpMap: this.sharedTextures.stuccoBump,
        bumpScale: 0.048,
        roughness: 0.76,
        metalness: 0.01
      });
    }
    if (baseFrosting === 'semi-naked') {
      const scrapedColor = icing.clone().lerp(new THREE.Color(spongeColor), 0.22);
      return new THREE.MeshStandardMaterial({
        color: scrapedColor,
        bumpMap: this.sharedTextures.smoothBump,
        bumpScale: 0.022,
        roughness: 0.65,
        metalness: 0.01
      });
    }
    return new THREE.MeshPhysicalMaterial({
      color: icing,
      bumpMap: this.sharedTextures.smoothBump,
      bumpScale: 0.012,
      roughness: 0.34,
      metalness: 0.01,
      clearcoat: 0.12,
      clearcoatRoughness: 0.25
    });
  }

  updateCake(selection, optionsData = {}) {
    if (!this.cakeGroup) return;
    const prevTiers = this.lastSelection?.tiers || 1;
    this.lastSelection = { ...selection, toppings: [...(selection.toppings || [])] };
    this.lastOptionsData = optionsData;

    this.clearGroup(this.cakeGroup);

    const {
      tiers = 1,
      shape = 'round',
      size = '1lb',
      base_frosting = 'smooth',
      icing_color = '#d4838f',
      sponge_flavor = 'vanilla',
      filling_flavor = 'cream',
      piping_style = 'pearl',
      toppings = [],
      inscription = '',
      inscription_color = '#542137'
    } = selection;

    const spongeColor = this.getSpongeColor(sponge_flavor, optionsData);
    const fillingStyle = this.getFillingStyle(filling_flavor);
    const outerColor = new THREE.Color(icing_color);

    const frostingMaterial = this.makeCakeMaterial(base_frosting, icing_color, spongeColor);
    const spongeMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(spongeColor),
      bumpMap: this.sharedTextures.spongeBump,
      bumpScale: 0.035,
      roughness: 0.88,
      metalness: 0.0
    });
    const fillingMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(fillingStyle.color),
      roughness: fillingStyle.roughness,
      metalness: fillingStyle.metalness,
      clearcoat: 0.35,
      clearcoatRoughness: 0.18
    });

    const sizeRadii = { '0.5lb': 1.06, '1lb': 1.28, '2lb': 1.5, '3lb': 1.7, '5lb': 1.88, '8lb': 2.04, '10lb': 2.18, '15lb': 2.34 };
    const sizeHeights = { '0.5lb': 0.58, '1lb': 0.66, '2lb': 0.7, '3lb': 0.74, '5lb': 0.78, '8lb': 0.8, '10lb': 0.82, '15lb': 0.84 };
    const baseRadius = sizeRadii[size] || 1.28;
    const tierHeight = sizeHeights[size] || 0.68;

    const platterScale = Math.max(0.96, baseRadius / 1.46);
    if (this.pedestalGroup) this.pedestalGroup.scale.set(platterScale, 1, platterScale);

    // Brushed gold cake board under bottom tier
    const boardFrames = this.samplePerimeterFrames(shape, baseRadius + 0.14, 64);
    const boardOutline = new THREE.Shape();
    boardFrames.forEach((f, idx) => {
      if (idx === 0) boardOutline.moveTo(f.x, -f.z);
      else boardOutline.lineTo(f.x, -f.z);
    });
    boardOutline.closePath();
    const boardGeo = new THREE.ExtrudeGeometry(boardOutline, { depth: 0.032, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.01 });
    boardGeo.rotateX(-Math.PI / 2);
    const boardMesh = new THREE.Mesh(boardGeo, new THREE.MeshStandardMaterial({ color: 0xd9b879, metalness: 0.6, roughness: 0.3 }));
    boardMesh.position.y = 0.005;
    boardMesh.receiveShadow = true;
    this.cakeGroup.add(boardMesh);

    let currentY = 0.042;
    const tierStep = tiers <= 1 ? 0 : Math.min(0.32, (baseRadius * 0.62) / (tiers - 1));

    for (let i = 0; i < tiers; i++) {
      const tierRadius = baseRadius - i * tierStep;

      if (base_frosting === 'semi-naked') {
        this.buildSemiNakedTier(shape, tierRadius, tierHeight, currentY, spongeMaterial, fillingMaterial, frostingMaterial);
      } else {
        const tierGeo = this.makeTierSolid(shape, tierRadius, tierHeight, base_frosting === 'fondant' ? 0.028 : 0.02);
        const tierMesh = new THREE.Mesh(tierGeo, frostingMaterial);
        tierMesh.position.y = currentY + tierHeight / 2;
        tierMesh.castShadow = true;
        tierMesh.receiveShadow = true;
        this.cakeGroup.add(tierMesh);
      }

      if (this.sliceView) {
        this.addSliceCrossSectionLayers(tierRadius, currentY, tierHeight, spongeMaterial, fillingMaterial, frostingMaterial);
      }

      if (base_frosting === 'fondant') {
        this.addFondantRibbonSash(shape, tierRadius, currentY, outerColor);
      } else if (base_frosting === 'ruffled') {
        this.addRuffledRibbons(shape, tierRadius, currentY, tierHeight, outerColor);
      } else if (base_frosting === 'textured') {
        this.addTexturedCrownSwirl(shape, tierRadius, currentY + tierHeight, outerColor);
      }

      if (piping_style !== 'none') {
        this.addPipingDecoration(shape, tierRadius, currentY, tierHeight, outerColor, piping_style);
      }

      currentY += tierHeight;
    }

    const topY = currentY;
    const topRadius = baseRadius - (tiers - 1) * tierStep;

    if (this.sliceView) {
      this.addPulledOutSlice(baseRadius, tierHeight, spongeMaterial, fillingMaterial, frostingMaterial);
    }

    // Toppings & Accents (plus graceful support for legacy topping IDs)
    const has = (id) => toppings.includes(id);
    if (has('gold_leaf') || has('silver_vark')) {
      this.addGoldLeafAccents(shape, tiers, baseRadius, tierStep, tierHeight, topRadius, topY);
    }
    if (has('floral_roses')) {
      this.addFloralRoseCascade(topRadius, topY, tiers, baseRadius, tierStep, tierHeight);
    }
    if (has('marigolds')) {
      this.addMarigoldToppers(topRadius, topY, tiers, baseRadius, tierStep, tierHeight);
    }
    if (has('macarons')) {
      this.addMacaronToppers(topRadius, topY, tiers, baseRadius, tierStep, tierHeight);
    }
    if (has('choco_truffles') || has('chocolate_shards')) {
      this.addChocolateTrufflesAndSails(topRadius, topY);
    }
    if (has('berries')) {
      this.addBerriesCluster(topRadius, topY);
    }
    if (has('praline_nuts') || has('dry_fruits') || has('coconut_flakes')) {
      this.addPralineAndNutsCrown(topRadius, topY);
    }
    if (has('acrylic_topper')) {
      this.addAcrylicCelebrateTopper(topRadius, topY);
    }

    if (inscription && inscription.trim() !== '') {
      this.addInscriptionPlaque(shape, baseRadius, inscription.trim(), inscription_color);
    }

    // Smoothly frame multi-tier and large-diameter cakes so all tiers fit inside stage
    if (this.controls && this.camera) {
      const totalH = tiers * tierHeight;
      const centerY = 0.54 + totalH * 0.5;
      this.controls.target.set(0, centerY, 0);
      if (tiers !== prevTiers || size !== this._prevSize) {
        this._prevSize = size;
        const targetDist = 5.8 + tiers * 1.25 + Math.max(0, baseRadius - 1.5) * 1.4;
        const dir = this.camera.position.clone().sub(this.controls.target).normalize();
        if (dir.lengthSq() < 0.01) dir.set(0.32, 0.48, 0.82).normalize();
        this.camera.position.copy(this.controls.target).addScaledVector(dir, targetDist);
        this.camera.position.y = Math.max(this.camera.position.y, centerY + 1.85 + tiers * 0.52);
      }
      this.controls.update();
    }

    this.handleResize();
  }

  buildSemiNakedTier(shape, radius, height, startY, spongeMat, fillingMat, frostingMat) {
    const layers = 5;
    const spongeH = height * 0.27;
    const fillingH = height * 0.095;
    let y = startY;

    for (let l = 0; l < layers; l++) {
      const isFilling = l % 2 === 1;
      const h = isFilling ? fillingH : spongeH;
      const r = isFilling ? radius - 0.015 : radius - 0.025;
      const geo = this.makeTierSolid(shape, r, h, 0.01);
      const mesh = new THREE.Mesh(geo, isFilling ? fillingMat : spongeMat);
      mesh.position.y = y + h / 2;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.cakeGroup.add(mesh);
      y += h;
    }

    const topCap = new THREE.Mesh(this.makeTierSolid(shape, radius, 0.055, 0.012), frostingMat);
    topCap.position.y = startY + height - 0.028;
    topCap.castShadow = true;
    topCap.receiveShadow = true;
    this.cakeGroup.add(topCap);

    const frames = this.samplePerimeterFrames(shape, radius - 0.008, 48);
    const bandMat = frostingMat.clone();
    bandMat.transparent = true;
    bandMat.opacity = 0.72;
    const patchGeo = new THREE.BoxGeometry(0.18, height * 0.88, 0.024);

    frames.forEach((f, idx) => {
      if (this.isAngleInsideCutout(f.theta) || idx % 2 === 1) return;
      const patch = new THREE.Mesh(patchGeo, bandMat);
      patch.position.set(f.x + f.nx * 0.004, startY + height / 2, f.z + f.nz * 0.004);
      patch.rotation.y = f.tangentAngle + Math.PI / 2;
      this.cakeGroup.add(patch);
    });
  }

  addSliceCrossSectionLayers(radius, startY, height, spongeMat, fillingMat, frostingMat) {
    const angles = [0.12, 0.96];
    const wallWidth = Math.max(0.25, radius * 0.82);

    angles.forEach(theta => {
      const dirX = Math.sin(theta);
      const dirZ = Math.cos(theta);
      const wallGroup = new THREE.Group();

      const bandHeights = [height * 0.25, height * 0.1, height * 0.25, height * 0.1, height * 0.24];
      let y = startY + 0.02;
      bandHeights.forEach((bh, idx) => {
        const isFill = idx % 2 === 1;
        const geo = new THREE.BoxGeometry(0.015, bh, wallWidth);
        const mesh = new THREE.Mesh(geo, isFill ? fillingMat : spongeMat);
        mesh.position.set(dirX * (wallWidth / 2), y + bh / 2, dirZ * (wallWidth / 2));
        mesh.rotation.y = theta;
        wallGroup.add(mesh);
        y += bh;
      });

      const topStrip = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.05, wallWidth + 0.02), frostingMat);
      topStrip.position.set(dirX * (wallWidth / 2), startY + height - 0.025, dirZ * (wallWidth / 2));
      topStrip.rotation.y = theta;
      wallGroup.add(topStrip);

      this.cakeGroup.add(wallGroup);
    });
  }

  addPulledOutSlice(baseRadius, tierHeight, spongeMat, fillingMat, frostingMat) {
    const sliceGroup = new THREE.Group();
    const wedgeLen = Math.min(0.86, baseRadius * 0.62);
    const wedgeAngle = 0.42;

    const sliceOutline = new THREE.Shape();
    sliceOutline.moveTo(0, 0);
    sliceOutline.lineTo(wedgeLen, 0);
    sliceOutline.lineTo(wedgeLen * Math.cos(wedgeAngle), wedgeLen * Math.sin(wedgeAngle));
    sliceOutline.closePath();

    const bands = [
      { h: tierHeight * 0.27, mat: spongeMat },
      { h: tierHeight * 0.09, mat: fillingMat },
      { h: tierHeight * 0.27, mat: spongeMat },
      { h: tierHeight * 0.09, mat: fillingMat },
      { h: tierHeight * 0.24, mat: spongeMat },
      { h: 0.045, mat: frostingMat }
    ];

    let y = 0.03;
    bands.forEach(b => {
      const geo = new THREE.ExtrudeGeometry(sliceOutline, { depth: b.h, bevelEnabled: false });
      geo.rotateX(-Math.PI / 2);
      const mesh = new THREE.Mesh(geo, b.mat);
      mesh.position.y = y;
      mesh.castShadow = true;
      sliceGroup.add(mesh);
      y += b.h;
    });

    const plate = new THREE.Mesh(
      new THREE.CylinderGeometry(0.54, 0.4, 0.03, 32),
      new THREE.MeshPhysicalMaterial({ color: 0xfffdf9, roughness: 0.14, clearcoat: 0.6 })
    );
    plate.position.set(wedgeLen * 0.48, 0.015, -wedgeLen * 0.16);
    plate.receiveShadow = true;
    sliceGroup.add(plate);

    sliceGroup.position.set(baseRadius * 0.56, 0.01, baseRadius * 0.88);
    sliceGroup.rotation.y = 0.35;
    this.cakeGroup.add(sliceGroup);
  }

  addFondantRibbonSash(shape, radius, startY, outerColor) {
    const lum = getColorLuminance(outerColor);
    const ribbonColor = outerColor.clone().offsetHSL(0, 0.06, lum > 0.5 ? -0.14 : 0.16);
    const ribbonMat = new THREE.MeshPhysicalMaterial({
      color: ribbonColor,
      roughness: 0.22,
      clearcoat: 0.45
    });
    const frames = this.samplePerimeterFrames(shape, radius + 0.01, 68);
    const ribbonGeo = new THREE.BoxGeometry(0.11, 0.065, 0.018);
    frames.forEach(f => {
      if (this.isAngleInsideCutout(f.theta)) return;
      const seg = new THREE.Mesh(ribbonGeo, ribbonMat);
      seg.position.set(f.x, startY + 0.04, f.z);
      seg.rotation.y = f.tangentAngle + Math.PI / 2;
      this.cakeGroup.add(seg);
    });
  }

  addRuffledRibbons(shape, radius, startY, height, outerColor) {
    const bands = 4;
    const ruffleGeo = new THREE.SphereGeometry(0.046, 10, 8);
    for (let b = 0; b < bands; b++) {
      const bandColor = outerColor.clone().offsetHSL(0, 0, (b - 1.5) * 0.035);
      const bandMat = new THREE.MeshStandardMaterial({ color: bandColor, roughness: 0.4 });
      const count = Math.max(44, Math.round(radius * 44));
      const frames = this.samplePerimeterFrames(shape, radius + 0.015, count);
      const baseY = startY + 0.1 + (b / bands) * (height - 0.16);

      frames.forEach((f, idx) => {
        if (this.isAngleInsideCutout(f.theta)) return;
        const pleat = new THREE.Mesh(ruffleGeo, bandMat);
        const wave = Math.sin(idx * 0.65 + b) * 0.022;
        pleat.scale.set(1.45, 0.72, 0.85);
        pleat.position.set(f.x + f.nx * 0.012, baseY + wave, f.z + f.nz * 0.012);
        pleat.rotation.y = f.tangentAngle + Math.PI / 2;
        this.cakeGroup.add(pleat);
      });
    }
  }

  addTexturedCrownSwirl(shape, radius, topY, outerColor) {
    const swirlMat = new THREE.MeshStandardMaterial({
      color: outerColor.clone().offsetHSL(0, 0, 0.045),
      roughness: 0.62
    });
    const maxR = shape === 'heart' ? radius * 0.56 : radius * 0.72;
    for (let r = 0.24; r < maxR; r += 0.2) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.016, 8, 44), swirlMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = topY + 0.005;
      this.cakeGroup.add(ring);
    }
  }

  addPipingDecoration(shape, radius, startY, height, outerColor, style) {
    const group = new THREE.Group();
    const lum = getColorLuminance(outerColor);
    const pipingColor = outerColor.clone().offsetHSL(0, -0.02, lum > 0.78 ? -0.08 : 0.12);
    const pipingMat = new THREE.MeshStandardMaterial({ color: pipingColor, roughness: 0.34, metalness: 0.02 });

    if (style === 'pearl') {
      const count = Math.max(36, Math.round(radius * 36));
      const frames = this.samplePerimeterFrames(shape, radius + 0.022, count);
      const pearlGeo = new THREE.SphereGeometry(0.044, 12, 10);
      frames.forEach(f => {
        if (this.isAngleInsideCutout(f.theta)) return;
        const bead = new THREE.Mesh(pearlGeo, pipingMat);
        bead.position.set(f.x, startY + 0.036, f.z);
        bead.castShadow = true;
        group.add(bead);
      });
    } else if (style === 'shell') {
      const count = Math.max(24, Math.round(radius * 24));
      const frames = this.samplePerimeterFrames(shape, radius + 0.026, count);
      const shellBody = new THREE.ConeGeometry(0.056, 0.14, 10);
      const shellCap = new THREE.SphereGeometry(0.056, 10, 8);
      frames.forEach(f => {
        if (this.isAngleInsideCutout(f.theta)) return;
        const shell = new THREE.Group();
        const tail = new THREE.Mesh(shellBody, pipingMat);
        tail.rotation.z = Math.PI / 2;
        tail.position.x = -0.045;
        const head = new THREE.Mesh(shellCap, pipingMat);
        head.scale.set(1.1, 0.9, 0.95);
        shell.add(tail, head);
        shell.position.set(f.x, startY + 0.045, f.z);
        shell.rotation.y = f.tangentAngle + Math.PI / 2;
        group.add(shell);
      });
    } else if (style === 'rosette') {
      const count = Math.max(14, Math.round(radius * 13));
      const frames = this.samplePerimeterFrames(shape, radius * 0.86, count);
      const petalRingGeo = new THREE.TorusGeometry(0.058, 0.025, 8, 16);
      const centerGeo = new THREE.SphereGeometry(0.036, 10, 8);
      frames.forEach(f => {
        if (this.isAngleInsideCutout(f.theta)) return;
        const ros = new THREE.Group();
        const outer = new THREE.Mesh(petalRingGeo, pipingMat);
        outer.rotation.x = Math.PI / 2;
        const core = new THREE.Mesh(centerGeo, pipingMat);
        core.position.y = 0.02;
        ros.add(outer, core);
        ros.position.set(f.x, startY + height + 0.026, f.z);
        group.add(ros);
      });
    } else if (style === 'mehndi') {
      const mehndiColor = lum > 0.72 ? new THREE.Color(0xcfa866) : new THREE.Color(0xfdf5e6);
      const mehndiMat = new THREE.MeshStandardMaterial({ color: mehndiColor, roughness: 0.34, metalness: 0.22 });
      const count = Math.max(48, Math.round(radius * 44));
      const frames = this.samplePerimeterFrames(shape, radius + 0.016, count);
      const dotGeo = new THREE.SphereGeometry(0.024, 8, 6);

      frames.forEach((f, idx) => {
        if (this.isAngleInsideCutout(f.theta)) return;
        const swagPhase = (idx % 6) / 6;
        const drop = Math.sin(swagPhase * Math.PI) * 0.14;
        const dot = new THREE.Mesh(dotGeo, mehndiMat);
        dot.position.set(f.x, startY + height * 0.72 - drop, f.z);
        group.add(dot);

        if (idx % 6 === 3) {
          const dropPearl = new THREE.Mesh(new THREE.SphereGeometry(0.034, 8, 6), mehndiMat);
          dropPearl.position.set(f.x, startY + height * 0.5, f.z);
          group.add(dropPearl);
        }
      });
    } else if (style === 'drip') {
      const dripColor = lum < 0.25 ? new THREE.Color(0xf6ead5) : new THREE.Color(0x3a1d19);
      const dripMat = new THREE.MeshPhysicalMaterial({ color: dripColor, roughness: 0.08, clearcoat: 0.9, clearcoatRoughness: 0.05 });

      // Glossy top ganache cap ring
      const capGeo = this.makeTierSolid(shape, radius + 0.008, 0.04, 0.012);
      const capMesh = new THREE.Mesh(capGeo, dripMat);
      capMesh.position.y = startY + height - 0.008;
      group.add(capMesh);

      const count = Math.max(30, Math.round(radius * 28));
      const frames = this.samplePerimeterFrames(shape, radius + 0.014, count);
      frames.forEach((f, idx) => {
        if (this.isAngleInsideCutout(f.theta)) return;
        const dripLen = 0.12 + ((idx * 17) % 10) * 0.036;
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.018, dripLen, 8), dripMat);
        stem.position.set(f.x, startY + height - dripLen / 2, f.z);
        const bead = new THREE.Mesh(new THREE.SphereGeometry(0.026, 8, 6), dripMat);
        bead.position.set(f.x, startY + height - dripLen, f.z);
        group.add(stem, bead);
      });
    }

    this.cakeGroup.add(group);
  }

  addGoldLeafAccents(shape, tiers, baseRadius, tierStep, tierHeight, topRadius, topY) {
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf4cc62,
      metalness: 0.92,
      roughness: 0.14,
      side: THREE.DoubleSide
    });
    const pearlMat = new THREE.MeshStandardMaterial({ color: 0xe6bc55, metalness: 0.85, roughness: 0.18 });
    const group = new THREE.Group();

    for (let t = 0; t < tiers; t++) {
      const r = baseRadius - t * tierStep;
      const frames = this.samplePerimeterFrames(shape, r + 0.018, 36);
      const startY = 0.042 + t * tierHeight;

      for (let i = 0; i < 12; i++) {
        const f = frames[(i * 3 + t * 2) % frames.length];
        if (this.isAngleInsideCutout(f.theta)) continue;
        const leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.24 + (i % 3) * 0.06, 0.18 + (i % 2) * 0.06), goldMat);
        leaf.position.set(f.x, startY + 0.14 + ((i * 19) % 50) / 100 * (tierHeight - 0.22), f.z);
        leaf.lookAt(f.x + f.nx, leaf.position.y, f.z + f.nz);
        leaf.rotateZ((i % 5) * 0.42);
        group.add(leaf);

        // Cascading edible gold pearls alongside foil
        const pearl = new THREE.Mesh(new THREE.SphereGeometry(0.036 + (i % 2) * 0.014, 10, 8), pearlMat);
        pearl.position.set(f.x + f.nx * 0.02, startY + 0.08 + ((i * 23) % 60) / 100 * (tierHeight - 0.12), f.z + f.nz * 0.02);
        group.add(pearl);
      }
    }

    // Crown gold pearl ring
    const crownFrames = this.samplePerimeterFrames(shape, topRadius * 0.65, 16);
    crownFrames.forEach((f, idx) => {
      if (this.isAngleInsideCutout(f.theta)) return;
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), pearlMat);
      p.position.set(f.x, topY + 0.035 + (idx % 2) * 0.015, f.z);
      group.add(p);
    });
    this.cakeGroup.add(group);
  }

  addFloralRoseCascade(topRadius, topY, tiers, baseRadius, tierStep, tierHeight) {
    const group = new THREE.Group();
    const rosePalettes = [
      [0x9e1b3b, 0xba284d, 0xd4466a], // crimson velvet rose
      [0xd97389, 0xe892a4, 0xf4b6c2], // blush garden rose
      [0xf5eadb, 0xfbf4e8, 0xffffff]  // ivory tea rose
    ];
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x3f663c, roughness: 0.52 });
    const breathMat = new THREE.MeshStandardMaterial({ color: 0xfffcf8, roughness: 0.6 });

    const createRose = (paletteIdx, scale) => {
      const rose = new THREE.Group();
      const colors = rosePalettes[paletteIdx % rosePalettes.length];
      for (let ring = 0; ring < 3; ring++) {
        const count = 8 - ring * 2;
        const r = 0.095 - ring * 0.028;
        const mat = new THREE.MeshStandardMaterial({ color: colors[ring], roughness: 0.44 });
        for (let i = 0; i < count; i++) {
          const a = (i / count) * Math.PI * 2 + ring * 0.45;
          const petal = new THREE.Mesh(new THREE.SphereGeometry(0.056, 10, 8), mat);
          petal.scale.set(1.2, 1.05, 0.55);
          petal.position.set(Math.cos(a) * r, ring * 0.028, Math.sin(a) * r);
          petal.rotation.y = -a + Math.PI / 2;
          petal.rotation.x = 0.35 - ring * 0.1;
          rose.add(petal);
        }
      }
      // Eucalyptus / rose leaves
      for (let l = 0; l < 3; l++) {
        const la = (l / 3) * Math.PI * 2 + 0.4;
        const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), leafMat);
        leaf.scale.set(1.8, 0.2, 0.85);
        leaf.position.set(Math.cos(la) * 0.18, -0.02, Math.sin(la) * 0.18);
        leaf.rotation.y = -la;
        rose.add(leaf);
      }
      // Baby's breath tiny florets
      for (let b = 0; b < 5; b++) {
        const ba = b * 1.25;
        const bud = new THREE.Mesh(new THREE.SphereGeometry(0.024, 6, 6), breathMat);
        bud.position.set(Math.cos(ba) * 0.2, 0.03 + (b % 2) * 0.02, Math.sin(ba) * 0.2);
        rose.add(bud);
      }
      rose.scale.setScalar(scale);
      return rose;
    };

    // Crown bouquet
    [
      { angle: 2.4, r: topRadius * 0.25, pal: 0, scale: 1.25 },
      { angle: 3.1, r: topRadius * 0.44, pal: 1, scale: 1.1 },
      { angle: -1.8, r: topRadius * 0.42, pal: 2, scale: 1.05 },
      { angle: -0.35, r: topRadius * 0.48, pal: 0, scale: 0.95 }
    ].forEach(p => {
      const rose = createRose(p.pal, p.scale);
      rose.position.set(Math.sin(p.angle) * p.r, topY + 0.08, Math.cos(p.angle) * p.r);
      group.add(rose);
    });

    // Cascading floral sweep across tier ledges
    for (let t = 0; t < tiers - 1; t++) {
      const ledgeR = baseRadius - t * tierStep - tierStep * 0.45;
      const ledgeY = 0.042 + (t + 1) * tierHeight + 0.065;
      [-0.35, -0.85].forEach((a, idx) => {
        const rose = createRose(t + idx + 1, 0.92 - idx * 0.1);
        rose.position.set(Math.sin(a) * ledgeR, ledgeY, Math.cos(a) * ledgeR);
        rose.rotation.x = 0.36;
        group.add(rose);
      });
    }

    this.cakeGroup.add(group);
  }

  addMarigoldToppers(topRadius, topY, tiers, baseRadius, tierStep, tierHeight) {
    const group = new THREE.Group();
    const petalColors = [0xf28500, 0xffa31a, 0xffc633];
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x45693c, roughness: 0.55 });
    const jasmineMat = new THREE.MeshStandardMaterial({ color: 0xfffcf5, roughness: 0.4 });

    const createFlower = (scale) => {
      const flower = new THREE.Group();
      for (let ring = 0; ring < 3; ring++) {
        const count = 14 - ring * 3;
        const ringR = 0.14 - ring * 0.04;
        const mat = new THREE.MeshStandardMaterial({ color: petalColors[ring], roughness: 0.48 });
        for (let i = 0; i < count; i++) {
          const a = (i / count) * Math.PI * 2 + ring * 0.3;
          const petal = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), mat);
          petal.scale.set(1.25, 0.72, 0.8);
          petal.position.set(Math.cos(a) * ringR, ring * 0.036, Math.sin(a) * ringR);
          petal.rotation.y = -a;
          petal.rotation.z = 0.42 - ring * 0.14;
          flower.add(petal);
        }
      }
      for (let l = 0; l < 3; l++) {
        const la = (l / 3) * Math.PI * 2;
        const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 6), leafMat);
        leaf.scale.set(1.7, 0.25, 0.8);
        leaf.position.set(Math.cos(la) * 0.2, -0.02, Math.sin(la) * 0.2);
        leaf.rotation.y = -la;
        flower.add(leaf);
      }
      flower.scale.setScalar(scale);
      return flower;
    };

    [
      { angle: 2.3, r: topRadius * 0.3, scale: 1.2 },
      { angle: 3.1, r: topRadius * 0.48, scale: 1.0 },
      { angle: -1.8, r: topRadius * 0.42, scale: 1.05 },
      { angle: -0.45, r: topRadius * 0.52, scale: 0.95 }
    ].forEach(p => {
      const fl = createFlower(p.scale);
      fl.position.set(Math.sin(p.angle) * p.r, topY + 0.085, Math.cos(p.angle) * p.r);
      group.add(fl);
    });

    // Jasmine & Marigold garland on tier ledges
    for (let t = 0; t < tiers - 1; t++) {
      const ledgeR = baseRadius - t * tierStep - tierStep * 0.48;
      const ledgeY = 0.042 + (t + 1) * tierHeight + 0.07;
      for (let j = 0; j < 10; j++) {
        const ja = -1.2 + j * 0.26;
        if (j % 3 === 0) {
          const fl = createFlower(0.8);
          fl.position.set(Math.sin(ja) * ledgeR, ledgeY, Math.cos(ja) * ledgeR);
          fl.rotation.x = 0.32;
          group.add(fl);
        } else {
          const jas = new THREE.Mesh(new THREE.SphereGeometry(0.042, 8, 6), jasmineMat);
          jas.position.set(Math.sin(ja) * ledgeR, ledgeY - 0.02, Math.cos(ja) * ledgeR);
          group.add(jas);
        }
      }
    }

    this.cakeGroup.add(group);
  }

  addMacaronToppers(topRadius, topY, tiers, baseRadius, tierStep, tierHeight) {
    const group = new THREE.Group();
    const colors = [0xe88ca0, 0xf5e2c8, 0x99b285, 0xc98a7d, 0xf0be7a, 0xa88db0];
    const fillMat = new THREE.MeshStandardMaterial({ color: 0xfffaf2, roughness: 0.2 });

    const makeMacaron = (colorHex) => {
      const mac = new THREE.Group();
      const shellMat = new THREE.MeshPhysicalMaterial({ color: colorHex, roughness: 0.26, clearcoat: 0.3 });
      const topShell = new THREE.Mesh(new THREE.SphereGeometry(0.2, 22, 14, 0, Math.PI * 2, 0, Math.PI * 0.5), shellMat);
      topShell.scale.set(1, 0.58, 1);
      topShell.position.y = 0.028;
      const feet = new THREE.Mesh(new THREE.CylinderGeometry(0.204, 0.204, 0.025, 22), shellMat);
      feet.position.y = 0.014;
      const filling = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.04, 22), fillMat);
      const botShell = new THREE.Mesh(new THREE.SphereGeometry(0.2, 22, 14, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5), shellMat);
      botShell.scale.set(1, 0.58, 1);
      botShell.position.y = -0.025;
      mac.add(topShell, feet, filling, botShell);
      mac.castShadow = true;
      return mac;
    };

    for (let i = 0; i < 6; i++) {
      const mac = makeMacaron(colors[i % colors.length]);
      const angle = -0.7 + i * 0.95;
      const r = topRadius * (i < 4 ? 0.5 : 0.22);
      mac.position.set(Math.sin(angle) * r, topY + 0.16, Math.cos(angle) * r);
      mac.rotation.set(0.55, angle, 0.25);
      group.add(mac);
    }

    if (tiers > 1) {
      const ledgeR = baseRadius - tierStep * 0.45;
      const ledgeY = 0.042 + tierHeight + 0.13;
      [-0.25, -0.75].forEach((a, idx) => {
        const mac = makeMacaron(colors[(idx + 2) % colors.length]);
        mac.scale.setScalar(0.85);
        mac.position.set(Math.sin(a) * ledgeR, ledgeY, Math.cos(a) * ledgeR);
        mac.rotation.set(0.6, a, 0.2);
        group.add(mac);
      });
    }
    this.cakeGroup.add(group);
  }

  addChocolateTrufflesAndSails(topRadius, topY) {
    const group = new THREE.Group();
    const darkMat = new THREE.MeshPhysicalMaterial({ color: 0x331c18, roughness: 0.16, clearcoat: 0.55 });
    const milkMat = new THREE.MeshPhysicalMaterial({ color: 0x663829, roughness: 0.2, clearcoat: 0.45 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xe6bc55, metalness: 0.88, roughness: 0.18 });

    // Tall tempered chocolate geometric sails
    for (let i = 0; i < 6; i++) {
      const shardShape = new THREE.Shape();
      shardShape.moveTo(0, 0);
      shardShape.lineTo(0.3 - i * 0.02, 0.05);
      shardShape.lineTo(0.16, 0.62 - i * 0.04);
      shardShape.lineTo(-0.06, 0.36);
      shardShape.closePath();

      const geo = new THREE.ExtrudeGeometry(shardShape, { depth: 0.026, bevelEnabled: true, bevelSize: 0.006, bevelThickness: 0.006 });
      const shard = new THREE.Mesh(geo, i % 2 === 0 ? darkMat : milkMat);
      const angle = 2.0 + i * 0.62;
      const r = topRadius * 0.28;
      shard.position.set(Math.sin(angle) * r, topY + 0.01, Math.cos(angle) * r);
      shard.rotation.set(-0.18, angle + 0.4, (i - 2.5) * 0.12);
      shard.castShadow = true;
      group.add(shard);
    }

    // Gold-dusted chocolate truffles around base of sails
    for (let t = 0; t < 7; t++) {
      const ta = -0.7 + t * 0.82;
      const tr = topRadius * (t < 5 ? 0.54 : 0.24);
      const truffle = new THREE.Mesh(new THREE.SphereGeometry(0.125, 16, 12), t % 2 === 0 ? darkMat : milkMat);
      truffle.position.set(Math.sin(ta) * tr, topY + 0.11, Math.cos(ta) * tr);
      truffle.castShadow = true;
      const speck = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), goldMat);
      speck.position.set(Math.sin(ta) * tr + 0.04, topY + 0.21, Math.cos(ta) * tr + 0.03);
      group.add(truffle, speck);
    }
    this.cakeGroup.add(group);
  }

  addBerriesCluster(topRadius, topY) {
    const group = new THREE.Group();
    const strawMat = new THREE.MeshPhysicalMaterial({ color: 0xc21e38, roughness: 0.22, clearcoat: 0.45 });
    const blueMat = new THREE.MeshStandardMaterial({ color: 0x2a315c, roughness: 0.32 });
    const raspMat = new THREE.MeshStandardMaterial({ color: 0xd12c52, roughness: 0.42 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x3b6932, roughness: 0.52 });

    for (let i = 0; i < 16; i++) {
      const angle = 1.4 + i * 0.41;
      const r = topRadius * (0.1 + (i % 3) * 0.17);
      const bx = Math.sin(angle) * r;
      const bz = Math.cos(angle) * r;
      const yLift = i < 6 ? 0.075 : 0.0;

      if (i % 3 === 0) {
        const straw = new THREE.Group();
        const body = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.24, 14), strawMat);
        body.rotation.x = Math.PI;
        const calyx = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.015, 0.025, 6), leafMat);
        calyx.position.y = 0.12;
        straw.add(body, calyx);
        straw.position.set(bx, topY + 0.12 + yLift, bz);
        straw.rotation.set(0.32, angle, 0.16);
        straw.castShadow = true;
        group.add(straw);
      } else {
        const berry = new THREE.Mesh(
          new THREE.SphereGeometry(i % 2 ? 0.072 : 0.088, 12, 10),
          i % 2 ? blueMat : raspMat
        );
        berry.position.set(bx, topY + 0.075 + yLift, bz);
        berry.castShadow = true;
        group.add(berry);
      }
    }
    // Fresh mint leaves
    for (let m = 0; m < 4; m++) {
      const ma = -0.3 + m * 1.5;
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), leafMat);
      leaf.scale.set(1.7, 0.18, 0.85);
      leaf.position.set(Math.sin(ma) * topRadius * 0.44, topY + 0.15, Math.cos(ma) * topRadius * 0.44);
      leaf.rotation.set(0.35, ma, 0.2);
      group.add(leaf);
    }
    this.cakeGroup.add(group);
  }

  addPralineAndNutsCrown(topRadius, topY) {
    const group = new THREE.Group();
    const materials = [
      new THREE.MeshStandardMaterial({ color: 0xdfc193, roughness: 0.45 }), // roasted almond
      new THREE.MeshStandardMaterial({ color: 0x6f8f46, roughness: 0.52 }), // pistachio
      new THREE.MeshStandardMaterial({ color: 0xc98b44, roughness: 0.4 }),  // cashew
      new THREE.MeshStandardMaterial({ color: 0x8a5424, roughness: 0.5 })   // walnut
    ];
    for (let i = 0; i < 24; i++) {
      const angle = -0.7 + i * 2.15;
      const r = topRadius * (0.2 + (i % 5) * 0.14);
      const nut = new THREE.Mesh(new THREE.SphereGeometry(0.095, 10, 8), materials[i % materials.length]);
      nut.scale.set(1.55, 0.65, 0.92);
      nut.position.set(Math.sin(angle) * r, topY + 0.065 + (i % 3) * 0.025, Math.cos(angle) * r);
      nut.rotation.set(0.28, angle, 0.15);
      nut.castShadow = true;
      group.add(nut);
    }

    // Translucent caramelized amber praline shards
    const amberMat = new THREE.MeshPhysicalMaterial({
      color: 0xd97a16,
      roughness: 0.12,
      metalness: 0.05,
      transparent: true,
      opacity: 0.85,
      clearcoat: 1.0
    });
    for (let s = 0; s < 4; s++) {
      const shardGeo = new THREE.ConeGeometry(0.12, 0.48 - s * 0.05, 4);
      const shard = new THREE.Mesh(shardGeo, amberMat);
      const sa = 2.2 + s * 0.7;
      shard.position.set(Math.sin(sa) * topRadius * 0.25, topY + 0.22, Math.cos(sa) * topRadius * 0.25);
      shard.rotation.set(0.18, sa, (s - 1.5) * 0.22);
      group.add(shard);
    }
    this.cakeGroup.add(group);
  }

  addAcrylicCelebrateTopper(topRadius, topY) {
    const group = new THREE.Group();
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xe6bf66,
      metalness: 0.9,
      roughness: 0.16
    });

    // Two slender support picks
    [-0.28, 0.28].forEach(xOff => {
      const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.012, 0.42, 8), goldMat);
      pin.position.set(xOff, topY + 0.18, 0);
      group.add(pin);
    });

    // Sculpted arched gold topper emblem
    const plaque = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.36, 0.03), goldMat);
    plaque.position.set(0, topY + 0.5, 0);
    group.add(plaque);

    const canvas = document.createElement('canvas');
    canvas.width = 768;
    canvas.height = 220;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#4b1328';
      ctx.fillRect(14, 14, canvas.width - 28, canvas.height - 28);
      ctx.strokeStyle = '#e6bf66';
      ctx.lineWidth = 8;
      ctx.strokeRect(24, 24, canvas.width - 48, canvas.height - 48);
      ctx.fillStyle = '#fff8e8';
      ctx.font = 'italic 700 84px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Celebrate', canvas.width / 2, canvas.height / 2 + 4);

      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      const faceMat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide });
      const face = new THREE.Mesh(new THREE.PlaneGeometry(1.12, 0.32), faceMat);
      face.position.set(0, topY + 0.5, 0.018);
      const backFace = new THREE.Mesh(new THREE.PlaneGeometry(1.12, 0.32), faceMat);
      backFace.position.set(0, topY + 0.5, -0.018);
      backFace.rotation.y = Math.PI;
      group.add(face, backFace);
    }

    this.cakeGroup.add(group);
  }

  /**
   * Gold-framed fondant plaque resting prominently on the front cake stand rim.
   */
  addInscriptionPlaque(shape, baseRadius, text, textColor = '#542137') {
    const plaqueGroup = new THREE.Group();
    const inkColor = new THREE.Color(textColor || '#542137');
    const isLightInk = getColorLuminance(inkColor) > 0.62;

    const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4aa5c, metalness: 0.82, roughness: 0.22 });
    const faceMat = new THREE.MeshPhysicalMaterial({
      color: isLightInk ? 0x2b1d20 : 0xfffaf2,
      roughness: 0.2,
      clearcoat: 0.35
    });

    const backing = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.38, 0.044), goldMat);
    const face = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.32, 0.052), faceMat);
    plaqueGroup.add(backing, face);

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = textColor || '#542137';
      ctx.font = 'italic 700 76px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const label = text.length > 28 ? `${text.slice(0, 26)}…` : text;
      ctx.fillText(label, canvas.width / 2, canvas.height / 2, canvas.width - 70);

      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      const textPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(1.34, 0.28),
        new THREE.MeshBasicMaterial({ map: tex, transparent: true })
      );
      textPlane.position.z = 0.028;
      plaqueGroup.add(textPlane);
    }

    const frames = this.samplePerimeterFrames(shape, baseRadius, 64);
    const frontFrame = frames.reduce((best, f) => {
      const score = f.z - Math.abs(f.x + 0.25) * 0.55;
      return score > best.score ? { score, frame: f } : best;
    }, { score: -Infinity, frame: frames[0] }).frame;

    plaqueGroup.position.set(frontFrame.x + frontFrame.nx * 0.32, 0.2, frontFrame.z + frontFrame.nz * 0.32);
    plaqueGroup.rotation.set(-0.46, Math.atan2(frontFrame.nx, frontFrame.nz), 0);
    this.cakeGroup.add(plaqueGroup);
  }

  clearGroup(group) {
    const geometries = new Set();
    const materials = new Set();
    group.traverse(object => {
      if (object.geometry) geometries.add(object.geometry);
      if (object.material) {
        (Array.isArray(object.material) ? object.material : [object.material]).forEach(m => materials.add(m));
      }
    });
    geometries.forEach(g => g.dispose());
    materials.forEach(m => {
      if (m.map && !Object.values(this.sharedTextures).includes(m.map)) {
        m.map.dispose();
      }
      m.dispose();
    });
    while (group.children.length) group.remove(group.children[0]);
  }

  animate() {
    this.animFrameId = requestAnimationFrame(() => this.animate());

    if (this.cameraTween && this.controls) {
      this.cameraTween.progress = Math.min(1, this.cameraTween.progress + 0.08);
      const t = 1 - Math.pow(1 - this.cameraTween.progress, 3);
      this.camera.position.lerpVectors(this.cameraTween.fromPos, this.cameraTween.toPos, t);
      this.controls.target.lerpVectors(this.cameraTween.fromTarget, this.cameraTween.toTarget, t);
      if (this.cameraTween.progress >= 1) this.cameraTween = null;
    }

    this.controls?.update();

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  destroy() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    if (this._onResize) window.removeEventListener('resize', this._onResize);

    if (this.controls) {
      this.controls.dispose();
      this.controls = null;
    }

    if (this.scene) {
      const geometries = new Set();
      const materials = new Set();
      const textures = new Set();
      this.scene.traverse(object => {
        if (object.geometry) geometries.add(object.geometry);
        if (object.material) {
          (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => {
            materials.add(material);
            Object.values(material).forEach(val => {
              if (val?.isTexture) textures.add(val);
            });
          });
        }
      });
      geometries.forEach(g => g.dispose());
      textures.forEach(t => t.dispose());
      materials.forEach(m => m.dispose());
    }

    Object.values(this.sharedTextures).forEach(tex => tex.dispose());
    this.sharedTextures = {};

    if (this.envRenderTarget) {
      this.envRenderTarget.dispose();
      this.envRenderTarget = null;
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
