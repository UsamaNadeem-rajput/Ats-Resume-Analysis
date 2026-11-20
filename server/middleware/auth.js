const jwt = require('jsonwebtoken');
const User = require('../models/users');
const AppError = require('../utils/AppError');
const { COOKIE_NAME } = require('../utils/cookie');

const protect = async (req, res, next) => {

  const token = req.cookies[COOKIE_NAME];

  if (!token) {
    throw new AppError('Login karein pehle', 401, 'UNAUTHORIZED');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const user = await User.findById(decoded.userId);
  if (!user) {
    throw new AppError('Yeh account ab maujood nahi', 401, 'UNAUTHORIZED');
  }

  req.user = user;

  next();
};

module.exports = { protect };