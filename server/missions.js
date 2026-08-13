// Mission / career-mode definitions.
// type: 'speed'   -> best top speed (km/h) reached in a single run
// type: 'distance'-> best distance (m) reached in a single run
// type: 'nitro'   -> cumulative nitro pickups collected across all runs
// type: 'runs'    -> cumulative completed runs
// type: 'track'   -> completed at least one run on a specific track id

const MISSIONS = [
  { id: 'speed_1',    name: 'Speed Demon',   desc: 'Hit 220 km/h in a single run',        type: 'speed',    target: 220, reward: 150 },
  { id: 'speed_2',    name: 'Sound Barrier', desc: 'Hit 300 km/h in a single run',         type: 'speed',    target: 300, reward: 300 },
  { id: 'distance_1', name: 'Road Warrior',  desc: 'Survive 1500m in a single run',        type: 'distance', target: 1500, reward: 150 },
  { id: 'distance_2', name: 'Marathon',      desc: 'Survive 4000m in a single run',        type: 'distance', target: 4000, reward: 400 },
  { id: 'nitro_1',    name: 'Fuel Junkie',   desc: 'Collect 10 nitro pickups total',       type: 'nitro',    target: 10, reward: 100 },
  { id: 'nitro_2',    name: 'Nitro Addict',  desc: 'Collect 40 nitro pickups total',       type: 'nitro',    target: 40, reward: 250 },
  { id: 'runs_1',     name: 'Regular',       desc: 'Complete 5 runs',                      type: 'runs',     target: 5, reward: 100 },
  { id: 'track_desert', name: 'Dune Runner', desc: 'Complete a run on Sunset Desert',      type: 'track',    target: 'desert', reward: 200 },
  { id: 'track_storm',  name: 'Storm Chaser',desc: 'Complete a run on Storm Coast',        type: 'track',    target: 'storm', reward: 200 },
];

// Tracks and their unlock requirements (checked against progress.bestDistanceTotal-ish stats)
const TRACKS = [
  { id: 'city',   name: 'Neon Highway',  unlock: null },
  { id: 'desert', name: 'Sunset Desert', unlock: { type: 'distance', target: 1200 } },
  { id: 'storm',  name: 'Storm Coast',   unlock: { type: 'distance', target: 3000 } },
];

const CARS = [
  { id: 0, name: 'Cyan Ghost',    tag: 'Balanced',   unlock: null },
  { id: 1, name: 'Magenta Storm', tag: 'Aggressive', unlock: null },
  { id: 2, name: 'Amber Blaze',   tag: 'Classic',     unlock: null },
  { id: 3, name: 'Void Carbon',   tag: 'Stealth',    unlock: { type: 'coins', target: 500 } },
];

module.exports = { MISSIONS, TRACKS, CARS };
