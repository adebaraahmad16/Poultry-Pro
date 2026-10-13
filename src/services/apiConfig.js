/**
 * Centralized API configuration for PoultryPro frontend.
 * Allows switching seamlessly between local backend and Render deployment.
 * 
 * To point to your Render backend, set VITE_API_BASE_URL in your .env file:
 * VITE_API_BASE_URL=https://<your-render-app-name>.onrender.com/api
 */

const rawBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

// Normalize by stripping any trailing slash
export const API_BASE_URL = rawBase.replace(/\/+$/, '');
