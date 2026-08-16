const express = require('express');
const bcrypt = require('bcryptjs');
const { randomUUID: uuid } = require('crypto');
const db = require('./db');
const { signToken, requireAuth } = require('./auth');
const { defaultProgress, applyRunResult } = require('./progressUtils');
const { MISSIONS, TRACKS, CARS, MODES, EVENTS } = require('./missions');

const router = express.Router();

// ---------- Catalog (public, static reference data for the client) ----------
router.get('/catalog', (req, res) => {
  res.json({ missions: MISSIONS, tracks: TRACKS, cars: CARS, modes: MODES, events: EVENTS });
});

// ---------- Auth ----------
router.post('/auth/register', (req, res) => {
  let { username, password } = req.body || {};
  username = String(username || '').trim().toLowerCase();
  if (!username || !password || username.length < 3 || password.length < 4) {
    return res.status(400).json({ error: 'Username (3+) and password (4+) required' });
  }
  const existing = db.get('users').find({ username }).value();
  if (existing) return res.status(409).json({ error: 'Username already taken' });

  const user = {
    id: uuid(),
    username,
    passwordHash: bcrypt.hashSync(password, 10),
    createdAt: new Date().toISOString()
  };
  db.get('users').push(user).write();
  db.set(['progress', user.id], defaultProgress()).write();

  const token = signToken(user);
  res.json({ token, user: { id: user.id, username: user.username } });
});

router.post('/auth/login', (req, res) => {
  let { username, password } = req.body || {};
  username = String(username || '').trim().toLowerCase();
  const user = db.get('users').find({ username }).value();
  if (!user || !bcrypt.compareSync(password || '', user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }
  const token = signToken(user);
  res.json({ token, user: { id: user.id, username: user.username } });
});

// ---------- Progress ----------
router.get('/progress', requireAuth, (req, res) => {
  let progress = db.get(['progress', req.user.id]).value();
  if (!progress) {
    progress = defaultProgress();
    progress.welcomePackGranted = true;
    db.set(['progress', req.user.id], progress).write();
  } else if (progress.totalRuns === 0 && progress.coins === 0 && !progress.welcomePackGranted) {
    // One-time garage starter pack for accounts created by older builds.
    progress.coins = 1200;
    progress.welcomePackGranted = true;
    db.set(['progress', req.user.id], progress).write();
  }
  res.json({ progress });
});

router.put('/progress', requireAuth, (req, res) => {
  // Allows saving lightweight preference changes (selected car) without a full run.
  const current = db.get(['progress', req.user.id]).value() || defaultProgress();
  const { selectedCar } = req.body || {};
  if (typeof selectedCar === 'number' && current.unlockedCars.includes(selectedCar)) {
    current.selectedCar = selectedCar;
  }
  db.set(['progress', req.user.id], current).write();
  res.json({ progress: current });
});

// ---------- Garage purchases ----------
router.post('/garage/buy-car', requireAuth, (req, res) => {
  const carId = Number(req.body?.carId);
  const car = CARS.find(c => c.id === carId);
  if (!car || !car.unlock || car.unlock.type !== 'coins') return res.status(400).json({ error: 'Car is not purchasable' });
  const progress = db.get(['progress', req.user.id]).value() || defaultProgress();
  if (progress.unlockedCars.includes(carId)) return res.json({ progress });
  if (progress.coins < car.unlock.target) return res.status(400).json({ error: `Need ${car.unlock.target} CR` });
  progress.coins -= car.unlock.target;
  progress.unlockedCars.push(carId);
  progress.selectedCar = carId;
  db.set(['progress', req.user.id], progress).write();
  res.json({ progress });
});

// ---------- Mission claims ----------
router.post('/missions/claim', requireAuth, (req, res) => {
  const missionId = String(req.body?.missionId || '');
  const mission = MISSIONS.find(m => m.id === missionId);
  if (!mission) return res.status(404).json({ error: 'Mission not found' });

  const progress = db.get(['progress', req.user.id]).value() || defaultProgress();
  const state = progress.missions?.[missionId];
  if (!state || !state.done) return res.status(400).json({ error: 'Mission is not complete yet' });

  // Legacy saves: these missions were already paid automatically.
  if (state.claimed === undefined) {
    state.claimed = true;
    progress.missions[missionId] = state;
    db.set(['progress', req.user.id], progress).write();
    return res.json({ progress, reward: 0, alreadyPaid: true });
  }

  if (state.claimed) return res.status(400).json({ error: 'Reward already claimed' });

  state.claimed = true;
  progress.missions[missionId] = state;
  progress.coins += mission.reward;
  db.set(['progress', req.user.id], progress).write();
  res.json({ progress, reward: mission.reward });
});

// ---------- Runs (submit a finished run -> updates progress + leaderboard) ----------
router.post('/runs', requireAuth, (req, res) => {
  const { distance, topSpeed, nitroCollected, track, crashed, mode, event } = req.body || {};
  if (typeof distance !== 'number' || distance < 0) {
    return res.status(400).json({ error: 'Invalid run payload' });
  }

  let progress = db.get(['progress', req.user.id]).value() || defaultProgress();
  const { progress: updated, rewards } = applyRunResult(progress, {
    distance, topSpeed: topSpeed || 0, nitroCollected: nitroCollected || 0,
    track: track || 'city', mode: mode || 'endless', event: event || null, crashed: !!crashed
  });
  db.set(['progress', req.user.id], updated).write();

  const scoreEntry = {
    id: uuid(),
    userId: req.user.id,
    username: req.user.username,
    distance: Math.floor(distance),
    track: track || 'city',
    car: updated.selectedCar,
    createdAt: new Date().toISOString()
  };
  db.get('scores').push(scoreEntry).write();

  res.json({ progress: updated, rewards });
});

// ---------- Leaderboard ----------
router.get('/leaderboard', (req, res) => {
  const track = req.query.track;
  let scores = db.get('scores').value();
  if (track) scores = scores.filter(s => s.track === track);
  scores = [...scores].sort((a, b) => b.distance - a.distance).slice(0, 20);
  res.json({ scores });
});

module.exports = router;
