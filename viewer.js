// ═══════════════════════════════════════════════════════════════
//   3D Heritage Viewer — viewer.js
// ═══════════════════════════════════════════════════════════════

import * as THREE        from 'https://esm.sh/three@0.160.0';
import { OrbitControls } from 'https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader }    from 'https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';
import { PLYLoader }     from 'https://esm.sh/three@0.160.0/examples/jsm/loaders/PLYLoader.js';

// ═══════════════════════════════════════════════════════════════
//   ★  CONFIGURATION — Edit this section before deploying  ★
// ═══════════════════════════════════════════════════════════════
//
//  MODEL_URL — paste your GitHub raw file URL here so the model
//  loads automatically when someone opens the page.
//
//  How to get the URL:
//    1. Go to your GitHub repo
//    2. Open the models/ folder and click your file
//    3. Click the "Raw" button
//    4. Copy the URL from your browser address bar
//
//  For LFS files, replace:
//    raw.githubusercontent.com/
//  with:
//    media.githubusercontent.com/media/
//
//  Leave as "" to use drag & drop only.
// we use locsl repo and host on github for easy access
const MODEL_URL = "https://media.githubusercontent.com/media/ljun00/thesis3d-viewer/refs/heads/main/models/Bale.ply";

// ═══════════════════════════════════════════════════════════════


// ── Renderer ─────────────────────────────────────────────────
const canvas = document.getElementById('canvas');
const wrap   = document.getElementById('wrap');

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
renderer.setSize(wrap.clientWidth, wrap.clientHeight);
renderer.setClearColor(0x0a0c0b);
renderer.outputColorSpace    = THREE.SRGBColorSpace;
renderer.toneMapping         = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.8;

// ── Scene & Camera ────────────────────────────────────────────
const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  45, wrap.clientWidth / wrap.clientHeight, 0.001, 2000
);
camera.position.set(0, 2, 5);

// ── OrbitControls ─────────────────────────────────────────────
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping      = true;
controls.dampingFactor      = 0.05;
controls.screenSpacePanning = true;

// ── Lighting ──────────────────────────────────────────────────
// GLB/PBR materials need strong, multi-directional lighting.

// Hemisphere: simulates open sky (blue from top, warm from ground)
const hemiLight = new THREE.HemisphereLight(0xc8e0ff, 0x8a7060, 1.2);
scene.add(hemiLight);

// Ambient: soft uniform fill
const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
scene.add(ambientLight);

// Key / sun light: main directional from upper-right
const sunLight = new THREE.DirectionalLight(0xfff5e0, 2.5);
sunLight.position.set(5, 10, 7);
scene.add(sunLight);

// Fill: softens opposite-side shadows
const fillLight = new THREE.DirectionalLight(0xddeeff, 0.8);
fillLight.position.set(-5, 4, -5);
scene.add(fillLight);

// Ground grid
scene.add(new THREE.GridHelper(20, 60, 0x1e2a22, 0x181e1c));

// ── Render loop ───────────────────────────────────────────────
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  updateHotspots();
  renderer.render(scene, camera);
}
animate();

// ── Handle resizing (window + layout changes) ───────────────
function syncRendererToWrap() {
  if (!wrap) return;

  const w = wrap.clientWidth;
  const h = wrap.clientHeight;
  if (w === 0 || h === 0) return;

  renderer.setSize(w, h, false); // don't change CSS size; avoid extra recalcs
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

// Real browser resizes
window.addEventListener('resize', syncRendererToWrap);



// ── Model container ───────────────────────────────────────────
// All loaded models go inside this group for easy clearing.
const modelGroup = new THREE.Group();
scene.add(modelGroup);

let currentModel = null;
let currentMats  = [];

// ── PART INFO DATA ────────────────────────────────────────────

const PART_INFO = {
  roof: {
    zone: 'Atop — Roof',
    name: 'Atop (Traditional Thatched Roof)',
    desc: `The atep is the thatched roof of the Ifugao Bale, made from
cogon grass (Imperata cylindrica) or pili leaves. These are tied over 
woven slit bamboos and it may descend to the level of the floor. The steep
A-frame pitch allows heavy rain to run off quickly — a practical
design adapted to the high rainfall in the Ifugao highlands.
The thickness of the thatch provides natural insulation against
both heat and cold.`,
    img:  ['images/roof_1.jpg', 'images/roof_2.png', 'images/roof_3.png'],

  },
  walls: {
    zone: 'Gaob — Wallboards',
    name: 'Dingding (Wooden Walls & Panels)',
    desc: `The walls of the Bale are constructed from wood planks,
	often from durable local hardwoods. The single room design
	maximises interior space while the raised floor keeps the
	living area dry and protected from animals. Walls may feature
	carved decorative elements that reflect the family\'s status.`,
    img:  ['images/gaob_1.png', 'images/gaob_2.png', 'images/gaob_3.png'],
  },
  posts: {
    zone: 'Tukkod — Posts',
    name: 'Tukkod (Foundation Posts)',
    desc: `The tukkod are 4 massive hardwood posts that elevate the Bale
	above the ground. A characteristic feature is the wooden rat
	guard (halipan) — a disk-shaped barrier fitted around each
	post to prevent rodents from climbing into the house. The
	number and size of posts often reflects the wealth and
	prestige of the household.`,
    img:  ['images/tukkud_1.jpg','images/tukkud_2.png'],  
  },
  wooden_disc: {
    zone: 'Halipan — wooden disc',
    name: 'Halipan (Rat Guard)',
    desc: `The halipan is a disk-shaped wooden barrier fitted around each
    tukkod (foundation post) to prevent rodents from climbing into the
    house. It is typically made from a single piece of wood, carved
    with a central hole to fit around the post. The halipan is an
    essential functional element of the Bale, reflecting the practical
    ingenuity of Ifugao architecture.`,
    img:  ['images/halipan_1.png', 'images/halipan_2.png','images/halipan_3.png'],
  },
  floor_beams: {
    zone: 'Mundilig — Side Floor Beams',
    name: 'Mundilig (Side Floor Beams)',
    desc: `The mundilig are the two outer horizontal beams that support the floor
    of the Bale. They are typically made from strong, durable wood and
    are carefully crafted to distribute weight evenly across the structure.
    It is where the posts and wallboards are mortized and they have right angled
    grooves for attaching the floorboards.`,
    img:  ['images/mundilig_1.png', 'images/mundilig_2.png', 'images/mundilig_3.png'], 
  },
  central_floor_beam: {
    zone: 'Gawaan — central_floor_beam',
    name: 'Gawaan (Central Floor Beam)',
    desc: `The gawaan is the central horizontal beam that supports the floor
    of the Bale. Both sides of the center floor beams have right angled
    grooves for attaching the floorboards.`,
    img:  ['images/gawaan_1.png', 'images/gawaan_2.png'], 
  },
  door: { 
    zone: 'Panto — Door',
    name: 'Panto (Main Entrance)',
    desc: `The panto is the main entrance to the Bale, typically a,
 narrow doorway on the front wall. It is often accessed via a small wooden ladder. 
The door may be ornately carved, symbolizing
protection and the family\'s connection to their ancestors. In some
cases, the door is positioned on the side wall instead of the front.`,
    img:  ['images/panto_1.png', 'images/panto_2.png', 'images/panto_3.png', 'images/panto_4.png'],  
  },
  ladder: { 
    zone: 'Teteh — ladder',
    name: 'Teteh (Ladder)',
    desc: `The teteh is a small wooden or bamboo ladder used to access the
    main entrance of the Bale. It is typically placed against the 
    front wall and may be ornately carved, symbolizing the family\'s 
    connection to their ancestors. For the safety of the occupants, 
    the ladder is pulled inside at night.`,
    img:  ['images/teteh_1.png','images/teteh_2.png'],
  },
  transverse_girders: { 
    zone: 'Kuling — Transverse Girders',
    name: 'Kuling (Transverse Girders)',
    desc: `Two transverse girders run across the width of the Bale,
    attached at the front and rear posts. They support the two floor 
    beams and center floor joists. The top suface is flat and the 
    base is rounded`,
    img:  ['images/kuling_1.png','images/kuling_2.png','images/kuling_3.png', 'images/kuling_4.png'],  
  },

};



// ── FLOATING 3D HOTSPOT DEFINITIONS ────────────────────────────
var HOTSPOT_DEFS = [
  { key: 'roof',  label: '▲  Atop',   yFrac: 0.80, xFrac:  0.0, zFrac:  0.2 },
  { key: 'walls', label: '◈  Gaob', yFrac: 0.35, xFrac:  0.1, zFrac:  0.2},
  { key: 'posts', label: '●  Tukkud', yFrac: 0.10, xFrac: 0.15, zFrac:  0.15 },
  { key: 'wooden_disc', label: '●  Halipan', yFrac: 0.15, xFrac: -0.15, zFrac:  0.15 },
  { key: 'floor_beams', label: '●  Mundilig', yFrac: 0.25, xFrac: -0.25, zFrac:  0.25 },
  { key: 'central_floor_beam', label: '●  Gawaan', yFrac: 0.25, xFrac: -0.25, zFrac:  0.0 },
  { key: 'ladder', label: '●  Teteh', yFrac: 0.10, xFrac: 0.3, zFrac:  0.0 },
  { key: 'door', label: '●  Panto', yFrac: 0.30, xFrac: 0.3, zFrac:  0.0},
  { key: 'transverse_girders', label: '●  Kuling', yFrac: 0.20, xFrac: 0.25, zFrac:  0.25 },
];


var hotspots = [];
var currentHotspotKey = null;

// ── Hotspots visibility toggle ─────────────────────────────
var hotspotsVisible = true;

// ── RAYCASTING: click on model to detect zone ─────────────────
const raycaster = new THREE.Raycaster();

const mouse     = new THREE.Vector2();


// NOTE: Click-on-model raycasting removed.
// Hotspots handle opening/closing the part panel.
renderer.domElement.addEventListener('click', function(e) {
  // Click empty space: close panel
  if (currentModel && (!hotspots || hotspots.length === 0)) {
    closePartPanel();
  }
});


function showPartPanel(info) {
  if (!info) return;

  var panel = document.getElementById('part-panel');
  if (!panel) return;

  var zoneEl = document.getElementById('part-zone');
  var nameEl = document.getElementById('part-name');
  var descEl = document.getElementById('part-desc');

  if (zoneEl) zoneEl.textContent = info.zone;
  if (nameEl) nameEl.textContent = info.name;
  if (descEl) descEl.textContent = info.desc;

  // Update image carousel (single-image fallback)
  var carouselTrack = document.getElementById('carousel-track');
  var carouselDots  = document.getElementById('carousel-dots');
  var carouselCount = document.getElementById('carousel-count');

  if (!carouselTrack || !carouselDots || !carouselCount) {
    console.warn('Carousel elements missing in DOM');
    panel.classList.remove('hidden');
    return;
  }

  var carouselImages = [];
  if (Array.isArray(info.img)) {
    carouselImages = info.img;
  } else if (info.img) {
    carouselImages = [info.img];
  }


  carouselTrack.innerHTML = '';
  carouselDots.innerHTML  = '';

  function goToSlide(idx) {
    var slides = carouselTrack.children;
    if (!slides || !slides.length) return;
    carouselTrack.style.transform = 'translateX(' + (-idx * 100) + '%)';

    // Update dots
    Array.prototype.forEach.call(carouselDots.children, function(dot, i) {
      dot.classList.toggle('active', i === idx);
    });

    carouselCount.textContent = (idx + 1) + ' / ' + slides.length;
  }

  // Hide buttons if only 1 slide
  var prevBtn = document.getElementById('carousel-prev');
  var nextBtn = document.getElementById('carousel-next');
  if (carouselImages.length <= 1) {
    if (prevBtn) prevBtn.classList.add('hidden');
    if (nextBtn) nextBtn.classList.add('hidden');
  } else {
    if (prevBtn) prevBtn.classList.remove('hidden');
    if (nextBtn) nextBtn.classList.remove('hidden');
  }

  // Hook prev/next each time we open a panel (simple + avoids stale closures)
  if (prevBtn) prevBtn.onclick = function() {
    var active = carouselDots.querySelector('.carousel-dot.active');
    var idx = active ? Array.prototype.indexOf.call(carouselDots.children, active) : 0;
    idx = Math.max(0, idx - 1);
    goToSlide(idx);
  };
  if (nextBtn) nextBtn.onclick = function() {
    var active = carouselDots.querySelector('.carousel-dot.active');
    var idx = active ? Array.prototype.indexOf.call(carouselDots.children, active) : 0;
    idx = Math.min(carouselImages.length - 1, idx + 1);
    goToSlide(idx);
  };

  // Build one slide per image
  carouselImages.forEach(function(src, i) {
    var slide = document.createElement('div');
    slide.className = 'carousel-slide';

    var img = document.createElement('img');
    img.alt = 'Photo ' + (i + 1);

    img.onerror = function() {
      slide.innerHTML =
        '<div class="carousel-placeholder">' +
          '<span>⚠</span>' +
          '<span>Image not found:<br>' + src + '</span>' +
        '</div>';
    };

    img.src = src;
    slide.appendChild(img);
    carouselTrack.appendChild(slide);

    var dot = document.createElement('div');
    dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
    dot.addEventListener('click', (function(idx) {
      return function() { goToSlide(idx); };
    })(i));
    carouselDots.appendChild(dot);
  });

  if (carouselImages.length === 0) {
    // No image: show placeholder slide
    var slide = document.createElement('div');
    slide.className = 'carousel-slide';
    slide.innerHTML =
      '<div class="carousel-placeholder">' +
        '<span>⚠</span>' +
        '<span>No image set for this part</span>' +
      '</div>';
    carouselTrack.appendChild(slide);
    carouselCount.textContent = '0 / 0';
    var dot = document.createElement('div');
    dot.className = 'carousel-dot active';
    carouselDots.appendChild(dot);
    if (prevBtn) prevBtn.classList.add('hidden');
    if (nextBtn) nextBtn.classList.add('hidden');
  } else {
    goToSlide(0);
  }

  panel.classList.remove('hidden');
}

// ── Image zoom overlay (click to enlarge, click outside to close) ──
(function initImageZoom() {
  var overlay = document.createElement('div');
  overlay.id = 'image-zoom-overlay';
  overlay.style.cssText = [
    'position:fixed',
    'inset:0',
    'background:rgba(0,0,0,0.65)',
    'z-index:60',
    'display:none',
    'align-items:center',
    'justify-content:center',
    'padding:24px',
  ].join(';');

  var box = document.createElement('div');
  box.style.cssText = [
    'width: min(960px, calc(100vw - 48px))',
    'height: min(620px, calc(88vh - 48px))',
    'border:1px solid rgba(255,255,255,0.15)',
    'background:rgba(12,16,14,0.97)',
    'border-radius:8px',
    'backdrop-filter:blur(10px)',
    'box-shadow:0 10px 40px rgba(0,0,0,0.7)',
    'display:flex',
    'align-items:center',
    'justify-content:center',
    'overflow:hidden',
  ].join(';');


  var img = document.createElement('img');
  img.alt = 'Zoomed image';
  img.style.cssText = [
    // Fixed panel-like sizing across all images
    'width: min(900px, calc(100vw - 48px))',
    'height: min(560px, calc(88vh - 48px))',
    'max-width: none',
    'max-height: none',
    'object-fit: contain',
    'display:block',
  ].join(';');


  box.appendChild(img);
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  function open(src) {
    if (!src) return;
    img.src = src;
    overlay.style.display = 'flex';

    // Reset zoom each time we open
    img.style.transform = 'scale(1)';
    img.dataset.zoom = '1';
  }


  function close() {
    overlay.style.display = 'none';
    img.removeAttribute('src');
  }

  overlay.addEventListener('click', function (e) {
    // Clicking backdrop closes; clicking inside box should not
    if (e.target === overlay) close();
  });

  // Expose for use in carousel click handler
  window.__imageZoom = { open: open, close: close, overlay: overlay, img: img };

  // Delegate click from the part-panel carousel images
  document.addEventListener('click', function (e) {
    var target = e.target;
    if (!target) return;

    // Only react to clicks on carousel images inside #part-panel
    if (target.tagName === 'IMG' && target.closest && target.closest('#part-panel')) {
      // Avoid opening when user clicks carousel nav/buttons (not images)
      var src = target.getAttribute('src');
      if (src) open(src);
    }
  });
})();

function closePartPanel() {
  document.getElementById('part-panel').classList.add('hidden');
  currentHotspotKey = null;
}


document.getElementById('part-close').addEventListener('click', closePartPanel);


// ── Collect all materials from a model ───────────────────────
function collectMaterials(root) {
  var mats = [];
  root.traverse(function (child) {
    if (child.isMesh) {
      if (Array.isArray(child.material)) {
        child.material.forEach(function (m) { mats.push(m); });
      } else {
        mats.push(child.material);
      }
    }
  });
  return mats;
}

// ── Place model bottom on the grid (Y = 0) ────────────────────
// Also normalizes scale to 2 units and centers on X/Z.
function placeOnGrid(root) {
  var box    = new THREE.Box3().setFromObject(root);
  var center = new THREE.Vector3();
  var size   = new THREE.Vector3();
  box.getCenter(center);
  box.getSize(size);
  var maxDim = Math.max(size.x, size.y, size.z);

  root.scale.setScalar(2 / maxDim);
  root.position.x = -center.x * (2 / maxDim);
  root.position.z = -center.z * (2 / maxDim);
  root.position.y = 0;

  // Recompute after scaling, then lift so bottom is at Y=0
  var scaledBox = new THREE.Box3().setFromObject(root);
  root.position.y = -scaledBox.min.y;
}

// ── Fit camera to the loaded model ────────────────────────────
function fitCamera(root) {
  var box   = new THREE.Box3().setFromObject(root);
  var bsize = box.getSize(new THREE.Vector3()).length();
  var bctr  = box.getCenter(new THREE.Vector3());

  camera.near = bsize / 100;
  camera.far  = bsize * 100;
  camera.updateProjectionMatrix();

  camera.position.set(bctr.x, bctr.y + bsize * 0.3, bctr.z + bsize * 1.6);
  controls.target.copy(bctr);
  controls.update();
}

function setCameraToFront(root) {
  if (!root) return;

  var box   = new THREE.Box3().setFromObject(root);
  var bsize = box.getSize(new THREE.Vector3()).length();
  var bctr  = box.getCenter(new THREE.Vector3());

  camera.near = bsize / 100;
  camera.far  = bsize * 100;
  camera.updateProjectionMatrix();

  var dist   = bsize * 1.6;
  var height = bsize * 0.1;

  controls.target.copy(bctr);

  
  var yaw = Math.PI / 2;

  var pos = new THREE.Vector3(0, height, dist);
  pos.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
  camera.position.copy(bctr).add(pos);
  controls.update();
}


// ── Count vertices and faces across all meshes ────────────────
function getModelStats(root) {
  var v = 0, f = 0;
  root.traverse(function (child) {
    if (child.isMesh && child.geometry) {
      v += child.geometry.attributes.position.count;
      f += child.geometry.index
        ? Math.floor(child.geometry.index.count / 3)
        : Math.floor(child.geometry.attributes.position.count / 3);
    }
  });
  return { verts: v, faces: f };
}
// ── CREATE HOTSPOT ELEMENTS ─────────────────────────────────────
function setupHotspots() {
  // Clear old hotspots
  var container = document.getElementById('hotspots-container');
  container.innerHTML = '';
  hotspots = [];

  if (!currentModel) return;

  var bbox = new THREE.Box3().setFromObject(modelGroup);
  var size = new THREE.Vector3();
  bbox.getSize(size);

  HOTSPOT_DEFS.forEach(function(def) {
    var worldPos = new THREE.Vector3(
      bbox.min.x + size.x * (0.5 + def.xFrac),
      bbox.min.y + size.y * def.yFrac,
      bbox.min.z + size.z * (0.5 + def.zFrac)
    );

    // Build the hotspot HTML element
    var el = document.createElement('div');
    el.className = 'hotspot';
    el.dataset.key = def.key;
    // Show ONLY the first label part on the hotspot (e.g., "Atop", "Tukkud").
    var partName = (def.label !== undefined && def.label !== null) ? def.label : def.key;
    //for the full details use this
    // var partName = (PART_INFO[def.key] && PART_INFO[def.key].name) ? PART_INFO[def.key].name : def.label;

    el.innerHTML =
      '<div class="hotspot-ring">' +
        '<div class="hotspot-pulse"></div>' +
        '<div class="hotspot-dot"></div>' +
      '</div>'+
      '<div class="hotspot-label">' + partName + '</div>';
      '</div>';



    el.addEventListener('click', (function(key) {
      return function(e) {
        e.stopPropagation(); // don't trigger canvas click

        // Toggle panel when clicking the same hotspot again
        if (currentHotspotKey === key && !document.getElementById('part-panel').classList.contains('hidden')) {
          closePartPanel();
          currentHotspotKey = null;
          return;
        }

        currentHotspotKey = key;
        showPartPanel(PART_INFO[key]);
      };
    })(def.key));


    container.appendChild(el);
    hotspots.push({ worldPos: worldPos, el: el });
  });
}

// ── UPDATE HOTSPOT SCREEN POSITIONS every frame ─────────────────
function updateHotspots() {
  if (!hotspots || !hotspots.length) return;
  if (!wrap || !camera) return;
  var rect = wrap.getBoundingClientRect();
  if (!rect || rect.width === 0 || rect.height === 0) return;

  hotspots.forEach(function(hs) {
    var pos = hs.worldPos.clone();
    pos.project(camera); // convert 3D → normalized device coords

    // Hide if the point is behind the camera
    if (pos.z > 1) {
      hs.el.style.opacity = '0';
      hs.el.style.pointerEvents = 'none';
      return;
    }
    // Convert to pixel position on the wrap div
    var x = (pos.x *  0.5 + 0.5) * rect.width;
    var y = (pos.y * -0.5 + 0.5) * rect.height;
    hs.el.style.left         = x + 'px';
    hs.el.style.top          = y + 'px';
    hs.el.style.opacity      = '1';
    hs.el.style.pointerEvents = 'auto';
  });
}


// ── Update all stat displays (bottom bar + left panel) ────────
function updateStats(fmt, verts, faces, size) {
  // Bottom bar
  var fe = document.getElementById('stat-fmt');
  fe.textContent = fmt;
  fe.className   = (fmt === 'GLB' || fmt === 'GLTF') ? 'glb' : '';
  document.getElementById('st-v').textContent = verts.toLocaleString();
  document.getElementById('st-f').textContent = faces.toLocaleString();
  document.getElementById('st-s').textContent = size;

  // Left panel stats section
  document.getElementById('ps-fmt').textContent   = fmt;
  document.getElementById('ps-verts').textContent = verts.toLocaleString();
  document.getElementById('ps-faces').textContent = faces.toLocaleString();
  document.getElementById('ps-size').textContent  = size;
  document.getElementById('panel-stats').style.display = 'block';
}

// ── Show model after loading ───────────────────────────────────
function showModel(root, fileName, fileSize, fmt) {
  // Remove and dispose previous model
  while (modelGroup.children.length > 0) {
    var old = modelGroup.children[0];
    old.traverse(function (child) {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(function (m) { m.dispose(); });
        } else {
          child.material.dispose();
        }
      }
    });
    modelGroup.remove(old);
  }

  modelGroup.add(root);
  currentModel = root;

  placeOnGrid(root);
  // Make the initial/default view match the "Reset View" button.
  setCameraToFront(root);
  currentMats = collectMaterials(root);

  var s = getModelStats(root);
  updateStats(fmt, s.verts, s.faces, fileSize);

  document.getElementById('hdr-file').textContent  = fileName;
  document.getElementById('toolbar').style.display = 'flex';
  document.getElementById('stats').style.display   = 'flex';
  document.getElementById('loading').classList.add('hidden');

  // Reset toggle button states
  isWireframe     = false;
  showingOriginal = true;
  document.getElementById('btn-wf').classList.remove('on');
  document.getElementById('btn-clr').classList.remove('on');
  setupHotspots();

  if (humanVisible) placeHumanFigure();
}


// ── Parse a GLB / GLTF file ───────────────────────────────────
function parseGLB(arrayBuffer) {
  return new Promise(function (resolve, reject) {
    new GLTFLoader().parse(arrayBuffer, '', resolve, reject);
  });
}

// ── Parse a PLY file ──────────────────────────────────────────
function parsePLY(arrayBuffer) {
  var geo = new PLYLoader().parse(arrayBuffer);
  geo.computeVertexNormals();

  var mat = new THREE.MeshStandardMaterial({
    vertexColors: geo.hasAttribute('color'),
    roughness: 0.72,
    metalness: 0.06
  });

  var mesh = new THREE.Mesh(geo, mat);

  // PLY from Blender uses Z-up coordinates; Three.js is Y-up.
  mesh.rotation.x = -Math.PI / 2;

  return mesh;
}

// ── Load from File object (drag & drop or browse) ─────────────
async function loadFile(file) {
  var ext = file.name.split('.').pop().toLowerCase();

  document.getElementById('dropzone').classList.add('hidden');
  document.getElementById('loading').classList.remove('hidden');
  document.getElementById('ld-error').style.display = 'none';
  document.getElementById('ld-msg').textContent     = 'Reading file…';
  document.getElementById('ld-bar').style.width     = '15%';
  document.getElementById('ld-prog').textContent    = file.name;

  try {
    var ab = await file.arrayBuffer();
    document.getElementById('ld-bar').style.width = '60%';
    document.getElementById('ld-msg').textContent = 'Parsing model…';

    var root, fmt;
    if (ext === 'glb' || ext === 'gltf') {
      var gltf = await parseGLB(ab);
      root = gltf.scene;
      fmt  = ext === 'glb' ? 'GLB' : 'GLTF';
    } else if (ext === 'ply') {
      root = parsePLY(ab);
      fmt  = 'PLY';
    } else {
      throw new Error('Unsupported format: .' + ext + ' — use .glb, .gltf, or .ply');
    }

    document.getElementById('ld-bar').style.width = '100%';
    showModel(root, file.name, (file.size / 1048576).toFixed(1) + ' MB', fmt);

  } catch (err) {
    console.error('Load error:', err);
    document.getElementById('ld-msg').textContent     = 'Failed to load';
    document.getElementById('ld-error').textContent   = 'Error: ' + err.message;
    document.getElementById('ld-error').style.display = 'block';
    setTimeout(function () {
      document.getElementById('loading').classList.add('hidden');
      document.getElementById('dropzone').classList.remove('hidden');
    }, 3000);
  }
}

// ── Load from URL ─────────────────────────────────────────────
async function loadURL(url) {
  var ext = url.split('?')[0].split('.').pop().toLowerCase();

  document.getElementById('dropzone').classList.add('hidden');
  document.getElementById('loading').classList.remove('hidden');
  document.getElementById('ld-error').style.display = 'none';
  document.getElementById('ld-msg').textContent     = 'Connecting to GitHub…';
  document.getElementById('ld-bar').style.width     = '5%';

  try {
    var res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status + ' — check that the URL is correct and the repo is public.');

    document.getElementById('ld-msg').textContent = 'Downloading model…';

    var total    = parseInt(res.headers.get('content-length') || '0');
    var reader   = res.body.getReader();
    var chunks   = [];
    var received = 0;

    while (true) {
      var r = await reader.read();
      if (r.done) break;
      chunks.push(r.value);
      received += r.value.length;
      if (total > 0) {
        document.getElementById('ld-bar').style.width =
          (5 + Math.round(received / total * 80)) + '%';
        document.getElementById('ld-prog').textContent =
          (received / 1048576).toFixed(1) + ' MB  /  ' +
          (total    / 1048576).toFixed(1) + ' MB';
      } else {
        document.getElementById('ld-prog').textContent =
          (received / 1048576).toFixed(1) + ' MB downloaded…';
      }
    }

    document.getElementById('ld-msg').textContent = 'Parsing model…';
    document.getElementById('ld-bar').style.width = '88%';

    // Combine downloaded chunks into a single ArrayBuffer
    var flat = new Uint8Array(received), off = 0;
    for (var i = 0; i < chunks.length; i++) {
      flat.set(chunks[i], off);
      off += chunks[i].length;
    }

    // Check if GitHub returned an LFS pointer instead of the actual file
    var header = new TextDecoder().decode(flat.slice(0, 50));
    if (header.indexOf('git-lfs.github.com') !== -1) {
      var mediaURL = url.replace(
        'raw.githubusercontent.com/',
        'media.githubusercontent.com/media/'
      );
      showToast('LFS pointer detected — retrying with media URL…');
      document.getElementById('ld-msg').textContent = 'Retrying (LFS)…';
      document.getElementById('ld-bar').style.width = '5%';
      return loadURL(mediaURL);
    }

    var root, fmt;
    if (ext === 'glb' || ext === 'gltf') {
      var gltf = await parseGLB(flat.buffer);
      root = gltf.scene; fmt = 'GLB';
    } else {
      root = parsePLY(flat.buffer); fmt = 'PLY';
    }

    document.getElementById('ld-bar').style.width = '100%';
    var name = url.split('/').pop().split('?')[0];
    showModel(root, name, (received / 1048576).toFixed(1) + ' MB', fmt);

  } catch (err) {
    console.error('URL load error:', err);
    document.getElementById('ld-msg').textContent     = 'Download failed';
    document.getElementById('ld-error').textContent   =
      'Could not load: ' + err.message + '\n\nUse drag & drop as a fallback.';
    document.getElementById('ld-error').style.display = 'block';
    setTimeout(function () {
      document.getElementById('loading').classList.add('hidden');
      document.getElementById('dropzone').classList.remove('hidden');
      document.getElementById('dz-note').textContent =
        '⚠ Auto-load failed. Drop your file here instead.';
    }, 4000);
  }
}

// ── Startup: auto-load or show drop zone ──────────────────────
if (MODEL_URL && MODEL_URL !== '') {
  loadURL(MODEL_URL);
} else {
  document.getElementById('dz-note').textContent =
    'Set MODEL_URL in js/viewer.js to auto-load from GitHub';
}

// ── Drag & Drop ───────────────────────────────────────────────
var dz = document.getElementById('dropzone');

dz.addEventListener('dragover', function (e) {
  e.preventDefault();
  dz.classList.add('over');
});
dz.addEventListener('dragleave', function () {
  dz.classList.remove('over');
});
dz.addEventListener('drop', function (e) {
  e.preventDefault();
  dz.classList.remove('over');
  if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]);
});

document.getElementById('file-input').addEventListener('change', function (e) {
  if (e.target.files[0]) loadFile(e.target.files[0]);
});

// ── PANEL TOGGLE + MOBILE SIDEBAR ────────────────────────────────

// Create the backdrop element dynamically — no HTML changes needed
var backdrop = document.createElement('div');
backdrop.id = 'panel-backdrop';
document.body.appendChild(backdrop);

function isMobile() {
  return window.innerWidth <= 768;
}

function openSidebar() {
  document.getElementById('info-panel').classList.remove('collapsed');
  // Show backdrop only on mobile
  if (isMobile()) backdrop.classList.add('visible');
}

function closeSidebar() {
  document.getElementById('info-panel').classList.add('collapsed');
  backdrop.classList.remove('visible');

  // On desktop, resize Three.js after the CSS transition finishes
  if (!isMobile()) {
    setTimeout(function () {
      renderer.setSize(wrap.clientWidth, wrap.clientHeight);
      camera.aspect = wrap.clientWidth / wrap.clientHeight;
      camera.updateProjectionMatrix();
    }, 320);
  }
}

// Panel toggle button
document.getElementById('panel-toggle').addEventListener('click', function () {
  var isCollapsed = document.getElementById('info-panel').classList.contains('collapsed');
  if (isCollapsed) {
    openSidebar();
  } else {
    closeSidebar();
  }
});

// Tapping the backdrop closes the panel
backdrop.addEventListener('click', closeSidebar);

// ── Auto-collapse on mobile at page load ──────────────────────────
if (isMobile()) {
  document.getElementById('info-panel').classList.add('collapsed');
}

// ── Handle screen resize ──────────────────────────────────────────
window.addEventListener('resize', function () {
  if (isMobile()) {
    // Screen got smaller — collapse and hide backdrop
    document.getElementById('info-panel').classList.add('collapsed');
    backdrop.classList.remove('visible');
  } else {
    // Screen got larger — expand sidebar, resize Three.js
    document.getElementById('info-panel').classList.remove('collapsed');
    backdrop.classList.remove('visible');

    setTimeout(function () {
      renderer.setSize(wrap.clientWidth, wrap.clientHeight);
      camera.aspect = wrap.clientWidth / wrap.clientHeight;
      camera.updateProjectionMatrix();
    }, 50);
  }
});






// ── Toolbar: Wireframe ────────────────────────────────────────
var isWireframe = false;
document.getElementById('btn-wf').addEventListener('click', function () {
  if (!currentModel) return;
  isWireframe = !isWireframe;
  currentMats.forEach(function (m) { m.wireframe = isWireframe; });
  this.classList.toggle('on', isWireframe);
});

// ── Toolbar: Reset camera ─────────────────────────────────────
document.getElementById('btn-cam').addEventListener('click', function () {
  if (!currentModel) return;
  setCameraToFront(currentModel);
});


// ── Toolbar: Color toggle ─────────────────────────────────────
var showingOriginal = true;
var solidGrayMat = new THREE.MeshStandardMaterial({
  color: 0x7a9e85, roughness: 0.7, metalness: 0.05
});

document.getElementById('btn-clr').addEventListener('click', function () {
  if (!currentModel) return;
  showingOriginal = !showingOriginal;
  currentModel.traverse(function (child) {
    if (!child.isMesh) return;
    if (showingOriginal) {
      if (child._origMat !== undefined) child.material = child._origMat;
    } else {
      if (child._origMat === undefined) child._origMat = child.material;
      child.material = solidGrayMat;
    }
  });
  this.classList.toggle('on', !showingOriginal);
});

// ── Toolbar: Brightness panel ─────────────────────────────────
document.getElementById('btn-brt').addEventListener('click', function () {
  var panel = document.getElementById('brightness-panel');
  var open  = panel.classList.contains('show');
  panel.classList.toggle('show', !open);
  this.classList.toggle('on', !open);
});

document.getElementById('sl-exposure').addEventListener('input', function () {
  renderer.toneMappingExposure = parseFloat(this.value);
  document.getElementById('val-exposure').textContent = parseFloat(this.value).toFixed(1);
});

document.getElementById('sl-ambient').addEventListener('input', function () {
  ambientLight.intensity = parseFloat(this.value);
  document.getElementById('val-ambient').textContent = parseFloat(this.value).toFixed(1);
});

document.getElementById('sl-sun').addEventListener('input', function () {
  sunLight.intensity = parseFloat(this.value);
  document.getElementById('val-sun').textContent = parseFloat(this.value).toFixed(1);
});

// ── Toolbar: Load new file ────────────────────────────────────
document.getElementById('btn-hs').addEventListener('click', function () {
  hotspotsVisible = !hotspotsVisible;
  this.classList.toggle('on', hotspotsVisible === false);

  if (hotspots && hotspots.length) {
    hotspots.forEach(function (hs) {
      hs.el.style.display = hotspotsVisible ? '' : 'none';
      hs.el.style.pointerEvents = hotspotsVisible ? 'auto' : 'none';
      hs.el.style.opacity = hotspotsVisible ? '1' : '0';
    });
  }
});

document.getElementById('btn-new').addEventListener('click', function () {
  document.getElementById('toolbar').style.display         = 'none';

  document.getElementById('stats').style.display           = 'none';
  document.getElementById('brightness-panel').classList.remove('show');
  document.getElementById('btn-brt').classList.remove('on');
  document.getElementById('hdr-file').textContent          = 'No model loaded';
  document.getElementById('dz-note').textContent           = '';
  document.getElementById('panel-stats').style.display     = 'none';
  dz.classList.remove('hidden');
});

// ── toolbar: AUTO-ROTATE ────────────────────────────────────────────────
// OrbitControls has autoRotate built in — we just toggle it.
var autoRotating = false;
controls.autoRotateSpeed = 1.2; // degrees per second (lower = slower)

document.getElementById('btn-rotate').addEventListener('click', function() {
  autoRotating = !autoRotating;
  controls.autoRotate = autoRotating;
  this.classList.toggle('on', autoRotating);
});

// Stop auto-rotate the moment the user touches the model
renderer.domElement.addEventListener('pointerdown', function() {
  if (autoRotating) {
    autoRotating = false;
    controls.autoRotate = false;
    document.getElementById('btn-rotate').classList.remove('on');
  }
});

// ── FULLSCREEN ─────────────────────────────────────────────────
document.getElementById('btn-fs').addEventListener('click', function() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
});

// Update icon when fullscreen state changes
document.addEventListener('fullscreenchange', function() {
  var btn = document.getElementById('btn-fs');
  var isFs = !!document.fullscreenElement;
  btn.classList.toggle('on', isFs);
  btn.querySelector('.tbtn-icon').textContent  = isFs ? '✕' : '⤢';
  btn.querySelector('.tbtn-label').textContent = isFs ? 'Exit Full' : 'Fullscreen';
  // Resize renderer after fullscreen change
  setTimeout(function() {
    renderer.setSize(wrap.clientWidth, wrap.clientHeight);
    camera.aspect = wrap.clientWidth / wrap.clientHeight;
    camera.updateProjectionMatrix();
  }, 100);
});

// ── Toast helper ──────────────────────────────────────────────
var toastTimer = null;
function showToast(msg) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { t.classList.remove('show'); }, 3500);
}

// ═══════════════════════════════════════════════════════════════
// HUMAN SCALE REFERENCE
// ════════════════════════════════════════════════════════════════

// ── Configuration ───────────────────────────────────────────────
// Typical Ifugao Bale ridge height: 5.5 – 7 m
var HUMAN_REAL_HEIGHT_M = 1.7;  // average adult height in meters
var MODEL_REAL_HEIGHT_M = 6.0;  // ← adjust to match the real house

var humanGroup = null;
var humanVisible = false;

// ── Text label sprite ────────────────────────────────────────────
function makeTextSprite(message) {
  var canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 96;
  var ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = 'bold 40px Courier New';
  ctx.fillStyle = '#4ec98a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(message, 128, 48);

  var tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;

  return new THREE.Sprite(
    new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false })
  );
}

// ── Build the figure ─────────────────────────────────────────────
function createHumanSilhouette() {
  var group = new THREE.Group();

  // Model is normalised to 2 units max dimension.
  // figure height (units) = (human metres / house metres) × 2
  var h = (HUMAN_REAL_HEIGHT_M / MODEL_REAL_HEIGHT_M) * 2;
  var r = h * 0.065; // base radius — everything scales from this

  var mat = new THREE.MeshStandardMaterial({
    color: 0x1e2d3d, // dark navy silhouette
    roughness: 1.0,
    metalness: 0.0,
  });

  // ── Legs ────────────────────────────────────────────────────────
  var legH = h * 0.46;
  var legGeo = new THREE.CylinderGeometry(r * 0.55, r * 0.48, legH, 7);
  var lLeg = new THREE.Mesh(legGeo, mat);
  var rLeg = new THREE.Mesh(legGeo, mat);
  lLeg.position.set(-r * 0.65, legH / 2, 0);
  rLeg.position.set(r * 0.65, legH / 2, 0);
  group.add(lLeg, rLeg);

  // ── Torso ───────────────────────────────────────────────────────
  var torsoH = h * 0.35;
  var torsoGeo = new THREE.CylinderGeometry(r * 0.85, r * 0.95, torsoH, 8);
  var torso = new THREE.Mesh(torsoGeo, mat);
  torso.position.y = legH + torsoH / 2;
  group.add(torso);

  // ── Arms ────────────────────────────────────────────────────────
  var armH = h * 0.30;
  var armGeo = new THREE.CylinderGeometry(r * 0.35, r * 0.30, armH, 6);
  var lArm = new THREE.Mesh(armGeo, mat);
  var rArm = new THREE.Mesh(armGeo, mat);
  lArm.rotation.z = 0.25; // slight outward angle
  rArm.rotation.z = -0.25;
  var armY = legH + torsoH * 0.75;
  lArm.position.set(-r * 1.55, armY, 0);
  rArm.position.set(r * 1.55, armY, 0);
  group.add(lArm, rArm);

  // ── Neck ────────────────────────────────────────────────────────
  var neckH = h * 0.045;
  var headR = h * 0.09;
  var neckGeo = new THREE.CylinderGeometry(headR * 0.42, headR * 0.48, neckH, 8);
  var neck = new THREE.Mesh(neckGeo, mat);
  neck.position.y = legH + torsoH + neckH / 2;
  group.add(neck);

  // ── Head ────────────────────────────────────────────────────────
  var headGeo = new THREE.SphereGeometry(headR, 12, 8);
  var headMesh = new THREE.Mesh(headGeo, mat);
  headMesh.position.y = legH + torsoH + neckH + headR;
  group.add(headMesh);

  // ── Ground shadow disc ─────────────────────────────────────────
  var shadowGeo = new THREE.CircleGeometry(r * 1.3, 16);
  var shadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.25,
  });
  var shadowDisc = new THREE.Mesh(shadowGeo, shadowMat);
  shadowDisc.rotation.x = -Math.PI / 2;
  shadowDisc.position.y = 0.002; // just above grid to avoid z-fighting
  group.add(shadowDisc);

  // ── Height measurement line ─────────────────────────────────────
  var lineMat = new THREE.LineBasicMaterial({ color: 0x4ec98a });

  // Vertical bar
  var vLine = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-r * 3.2, 0, 0),
    new THREE.Vector3(-r * 3.2, h, 0),
  ]);
  group.add(new THREE.Line(vLine, lineMat));

  // Top tick
  var topTick = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-r * 3.9, h, 0),
    new THREE.Vector3(-r * 2.5, h, 0),
  ]);
  group.add(new THREE.Line(topTick, lineMat));

  // Bottom tick
  var botTick = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-r * 3.9, 0, 0),
    new THREE.Vector3(-r * 2.5, 0, 0),
  ]);
  group.add(new THREE.Line(botTick, lineMat));

  // Label
  var label = makeTextSprite('≈ ' + HUMAN_REAL_HEIGHT_M + 'm');
  label.scale.set(r * 8, r * 3, 1);
  label.position.set(-r * 7.5, h / 2, 0);
  group.add(label);

  return { group: group, height: h };
}

// ── Position figure beside the loaded model ──────────────────────
function placeHumanFigure() {
  if (!currentModel) return;

  if (humanGroup) {
    scene.remove(humanGroup);
    humanGroup = null;
  }

  var result = createHumanSilhouette();
  humanGroup = result.group;

  // Stand to the right of the model with a small gap, position of the human dummy
  var bbox = new THREE.Box3().setFromObject(modelGroup);
  var center = bbox.getCenter(new THREE.Vector3());
  var gap = result.height * 0.4;

  humanGroup.position.set(bbox.max.x + gap, 0, center.z + result.height * 0.2);

  
  var toCamera = new THREE.Vector3().copy(camera.position).sub(humanGroup.position);
  var yaw = Math.atan2(toCamera.x, toCamera.z); // Yaw around Y axis
  humanGroup.rotation.set(0, yaw, 0);

  scene.add(humanGroup);
}

// ── Toggle button ────────────────────────────────────────────────
var humanBtn = document.getElementById('btn-human');
if (humanBtn) {
  humanBtn.addEventListener('click', function () {
    if (!currentModel) {
      showToast('Load a model first');
      return;
    }

    humanVisible = !humanVisible;

    if (humanVisible) {
      placeHumanFigure();
      if (humanGroup) humanGroup.visible = true;
      showToast('Human scale reference: ON  (≈ 1.7 m)');
    } else {
      if (humanGroup) humanGroup.visible = false;
    }

    this.classList.toggle('on', humanVisible);
  });
}

// ── Recreate when a new model loads ───────────────────────────────
// Add one line inside your showModel() function:
//   if (humanVisible) placeHumanFigure();


