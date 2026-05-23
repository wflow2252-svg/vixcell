'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name must not exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: (v) => validator.isEmail(v),
        message: 'Invalid email address',
      },
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Don't return password by default
    },
    role: {
      type: String,
      enum: ['admin', 'superadmin'],
      default: 'admin',
    },
    avatar: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // FCM tokens for push notifications (multiple devices)
    fcmTokens: [
      {
        token: { type: String, required: true },
        device: { type: String, default: 'unknown' }, // flutter_android, flutter_ios, web
        addedAt: { type: Date, default: Date.now },
      },
    ],
    lastLogin: {
      type: Date,
      default: null,
    },
    refreshTokens: [
      {
        token: { type: String, required: true },
        expiresAt: { type: Date, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.password;
        delete ret.refreshTokens;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ─── Pre-save Hook: Hash password ──────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ─── Instance Methods ──────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.addFcmToken = async function (token, device = 'unknown') {
  // Remove duplicate token if exists
  this.fcmTokens = this.fcmTokens.filter((t) => t.token !== token);
  // Add new
  this.fcmTokens.push({ token, device, addedAt: new Date() });
  // Keep max 10 tokens per user
  if (this.fcmTokens.length > 10) {
    this.fcmTokens = this.fcmTokens.slice(-10);
  }
  return this.save();
};

userSchema.methods.removeFcmToken = async function (token) {
  this.fcmTokens = this.fcmTokens.filter((t) => t.token !== token);
  return this.save();
};

userSchema.methods.addRefreshToken = async function (token, expiresAt) {
  // Clean expired tokens first
  const now = new Date();
  this.refreshTokens = this.refreshTokens.filter((rt) => rt.expiresAt > now);
  this.refreshTokens.push({ token, expiresAt });
  // Keep max 5 refresh tokens per user (multi-device)
  if (this.refreshTokens.length > 5) {
    this.refreshTokens = this.refreshTokens.slice(-5);
  }
  return this.save();
};

userSchema.methods.removeRefreshToken = async function (token) {
  this.refreshTokens = this.refreshTokens.filter((rt) => rt.token !== token);
  return this.save();
};

// ─── Static Methods ────────────────────────────────────────────────────────
userSchema.statics.getAllActiveFcmTokens = async function () {
  const users = await this.find({ isActive: true }, 'fcmTokens').lean();
  const tokens = [];
  users.forEach((u) => {
    u.fcmTokens.forEach((t) => tokens.push(t.token));
  });
  return [...new Set(tokens)]; // deduplicate
};

// ─── Indexes ───────────────────────────────────────────────────────────────
userSchema.index({ email: 1 });
userSchema.index({ isActive: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User;
