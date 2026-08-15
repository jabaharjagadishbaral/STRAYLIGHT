const POSTFX = (() => {
  let composer, bloomPass, afterimagePass, renderPass;
  let quality = 'high';
  let baseBloom = 0.85;
  let baseAfterimage = 0.72;

  function setQuality(q) {
    quality = q === 'perf' ? 'perf' : 'high';
    baseBloom = quality === 'perf' ? 0.5 : 0.85;
    baseAfterimage = quality === 'perf' ? 0.45 : 0.72;
    if (bloomPass) bloomPass.strength = baseBloom;
    if (afterimagePass) afterimagePass.uniforms['damp'].value = baseAfterimage;
  }
  function getQuality() { return quality; }

  function init(renderer, scene, camera, width, height) {
    composer = new THREE.EffectComposer(renderer);
    renderPass = new THREE.RenderPass(scene, camera);
    composer.addPass(renderPass);

    bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(width, height), 0.85, 0.45, 0.42);
    bloomPass.strength = baseBloom;
    bloomPass.radius = 0.45;
    bloomPass.threshold = 0.42;
    composer.addPass(bloomPass);

    afterimagePass = new THREE.AfterimagePass(baseAfterimage);
    composer.addPass(afterimagePass);

    return composer;
  }

  function setSize(w, h) {
    if (composer) composer.setSize(w, h);
  }

  // speedFactor 0..1, nitro boolean -> modulate bloom intensity and trail persistence
  function setIntensity(speedFactor, nitro) {
    if (!bloomPass || !afterimagePass) return;
    bloomPass.strength = baseBloom + speedFactor * 0.55 + (nitro ? 0.6 : 0);
    afterimagePass.uniforms['damp'].value = nitro ? 0.86 : (baseAfterimage + speedFactor * 0.08);
  }

  function setFlash(intensity) {
    // brief extra bloom kick, used for lightning
    if (!bloomPass) return;
    bloomPass.strength = baseBloom + intensity;
  }

  function render(dt) {
    if (composer) composer.render(dt);
  }

  return { init, setSize, setIntensity, setFlash, render, setQuality, getQuality };
})();
