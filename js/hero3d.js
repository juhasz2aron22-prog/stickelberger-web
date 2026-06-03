/* =========================================================================
   Stickelberger — hero 3D
   A slowly rotating wireframe architectural massing ("Baukörper") sitting on
   a blueprint ground grid, with subtle pointer parallax. Tasteful, not flashy.
   Reads palette from CSS custom properties so it matches any chosen theme.
   Mount point: <canvas data-hero3d></canvas>
   ========================================================================= */
(function () {
  "use strict";
  const canvas = document.querySelector("[data-hero3d]");
  if (!canvas || typeof window.THREE === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const css = (name, fallback) =>
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

  const COL_LINE = new THREE.Color(css("--c-3d-line", "#2B4A6F"));
  const COL_WARM = new THREE.Color(css("--c-warm", "#B4502A"));

  const wrap = canvas.parentElement;
  let W = wrap.clientWidth, H = wrap.clientHeight;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (e) { return; } // no WebGL → keep the static SVG fallback
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H);
  wrap.classList.add("is-3d"); // hide the SVG fallback

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 100);
  camera.position.set(6.4, 4.6, 7.6);
  camera.lookAt(0, 0.6, 0);

  const root = new THREE.Group();
  scene.add(root);

  /* --- Ground blueprint grid -------------------------------------------- */
  const grid = new THREE.GridHelper(16, 32, COL_LINE, COL_LINE);
  grid.material.opacity = 0.18;
  grid.material.transparent = true;
  grid.position.y = -0.02;
  root.add(grid);

  /* --- Massing model: a cluster of wireframe volumes -------------------- */
  // [x, z, width, depth, height]
  const blocks = [
    [0, 0, 2.4, 2.4, 3.4],
    [-2.1, 0.4, 1.5, 1.7, 2.0],
    [1.9, -0.6, 1.6, 1.4, 4.6],
    [0.2, 2.3, 2.0, 1.3, 1.5],
    [-1.6, -2.0, 1.2, 1.2, 2.7],
    [2.4, 1.9, 1.0, 1.0, 1.1],
  ];

  const solidMat = new THREE.MeshBasicMaterial({ color: COL_LINE, transparent: true, opacity: 0.035 });
  const lineMat = new THREE.LineBasicMaterial({ color: COL_LINE, transparent: true, opacity: 0.5 });
  const lineMatFront = new THREE.LineBasicMaterial({ color: COL_LINE, transparent: true, opacity: 0.85 });

  let tower = null, towerDims = null;
  blocks.forEach((b, i) => {
    const [x, z, w, d, h] = b;
    const geo = new THREE.BoxGeometry(w, h, d);
    const edges = new THREE.EdgesGeometry(geo);
    const line = new THREE.LineSegments(edges, i === 2 ? lineMatFront : lineMat);
    const mesh = new THREE.Mesh(geo, solidMat);
    const g = new THREE.Group();
    g.add(mesh, line);
    g.position.set(x, h / 2, z);
    g.userData.baseY = h / 2;
    g.userData.phase = i * 1.3;
    root.add(g);
    if (i === 2) { tower = g; towerDims = { w, d, h }; }
  });

  /* --- The signature: a warm "survey laser" point climbing the tower ---- */
  let laser = null;
  if (tower) {
    laser = new THREE.Group();
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 12, 12),
      new THREE.MeshBasicMaterial({ color: COL_WARM })
    );
    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 16, 16),
      new THREE.MeshBasicMaterial({ color: COL_WARM, transparent: true, opacity: 0.22 })
    );
    laser.add(dot, halo);
    tower.add(laser);
  }

  /* --- A few drifting accent nodes (survey points) ---------------------- */
  const nodes = [];
  const nodeGeo = new THREE.SphereGeometry(0.04, 8, 8);
  const nodeMat = new THREE.MeshBasicMaterial({ color: COL_LINE, transparent: true, opacity: 0.6 });
  for (let i = 0; i < 5; i++) {
    const n = new THREE.Mesh(nodeGeo, nodeMat);
    n.userData = { r: 3.6 + i * 0.5, s: 0.12 + i * 0.05, a: i * 1.7, y: 3 + i * 0.7 };
    root.add(n);
    nodes.push(n);
  }

  /* --- Pointer parallax -------------------------------------------------- */
  const target = { x: 0, y: 0 };
  const cur = { x: 0, y: 0 };
  window.addEventListener("pointermove", (e) => {
    target.x = (e.clientX / window.innerWidth - 0.5) * 2;
    target.y = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  /* --- Resize ------------------------------------------------------------ */
  const onResize = () => {
    W = wrap.clientWidth; H = wrap.clientHeight;
    camera.aspect = W / H; camera.updateProjectionMatrix();
    renderer.setSize(W, H);
  };
  window.addEventListener("resize", onResize);

  /* --- Loop -------------------------------------------------------------- */
  let raf, t = 0, running = true;
  const loop = () => {
    if (!running) return;
    raf = requestAnimationFrame(loop);
    t += 0.006;

    root.rotation.y = t * 0.5;

    cur.x += (target.x - cur.x) * 0.05;
    cur.y += (target.y - cur.y) * 0.05;
    camera.position.x = 6.4 + cur.x * 1.1;
    camera.position.y = 4.6 - cur.y * 0.8;
    camera.lookAt(0, 0.7, 0);

    root.children.forEach((c) => {
      if (c.userData.baseY !== undefined)
        c.position.y = c.userData.baseY + Math.sin(t * 1.2 + c.userData.phase) * 0.05;
    });
    nodes.forEach((n) => {
      const a = n.userData.a + t * n.userData.s * 6;
      n.position.set(Math.cos(a) * n.userData.r, n.userData.y + Math.sin(t + n.userData.a) * 0.4, Math.sin(a) * n.userData.r);
    });

    /* survey laser climbs the four vertical corner edges of the tower */
    if (laser && towerDims) {
      const { w, d, h } = towerDims;
      const corners = [[w/2, d/2], [-w/2, d/2], [-w/2, -d/2], [w/2, -d/2]];
      const p = (t * 0.32) % 4;          // 0..4 over the loop
      const seg = Math.floor(p);
      const frac = p - seg;
      const [cx, cz] = corners[seg];
      laser.position.set(cx, -h / 2 + frac * h, cz);
      const pulse = 0.85 + Math.sin(t * 8) * 0.15;
      laser.scale.setScalar(pulse);
    }

    renderer.render(scene, camera);
  };
  loop();

  // Pause when offscreen / tab hidden
  document.addEventListener("visibilitychange", () => {
    running = !document.hidden;
    if (running) loop();
  });
})();
