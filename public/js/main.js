const GAME = (() => {
  let renderer, scene, camera, composer;
  let playerCar, wheelSpin = 0;
  let speed = 0;            // internal units/sec
  const CRUISE_MIN = 16, CRUISE_MAX = 46, NITRO_MAX = 68;
  let steerX = 0;           // current lateral position
  let steerTarget = 0;      // persistent lane target; steering does NOT spring back to center
  let steerVel = 0;
  const LANE_STEP = 4;      // matches the 3 road lanes: -4 / 0 / +4
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
  let modeId = 'endless';
  let eventId = null;
  let raceTime = 0;
  let finishDistance = 0;

  const input = { left: false, right: false, gas: false, brake: false, nitro: false };

  // Close-call combo: rewards tight, controlled driving near traffic without
  // touching real distance/economy — it's a pure excitement/feedback layer.
  let combo = 0, comboMultiplier = 1, comboTimer = 0;

  function kmh(s) { return Math.round(s * 9.2); }

  function setupRenderer() {
    const wrap = document.getElementById('canvas-wrap');
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    const perf = window.SETTINGS && SETTINGS.get().quality === 'perf';
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, perf ? 1.5 : 2));
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

  function buildRun(track, car, mode = 'endless', event = null) {
    trackId = track;
    carId = car;
    modeId = mode;
    eventId = event;
    clearScene();

    const worldInfo = WORLD.init(scene, trackId);
    roadHalf = worldInfo.roadWidth / 2 - 1.0;

    playerCar = CAR.build(carId);
    playerCar.position.set(0, 0, 0);
    scene.add(playerCar);

    TRAFFIC.init(scene, worldInfo.laneX, 0, modeId === 'trafficstorm' ? 15 : 9);
    POWERUPS.init(scene, worldInfo.laneX, 0);
    WEATHER.init(scene, worldInfo.weather);

    composer = POSTFX.init(renderer, scene, camera, window.innerWidth, window.innerHeight);
    if (window.SETTINGS) POSTFX.setQuality(SETTINGS.get().quality);

    speed = CRUISE_MIN;
    steerX = 0; steerTarget = 0; steerVel = 0;
    distance = 0; topSpeedKmh = 0; raceTime = 0;
    finishDistance = modeId === 'grandprix' ? 2500 : 0;
    nitroMeter = 100; nitroActive = false; nitroCollectedCount = 0;
    crashed = false;
    input.left = input.right = input.gas = input.brake = input.nitro = false;
    combo = 0; comboMultiplier = 1; comboTimer = 0;
    updateComboHud();

    document.getElementById('score-num').textContent = '0';
    document.getElementById('crash-flash').style.opacity = '0';
  }

  // ---------- Input ----------
  function bindInput() {
    const shiftLane = (screenDirection) => {
      // The Three.js chase camera presents +X on the player's LEFT in this
      // scene. Convert screen intent to world X here so controls always feel
      // natural: LEFT button -> visual left, RIGHT button -> visual right.
      const worldDirection = -screenDirection;
      steerTarget += worldDirection * LANE_STEP;
      steerTarget = Math.max(-4, Math.min(4, steerTarget));
      steerVel = worldDirection * 7;
    };

    window.addEventListener('keydown', (e) => {
      if (['ArrowLeft', 'a', 'A'].includes(e.key)) { e.preventDefault(); if (!e.repeat) shiftLane(-1); }
      if (['ArrowRight', 'd', 'D'].includes(e.key)) { e.preventDefault(); if (!e.repeat) shiftLane(1); }
      if (['ArrowUp', 'w', 'W'].includes(e.key)) input.gas = true;
      if (['ArrowDown', 's', 'S'].includes(e.key)) input.brake = true;
      if (e.key === ' ') input.nitro = true;
    });
    window.addEventListener('keyup', (e) => {
      if (['ArrowUp', 'w', 'W'].includes(e.key)) input.gas = false;
      if (['ArrowDown', 's', 'S'].includes(e.key)) input.brake = false;
      if (e.key === ' ') input.nitro = false;
    });

    const bindHold = (id, key) => {
      const el = document.getElementById(id);
      const on = (e) => { e.preventDefault(); input[key] = true; };
      const off = (e) => { e.preventDefault(); input[key] = false; };
      el.addEventListener('pointerdown', on);
      el.addEventListener('pointerup', off);
      el.addEventListener('pointercancel', off);
      el.addEventListener('pointerleave', off);
    };
    const bindSteer = (id, direction) => {
      const el = document.getElementById(id);
      if (!el) return;
      // One physical press = one lane change. Do NOT also bind click,
      // otherwise touch browsers fire pointerdown + click and move twice.
      el.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        if (e.button !== undefined && e.button !== 0) return;
        el.setPointerCapture?.(e.pointerId);
        shiftLane(direction);
        el.classList.add('pressed');
      }, { passive:false });
      const release = (e) => { e.preventDefault(); el.classList.remove('pressed'); };
      el.addEventListener('pointerup', release, { passive:false });
      el.addEventListener('pointercancel', release, { passive:false });
      el.addEventListener('pointerleave', release, { passive:false });
    };
    // Steering is a persistent 3-lane system: releasing the button does NOT return the car to center.
    bindSteer('btn-left', -1);
    bindSteer('btn-right', 1);
    bindHold('btn-gas', 'gas'); bindHold('btn-brake', 'brake'); bindHold('btn-nitro', 'nitro');

    if ('ontouchstart' in window) {
      document.getElementById('touch-controls').classList.add('active');
    }

    // Tilt steering: only acts when the player has chosen it in Settings.
    // Uses the same discrete lane-shift as buttons/keys, triggered by gamma
    // crossing a threshold, with a small cooldown + deadzone so it doesn't
    // fire repeatedly while the phone rests at an angle.
    let tiltDir = 0, tiltCooldownUntil = 0;
    window.addEventListener('deviceorientation', (e) => {
      if (!window.SETTINGS || SETTINGS.get().control !== 'tilt') return;
      if (!running || crashed) return;
      const now = performance.now();
      const gamma = e.gamma || 0;
      const THRESH = 13, RELEASE = 6;
      if (now >= tiltCooldownUntil) {
        if (gamma < -THRESH && tiltDir !== -1) { shiftLane(-1); tiltDir = -1; tiltCooldownUntil = now + 260; }
        else if (gamma > THRESH && tiltDir !== 1) { shiftLane(1); tiltDir = 1; tiltCooldownUntil = now + 260; }
      }
      if (Math.abs(gamma) < RELEASE) tiltDir = 0;
    });
  }

  // ---------- Physics / update ----------
  function updatePhysics(dt) {
    // Persistent lane steering: once the player changes lane, the car stays there until another steering input.
    // Smooth-damp lane movement: the target lane is persistent, while the
    // car eases into it with a real velocity instead of snapping/returning.
    const smoothTime = 0.22;
    const omega = 2 / smoothTime;
    const xDelta = steerX - steerTarget;
    const exp = 1 / (1 + omega * dt + 0.48 * omega * omega * dt * dt + 0.235 * omega * omega * omega * dt * dt * dt);
    const oldX = steerX;
    const oldTarget = steerTarget;
    steerX = steerTarget + (xDelta + (steerVel + omega * xDelta) * dt) * exp;
    steerVel = (steerVel - omega * (steerVel + omega * xDelta) * dt) * exp;
    // Keep the car firmly inside the road.
    if (steerX < -roadHalf) { steerX = -roadHalf; steerVel = 0; steerTarget = -roadHalf; }
    if (steerX > roadHalf) { steerX = roadHalf; steerVel = 0; steerTarget = roadHalf; }
    steerVel = (steerX - oldX) / Math.max(dt, 0.001);

    // Mode modifiers
    raceTime += dt;
    nitroActive = input.nitro && nitroMeter > 1;
    const recharge = modeId === 'nitrorush' ? 13 : 6;
    if (nitroActive) nitroMeter = Math.max(0, nitroMeter - dt * (modeId === 'nitrorush' ? 28 : 34));
    else nitroMeter = Math.min(100, nitroMeter + dt * recharge);

    // speed
    const targetCruise = CRUISE_MIN + (distance / 4000) * (CRUISE_MAX - CRUISE_MIN); // gentle ramp with distance
    let target = Math.min(CRUISE_MAX, targetCruise);
    if (input.gas) target += 12;
    if (input.brake) target -= 14;
    if (modeId === 'trafficstorm') target += 5;
    if (nitroActive) target = NITRO_MAX;
    target = Math.max(6, target);
    speed += (target - speed) * Math.min(1, dt * (nitroActive ? 2.6 : 1.6));

    distance += speed * dt;
    playerCar.position.z = distance;
    playerCar.position.x = steerX;
    // Subtle body lean gives the lane change weight without making the car
    // look like it is drifting uncontrollably.
    playerCar.rotation.z += ((-steerVel * 0.018) - playerCar.rotation.z) * Math.min(1, dt * 10);
    playerCar.rotation.y += ((-steerVel * 0.008) - playerCar.rotation.y) * Math.min(1, dt * 10);

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

    if (modeId === 'timeattack' && raceTime >= 90) { triggerFinish('TIME EXPIRED'); return; }
    if (finishDistance > 0 && distance * 2.1 >= finishDistance) { triggerFinish('FINISH LINE'); return; }

    checkCollisions();

    // Combo decay: no close call for a couple seconds resets the streak.
    if (combo > 0) {
      comboTimer -= dt;
      if (comboTimer <= 0) { combo = 0; comboMultiplier = 1; updateComboHud(); }
    }

    // HUD
    document.getElementById('speed-num').textContent = String(kmh(speed)).padStart(3, '0');
    document.getElementById('score-num').textContent = Math.floor(distance * 2.1);
    document.getElementById('speedbar-fill').style.width = Math.min(100, (kmh(speed) / kmh(NITRO_MAX)) * 100) + '%';
    document.getElementById('nitrobar-fill').style.width = nitroMeter + '%';
    const nitroPercent = document.getElementById('nitro-percent');
    if (nitroPercent) nitroPercent.textContent = Math.round(nitroMeter) + '%';
    const nitroBtn = document.getElementById('btn-nitro');
    if (nitroBtn) {
      nitroBtn.classList.toggle('ready', nitroMeter > 8);
      nitroBtn.classList.toggle('boosting', nitroActive);
      const label = nitroBtn.querySelector('.nitro-label');
      if (label) label.textContent = nitroActive ? 'BOOSTING' : (nitroMeter > 8 ? 'NITRO' : 'RECHARGING');
    }

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
      // Close call: passed within a tight window without touching -> combo bonus.
      if (!c.passed && Math.abs(dz) < 3.4 && Math.abs(dx) < 2.6) {
        c.passed = true;
        registerCloseCall();
      }
    }
  }

  function registerCloseCall() {
    combo++;
    comboTimer = 2.6;
    comboMultiplier = Math.min(4, 1 + combo * 0.25);
    updateComboHud(true);
  }

  function updateComboHud(pulse) {
    const badge = document.getElementById('combo-badge');
    if (!badge) return;
    if (combo > 0) {
      badge.classList.remove('hidden');
      document.getElementById('combo-mult-num').textContent = 'x' + comboMultiplier.toFixed(1);
      document.getElementById('combo-streak-num').textContent = combo;
      if (pulse) { badge.classList.remove('pulse'); void badge.offsetWidth; badge.classList.add('pulse'); }
    } else {
      badge.classList.add('hidden');
    }
  }

  function triggerFinish(reason) {
    if (crashed || !running) return;
    crashed = true;
    running = false;
    document.body.classList.remove('racing');
    setTimeout(() => showCrashScreen(reason), 250);
  }

  function triggerCrash() {
    crashed = true;
    running = false;
    document.body.classList.remove('racing');
    document.getElementById('crash-flash').style.transition = 'opacity 0.05s';
    document.getElementById('crash-flash').style.opacity = '0.85';
    setTimeout(() => { document.getElementById('crash-flash').style.transition = 'opacity 0.6s'; document.getElementById('crash-flash').style.opacity = '0'; }, 90);
    setTimeout(showCrashScreen, 550);
  }

  async function showCrashScreen(reason = 'RUN COMPLETE') {
    const distMeters = Math.floor(distance * 2.1);
    document.getElementById('final-distance').textContent = distMeters;
    document.getElementById('crash-sub').textContent = reason === 'FINISH LINE' ? 'Finish line crossed. Event rewards secured.' : (reason === 'TIME EXPIRED' ? 'Clock zero. Your distance is locked in.' : (distMeters > 2000 ? 'Legendary run.' : (distMeters > 800 ? 'Solid drive.' : 'The night got you.')));
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
          mode: modeId,
          event: eventId,
          crashed: reason !== 'FINISH LINE' && reason !== 'TIME EXPIRED'
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

  function startRun(track, car, mode, event) {
    if (window.MUSIC) MUSIC.autoStart();
    buildRun(track, car, mode, event);
    running = true;
    lastTime = performance.now();
    document.getElementById('start-overlay').classList.add('hidden');
    document.getElementById('crash-overlay').classList.add('hidden');
    document.body.classList.add('racing');
    requestAnimationFrame(loop);
  }

  function backToGarage() {
    running = false;
    input.gas = input.brake = input.nitro = false;
    document.body.classList.remove('racing');
    document.getElementById('crash-overlay').classList.add('hidden');
    document.getElementById('start-overlay').classList.remove('hidden');
  }

  function init() {
    setupRenderer();
    bindInput();

    document.getElementById('start-btn').addEventListener('click', () => {
      startRun(GARAGE_UI.getSelectedTrack(), GARAGE_UI.getSelectedCar(), GARAGE_UI.getSelectedMode(), GARAGE_UI.getSelectedEvent());
    });
    document.getElementById('retry-btn').addEventListener('click', () => {
      startRun(trackId, carId, modeId, eventId);
    });
    document.getElementById('garage-btn').addEventListener('click', backToGarage);
  }

  return { init };
})();

window.addEventListener('DOMContentLoaded', () => GAME.init());
