'use strict';

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const chatSessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      default: () => uuidv4(),
      index: true,
    },
    // Visitor info
    visitor: {
      name: { type: String, default: 'Visitor' },
      email: { type: String, default: null },
      phone: { type: String, default: null },
      ip: { type: String, default: null },
      userAgent: { type: String, default: null },
      country: { type: String, default: null },
      language: { type: String, default: 'en' },
    },
    // Which admin is currently handling this session
    assignedAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: ['waiting', 'active', 'closed'],
      default: 'waiting',
      index: true,
    },
    // Page the visitor is on when starting chat
    pageUrl: {
      type: String,
      default: null,
    },
    // First message preview
    preview: {
      type: String,
      default: null,
      maxlength: 200,
    },
    // When admin last read this session
    adminLastRead: {
      type: Date,
      default: null,
    },
    // Unread message count for admin
    unreadAdminCount: {
      type: Number,
      default: 0,
    },
    // Total messages
    messageCount: {
      type: Number,
      default: 0,
    },
    closedAt: {
      type: Date,
      default: null,
    },
    closedBy: {
      type: String,
      enum: ['visitor', 'admin', 'system'],
      default: null,
    },
    // Tags for filtering
    tags: [{ type: String }],
    // Internal admin notes
    notes: {
      type: String,
      default: null,
    },
    // Visitor rating after close (1-5)
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// ─── Virtuals ──────────────────────────────────────────────────────────────
chatSessionSchema.virtual('isActive').get(function () {
  return this.status === 'active';
});

chatSessionSchema.virtual('waitDuration').get(function () {
  if (this.status !== 'waiting') return null;
  return Math.floor((Date.now() - this.createdAt.getTime()) / 1000);
});

// ─── Indexes ───────────────────────────────────────────────────────────────
chatSessionSchema.index({ status: 1, createdAt: -1 });
chatSessionSchema.index({ assignedAdmin: 1, status: 1 });
chatSessionSchema.index({ 'visitor.email': 1 });

const ChatSession = mongoose.model('ChatSession', chatSessionSchema);

module.exports = ChatSession;
