const POWERUPS = (() => {
  let items = [];
  let laneX = [-4, 0, 4];
  const TYPES = {
    nitro:  { color: 0xffb347, chance: 0.35 },
    shield: { color: 0x00e5ff, chance: 0.2 },
    coin:   { color: 0xffe066, chance: 0.45 }
  };

  function buildMesh(type) {
    const color = TYPES[type].color;
    let geo;
    if (type === 'nitro') geo = new THREE.OctahedronGeometry(0.55, 0);
    else if (type === 'shield') geo = new THREE.IcosahedronGeometry(0.5, 0);
    else geo = new THREE.CylinderGeometry(0.32, 0.32, 0.12, 14);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95 });
    const mesh = new THREE.Mesh(geo, mat);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.04, 8, 20), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5 }));
    ring.rotation.x = Math.PI / 2;
    mesh.add(ring);
    const light = new THREE.PointLight(color, 0.7, 5);
    mesh.add(light);
    return mesh;
  }

  function pickType() {
    const r = Math.random();
    let acc = 0;
    for (const key in TYPES) {
      acc += TYPES[key].chance;
      if (r <= acc) return key;
    }
    return 'coin';
  }

  function spawnOne(scene, aheadZ) {
    const type = pickType();
    const mesh = buildMesh(type);
    const lane = Math.floor(Math.random() * laneX.length);
    mesh.position.set(laneX[lane], 1.0, aheadZ);
    scene.add(mesh);
    items.push({ mesh, type, taken: false, spin: Math.random() * Math.PI });
  }

  function init(scene, laneXArg, playerZ, count = 16) {
    laneX = laneXArg;
    items.forEach(it => scene.remove(it.mesh));
    items = [];
    for (let i = 0; i < count; i++) {
      spawnOne(scene, playerZ + 40 + i * 22 + Math.random() * 10);
    }
  }

  function update(dt, playerZ, playerX, onPickup, scene) {
    const t = performance.now() * 0.002;
    items.forEach(it => {
      it.mesh.rotation.y = t + it.spin;
      it.mesh.position.y = 1.0 + Math.sin(t * 2 + it.spin) * 0.15;

      if (!it.taken) {
        const dz = it.mesh.position.z - playerZ;
        const dx = it.mesh.position.x - playerX;
        if (Math.abs(dz) < 1.6 && Math.abs(dx) < 1.3) {
          it.taken = true;
          it.mesh.visible = false;
          onPickup(it.type);
        }
      }

      if (it.mesh.position.z < playerZ - 20) {
        // recycle further ahead, keep same mesh/type to avoid visual mismatch
        it.taken = false;
        it.mesh.visible = true;
        const lane = Math.floor(Math.random() * laneX.length);
        it.mesh.position.set(laneX[lane], 1.0, playerZ + 220 + Math.random() * 60);
      }
    });
  }

  return { init, update };
})();
