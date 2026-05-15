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
// Height zones: when you click the model, we check the Y position
// of the click as a % of the total model height:
//   Top 35%    → Roof  (Atep)
//   Middle 40% → Walls (Dingding)
//   Bottom 25% → Posts (Tukkod)
//
// To add your actual photo, put the image file in an "images/" folder
// and replace the empty src "" with "images/roof.jpg" etc.

const PART_INFO = {
  roof: {
    zone: 'Atep — Roof',
    name: 'Atep (Traditional Thatched Roof)',
    desc: `The atep is the thatched roof of the Ifugao Bale, made from
cogon grass (Imperata cylindrica) or pili leaves. The steep
A-frame pitch allows heavy rain to run off quickly — a practical
design adapted to the high rainfall in the Ifugao highlands.
The thickness of the thatch provides natural insulation against
both heat and cold.`,
    img:  '',   // ← replace with 'images/roof.jpg'
  },
  walls: {
    zone: 'Dingding — Walls',
    name: 'Dingding (Wooden Walls & Panels)',
    desc: `The walls of the Bale are constructed from wood planks,
often from durable local hardwoods. The single room design
maximises interior space while the raised floor keeps the
living area dry and protected from animals. Walls may feature
carved decorative elements that reflect the family\'s status.`,
    img:  '',   // ← replace with 'images/walls.jpg'
  },
  posts: {
    zone: 'Tukkod — Posts',
    name: 'Tukkod (Foundation Posts)',
    desc: `The tukkod are massive hardwood posts that elevate the Bale
above the ground. A characteristic feature is the wooden rat
guard (halipan) — a disk-shaped barrier fitted around each
post to prevent rodents from climbing into the house. The
number and size of posts often reflects the wealth and
prestige of the household.`,
    img:  '',   // ← replace with 'images/posts.jpg'
  },
};

// ── FLOATING 3D HOTSPOT DEFINITIONS ────────────────────────────
// yFrac: 0.0 = bottom of model, 1.0 = top
// xFrac/zFrac: offset from center (-0.5 to 0.5)
// Adjust these numbers if labels don't appear in the right spot.

var HOTSPOT_DEFS = [
  { key: 'roof',  label: '▲  Atep · Roof',   yFrac: 0.90, xFrac:  0.0, zFrac:  0.2 },
  { key: 'walls', label: '◈  Dingding · Walls', yFrac: 0.52, xFrac:  0.4, zFrac:  0.3 },
  { key: 'posts', label: '●  Tukkod · Posts', yFrac: 0.10, xFrac: -0.3, zFrac:  0.4 },
];

var hotspots = [];
var currentHotspotKey = null;

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

  var img = document.getElementById('part-img');
  var ph  = document.getElementById('part-placeholder');

  if (info.img) {
    if (img) {
      img.src = info.img;
      img.style.display = 'block';
    }
    if (ph) ph.style.display = 'none';
  } else {
    if (img) img.style.display = 'none';
    if (ph) ph.style.display = 'flex';
  }

  panel.classList.remove('hidden');
}


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
// Called after a model loads. Places glowing labels at defined
// positions on the model surface.
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
    // Calculate world position from fractions of the bounding box
    var worldPos = new THREE.Vector3(
      bbox.min.x + size.x * (0.5 + def.xFrac),
      bbox.min.y + size.y * def.yFrac,
      bbox.min.z + size.z * (0.5 + def.zFrac)
    );

    // Build the hotspot HTML element
    var el = document.createElement('div');
    el.className = 'hotspot';
    el.dataset.key = def.key;
    el.innerHTML =
      '<div class="hotspot-ring">' +
        '<div class="hotspot-pulse"></div>' +
        '<div class="hotspot-dot"></div>' +
      '</div>' +
      '<div class="hotspot-label">' + def.label + '</div>';

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
  fitCamera(root);
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

// ── Toolbar: Left panel toggle ────────────────────────────────
document.getElementById('panel-toggle').addEventListener('click', function () {
  var panel = document.getElementById('info-panel');
  panel.classList.toggle('collapsed');
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
  fitCamera(currentModel);
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
