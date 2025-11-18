import axios from 'axios';

export const http = axios.create({
  timeout: 10000,
  maxRedirects: 3,
  validateStatus: status => status >= 200 && status < 500
});


