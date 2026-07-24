const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  avatar: { type: String, default: '' },
  bio: { type: String, default: '' },
  targetRole: { type: String, default: '' },
  skills: [{ type: String }],
  totalInterviews: { type: Number, default: 0 },
  averageScore: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  verifyTokenHash: { type: String, select: false },
  verifyTokenExpires: { type: Date, select: false },
  resetTokenHash: { type: String, select: false },
  resetTokenExpires: { type: Date, select: false },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// we store only the hash of email/reset tokens and mail the raw value, so a db
// leak doesn't hand out working links
const buildToken = () => {
  const raw = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  return { raw, hash };
};

userSchema.methods.createVerifyToken = function () {
  const { raw, hash } = buildToken();
  this.verifyTokenHash = hash;
  this.verifyTokenExpires = Date.now() + 24 * 60 * 60 * 1000;
  return raw;
};

userSchema.methods.createResetToken = function () {
  const { raw, hash } = buildToken();
  this.resetTokenHash = hash;
  this.resetTokenExpires = Date.now() + 60 * 60 * 1000;
  return raw;
};

userSchema.statics.hashToken = (raw) => crypto.createHash('sha256').update(raw).digest('hex');

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.verifyTokenHash;
  delete obj.verifyTokenExpires;
  delete obj.resetTokenHash;
  delete obj.resetTokenExpires;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
