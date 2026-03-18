// Central API URL — reads from environment variable
// In production this is set in .env.production before build
const API_BASE = process.env.REACT_APP_API_URL
  ? process.env.REACT_APP_API_URL.replace('/api', '')
  : 'http://localhost:5000';

export default API_BASE;
