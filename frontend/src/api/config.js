// Central API URL — reads from environment variable
// In production this is set in .env.production before build
const API_BASE = process.env.REACT_APP_API_URL
  ? process.env.REACT_APP_API_URL.replace('/api', '')
  : '';

// For production with relative path, return empty string so fetch uses same origin
export default API_BASE;
