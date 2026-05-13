import axios from 'axios';

const API = axios.create({
    baseURL: 'http://100.73.77.3/masar-backend',//change IP to your own
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

export default API;
