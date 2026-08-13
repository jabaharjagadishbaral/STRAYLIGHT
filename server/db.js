const path = require('path');
const os = require('os');
const fs = require('fs');
const FileSync = require('lowdb/adapters/FileSync');
const low = require('lowdb');

// Keep player data outside the project directory so replacing/updating the game
// does NOT erase accounts, credits, cars, missions, or leaderboard scores.
const dataDir = path.join(os.homedir(), '.straylight-apex');
fs.mkdirSync(dataDir, { recursive: true });
const dbFile = path.join(dataDir, 'db.json');

const adapter = new FileSync(dbFile);
const db = low(adapter);

db.defaults({
  users: [],
  progress: {},
  scores: []
}).write();

module.exports = db;
