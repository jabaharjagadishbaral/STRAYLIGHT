const AUTH_UI = (() => {
  let mode = 'login';

  function showError(msg) {
    const el = document.getElementById('auth-error');
    el.textContent = msg;
    el.classList.remove('hidden');
  }
  function clearError() {
    document.getElementById('auth-error').classList.add('hidden');
  }

  function setMode(m) {
    mode = m;
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.toggle('selected', t.dataset.tab === m));
    document.getElementById('auth-submit').textContent = m === 'login' ? '▶ SIGN IN' : '▶ CREATE ACCOUNT';
    document.getElementById('auth-password').autocomplete = m === 'login' ? 'current-password' : 'new-password';
    clearError();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    clearError();
    const username = document.getElementById('auth-username').value.trim().toLowerCase();
    const password = document.getElementById('auth-password').value;
    const btn = document.getElementById('auth-submit');
    btn.disabled = true;
    try {
      if (mode === 'login') await API.login(username, password);
      else await API.register(username, password);
      await enterGarage();
    } catch (err) {
      showError(err.message || 'Something went wrong');
    } finally {
      btn.disabled = false;
    }
  }

  async function continueAsGuest() {
    API.logout();
    await enterGarage();
  }

  async function enterGarage() {
    document.getElementById('auth-overlay').classList.add('hidden');
    document.getElementById('start-overlay').classList.remove('hidden');
    const user = API.currentUser();
    const userBadge = document.getElementById('user-badge');
    if (user) {
      userBadge.textContent = '● ' + user.username;
      userBadge.style.display = 'block';
      document.getElementById('welcome-line').textContent = 'Welcome back, ' + user.username + '. Your progress is saved.';
      document.getElementById('signout-btn').style.display = 'inline-block';
    } else {
      userBadge.style.display = 'none';
      document.getElementById('welcome-line').textContent = 'Playing as guest — sign in from the menu to save progress.';
      document.getElementById('signout-btn').style.display = 'none';
    }
    await GARAGE_UI.init();
  }

  function signOut() {
    API.logout();
    location.reload();
  }

  async function init() {
    document.querySelectorAll('.auth-tab').forEach(t => t.addEventListener('click', () => setMode(t.dataset.tab)));
    document.getElementById('auth-form').addEventListener('submit', handleSubmit);
    document.getElementById('guest-btn').addEventListener('click', continueAsGuest);
    document.getElementById('signout-btn').addEventListener('click', signOut);

    if (API.isLoggedIn()) {
      try {
        await API.getProgress();
        await enterGarage();
      } catch (e) {
        // Token may be stale after an upgrade. Clear it but keep the account
        // on the server so the player can simply sign in again.
        API.logout();
        document.getElementById('auth-overlay').classList.remove('hidden');
        showError('Session expired. Sign in again — your account and progress are still saved.');
      }
    } else {
      document.getElementById('auth-overlay').classList.remove('hidden');
    }
  }

  return { init };
})();

window.addEventListener('DOMContentLoaded', () => AUTH_UI.init());
