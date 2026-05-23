'use strict';

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    // Reference to the parent session
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    // Who sent this message
    senderType: {
      type: String,
      enum: ['visitor', 'admin', 'system'],
      required: true,
    },
    // If sent by admin, which admin
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    senderName: {
      type: String,
      default: null,
    },
    // Message content
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
      maxlength: [5000, 'Message cannot exceed 5000 characters'],
    },
    // Message type
    type: {
      type: String,
      enum: ['text', 'image', 'file', 'system_event'],
      default: 'text',
    },
    // For file/image messages
    attachment: {
      url: { type: String, default: null },
      filename: { type: String, default: null },
      mimeType: { type: String, default: null },
      size: { type: Number, default: null },
    },
    // Read status tracking
    readBy: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        readAt: { type: Date, default: Date.now },
      },
    ],
    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        if (ret.isDeleted) {
          ret.content = '[Message deleted]';
        }
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ─── Indexes ───────────────────────────────────────────────────────────────
messageSchema.index({ sessionId: 1, createdAt: 1 });
messageSchema.index({ senderType: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
