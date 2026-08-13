const WORLD = (() => {
  const ROAD_WIDTH = 12;
  const TILE_LENGTH = 50;
  const TILE_COUNT = 14;
  const LANE_X = [-4, 0, 4];

  let scene, trackId, visual;
  let tiles = [];
  let group;

  function skyTexture(colorBottomHex, colorTopHex) {
    const c = document.createElement('canvas');
    c.width = 8; c.height = 256;
    const ctx = c.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    const top = new THREE.Color(colorTopHex);
    const bottom = new THREE.Color(colorBottomHex);
    grad.addColorStop(0, `rgb(${top.r*255|0},${top.g*255|0},${top.b*255|0})`);
    grad.addColorStop(1, `rgb(${bottom.r*255|0},${bottom.g*255|0},${bottom.b*255|0})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 8, 256);
    const tex = new THREE.CanvasTexture(c);
    tex.magFilter = THREE.LinearFilter;
    return tex;
  }

  function neonStrip(length, color, width = 0.12, height = 0.4) {
    const geo = new THREE.BoxGeometry(width, height, length);
    const mat = new THREE.MeshBasicMaterial({ color });
    return new THREE.Mesh(geo, mat);
  }

  function laneMarkings(tileGroup, trackType) {
    const dashColor = trackType === 'storm' ? 0x8fd8ff : 0xffffff;
    for (let d = 0; d < TILE_LENGTH; d += 8) {
      const dash = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, 0.05, 3.2),
        new THREE.MeshBasicMaterial({ color: dashColor, transparent: true, opacity: 0.85 })
      );
      dash.position.set(-2, 0.05, d);
      tileGroup.add(dash);
      const dash2 = dash.clone();
      dash2.position.x = 2;
      tileGroup.add(dash2);
    }
    const edgeColor = visual.scenery === 'city' ? 0x00e5ff : (visual.scenery === 'desert' ? 0xffb347 : 0x00e5ff);
    const left = neonStrip(TILE_LENGTH, edgeColor, 0.15, 0.5);
    left.position.set(-ROAD_WIDTH/2, 0.25, TILE_LENGTH/2);
    tileGroup.add(left);
    const right = left.clone();
    right.position.x = ROAD_WIDTH/2;
    tileGroup.add(right);
  }

  function buildingProp(side) {
    const g = new THREE.Group();
    const h = 8 + Math.random() * 26;
    const w = 5 + Math.random() * 5;
    const bodyColor = Math.random() > 0.5 ? 0x120b2e : 0x1a1145;
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), new THREE.MeshLambertMaterial({ color: bodyColor }));
    body.position.y = h/2;
    g.add(body);
    // window strips (emissive)
    const winColor = Math.random() > 0.5 ? 0xff2e88 : 0x00e5ff;
    const winMat = new THREE.MeshBasicMaterial({ color: winColor });
    const rows = Math.floor(h / 3);
    for (let r = 1; r < rows; r++) {
      if (Math.random() > 0.55) continue;
      const strip = new THREE.Mesh(new THREE.BoxGeometry(w * 0.9, 0.35, 0.1), winMat);
      strip.position.set(0, r * 3, w/2 + 0.05);
      g.add(strip);
    }
    g.position.x = side * (ROAD_WIDTH/2 + 6 + Math.random() * 10);
    g.position.z = Math.random() * TILE_LENGTH;
    return g;
  }

  function cactusProp(side) {
    const g = new THREE.Group();
    const mat = new THREE.MeshLambertMaterial({ color: 0x2e6b4f });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 3 + Math.random()*2, 8), mat);
    trunk.position.y = 1.5;
    g.add(trunk);
    if (Math.random() > 0.4) {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 1.6, 8), mat);
      arm.position.set(0.5, 2.2, 0);
      arm.rotation.z = Math.PI/3;
      g.add(arm);
    }
    const glow = new THREE.Mesh(new THREE.RingGeometry(0.01, 0.5, 12), new THREE.MeshBasicMaterial({ color: 0xff7a3d, transparent: true, opacity: 0.25, side: THREE.DoubleSide }));
    glow.rotation.x = -Math.PI/2;
    glow.position.y = 0.02;
    g.add(glow);
    g.position.x = side * (ROAD_WIDTH/2 + 3 + Math.random() * 12);
    g.position.z = Math.random() * TILE_LENGTH;
    return g;
  }

  function rockProp(side) {
    const g = new THREE.Group();
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.8 + Math.random()*1.4, 0), new THREE.MeshLambertMaterial({ color: 0x2a2035 }));
    rock.position.y = 0.6;
    rock.rotation.set(Math.random(), Math.random(), Math.random());
    g.add(rock);
    g.position.x = side * (ROAD_WIDTH/2 + 2 + Math.random() * 14);
    g.position.z = Math.random() * TILE_LENGTH;
    return g;
  }

  function pierPostProp(side) {
    const g = new THREE.Group();
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 4, 8), new THREE.MeshLambertMaterial({ color: 0x1a1a2e }));
    post.position.y = 2;
    g.add(post);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), new THREE.MeshBasicMaterial({ color: 0x00e5ff }));
    lamp.position.y = 4.2;
    g.add(lamp);
    g.position.x = side * (ROAD_WIDTH/2 + 3 + Math.random() * 6);
    g.position.z = Math.random() * TILE_LENGTH;
    return g;
  }

  function streetlight(side, z) {
    const g = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 7, 6), new THREE.MeshLambertMaterial({ color: 0x111122 }));
    pole.position.y = 3.5;
    g.add(pole);
    const lampColor = visual.scenery === 'desert' ? 0xffb347 : (visual.scenery === 'coast' ? 0x00e5ff : 0xff2e88);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 10), new THREE.MeshBasicMaterial({ color: lampColor }));
    lamp.position.y = 7;
    g.add(lamp);
    const light = new THREE.PointLight(lampColor, 0.6, 14);
    light.position.y = 7;
    g.add(light);
    g.position.set(side * (ROAD_WIDTH/2 + 1.5), 0, z);
    return g;
  }

  function groundFor(tileGroup) {
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(200, TILE_LENGTH),
      new THREE.MeshLambertMaterial({ color: visual.ground })
    );
    ground.rotation.x = -Math.PI/2;
    ground.position.set(0, -0.02, TILE_LENGTH/2);
    tileGroup.add(ground);

    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(ROAD_WIDTH, TILE_LENGTH),
      new THREE.MeshPhysicalMaterial({ color: 0x0b0b16, roughness: 0.35, metalness: 0.15, clearcoat: 0.6, clearcoatRoughness: 0.25 })
    );
    road.rotation.x = -Math.PI/2;
    road.position.set(0, 0, TILE_LENGTH/2);
    tileGroup.add(road);

    if (visual.scenery === 'coast') {
      const water = new THREE.Mesh(
        new THREE.PlaneGeometry(80, TILE_LENGTH),
        new THREE.MeshPhysicalMaterial({ color: 0x061224, roughness: 0.15, metalness: 0.3, clearcoat: 0.8 })
      );
      water.rotation.x = -Math.PI/2;
      water.position.set(-50, -0.3, TILE_LENGTH/2);
      tileGroup.add(water);
    }
  }

  function buildTile(index) {
    const g = new THREE.Group();
    g.position.z = index * TILE_LENGTH;
    groundFor(g);
    laneMarkings(g, visual.scenery);

    const propCount = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < propCount; i++) {
      const side = Math.random() > 0.5 ? 1 : -1;
      let prop;
      if (visual.scenery === 'city') prop = buildingProp(side);
      else if (visual.scenery === 'desert') prop = Math.random() > 0.4 ? cactusProp(side) : rockProp(side);
      else prop = Math.random() > 0.5 ? pierPostProp(side) : rockProp(side);
      g.add(prop);
    }
    if (index % 2 === 0) {
      g.add(streetlight(-1, TILE_LENGTH * 0.3));
      g.add(streetlight(1, TILE_LENGTH * 0.7));
    }
    return g;
  }

  function init(sceneRef, trackIdArg) {
    scene = sceneRef;
    trackId = trackIdArg;
    visual = CATALOG.trackVisual(trackId);

    scene.background = skyTexture(visual.sky[0], visual.sky[1]);
    scene.fog = new THREE.FogExp2(visual.fog, 0.012);

    const hemi = new THREE.HemisphereLight(visual.sky[1], visual.ground, 0.55);
    scene.add(hemi);
    const ambient = new THREE.AmbientLight(0xffffff, 0.25);
    scene.add(ambient);

    group = new THREE.Group();
    scene.add(group);
    tiles = [];
    for (let i = 0; i < TILE_COUNT; i++) {
      const tile = buildTile(i);
      group.add(tile);
      tiles.push(tile);
    }

    return { hemi, ambient, weather: visual.weather, laneX: LANE_X, roadWidth: ROAD_WIDTH };
  }

  // Recycle tiles that have fallen behind the car
  function update(carZ) {
    const totalLength = TILE_COUNT * TILE_LENGTH;
    tiles.forEach(tile => {
      if (tile.position.z < carZ - TILE_LENGTH * 2) {
        tile.position.z += totalLength;
      }
    });
  }

  function laneX(i) { return LANE_X[i]; }

  return { init, update, laneX, ROAD_WIDTH, TILE_LENGTH };
})();
