const SETTINGS = (() => {
  const KEY = 'straylight_settings_v1';
  let state = { control: 'buttons', quality: 'high' };

  function detectDefaultControl() {
    // Best default guess before the player has chosen anything: touch device -> buttons, else keyboard.
    return ('ontouchstart' in window || navigator.maxTouchPoints > 0) ? 'buttons' : 'keyboard';
  }

  function load() {
    state.control = detectDefaultControl();
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) state = Object.assign(state, JSON.parse(raw));
    } catch (e) { /* ignore corrupt/blocked storage */ }
    return state;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }
  function get() { return state; }

  function apply() {
    document.body.dataset.controlScheme = state.control;
    if (window.POSTFX && POSTFX.setQuality) POSTFX.setQuality(state.quality);
  }

  function setControl(mode) {
    if (!['buttons', 'tilt', 'keyboard'].includes(mode)) return;
    state.control = mode;
    save();
    apply();
  }

  function setQualityMode(mode) {
    if (!['high', 'perf'].includes(mode)) return;
    state.quality = mode;
    save();
    apply();
  }

  function tiltNeedsPermission() {
    return typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function';
  }

  function bindUI() {
    document.querySelectorAll('.control-card[data-control]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.control === state.control);
      btn.addEventListener('click', () => {
        setControl(btn.dataset.control);
        document.querySelectorAll('.control-card[data-control]').forEach(b => b.classList.toggle('active', b === btn));
        const note = document.getElementById('tilt-permission-note');
        if (note) note.classList.toggle('hidden', !(btn.dataset.control === 'tilt' && tiltNeedsPermission()));
      });
    });
    document.querySelectorAll('.control-card[data-quality]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.quality === state.quality);
      btn.addEventListener('click', () => {
        setQualityMode(btn.dataset.quality);
        document.querySelectorAll('.control-card[data-quality]').forEach(b => b.classList.toggle('active', b === btn));
      });
    });
    const permBtn = document.getElementById('tilt-permission-btn');
    if (permBtn) {
      permBtn.addEventListener('click', async () => {
        try {
          const result = await DeviceOrientationEvent.requestPermission();
          if (result === 'granted') {
            permBtn.textContent = 'TILT ENABLED';
            document.getElementById('tilt-permission-note')?.classList.add('granted');
          }
        } catch (e) { /* user declined or unsupported */ }
      });
    }
  }

  function init() {
    load();
    apply();
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bindUI);
    } else {
      bindUI();
    }
  }

  return { init, get, setControl, setQualityMode, tiltNeedsPermission, apply };
})();

SETTINGS.init();
