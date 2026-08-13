const GARAGE_UI = (() => {
  let catalog = null;
  let progress = null;
  let selectedCar = 0;
  let selectedTrack = 'city';

  function isCarUnlocked(carId) {
    if (!progress) return carId <= 2; // guests: first 3 cars free
    return progress.unlockedCars.includes(carId);
  }
  function isTrackUnlocked(trackId) {
    if (!progress) return trackId === 'city';
    return progress.unlockedTracks.includes(trackId);
  }

  function renderCars() {
    const wrap = document.getElementById('car-select');
    wrap.innerHTML = '';
    catalog.cars.forEach(c => {
      const vis = CATALOG.carVisual(c.id);
      const unlocked = isCarUnlocked(c.id);
      const card = document.createElement('div');
      card.className = 'car-card' + (c.id === selectedCar ? ' selected' : '') + (unlocked ? '' : ' locked');
      const hex = '#' + vis.body.toString(16).padStart(6, '0');
      card.innerHTML = `
        <div class="car-swatch" style="background:${hex}"></div>
        <div class="car-name">${c.name}</div>
        <div class="car-tag">${c.tag}</div>
        ${unlocked ? '' : `<div class="lock-tag">🔒 ${c.unlock && c.unlock.type === 'coins' ? c.unlock.target + ' coins' : 'locked'}</div>`}
      `;
      card.addEventListener('click', () => {
        if (!unlocked) return;
        selectedCar = c.id;
        renderCars();
        if (API.isLoggedIn()) API.saveSelectedCar(c.id).catch(() => {});
        updateCarBadge();
      });
      wrap.appendChild(card);
    });
    updateCarBadge();
  }

  function updateCarBadge() {
    const vis = CATALOG.carVisual(selectedCar);
    const badge = document.getElementById('car-badge');
    badge.textContent = '🏎 ' + vis.name;
    badge.style.display = 'block';
  }

  function renderTracks() {
    const wrap = document.getElementById('track-select');
    wrap.innerHTML = '';
    catalog.tracks.forEach(t => {
      const vis = CATALOG.trackVisual(t.id);
      const unlocked = isTrackUnlocked(t.id);
      const card = document.createElement('div');
      card.className = 'track-card' + (t.id === selectedTrack ? ' selected' : '') + (unlocked ? '' : ' locked');
      const topHex = '#' + vis.sky[1].toString(16).padStart(6, '0');
      const botHex = '#' + vis.sky[0].toString(16).padStart(6, '0');
      card.innerHTML = `
        <div class="track-swatch" style="background:linear-gradient(180deg, ${topHex}, ${botHex})"></div>
        <div class="track-name">${t.name}</div>
        <div class="track-tag">${vis.weather === 'rain' ? '⛈ storm' : '☀ clear'}</div>
        ${unlocked ? '' : `<div class="lock-tag">🔒 ${t.unlock ? t.unlock.target + 'm distance' : ''}</div>`}
      `;
      card.addEventListener('click', () => {
        if (!unlocked) return;
        selectedTrack = t.id;
        renderTracks();
      });
      wrap.appendChild(card);
    });
  }

  function renderMissions() {
    const wrap = document.getElementById('mission-list');
    wrap.innerHTML = '';
    if (!catalog.missions.length) {
      wrap.innerHTML = '<div class="mission-desc">No missions loaded.</div>';
      return;
    }
    catalog.missions.forEach(m => {
      const state = progress && progress.missions[m.id] ? progress.missions[m.id] : { progress: 0, done: false };
      const row = document.createElement('div');
      row.className = 'mission-row' + (state.done ? ' done' : '');
      row.innerHTML = `
        <div>
          <div class="mission-name">${m.name}</div>
          <div class="mission-desc">${m.desc}</div>
        </div>
        <div class="mission-reward">${state.done ? '<span class="mission-check">✓</span>' : '+' + m.reward + '¢'}</div>
      `;
      wrap.appendChild(row);
    });
  }

  async function renderLeaderboard() {
    const wrap = document.getElementById('leaderboard-list');
    document.getElementById('leaderboard-track-label').textContent = '— ' + (CATALOG.trackVisual(selectedTrack).name || '');
    wrap.innerHTML = '<div class="mission-desc">Loading…</div>';
    try {
      const res = await API.getLeaderboard(selectedTrack);
      wrap.innerHTML = '';
      if (!res.scores.length) {
        wrap.innerHTML = '<div class="mission-desc">No runs yet on this route. Be the first.</div>';
        return;
      }
      res.scores.forEach((s, i) => {
        const row = document.createElement('div');
        row.className = 'lb-row';
        row.innerHTML = `<span class="lb-rank">#${i+1}</span><span class="lb-name">${s.username}</span><span class="lb-dist">${s.distance} m</span>`;
        wrap.appendChild(row);
      });
    } catch (e) {
      wrap.innerHTML = '<div class="mission-desc">Could not load leaderboard.</div>';
    }
  }

  function updateCoinBadge() {
    document.getElementById('coin-num').textContent = progress ? progress.coins : 0;
  }

  function switchPanel(name) {
    document.querySelectorAll('.panel-tab').forEach(t => t.classList.toggle('selected', t.dataset.panel === name));
    document.querySelectorAll('.garage-panel').forEach(p => p.classList.toggle('hidden', p.id !== name));
    if (name === 'garage-leaderboard') renderLeaderboard();
  }

  async function init() {
    catalog = await CATALOG.load();
    const progRes = await API.getProgress();
    progress = progRes.progress;
    if (progress) {
      selectedCar = progress.selectedCar;
      updateCoinBadge();
    }
    renderCars();
    renderTracks();
    renderMissions();

    document.querySelectorAll('.panel-tab').forEach(t => {
      t.addEventListener('click', () => switchPanel(t.dataset.panel));
    });
  }

  // Called by main.js after a run finishes and was submitted to the backend
  function applyRunUpdate(newProgress) {
    progress = newProgress;
    updateCoinBadge();
    renderCars();
    renderTracks();
    renderMissions();
  }

  function showMissionToasts(missionIds) {
    if (!missionIds || !missionIds.length || !catalog) return;
    const wrap = document.getElementById('mission-toast-wrap');
    missionIds.forEach((id, i) => {
      const m = catalog.missions.find(x => x.id === id);
      if (!m) return;
      const el = document.createElement('div');
      el.className = 'mission-toast';
      el.textContent = `MISSION COMPLETE: ${m.name} (+${m.reward}¢)`;
      wrap.appendChild(el);
      setTimeout(() => el.remove(), 3200 + i * 300);
    });
  }

  return {
    init,
    applyRunUpdate,
    showMissionToasts,
    getSelectedCar: () => selectedCar,
    getSelectedTrack: () => selectedTrack,
    getProgress: () => progress
  };
})();
