const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');
const logger = require('../config/logger');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '30d' });

const register = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }
    const user = await User.create({ name, email, password });
    const rawToken = user.createVerifyToken();
    await user.save();

    // don't block signup if the mail server is down - the user can resend later
    try {
      await sendVerificationEmail(user.email, user.name, rawToken);
    } catch (mailErr) {
      logger.warn(`verification email failed for ${user.email}: ${mailErr.message}`);
    }

    const token = generateToken(user._id);
    res.status(201).json({ success: true, token, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account has been deactivated' });
    }
    const token = generateToken(user._id);
    res.json({ success: true, token, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const hash = User.hashToken(req.body.token || '');
    const user = await User.findOne({
      verifyTokenHash: hash,
      verifyTokenExpires: { $gt: Date.now() },
    }).select('+verifyTokenHash +verifyTokenExpires');
    if (!user) {
      return res.status(400).json({ success: false, message: 'Verification link is invalid or expired' });
    }
    user.isVerified = true;
    user.verifyTokenHash = undefined;
    user.verifyTokenExpires = undefined;
    await user.save();
    res.json({ success: true, message: 'Email verified' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const resendVerification = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user.isVerified) return res.json({ success: true, message: 'Already verified' });
    const rawToken = user.createVerifyToken();
    await user.save();
    await sendVerificationEmail(user.email, user.name, rawToken);
    res.json({ success: true, message: 'Verification email sent' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    // always answer the same way so we don't leak which emails exist
    if (user) {
      const rawToken = user.createResetToken();
      await user.save();
      try {
        await sendPasswordResetEmail(user.email, user.name, rawToken);
      } catch (mailErr) {
        logger.warn(`reset email failed for ${user.email}: ${mailErr.message}`);
      }
    }
    res.json({ success: true, message: 'If that email exists, a reset link is on its way.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const resetPassword = async (req, res) => {
  const { token, password } = req.body;
  try {
    const hash = User.hashToken(token || '');
    const user = await User.findOne({
      resetTokenHash: hash,
      resetTokenExpires: { $gt: Date.now() },
    }).select('+resetTokenHash +resetTokenExpires');
    if (!user) {
      return res.status(400).json({ success: false, message: 'Reset link is invalid or expired' });
    }
    user.password = password;
    user.resetTokenHash = undefined;
    user.resetTokenExpires = undefined;
    await user.save();
    res.json({ success: true, message: 'Password reset. You can log in now.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

const updateProfile = async (req, res) => {
  const { name, bio, targetRole, skills } = req.body;
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, bio, targetRole, skills },
      { new: true, runValidators: true }
    );
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!(await user.matchPassword(currentPassword))) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  register,
  login,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
  changePassword,
};
