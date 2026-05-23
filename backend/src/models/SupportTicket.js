'use strict';

const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      unique: true,
      index: true,
    },
    // Requester info
    requester: {
      name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
      },
      email: {
        type: String,
        required: [true, 'Email is required'],
        lowercase: true,
        trim: true,
      },
      phone: { type: String, default: null },
    },
    // Ticket details
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: [300, 'Subject too long'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [10000, 'Description too long'],
    },
    category: {
      type: String,
      enum: [
        'bug_report',
        'feature_request',
        'billing',
        'account',
        'technical',
        'design',
        'performance',
        'security',
        'general',
      ],
      default: 'general',
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'critical'],
      default: 'normal',
      index: true,
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'waiting_client', 'resolved', 'closed'],
      default: 'open',
      index: true,
    },
    // Admin handling
    assignedAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // Replies thread
    replies: [
      {
        sender: {
          type: String,
          enum: ['admin', 'client'],
          required: true,
        },
        senderId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          default: null,
        },
        senderName: { type: String, required: true },
        content: {
          type: String,
          required: true,
          maxlength: 10000,
        },
        attachments: [
          {
            url: String,
            filename: String,
          },
        ],
        isInternal: {
          type: Boolean,
          default: false, // Internal notes not shown to client
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Linked project (if ticket is about a specific project)
    linkedProject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProjectRequest',
      default: null,
    },
    // Attachments on opening
    attachments: [
      {
        url: String,
        filename: String,
        mimeType: String,
      },
    ],
    resolvedAt: { type: Date, default: null },
    closedAt: { type: Date, default: null },
    // Client satisfaction rating (1-5)
    rating: {
      score: { type: Number, min: 1, max: 5, default: null },
      comment: { type: String, default: null, maxlength: 1000 },
      ratedAt: { type: Date, default: null },
    },
    // SLA tracking
    firstResponseAt: { type: Date, default: null },
    dueAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// ─── Pre-save: Auto-generate ticket number ─────────────────────────────────
supportTicketSchema.pre('save', async function (next) {
  if (this.ticketNumber) return next();
  const count = await mongoose.model('SupportTicket').countDocuments();
  this.ticketNumber = `VIX-${String(count + 1).padStart(5, '0')}`;
  next();
});

// ─── Virtuals ──────────────────────────────────────────────────────────────
supportTicketSchema.virtual('replyCount').get(function () {
  return this.replies ? this.replies.length : 0;
});

// ─── Indexes ───────────────────────────────────────────────────────────────
supportTicketSchema.index({ status: 1, priority: -1, createdAt: -1 });
supportTicketSchema.index({ 'requester.email': 1 });
supportTicketSchema.index({ assignedAdmin: 1, status: 1 });

const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);

module.exports = SupportTicket;
