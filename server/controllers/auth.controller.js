const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const User = require('../models/users');
const AppError = require('../utils/AppError');
const { sendTokenCookie, clearTokenCookie } = require('../utils/cookie');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const signToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const userResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  avatar: user.avatar || null,
});

const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new AppError('Name, email aur password zaroori hain', 400, 'VALIDATION_ERROR');
  }
  if (password.length < 8) {
    throw new AppError('Password kam az kam 8 characters ka hona chahiye', 400, 'VALIDATION_ERROR');
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('Yeh email pehle se register hai', 409, 'EMAIL_EXISTS');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await User.create({ name, email, passwordHash });

  const token = signToken(user._id);
  sendTokenCookie(res, token);

  res.status(201).json({
    success: true,
    user: userResponse(user),
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Email aur password zaroori hain', 400, 'VALIDATION_ERROR');
  }

  const user = await User.findOne({ email }).select('+passwordHash');

  const isPasswordCorrect = user
    ? await bcrypt.compare(password, user.passwordHash)
    : false;

  if (!user || !isPasswordCorrect) {
    throw new AppError('Email ya password ghalat hai', 401, 'UNAUTHORIZED');
  }

  const token = signToken(user._id);
  sendTokenCookie(res, token);

  res.json({
    success: true,
    user: userResponse(user),
  });
};

const googleAuth = async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    throw new AppError('Google token nahi mila', 400, 'VALIDATION_ERROR');
  }

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const { sub: googleId, email, name, picture } = ticket.getPayload();

  let user = await User.findOne({ googleId });

  if (!user) {
    user = await User.findOne({ email });

    if (user) {
      user.googleId = googleId;
      if (!user.avatar) user.avatar = picture;
      await user.save();
    } else {
      user = await User.create({
        name,
        email,
        googleId,
        avatar: picture,
      });
    }
  }

  const token = signToken(user._id);
  sendTokenCookie(res, token);

  res.json({
    success: true,
    user: userResponse(user),
  });
};

const me = async (req, res) => {
  res.json({
    success: true,
    user: userResponse(req.user),
  });
};

const logout = (req, res) => {
  clearTokenCookie(res);
  res.json({ success: true, message: 'Logout ho gaye' });
};

module.exports = { register, login, googleAuth, me, logout };