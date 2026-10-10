import * as THREE from 'three';

const canvas = document.querySelector('#world');
const fallback = document.querySelector('.fallback');
const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const lerp = (a, b, t) => a + (b - a) * t;
let renderer, camera, scene, world, core, wire, ringA, ringB, stars, clock;
let goalScroll = 0, currentScroll = 0, px = 0, py = 0, tx = 0, ty = 0;

function updateProgress() {
  goalScroll = clamp(scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight), 0, 1);
  const bar = document.querySelector('#bar');
  if (bar) bar.style.width = (goalScroll * 100).toFixed(2) + '%';
}
addEventListener('scroll', updateProgress, { passive: true });
addEventListener('resize', updateProgress);
addEventListener('pointermove', e => {
  tx = (e.clientX / Math.max(1, innerWidth) - .5) * 2;
  ty = (e.clientY / Math.max(1, innerHeight) - .5) * 2;
}, { passive: true });
updateProgress();

try {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, .1, 80);
  camera.position.set(0, 0, 10);
  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: innerWidth > 700, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth < 700 ? 1.2 : 1.5));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  clock = new THREE.Clock();

  world = new THREE.Group();
  scene.add(world);
  core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.72, innerWidth < 700 ? 3 : 4),
    new THREE.MeshPhysicalMaterial({ color: 0x7d91ff, metalness: .68, roughness: .22, clearcoat: 1, clearcoatRoughness: .18, emissive: 0x172565, emissiveIntensity: .22 })
  );
  world.add(core);
  wire = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.82, 2),
    new THREE.MeshBasicMaterial({ color: 0xaab5ff, wireframe: true, transparent: true, opacity: .24 })
  );
  world.add(wire);
  ringA = new THREE.Mesh(new THREE.TorusGeometry(2.38, .012, 6, 160), new THREE.MeshBasicMaterial({ color: 0x8496ff, transparent: true, opacity: .75 }));
  ringA.rotation.set(.95, .2, -.42); world.add(ringA);
  ringB = new THREE.Mesh(new THREE.TorusGeometry(2.86, .006, 5, 160), new THREE.MeshBasicMaterial({ color: 0x687cff, transparent: true, opacity: .34 }));
  ringB.rotation.set(1.25, .1, .38); world.add(ringB);

  const count = innerWidth < 700 ? 350 : 720;
  const points = new Float32Array(count * 3);
  let seed = 90517;
  const rand = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
  for (let i = 0; i < count; i++) {
    const radius = 3.2 + Math.pow(rand(), .8) * 7.7;
    const angle = rand() * Math.PI * 2;
    points[i * 3] = Math.cos(angle) * radius;
    points[i * 3 + 1] = (rand() - .5) * 9;
    points[i * 3 + 2] = Math.sin(angle) * radius - 2.5;
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(points, 3));
  stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0x95a4ff, size: .018, transparent: true, opacity: .62, sizeAttenuation: true }));
  scene.add(stars);

  const light1 = new THREE.PointLight(0xc2ccff, 42, 28); light1.position.set(3.8, 4.2, 5.2); scene.add(light1);
  const light2 = new THREE.PointLight(0x526cff, 42, 28); light2.position.set(-5, -2, -4); scene.add(light2);
  scene.add(new THREE.AmbientLight(0x7783bd, 1.25));

  function resize() {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth < 700 ? 1.2 : 1.5));
  }
  addEventListener('resize', resize);

  function draw() {
    requestAnimationFrame(draw);
    currentScroll = lerp(currentScroll, goalScroll, prefersReduced ? .24 : .065);
    px = lerp(px, tx, .035); py = lerp(py, ty, .035);
    const t = prefersReduced ? 0 : clock.getElapsedTime();
    const mobile = innerWidth < 700;
    const sweep = currentScroll * Math.PI * 2;
    const scale = (1 + Math.sin(sweep * 2) * .04) * (1 + Math.sin(currentScroll * Math.PI) * .2) * (mobile ? .68 : 1);
    world.position.set((mobile ? .72 : 2.1) + px * .13, .15 + py * -.1 + Math.sin(t * .24) * .035, 0);
    world.scale.setScalar(scale);
    world.rotation.set(.12 + sweep * .72 + py * .08 + t * .04, .3 + sweep * 1.25 + px * .1 + t * .055, -.13 + sweep * .38);
    core.rotation.set(.15 + sweep * .33, -.2 + sweep * .45, .12 + sweep * .2);
    wire.rotation.set(-.12 - sweep * .4, .1 + sweep * .28, .1 - sweep * .19);
    ringA.rotation.set(.88 + sweep * .28, .2 + sweep * .6, -.42 - sweep * .34);
    ringB.rotation.y = .1 - sweep * .5;
    ringB.rotation.z = .38 + sweep * .22;
    stars.rotation.y = currentScroll * .32 + t * .006;
    stars.rotation.x = currentScroll * .06;
    camera.position.x = px * .16;
    camera.position.y = -py * .08;
    camera.position.z = lerp(10.2, 8.5, Math.sin(currentScroll * Math.PI));
    camera.lookAt(mobile ? .45 : .7, 0, 0);
    renderer.render(scene, camera);
  }
  draw();
} catch (error) {
  if (canvas) canvas.style.display = 'none';
  if (fallback) fallback.style.display = 'block';
  console.warn('3D rendering unavailable; using static CSS fallback.', error);
}
