const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super-shine-cargo-secret-key-2024';

const auth = (req, res, next) => {
  try {
    console.log('Auth middleware - checking token for:', req.method, req.path);
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log('Auth middleware - token present:', !!token);
    if (!token) {
      console.log('Auth middleware - no token provided');
      throw new Error();
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Auth middleware - decoded user:', decoded);
    req.user = decoded;
    next();
  } catch (error) {
    console.log('Auth middleware - authentication failed:', error.message);
    res.status(401).json({ message: 'Please authenticate' });
  }
};

const checkRole = (...roles) => {
  return (req, res, next) => {
    console.log('CheckRole middleware - user role:', req.user?.role);
    console.log('CheckRole middleware - required roles:', roles);
    if (!roles.includes(req.user.role)) {
      console.log('CheckRole middleware - access denied');
      return res.status(403).json({ message: 'Access denied' });
    }
    console.log('CheckRole middleware - access granted');
    next();
  };
};

module.exports = { auth, checkRole, JWT_SECRET };
