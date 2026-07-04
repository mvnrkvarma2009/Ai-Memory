'use client';
import axios from 'axios';

// All requests go through same-origin /api routes.
const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

export default api;
