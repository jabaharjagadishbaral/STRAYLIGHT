const GAME = (() => {
  let renderer, scene, camera, composer;
  let playerCar, wheelSpin = 0;
  let speed = 0;            // internal units/sec
  const CRUISE_MIN = 16, CRUISE_MAX = 46, NITRO_MAX = 68;
  let steerX = 0;           // current lateral position
  let steerVel = 0;
  let distance = 0;
  let topSpeedKmh = 0;
  let nitroMeter = 100;     // 0-100
  let nitroActive = false;
  let nitroCollectedCount = 0;
  let running = false;
  let crashed = false;
  let lastTime = 0;
  let roadHalf = 4.8;
  let trackId = 'city';
  let carId = 0;

  const input = { left: false, right: false, gas: false, brake: false, nitro: false };

  function kmh(s) { return Math.round(s * 9.2); }

  function setupRenderer() {
    const wrap = document.getElementById('canvas-wrap');
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = false;
    wrap.appendChild(renderer.domElement);

    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 500);

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      POSTFX.setSize(window.innerWidth, window.innerHeight);
    });
  }

  function clearScene() {
    if (!scene) { scene = new THREE.Scene(); return; }
    while (scene.children.length) scene.remove(scene.children[0]);
  }

  function buildRun(track, car) {
    trackId = track;
    carId = car;
    clearScene();

    const worldInfo = WORLD.init(scene, trackId);
    roadHalf = worldInfo.roadWidth / 2 - 1.0;

    playerCar = CAR.build(carId);
    playerCar.position.set(0, 0, 0);
    scene.add(playerCar);

    TRAFFIC.init(scene, worldInfo.laneX, 0);
    POWERUPS.init(scene, worldInfo.laneX, 0);
    WEATHER.init(scene, worldInfo.weather);

    composer = POSTFX.init(renderer, scene, camera, window.innerWidth, window.innerHeight);

    speed = CRUISE_MIN;
    steerX = 0; steerVel = 0;
    distance = 0; topSpeedKmh = 0;
    nitroMeter = 100; nitroActive = false; nitroCollectedCount = 0;
    crashed = false;

    document.getElementById('score-num').textContent = '0';
    document.getElementById('crash-flash').style.opacity = '0';
  }

  // ---------- Input ----------
  function bindInput() {
    window.addEventListener('keydown', (e) => {
      if (['ArrowLeft', 'a', 'A'].includes(e.key)) input.left = true;
      if (['ArrowRight', 'd', 'D'].includes(e.key)) input.right = true;
      if (['ArrowUp', 'w', 'W'].includes(e.key)) input.gas = true;
      if (['ArrowDown', 's', 'S'].includes(e.key)) input.brake = true;
      if (e.key === ' ') input.nitro = true;
    });
    window.addEventListener('keyup', (e) => {
      if (['ArrowLeft', 'a', 'A'].includes(e.key)) input.left = false;
      if (['ArrowRight', 'd', 'D'].includes(e.key)) input.right = false;
      if (['ArrowUp', 'w', 'W'].includes(e.key)) input.gas = false;
      if (['ArrowDown', 's', 'S'].includes(e.key)) input.brake = false;
      if (e.key === ' ') input.nitro = false;
    });

    const bind = (id, key) => {
      const el = document.getElementById(id);
      const on = (e) => { e.preventDefault(); input[key] = true; };
      const off = (e) => { e.preventDefault(); input[key] = false; };
      el.addEventListener('touchstart', on, { passive: false });
      el.addEventListener('touchend', off, { passive: false });
      el.addEventListener('touchcancel', off, { passive: false });
      el.addEventListener('mousedown', on);
      el.addEventListener('mouseup', off);
      el.addEventListener('mouseleave', off);
    };
    /* Touch steering is intentionally mapped by the button's physical side. */
    bind('btn-left', 'left'); bind('btn-right', 'right');
    bind('btn-gas', 'gas'); bind('btn-brake', 'brake'); bind('btn-nitro', 'nitro');

    if ('ontouchstart' in window) {
      document.getElementById('touch-controls').classList.add('active');
    }
  }

  // ---------- Physics / update ----------
  function updatePhysics(dt) {
    // steering
    const steerAccel = 22;
    // The rendered road/camera coordinate system is mirrored relative to the
    // input axis, so map the player's LEFT control to visual-left explicitly.
    if (input.left) steerVel += steerAccel * dt;
    else if (input.right) steerVel -= steerAccel * dt;
    else steerVel *= 0.85;
    steerVel = Math.max(-9, Math.min(9, steerVel));
    steerX += steerVel * dt;
    steerX = Math.max(-roadHalf, Math.min(roadHalf, steerX));
    if (steerX === roadHalf || steerX === -roadHalf) steerVel = 0;

    // nitro
    nitroActive = input.nitro && nitroMeter > 1;
    if (nitroActive) nitroMeter = Math.max(0, nitroMeter - dt * 34);
    else nitroMeter = Math.min(100, nitroMeter + dt * 6);

    // speed
    const targetCruise = CRUISE_MIN + (distance / 4000) * (CRUISE_MAX - CRUISE_MIN); // gentle ramp with distance
    let target = Math.min(CRUISE_MAX, targetCruise);
    if (input.gas) target += 12;
    if (input.brake) target -= 14;
    if (nitroActive) target = NITRO_MAX;
    target = Math.max(6, target);
    speed += (target - speed) * Math.min(1, dt * (nitroActive ? 2.6 : 1.6));

    distance += speed * dt;
    playerCar.position.z = distance;
    playerCar.position.x += (steerX - playerCar.position.x) * Math.min(1, dt * 10);
    playerCar.rotation.z = -steerVel * 0.035;
    playerCar.rotation.y = -steerVel * 0.015;

    // wheel spin
    wheelSpin += speed * dt * 2.2;
    playerCar.userData.wheels.forEach(w => w.rotation.x = wheelSpin);

    // brake lights
    const braking = input.brake || (!input.gas && speed < target - 2);
    playerCar.userData.tailMats.forEach(m => m.color.setHex(braking ? 0xff2222 : 0x661010));

    // nitro visual pulse
    const glowScale = nitroActive ? 1.7 : 1.0;
    playerCar.userData.underglowMesh.scale.set(glowScale, 1, 1);
    playerCar.userData.underLight.intensity = nitroActive ? 2.2 : 0.9;

    topSpeedKmh = Math.max(topSpeedKmh, kmh(speed));

    // camera chase
    const camOffsetZ = nitroActive ? -8.5 : -7.2;
    const camY = 3.1 + (nitroActive ? 0.15 : 0);
    camera.position.x += (playerCar.position.x - camera.position.x) * Math.min(1, dt * 4);
    camera.position.z += (playerCar.position.z + camOffsetZ - camera.position.z) * Math.min(1, dt * 5);
    camera.position.y += (camY - camera.position.y) * Math.min(1, dt * 4);
    camera.lookAt(playerCar.position.x * 0.4, 1.2, playerCar.position.z + 12);
    camera.fov = 70 + Math.min(14, speed * 0.15) + (nitroActive ? 6 : 0);
    camera.updateProjectionMatrix();

    WORLD.update(distance);
    TRAFFIC.update(dt, distance);
    POWERUPS.update(dt, distance, playerCar.position.x, onPickup, scene);
    WEATHER.update(dt, camera);

    checkCollisions();

    // HUD
    document.getElementById('speed-num').textContent = String(kmh(speed)).padStart(3, '0');
    document.getElementById('score-num').textContent = Math.floor(distance * 2.1);
    document.getElementById('speedbar-fill').style.width = Math.min(100, (kmh(speed) / kmh(NITRO_MAX)) * 100) + '%';
    document.getElementById('nitrobar-fill').style.width = nitroMeter + '%';

    const speedFactor = Math.min(1, speed / NITRO_MAX);
    POSTFX.setIntensity(speedFactor, nitroActive);
  }

  function onPickup(type) {
    if (type === 'nitro') { nitroMeter = Math.min(100, nitroMeter + 35); nitroCollectedCount++; }
    else if (type === 'shield') { /* brief grace window */ grantShield(); }
    else if (type === 'coin') { /* cosmetic only, real coins awarded server-side at run end */ }
  }

  let shieldUntil = 0;
  function grantShield() { shieldUntil = performance.now() + 4000; }
  function hasShield() { return performance.now() < shieldUntil; }

  function checkCollisions() {
    if (crashed) return;
    const cars = TRAFFIC.getCars();
    for (const c of cars) {
      const dz = c.mesh.position.z - playerCar.position.z;
      const dx = c.mesh.position.x - playerCar.position.x;
      if (Math.abs(dz) < 2.3 && Math.abs(dx) < 1.55) {
        if (hasShield()) continue;
        triggerCrash();
        return;
      }
    }
  }

  function triggerCrash() {
    crashed = true;
    running = false;
    document.getElementById('crash-flash').style.transition = 'opacity 0.05s';
    document.getElementById('crash-flash').style.opacity = '0.85';
    setTimeout(() => { document.getElementById('crash-flash').style.transition = 'opacity 0.6s'; document.getElementById('crash-flash').style.opacity = '0'; }, 90);
    setTimeout(showCrashScreen, 550);
  }

  async function showCrashScreen() {
    const distMeters = Math.floor(distance * 2.1);
    document.getElementById('final-distance').textContent = distMeters;
    document.getElementById('crash-sub').textContent = distMeters > 2000 ? 'Legendary run.' : (distMeters > 800 ? 'Solid drive.' : 'The night got you.');
    const rewardsWrap = document.getElementById('run-rewards');
    rewardsWrap.innerHTML = '<div class="reward-line">Submitting run…</div>';
    document.getElementById('crash-overlay').classList.remove('hidden');

    if (API.isLoggedIn()) {
      try {
        const res = await API.submitRun({
          distance: distMeters,
          topSpeed: topSpeedKmh,
          nitroCollected: nitroCollectedCount,
          track: trackId,
          crashed: true
        });
        GARAGE_UI.applyRunUpdate(res.progress);
        rewardsWrap.innerHTML = `<div class="reward-line">+${res.rewards.coins}¢ earned</div>` +
          (res.rewards.newlyUnlockedTracks.length ? `<div class="reward-line">New route unlocked: ${res.rewards.newlyUnlockedTracks.join(', ')}</div>` : '');
        GARAGE_UI.showMissionToasts(res.rewards.completedMissions);
      } catch (e) {
        rewardsWrap.innerHTML = '<div class="reward-line">Could not save run (offline?)</div>';
      }
    } else {
      rewardsWrap.innerHTML = '<div class="reward-line">Sign in to save runs & unlock rewards</div>';
    }
  }

  function loop(t) {
    if (!running) return;
    const dt = Math.min(0.05, (t - lastTime) / 1000 || 0.016);
    lastTime = t;
    updatePhysics(dt);
    POSTFX.render(dt);
    requestAnimationFrame(loop);
  }

  function startRun(track, car) {
    if (window.MUSIC) MUSIC.autoStart();
    buildRun(track, car);
    running = true;
    lastTime = performance.now();
    document.getElementById('start-overlay').classList.add('hidden');
    document.getElementById('crash-overlay').classList.add('hidden');
    requestAnimationFrame(loop);
  }

  function backToGarage() {
    document.getElementById('crash-overlay').classList.add('hidden');
    document.getElementById('start-overlay').classList.remove('hidden');
  }

  function init() {
    setupRenderer();
    bindInput();

    document.getElementById('start-btn').addEventListener('click', () => {
      startRun(GARAGE_UI.getSelectedTrack(), GARAGE_UI.getSelectedCar());
    });
    document.getElementById('retry-btn').addEventListener('click', () => {
      startRun(trackId, carId);
    });
    document.getElementById('garage-btn').addEventListener('click', backToGarage);
  }

  return { init };
})();

window.addEventListener('DOMContentLoaded', () => GAME.init());
