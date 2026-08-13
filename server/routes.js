const express = require('express');
const bcrypt = require('bcryptjs');
const { randomUUID: uuid } = require('crypto');
const db = require('./db');
const { signToken, requireAuth } = require('./auth');
const { defaultProgress, applyRunResult } = require('./progressUtils');
const { MISSIONS, TRACKS, CARS } = require('./missions');

const router = express.Router();

// ---------- Catalog (public, static reference data for the client) ----------
router.get('/catalog', (req, res) => {
  res.json({ missions: MISSIONS, tracks: TRACKS, cars: CARS });
});

// ---------- Auth ----------
router.post('/auth/register', (req, res) => {
  const { username, password } = req.body || {};
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
  const { username, password } = req.body || {};
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

// ---------- Runs (submit a finished run -> updates progress + leaderboard) ----------
router.post('/runs', requireAuth, (req, res) => {
  const { distance, topSpeed, nitroCollected, track, crashed } = req.body || {};
  if (typeof distance !== 'number' || distance < 0) {
    return res.status(400).json({ error: 'Invalid run payload' });
  }

  let progress = db.get(['progress', req.user.id]).value() || defaultProgress();
  const { progress: updated, rewards } = applyRunResult(progress, {
    distance, topSpeed: topSpeed || 0, nitroCollected: nitroCollected || 0,
    track: track || 'city', crashed: !!crashed
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
