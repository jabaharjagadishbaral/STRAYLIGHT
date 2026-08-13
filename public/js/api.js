const API = (() => {
  const BASE = '/api';
  let token = localStorage.getItem('nh_token') || null;
  let user = JSON.parse(localStorage.getItem('nh_user') || 'null');

  function setSession(t, u) {
    token = t; user = u;
    if (t) { localStorage.setItem('nh_token', t); localStorage.setItem('nh_user', JSON.stringify(u)); }
    else { localStorage.removeItem('nh_token'); localStorage.removeItem('nh_user'); }
  }

  async function req(path, opts = {}) {
    const headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const res = await fetch(BASE + path, Object.assign({}, opts, { headers }));
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  }

  return {
    isLoggedIn: () => !!token,
    isGuest: () => !token,
    currentUser: () => user,

    register: (username, password) => req('/auth/register', { method: 'POST', body: JSON.stringify({ username, password }) })
      .then(d => { setSession(d.token, d.user); return d; }),

    login: (username, password) => req('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) })
      .then(d => { setSession(d.token, d.user); return d; }),

    logout: () => setSession(null, null),

    getCatalog: () => req('/catalog', { method: 'GET' }),

    getProgress: () => token ? req('/progress', { method: 'GET' }) : Promise.resolve({ progress: null }),

    saveSelectedCar: (carId) => token
      ? req('/progress', { method: 'PUT', body: JSON.stringify({ selectedCar: carId }) })
      : Promise.resolve(null),

    submitRun: (payload) => token
      ? req('/runs', { method: 'POST', body: JSON.stringify(payload) })
      : Promise.resolve(null),

    getLeaderboard: (track) => req('/leaderboard' + (track ? '?track=' + encodeURIComponent(track) : ''), { method: 'GET' })
  };
})();
