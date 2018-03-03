import axios from 'axios';

const instance = axios.create({
  baseURL: '/api/',
  timeout: 5000,
  withCredentials: true,
});

const request = (apiMethod = '', data = {}) =>
  instance.post(apiMethod, data)
    .then(response => response.data, (error) => {
      throw error.response && error.response.data && error.response.data.error ? error.response.data.error : 'serverError';
    });

export {request}; //eslint-disable-line
