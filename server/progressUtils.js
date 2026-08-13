const { MISSIONS, TRACKS, CARS } = require('./missions');

function defaultProgress() {
  const missions = {};
  MISSIONS.forEach(m => { missions[m.id] = { progress: 0, done: false }; });
  return {
    coins: 0,
    bestDistance: 0,
    bestSpeed: 0,
    totalRuns: 0,
    totalNitro: 0,
    selectedCar: 0,
    unlockedCars: [0, 1, 2],
    unlockedTracks: ['city'],
    trackRunHistory: [], // track ids the player has completed at least one run on
    missions
  };
}

// Apply the result of a finished run to a progress object.
// runResult: { distance, topSpeed, nitroCollected, track, crashed }
// Returns { progress, rewards: { coins, newlyUnlockedTracks, newlyUnlockedCars, completedMissions } }
function applyRunResult(progress, runResult) {
  const p = progress || defaultProgress();
  const rewards = { coins: 0, newlyUnlockedTracks: [], newlyUnlockedCars: [], completedMissions: [] };

  p.totalRuns += 1;
  p.totalNitro += runResult.nitroCollected || 0;
  p.bestDistance = Math.max(p.bestDistance, runResult.distance || 0);
  p.bestSpeed = Math.max(p.bestSpeed, runResult.topSpeed || 0);

  if (runResult.track && !p.trackRunHistory.includes(runResult.track)) {
    p.trackRunHistory.push(runResult.track);
  }

  // base coin reward for the run itself
  const runCoins = Math.floor((runResult.distance || 0) / 10) + (runResult.nitroCollected || 0) * 5;
  p.coins += runCoins;
  rewards.coins += runCoins;

  // evaluate missions
  MISSIONS.forEach(m => {
    const state = p.missions[m.id] || { progress: 0, done: false };
    if (state.done) { p.missions[m.id] = state; return; }

    let current = state.progress;
    if (m.type === 'speed') current = p.bestSpeed;
    else if (m.type === 'distance') current = p.bestDistance;
    else if (m.type === 'nitro') current = p.totalNitro;
    else if (m.type === 'runs') current = p.totalRuns;
    else if (m.type === 'track') current = p.trackRunHistory.includes(m.target) ? m.target : current;

    state.progress = current;
    const reached = m.type === 'track' ? current === m.target : current >= m.target;
    if (reached && !state.done) {
      state.done = true;
      p.coins += m.reward;
      rewards.coins += m.reward;
      rewards.completedMissions.push(m.id);
    }
    p.missions[m.id] = state;
  });

  // evaluate track unlocks
  TRACKS.forEach(t => {
    if (p.unlockedTracks.includes(t.id)) return;
    if (!t.unlock) { p.unlockedTracks.push(t.id); return; }
    if (t.unlock.type === 'distance' && p.bestDistance >= t.unlock.target) {
      p.unlockedTracks.push(t.id);
      rewards.newlyUnlockedTracks.push(t.id);
    }
  });

  // evaluate car unlocks (coin-gated cars need explicit purchase, but auto-flag eligibility)
  CARS.forEach(c => {
    if (p.unlockedCars.includes(c.id)) return;
    if (!c.unlock) { p.unlockedCars.push(c.id); }
  });

  return { progress: p, rewards };
}

module.exports = { defaultProgress, applyRunResult };
