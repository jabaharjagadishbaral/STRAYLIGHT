const WEATHER = (() => {
  let rainPoints = null;
  let rainVelocities = null;
  let type = 'clear';
  let lightningTimer = 0;
  let flashEl = null;

  function rainSprite() {
    const c = document.createElement('canvas');
    c.width = 16; c.height = 16;
    const ctx = c.getContext('2d');
    const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    grad.addColorStop(0, 'rgba(200,230,255,0.9)');
    grad.addColorStop(1, 'rgba(200,230,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 16, 16);
    return new THREE.CanvasTexture(c);
  }

  function initRain(scene, count = 700) {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    rainVelocities = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i*3] = (Math.random() - 0.5) * 60;
      positions[i*3+1] = Math.random() * 30;
      positions[i*3+2] = (Math.random() - 0.5) * 80;
      rainVelocities[i] = 18 + Math.random() * 10;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      map: rainSprite(), color: 0x9fd8ff, size: 0.35, transparent: true,
      opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending
    });
    rainPoints = new THREE.Points(geo, mat);
    scene.add(rainPoints);
  }

  function init(scene, weatherType) {
    type = weatherType;
    flashEl = document.getElementById('lightning-flash');
    if (type === 'rain') initRain(scene);
    lightningTimer = 2 + Math.random() * 3;
  }

  function update(dt, camera) {
    if (type === 'rain' && rainPoints) {
      const pos = rainPoints.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let y = pos.getY(i) - rainVelocities[i] * dt;
        if (y < -1) y = 25 + Math.random() * 5;
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
      rainPoints.position.x = camera.position.x;
      rainPoints.position.z = camera.position.z;

      lightningTimer -= dt;
      if (lightningTimer <= 0) {
        lightningTimer = 4 + Math.random() * 6;
        triggerLightning();
      }
    }
  }

  function triggerLightning() {
    if (!flashEl) return;
    let flashes = 2 + Math.floor(Math.random() * 2);
    let i = 0;
    const step = () => {
      flashEl.style.opacity = i % 2 === 0 ? '0.85' : '0';
      POSTFX.setFlash(i % 2 === 0 ? 1.4 : 0);
      i++;
      if (i < flashes * 2) setTimeout(step, 70 + Math.random() * 60);
      else { flashEl.style.opacity = '0'; }
    };
    step();
  }

  return { init, update };
})();
