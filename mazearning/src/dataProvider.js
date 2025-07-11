// src/dataProvider.js
import simpleRestProvider from 'ra-data-simple-rest';

const httpClient = (url, options = {}) => {
  if (!options.headers) {
    options.headers = new Headers({ Accept: 'application/json' });
  }
  const auth = JSON.parse(localStorage.getItem('admin_auth'));
  if (auth?.token) {
    options.headers.set('Authorization', `Bearer ${auth.token}`);
  }
  return fetch(url, options);
};

const dataProvider = simpleRestProvider('http://localhost:5000/api/auth/login', httpClient);

export default dataProvider;
