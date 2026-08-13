const CATALOG = (() => {
  let data = null;

  // Client-only visual metadata (colors, geometry hints) keyed by id.
  const CAR_VISUALS = {
    0: { name: 'Cyan Ghost',    body: 0x00e5ff, accent: 0xffffff, glow: 0x00e5ff },
    1: { name: 'Magenta Storm', body: 0xff2e88, accent: 0x1a1a2e, glow: 0xff2e88 },
    2: { name: 'Amber Blaze',   body: 0xffb347, accent: 0x2a1a00, glow: 0xffb347 },
    3: { name: 'Void Carbon',   body: 0x151521, accent: 0x7dff6e, glow: 0x7dff6e }
  };

  const TRACK_VISUALS = {
    city:   { name: 'Neon Highway',  sky: [0x1a1145, 0xff2e88], fog: 0x1a1145, ground: 0x0d0a20, weather: 'clear',  scenery: 'city' },
    desert: { name: 'Sunset Desert', sky: [0x2a1030, 0xff7a3d], fog: 0x33172a, ground: 0x271a12, weather: 'clear',  scenery: 'desert' },
    storm:  { name: 'Storm Coast',   sky: [0x05060f, 0x1c2540], fog: 0x05060f, ground: 0x080a14, weather: 'rain',   scenery: 'coast' }
  };

  async function load() {
    if (data) return data;
    try {
      const res = await API.getCatalog();
      data = res;
    } catch (e) {
      // Offline fallback so the game is still playable if the API is briefly unreachable
      data = {
        missions: [],
        tracks: [{ id: 'city', name: 'Neon Highway', unlock: null }],
        cars: [{ id: 0, name: 'Cyan Ghost', tag: 'Balanced', unlock: null }]
      };
    }
    return data;
  }

  return {
    load,
    get: () => data,
    carVisual: (id) => CAR_VISUALS[id] || CAR_VISUALS[0],
    trackVisual: (id) => TRACK_VISUALS[id] || TRACK_VISUALS.city,
    allCarVisuals: () => CAR_VISUALS,
    allTrackVisuals: () => TRACK_VISUALS
  };
})();
