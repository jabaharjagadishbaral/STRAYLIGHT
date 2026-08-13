const path = require('path');
const FileSync = require('lowdb/adapters/FileSync');
const low = require('lowdb');

const adapter = new FileSync(path.join(__dirname, 'data', 'db.json'));
const db = low(adapter);

// Default DB shape
db.defaults({
  users: [],       // { id, username, passwordHash, createdAt }
  progress: {},    // userId -> { coins, bestDistance, selectedCar, unlockedTracks, unlockedCars, missions: {id: {progress, done}}, totalNitro, totalRuns }
  scores: []        // { id, userId, username, distance, track, car, createdAt }
}).write();

module.exports = db;
