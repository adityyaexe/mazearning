// src/authProvider.js
const authProvider = {
  // Called when the user attempts to log in
  async login({ username, password }) {
    const request = new Request('http://localhost:5000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: username, password }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    });
    let response;
    try {
      response = await fetch(request);
    } catch (error) {
      throw new Error('Network error');
    }
    if (response.status < 200 || response.status >= 300) {
      throw new Error('Invalid credentials');
    }
    const { token, ...user } = await response.json();
    localStorage.setItem('admin_auth', JSON.stringify({ token, ...user }));
    return Promise.resolve();
  },

  // Called when the user clicks on the logout button
  logout() {
    localStorage.removeItem('admin_auth');
    return Promise.resolve();
  },

  // Called when the API returns an error
  checkError({ status }) {
    if (status === 401 || status === 403) {
      localStorage.removeItem('admin_auth');
      return Promise.reject();
    }
    return Promise.resolve();
  },

  // Called when the user navigates, to check authentication
  checkAuth() {
    return localStorage.getItem('admin_auth') ? Promise.resolve() : Promise.reject();
  },

  // (Optional) Get admin identity for the UI
  getIdentity() {
    try {
      const { token, ...user } = JSON.parse(localStorage.getItem('admin_auth'));
      return Promise.resolve(user);
    } catch {
      return Promise.reject();
    }
  },

  // (Optional) Authorization logic for resources/actions
  canAccess() {
    // Implement role-based checks if needed
    return Promise.resolve();
  },
};

export default authProvider;
