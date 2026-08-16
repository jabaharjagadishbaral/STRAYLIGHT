const TRAFFIC = (() => {
  let cars = [];
  let laneX = [-4, 0, 4];
  const COLORS = [0xffffff, 0xffd166, 0x8fd8ff, 0xff6b6b, 0xc792ea];

  function buildTrafficCar() {
    const g = new THREE.Group();
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.7, 0.9, 3.2),
      new THREE.MeshLambertMaterial({ color })
    );
    body.position.y = 0.6;
    g.add(body);
    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 0.5, 1.4),
      new THREE.MeshLambertMaterial({ color: 0x111122 })
    );
    cabin.position.set(0, 1.2, -0.1);
    g.add(cabin);
    const tailMat = new THREE.MeshBasicMaterial({ color: 0xff3344 });
    const tailL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.18, 0.06), tailMat);
    tailL.position.set(-0.6, 0.7, -1.62);
    g.add(tailL);
    const tailR = tailL.clone(); tailR.position.x = 0.6; g.add(tailR);
    return g;
  }

  function respawn(car, aheadZ) {
    const lane = Math.floor(Math.random() * laneX.length);
    car.mesh.position.set(laneX[lane], 0, aheadZ + 60 + Math.random() * 140);
    car.speed = 6 + Math.random() * 10;
    car.lane = lane;
    car.passed = false; // reset close-call tracking each time this slot re-enters play
  }

  function init(scene, laneXArg, playerZ, count = 9) {
    laneX = laneXArg;
    cars.forEach(c => scene.remove(c.mesh));
    cars = [];
    for (let i = 0; i < count; i++) {
      const mesh = buildTrafficCar();
      const car = { id: i, mesh, speed: 6, lane: 0, passed: false };
      respawn(car, playerZ);
      scene.add(mesh);
      cars.push(car);
    }
  }

  function update(dt, playerZ) {
    cars.forEach(car => {
      car.mesh.position.z += car.speed * dt;
      if (car.mesh.position.z < playerZ - 25) {
        respawn(car, playerZ);
      }
    });
  }

  function getCars() {
    return cars;
  }

  return { init, update, getCars };
})();
