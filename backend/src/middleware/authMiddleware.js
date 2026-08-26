const jwt = require('jsonwebtoken');
const { User } = require('../models');

// @desc    Protect routes - authenticate JWT token
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      const parts = req.headers.authorization.split(' ');
      if (parts.length !== 2 || !parts[1]) {
        return res.status(401).json({
          success: false,
          message: 'Malformed authorization token'
        });
      }

      token = parts[1];
      const secret = process.env.JWT_SECRET || 'ne_connect_jwt_secure_secret_key_2026_dev_prod';
      const decoded = jwt.verify(token, secret);

      const user = await User.findById(decoded.userId || decoded.id);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User no longer exists'
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User account is inactive'
        });
      }

      req.user = user;
      return next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, invalid or expired token'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided'
    });
  }
};

// @desc    Authorize specific user roles
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this resource`
      });
    }

    next();
  };
};

module.exports = {
  protect,
  authorizeRoles
};
